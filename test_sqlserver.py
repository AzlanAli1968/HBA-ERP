import pyodbc

connection_string = (
    "DRIVER={ODBC Driver 18 for SQL Server};"
    "SERVER=localhost;"
    "DATABASE=master;"
    "Trusted_Connection=yes;"
    "Encrypt=no;"
    "TrustServerCertificate=yes;"
)

conn = pyodbc.connect(connection_string, timeout=10)
cursor = conn.cursor()

cursor.execute("""
    SELECT
        DB_NAME(),
        SUSER_SNAME(),
        IS_SRVROLEMEMBER('sysadmin')
""")

print(cursor.fetchone())

cursor.close()
conn.close()
