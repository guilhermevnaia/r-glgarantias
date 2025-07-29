import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv("S:/comp-glgarantias/r-glgarantias/backend/.env")

supabase_url = os.getenv("SUPABASE_URL")
supabase_service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not supabase_url or not supabase_service_role_key:
    print("Erro: Variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas.")
    exit()

supabase: Client = create_client(supabase_url, supabase_service_role_key)

def get_table_schema(table_name: str):
    try:
        # Query information_schema.columns directly
        query = f"""SELECT column_name, data_type, is_nullable, column_default
                    FROM information_schema.columns
                    WHERE table_schema = 'public' AND table_name = '{table_name}'
                    ORDER BY ordinal_position;"""
        
        res = supabase.rpc("execute_sql", {"sql": query}).execute()
        
        if res.data and res.data[0] and res.data[0]["result"]:
            print(f"\n--- Schema for table: {table_name} ---")
            # The result comes as a list of lists, where the first list is headers
            headers = res.data[0]["result"][0]
            rows = res.data[0]["result"][1:]
            
            for row in rows:
                col_info = dict(zip(headers, row))
                print(f"  {col_info['column_name']}: {col_info['data_type']} (Nullable: {col_info['is_nullable']}, Default: {col_info['column_default']})")
        else:
            print(f"\n--- No columns found for table: {table_name} ---")

        # Get constraints (primary key, unique, check)
        constraints_query = f"""SELECT constraint_name, constraint_type
                                FROM information_schema.table_constraints
                                WHERE table_schema = 'public' AND table_name = '{table_name}';"""
        
        constraints_res = supabase.rpc("execute_sql", {"sql": constraints_query}).execute()
        
        if constraints_res.data and constraints_res.data[0] and constraints_res.data[0]["result"] and len(constraints_res.data[0]["result"]) > 1:
            print(f"  Constraints for {table_name}:")
            con_headers = constraints_res.data[0]["result"][0]
            con_rows = constraints_res.data[0]["result"][1:]
            for con_row in con_rows:
                con_info = dict(zip(con_headers, con_row))
                print(f"    - {con_info['constraint_name']} ({con_info['constraint_type']})")
        else:
            print(f"  No constraints found for {table_name}.")

    except Exception as e:
        print(f"Erro ao obter esquema para a tabela {table_name}: {e}")


print("Iniciando verificação do esquema do Supabase...")

get_table_schema("service_orders")
get_table_schema("file_processing_logs")
get_table_schema("processing_errors")
get_table_schema("system_settings")

print("Verificação do esquema concluída.")


