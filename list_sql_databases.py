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

cur.execute("""
    SELECT
        name,
        state_desc,
        user_access_desc,
        recovery_model_desc,
        is_read_only,
        SUSER_SNAME(owner_sid)
    FROM sys.databases
    ORDER BY name
""")

print("=== SQL SERVER DATABASES ===")

for row in cur.fetchall():
    print(row)

cur.close()
conn.close()
