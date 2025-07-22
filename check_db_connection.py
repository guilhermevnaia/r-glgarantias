import psycopg2
import os

db_url = "postgresql://postgres:Edu23Tata23!@db.njdmpdpglpidamparwtr.supabase.co:5432/postgres"

try:
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';")
    tables = cur.fetchall()
    print("Conexão com o Supabase bem-sucedida!")
    print("Tabelas no banco de dados:")
    for table in tables:
        print(f"- {table[0]}")
    cur.close()
    conn.close()
except Exception as e:
    print(f"Erro ao conectar ou consultar o Supabase: {e}")


