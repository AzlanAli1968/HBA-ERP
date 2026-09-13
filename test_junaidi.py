import pyodbc

cs = (
    "DRIVER={ODBC Driver 18 for SQL Server};"
    "SERVER=localhost;"
    "DATABASE=master;"
    "Trusted_Connection=yes;"
    "Encrypt=no;"
    "TrustServerCertificate=yes;"
)

conn = pyodbc.connect(cs, timeout=10)
cur = conn.cursor()

print("=== DATABASE STATUS ===")

cur.execute("""
    SELECT
        name,
        state_desc,
        user_access_desc,
        recovery_model_desc,
        is_read_only,
        is_auto_close_on,
        containment_desc,
        SUSER_SNAME(owner_sid)
    FROM sys.databases
    WHERE name = 'JUNAIDIGROUP'
""")

row = cur.fetchone()
print(row)

print()
print("=== DATABASE ID ===")

cur.execute("""
    SELECT DB_ID('JUNAIDIGROUP')
""")

print(cur.fetchone())

print()
print("=== DATABASE FILES ===")

cur.execute("""
    SELECT
        DB_NAME(database_id),
        name,
        physical_name,
        state_desc
    FROM sys.master_files
    WHERE database_id = DB_ID('JUNAIDIGROUP')
""")

for row in cur.fetchall():
    print(row)

print()
print("=== ATTEMPTING USE JUNAIDIGROUP ===")

try:
    cur.execute("USE [JUNAIDIGROUP]")
    cur.execute("SELECT DB_NAME(), SUSER_SNAME(), IS_SRVROLEMEMBER('sysadmin')")
    print(cur.fetchone())
    print("DATABASE ACCESS OK")
except Exception as e:
    print("USE FAILED:")
    print(e)

cur.close()
conn.close()
