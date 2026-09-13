#!/usr/bin/env python3
"""
Accu-Travel SQL Server -> MariaDB full legacy mirror.

Purpose
-------
Creates a faithful, table-for-table copy of the source SQL Server database in a
separate MariaDB database. It is intentionally NOT the application's normalized
schema. The mirror is the safe source layer for later HBA ERP mapping.

Default source:
    SQL Server default instance on localhost, database JUNAIDIGROUP,
    Windows Integrated Authentication.

Default target:
    MariaDB 127.0.0.1, database hba_erp_legacy.

Dependencies:
    pyodbc
    mysql-connector-python

Example:
    python migrate_accu_to_mariadb.py \
        --sql-server localhost \
        --sql-database JUNAIDIGROUP \
        --maria-database hba_erp_legacy \
        --maria-user hba_erp

Notes:
- Table/column names are preserved wherever MariaDB permits them.
- SQL Server identities become MariaDB AUTO_INCREMENT.
- Primary keys, unique indexes, normal indexes, and foreign keys are recreated
  after data loading where possible.
- Source computed columns are mirrored as ordinary stored columns so that their
  historical values are preserved.
- Stored procedures/views/triggers are not mirrored by this utility. Earlier
  source inspection indicated no user procedures/views/functions/triggers.
- The application database hba_erp_dev is never modified by this script.
"""

from __future__ import annotations

import argparse
import getpass
import hashlib
import re
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Iterable

import mysql.connector
import pyodbc
from mysql.connector import Error as MySQLError


BATCH_SIZE = 2000
MAX_IDENTIFIER_LENGTH = 64


def utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def q_mssql(name: str) -> str:
    return "[" + name.replace("]", "]]" ) + "]"


def q_mysql(name: str) -> str:
    return "`" + name.replace("`", "``") + "`"


def safe_mysql_identifier(name: str, fallback_prefix: str = "idx") -> str:
    """Keep identifiers <= 64 chars while minimizing collisions."""
    if len(name) <= MAX_IDENTIFIER_LENGTH:
        return name
    digest = hashlib.sha1(name.encode("utf-8")).hexdigest()[:10]
    keep = MAX_IDENTIFIER_LENGTH - len(digest) - 1
    return f"{name[:keep]}_{digest}"


@dataclass
class Column:
    name: str
    sql_type: str
    max_length: int
    precision: int
    scale: int
    nullable: bool
    identity: bool
    computed: bool

    @property
    def is_lob(self) -> bool:
        return self.sql_type.lower() in {
            "text",
            "ntext",
            "image",
            "xml",
        } or (
            self.sql_type.lower() in {"varchar", "nvarchar", "varbinary"}
            and self.max_length == -1
        )


@dataclass
class Index:
    name: str
    is_unique: bool
    columns: list[str]


@dataclass
class ForeignKey:
    name: str
    child_columns: list[str]
    parent_schema: str
    parent_table: str
    parent_columns: list[str]


@dataclass
class TableInfo:
    schema: str
    name: str
    columns: list[Column]
    primary_key: list[str]
    indexes: list[Index]
    foreign_keys: list[ForeignKey]
    source_row_count: int = 0


def map_sqlserver_type(col: Column) -> str:
    t = col.sql_type.lower()

    if t in {"bigint"}:
        return "BIGINT"
    if t in {"int"}:
        return "INT"
    if t in {"smallint"}:
        return "SMALLINT"
    if t in {"tinyint"}:
        return "TINYINT"
    if t in {"bit"}:
        return "TINYINT(1)"
    if t in {"decimal", "numeric"}:
        p = max(1, min(col.precision or 18, 65))
        s = max(0, min(col.scale or 0, p))
        return f"DECIMAL({p},{s})"
    if t in {"money", "smallmoney"}:
        return "DECIMAL(19,4)" if t == "money" else "DECIMAL(10,4)"
    if t in {"float"}:
        return "DOUBLE"
    if t in {"real"}:
        return "FLOAT"

    if t in {"char", "varchar"}:
        if col.max_length == -1:
            return "LONGTEXT"
        length = max(1, min(col.max_length, 16383))
        if t == "char":
            return f"CHAR({length})"
        return f"VARCHAR({length})"

    if t in {"nchar", "nvarchar"}:
        if col.max_length == -1:
            return "LONGTEXT"
        # SQL Server max_length for nchar/nvarchar is bytes, not characters.
        length = max(1, min(col.max_length // 2, 16383))
        if t == "nchar":
            return f"CHAR({length})"
        return f"VARCHAR({length})"

    if t in {"text", "ntext"}:
        return "LONGTEXT"

    if t in {"binary", "varbinary"}:
        if col.max_length == -1:
            return "LONGBLOB"
        length = max(1, min(col.max_length, 65532))
        return f"BINARY({length})" if t == "binary" else f"VARBINARY({length})"

    if t in {"image"}:
        return "LONGBLOB"

    if t in {"date"}:
        return "DATE"
    if t in {"time"}:
        # SQL Server time precision max is 7; MariaDB supports microseconds.
        return "TIME(6)"
    if t in {"datetime", "smalldatetime"}:
        return "DATETIME"
    if t in {"datetime2"}:
        return "DATETIME(6)"
    if t in {"datetimeoffset"}:
        # Preserve the original offset safely as text.
        return "VARCHAR(50)"
    if t in {"timestamp", "rowversion"}:
        return "BINARY(8)"

    if t in {"uniqueidentifier"}:
        return "CHAR(36)"
    if t in {"xml"}:
        return "LONGTEXT"
    if t in {"sql_variant"}:
        return "LONGTEXT"
    if t in {"geography", "geometry", "hierarchyid"}:
        # Rare in the Accu-Travel schema; preserve as binary if present.
        return "LONGBLOB"

    # Conservative fallback for uncommon SQL Server types.
    return "LONGTEXT"


def source_select_expression(col: Column) -> str:
    """Return a source SELECT expression that is safe for pyodbc retrieval."""
    q = q_mssql(col.name)
    t = col.sql_type.lower()
    if t == "sql_variant":
        return f"CONVERT(nvarchar(max), {q}) AS {q_mssql(col.name)}"
    if t in {"datetimeoffset"}:
        return f"CONVERT(varchar(50), {q}, 127) AS {q_mssql(col.name)}"
    if t in {"geography", "geometry", "hierarchyid"}:
        return f"CONVERT(varbinary(max), {q}) AS {q_mssql(col.name)}"
    return q


def normalize_row_value(value: Any, col: Column) -> Any:
    """Normalize pyodbc output into mysql-connector compatible values."""
    if value is None:
        return None

    t = col.sql_type.lower()

    # pyodbc sometimes exposes GUIDs as strings already; preserve as text.
    if t == "uniqueidentifier":
        return str(value)

    # SQL Server rowversion/timestamp/varbinary/image may return bytearray.
    if isinstance(value, bytearray):
        return bytes(value)

    # Convert Decimal to itself; connector supports Decimal.
    if isinstance(value, Decimal):
        return value

    return value


def connect_sqlserver(server: str, database: str) -> pyodbc.Connection:
    """Connect to SQL Server using Windows Integrated Authentication."""

    installed_drivers = pyodbc.drivers()

    preferred = None

    for candidate in (
        "ODBC Driver 18 for SQL Server",
        "ODBC Driver 17 for SQL Server",
        "ODBC Driver 13 for SQL Server",
    ):
        if candidate in installed_drivers:
            preferred = candidate
            break

    if preferred is None:
        raise RuntimeError(
            "No Microsoft SQL Server ODBC driver was found. "
            f"Installed drivers: {installed_drivers}"
        )

    print(f"  Using SQL Server ODBC driver: {preferred}")

    conn_str = (
        f"DRIVER={{{preferred}}};"
        f"SERVER={server};"
        f"DATABASE={database};"
        "Trusted_Connection=yes;"
        "Encrypt=no;"
        "TrustServerCertificate=yes;"
    )

    return pyodbc.connect(
        conn_str,
        timeout=30,
    )


def connect_mariadb(host: str, port: int, user: str, password: str, database: str):
    return mysql.connector.connect(
        host=host,
        port=port,
        user=user,
        password=password,
        database=database,
        autocommit=False,
        charset="utf8mb4",
        collation="utf8mb4_unicode_ci",
    )


def create_manifest_table(conn) -> None:
    cur = conn.cursor()
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS `__migration_manifest` (
            `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            `run_id` CHAR(36) NOT NULL,
            `source_schema` VARCHAR(128) NOT NULL,
            `source_table` VARCHAR(128) NOT NULL,
            `source_rows` BIGINT NOT NULL DEFAULT 0,
            `target_rows` BIGINT NOT NULL DEFAULT 0,
            `status` VARCHAR(30) NOT NULL,
            `error_message` LONGTEXT NULL,
            `started_at` DATETIME(6) NOT NULL,
            `finished_at` DATETIME(6) NULL,
            PRIMARY KEY (`id`),
            KEY `idx_manifest_run` (`run_id`),
            KEY `idx_manifest_table` (`source_schema`, `source_table`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """
    )
    conn.commit()
    cur.close()


def table_metadata(sql_conn: pyodbc.Connection, schema: str, table: str) -> TableInfo:
    cur = sql_conn.cursor()

    cur.execute(
        """
        SELECT
            c.name,
            ty.name,
            c.max_length,
            c.precision,
            c.scale,
            c.is_nullable,
            c.is_identity,
            c.is_computed
        FROM sys.columns c
        JOIN sys.tables t ON t.object_id = c.object_id
        JOIN sys.schemas s ON s.schema_id = t.schema_id
        JOIN sys.types ty ON ty.user_type_id = c.user_type_id
        WHERE s.name = ? AND t.name = ?
        ORDER BY c.column_id
        """,
        schema,
        table,
    )
    columns = [
        Column(
            name=row[0],
            sql_type=row[1],
            max_length=int(row[2]),
            precision=int(row[3]),
            scale=int(row[4]),
            nullable=bool(row[5]),
            identity=bool(row[6]),
            computed=bool(row[7]),
        )
        for row in cur.fetchall()
    ]

    cur.execute(
        """
        SELECT c.name
        FROM sys.indexes i
        JOIN sys.index_columns ic
          ON ic.object_id = i.object_id
         AND ic.index_id = i.index_id
         AND ic.key_ordinal > 0
        JOIN sys.columns c
          ON c.object_id = ic.object_id
         AND c.column_id = ic.column_id
        JOIN sys.tables t ON t.object_id = i.object_id
        JOIN sys.schemas s ON s.schema_id = t.schema_id
        WHERE s.name = ?
          AND t.name = ?
          AND i.is_primary_key = 1
        ORDER BY ic.key_ordinal
        """,
        schema,
        table,
    )
    pk = [row[0] for row in cur.fetchall()]

    cur.execute(
        """
        SELECT
            i.name,
            i.is_unique,
            c.name,
            ic.key_ordinal
        FROM sys.indexes i
        JOIN sys.index_columns ic
          ON ic.object_id = i.object_id
         AND ic.index_id = i.index_id
         AND ic.is_included_column = 0
         AND ic.key_ordinal > 0
        JOIN sys.columns c
          ON c.object_id = ic.object_id
         AND c.column_id = ic.column_id
        JOIN sys.tables t ON t.object_id = i.object_id
        JOIN sys.schemas s ON s.schema_id = t.schema_id
        WHERE s.name = ?
          AND t.name = ?
          AND i.is_primary_key = 0
          AND i.is_disabled = 0
          AND i.type IN (1, 2)
        ORDER BY i.name, ic.key_ordinal
        """,
        schema,
        table,
    )
    index_rows = cur.fetchall()
    index_map: dict[str, Index] = {}
    for name, unique, col, _ordinal in index_rows:
        index_map.setdefault(
            name,
            Index(name=name, is_unique=bool(unique), columns=[]),
        ).columns.append(col)

    cur.execute(
        """
        SELECT
            fk.name,
            pc.name,
            rs.name,
            rt.name,
            rc.name,
            fkc.constraint_column_id
        FROM sys.foreign_keys fk
        JOIN sys.foreign_key_columns fkc
          ON fkc.constraint_object_id = fk.object_id
        JOIN sys.tables ct ON ct.object_id = fk.parent_object_id
        JOIN sys.schemas cs ON cs.schema_id = ct.schema_id
        JOIN sys.columns pc
          ON pc.object_id = fk.parent_object_id
         AND pc.column_id = fkc.parent_column_id
        JOIN sys.tables rt ON rt.object_id = fk.referenced_object_id
        JOIN sys.schemas rs ON rs.schema_id = rt.schema_id
        JOIN sys.columns rc
          ON rc.object_id = fk.referenced_object_id
         AND rc.column_id = fkc.referenced_column_id
        WHERE cs.name = ? AND ct.name = ?
        ORDER BY fk.name, fkc.constraint_column_id
        """,
        schema,
        table,
    )
    fk_rows = cur.fetchall()
    fk_map: dict[str, ForeignKey] = {}
    for name, child, pschema, ptable, parent, _ordinal in fk_rows:
        fk_map.setdefault(
            name,
            ForeignKey(
                name=name,
                child_columns=[],
                parent_schema=pschema,
                parent_table=ptable,
                parent_columns=[],
            ),
        )
        fk_map[name].child_columns.append(child)
        fk_map[name].parent_columns.append(parent)

    cur.execute(
        f"SELECT COUNT_BIG(*) FROM {q_mssql(schema)}.{q_mssql(table)}"
    )
    row_count = int(cur.fetchone()[0])
    cur.close()

    return TableInfo(
        schema=schema,
        name=table,
        columns=columns,
        primary_key=pk,
        indexes=list(index_map.values()),
        foreign_keys=list(fk_map.values()),
        source_row_count=row_count,
    )


def list_user_tables(sql_conn: pyodbc.Connection) -> list[tuple[str, str]]:
    cur = sql_conn.cursor()
    cur.execute(
        """
        SELECT s.name, t.name
        FROM sys.tables t
        JOIN sys.schemas s ON s.schema_id = t.schema_id
        WHERE t.is_ms_shipped = 0
        ORDER BY s.name, t.name
        """
    )
    tables = [(row[0], row[1]) for row in cur.fetchall()]
    cur.close()
    return tables


def drop_target_table(conn, table: str) -> None:
    cur = conn.cursor()
    cur.execute(f"DROP TABLE IF EXISTS {q_mysql(table)}")
    conn.commit()
    cur.close()


def create_target_table(conn, info: TableInfo) -> None:
    clauses: list[str] = []
    for col in info.columns:
        target_type = map_sqlserver_type(col)
        nullable = "NULL" if col.nullable else "NOT NULL"
        auto = ""
        # Source computed columns are stored values in the legacy mirror.
        clauses.append(
            f"{q_mysql(col.name)} {target_type}{auto} {nullable}"
        )

    sql = (
        f"CREATE TABLE {q_mysql(info.name)} (\n  "
        + ",\n  ".join(clauses)
        + "\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    )
    cur = conn.cursor()
    cur.execute(sql)
    conn.commit()
    cur.close()


def insert_table_data(sql_conn: pyodbc.Connection, maria_conn, info: TableInfo) -> int:
    source_columns = ", ".join(source_select_expression(c) for c in info.columns)
    target_columns = ", ".join(q_mysql(c.name) for c in info.columns)
    placeholders = ", ".join(["%s"] * len(info.columns))

    select_sql = (
        f"SELECT {source_columns} "
        f"FROM {q_mssql(info.schema)}.{q_mssql(info.name)}"
    )

    insert_sql = (
        f"INSERT INTO {q_mysql(info.name)} ({target_columns}) "
        f"VALUES ({placeholders})"
    )

    src = sql_conn.cursor()
    src.arraysize = BATCH_SIZE
    src.execute(select_sql)

    dst = maria_conn.cursor()
    count = 0
    while True:
        rows = src.fetchmany(BATCH_SIZE)
        if not rows:
            break

        normalized = [
            tuple(
                normalize_row_value(value, col)
                for value, col in zip(row, info.columns)
            )
            for row in rows
        ]
        dst.executemany(insert_sql, normalized)
        maria_conn.commit()
        count += len(rows)

    dst.close()
    src.close()
    return count


def add_primary_key(conn, info: TableInfo) -> None:
    if not info.primary_key:
        return
    cur = conn.cursor()
    name = safe_mysql_identifier(
        f"PK_{info.name}",
        "pk",
    )
    cols = ", ".join(q_mysql(c) for c in info.primary_key)
    try:
        cur.execute(
            f"ALTER TABLE {q_mysql(info.name)} "
            f"ADD CONSTRAINT {q_mysql(name)} PRIMARY KEY ({cols})"
        )
        conn.commit()
    except MySQLError as exc:
        print(f"  WARNING: PK skipped for {info.name}: {exc}")
        conn.rollback()
    finally:
        cur.close()


def add_indexes(conn, info: TableInfo) -> None:
    cur = conn.cursor()
    for idx in info.indexes:
        name = safe_mysql_identifier(idx.name, "idx")
        cols = ", ".join(q_mysql(c) for c in idx.columns)
        kind = "UNIQUE " if idx.is_unique else ""
        try:
            cur.execute(
                f"ALTER TABLE {q_mysql(info.name)} "
                f"ADD {kind}INDEX {q_mysql(name)} ({cols})"
            )
            conn.commit()
        except MySQLError as exc:
            print(
                f"  WARNING: index {idx.name} on {info.name} skipped: {exc}"
            )
            conn.rollback()
    cur.close()


def add_foreign_keys(conn, infos: dict[tuple[str, str], TableInfo]) -> None:
    cur = conn.cursor()
    # Add FKs only after every table is loaded.
    for info in infos.values():
        for fk in info.foreign_keys:
            if (fk.parent_schema, fk.parent_table) not in infos:
                print(
                    f"  WARNING: FK {fk.name} on {info.name} references "
                    f"external table {fk.parent_schema}.{fk.parent_table}; skipped."
                )
                continue

            name = safe_mysql_identifier(fk.name, "fk")
            child_cols = ", ".join(q_mysql(c) for c in fk.child_columns)
            parent_cols = ", ".join(q_mysql(c) for c in fk.parent_columns)
            try:
                cur.execute(
                    f"ALTER TABLE {q_mysql(info.name)} "
                    f"ADD CONSTRAINT {q_mysql(name)} FOREIGN KEY "
                    f"({child_cols}) REFERENCES {q_mysql(fk.parent_table)} "
                    f"({parent_cols})"
                )
                conn.commit()
            except MySQLError as exc:
                print(
                    f"  WARNING: FK {fk.name} on {info.name} skipped: {exc}"
                )
                conn.rollback()
    cur.close()


def target_row_count(conn, table: str) -> int:
    cur = conn.cursor()
    cur.execute(f"SELECT COUNT(*) FROM {q_mysql(table)}")
    result = int(cur.fetchone()[0])
    cur.close()
    return result


def manifest_insert(
    conn,
    run_id: str,
    info: TableInfo,
    status: str,
    target_rows: int,
    error_message: str | None,
    started_at: datetime,
    finished_at: datetime,
) -> None:
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO `__migration_manifest`
        (`run_id`, `source_schema`, `source_table`, `source_rows`,
         `target_rows`, `status`, `error_message`, `started_at`, `finished_at`)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (
            run_id,
            info.schema,
            info.name,
            info.source_row_count,
            target_rows,
            status,
            error_message,
            started_at,
            finished_at,
        ),
    )
    conn.commit()
    cur.close()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sql-server", default="localhost")
    parser.add_argument("--sql-database", default="JUNAIDIGROUP")
    parser.add_argument("--maria-host", default="127.0.0.1")
    parser.add_argument("--maria-port", type=int, default=3306)
    parser.add_argument("--maria-user", default="hba_erp")
    parser.add_argument("--maria-database", default="hba_erp_legacy")
    parser.add_argument(
        "--replace",
        action="store_true",
        help="Drop and recreate target tables before copying. Recommended for repeated snapshots.",
    )
    parser.add_argument(
        "--no-indexes",
        action="store_true",
        help="Skip recreating indexes and foreign keys.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    print("=" * 78)
    print("HBA ERP â€” Accu-Travel -> MariaDB Legacy Mirror")
    print("=" * 78)
    print(f"Source: {args.sql_server} / {args.sql_database}")
    print(f"Target: {args.maria_host}:{args.maria_port} / {args.maria_database}")
    print()

    maria_password = getpass.getpass(
        f"MariaDB password for {args.maria_user}: "
    )

    try:
        print("Connecting to SQL Server...")
        sql_conn = connect_sqlserver(
            args.sql_server,
            args.sql_database,
        )
        print("  SQL Server connected.")

        print("Connecting to MariaDB...")
        maria_conn = connect_mariadb(
            args.maria_host,
            args.maria_port,
            args.maria_user,
            maria_password,
            args.maria_database,
        )
        print("  MariaDB connected.")

    except Exception as exc:
        print(f"ERROR connecting: {exc}")
        return 1

    run_id = hashlib.sha1(
        f"{datetime.now().isoformat()}".encode("utf-8")
    ).hexdigest()[:8]
    # Use UUID-like readable run ID for manifest without adding dependency.
    run_id = f"{run_id}-{datetime.now().strftime('%Y%m%d%H%M%S')}"

    try:
        create_manifest_table(maria_conn)

        print("Reading SQL Server table list...")
        table_names = list_user_tables(sql_conn)
        print(f"  Found {len(table_names)} user tables.")
        print()

        infos: dict[tuple[str, str], TableInfo] = {}
        for schema, table in table_names:
            info = table_metadata(sql_conn, schema, table)
            infos[(schema, table)] = info

        failures = 0
        successful = 0
        total_source_rows = 0
        total_target_rows = 0

        # Phase 1: create and load every table.
        for idx, ((schema, table), info) in enumerate(infos.items(), start=1):
            started = utc_now()
            print(
                f"[{idx}/{len(infos)}] {schema}.{table} "
                f"({info.source_row_count:,} rows)"
            )
            total_source_rows += info.source_row_count

            try:
                if args.replace:
                    drop_target_table(maria_conn, table)

                # If the table exists and not replacing, truncate so the snapshot
                # remains deterministic rather than accumulating duplicates.
                cur = maria_conn.cursor()
                cur.execute(
                    "SELECT COUNT(*) FROM information_schema.tables "
                    "WHERE table_schema = DATABASE() AND table_name = %s",
                    (table,),
                )
                exists = int(cur.fetchone()[0]) > 0
                cur.close()

                if exists:
                    cur = maria_conn.cursor()
                    cur.execute(f"TRUNCATE TABLE {q_mysql(table)}")
                    maria_conn.commit()
                    cur.close()
                else:
                    create_target_table(maria_conn, info)

                # If replace=True, table was dropped; recreate it.
                cur = maria_conn.cursor()
                cur.execute(
                    "SELECT COUNT(*) FROM information_schema.tables "
                    "WHERE table_schema = DATABASE() AND table_name = %s",
                    (table,),
                )
                exists_after_drop = int(cur.fetchone()[0]) > 0
                cur.close()
                if not exists_after_drop:
                    create_target_table(maria_conn, info)

                loaded = insert_table_data(sql_conn, maria_conn, info)
                target_count = target_row_count(maria_conn, table)
                total_target_rows += target_count

                if target_count != info.source_row_count:
                    raise RuntimeError(
                        f"Row count mismatch: source={info.source_row_count:,}, "
                        f"target={target_count:,}, loaded={loaded:,}"
                    )

                manifest_insert(
                    maria_conn,
                    run_id,
                    info,
                    "OK",
                    target_count,
                    None,
                    started,
                    utc_now(),
                )
                successful += 1
                print(f"    OK â€” {target_count:,} rows")

            except Exception as exc:
                failures += 1
                maria_conn.rollback()
                message = str(exc)
                try:
                    target_count = target_row_count(maria_conn, table)
                except Exception:
                    target_count = 0
                manifest_insert(
                    maria_conn,
                    run_id,
                    info,
                    "FAILED",
                    target_count,
                    message,
                    started,
                    utc_now(),
                )
                print(f"    FAILED â€” {message}")

        if not args.no_indexes:
            print()
            print("Adding primary keys...")
            for info in infos.values():
                add_primary_key(maria_conn, info)

            print("Adding indexes...")
            for info in infos.values():
                add_indexes(maria_conn, info)

            print("Adding foreign keys...")
            add_foreign_keys(maria_conn, infos)

        print()
        print("=" * 78)
        print("MIGRATION SUMMARY")
        print("=" * 78)
        print(f"Run ID:          {run_id}")
        print(f"Tables found:    {len(infos):,}")
        print(f"Tables successful:{successful:3d}")
        print(f"Tables failed:   {failures:3d}")
        print(f"Source rows:     {total_source_rows:,}")
        print(f"Target rows:     {total_target_rows:,}")
        print()

        if failures:
            print(
                "Migration completed with failures. Query "
                "__migration_manifest in the target database for details."
            )
            return 2

        print("Full table/data mirror completed successfully.")
        print(
            "Next step: map this legacy mirror into the HBA ERP application tables."
        )
        return 0

    finally:
        try:
            sql_conn.close()
        except Exception:
            pass
        try:
            maria_conn.close()
        except Exception:
            pass


if __name__ == "__main__":
    raise SystemExit(main())

