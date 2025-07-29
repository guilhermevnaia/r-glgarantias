import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv("S:/comp-glgarantias/r-glgarantias/backend/.env")

supabase_url = os.getenv("SUPABASE_URL")
supabase_service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not supabase_url or not supabase_service_role_key:
    print("Erro: Variáveis de ambiente não configuradas.")
    exit()

supabase: Client = create_client(supabase_url, supabase_service_role_key)

def check_table_structure():
    try:
        # Tentar obter alguns registros para ver a estrutura
        result = supabase.table("service_orders").select("*").limit(1).execute()
        
        if result.data:
            print("Colunas encontradas na tabela service_orders:")
            for key in result.data[0].keys():
                print(f"  - {key}")
        else:
            print("Tabela vazia, tentando inserir um registro de teste...")
            
            # Tentar inserir com estrutura básica
            test_record = {
                "order_number": "TEST001",
                "order_date": "2024-01-01",
                "order_status": "G"
            }
            
            try:
                insert_result = supabase.table("service_orders").insert(test_record).execute()
                print("Inserção de teste bem-sucedida!")
                
                # Deletar o registro de teste
                supabase.table("service_orders").delete().eq("order_number", "TEST001").execute()
                print("Registro de teste removido.")
                
            except Exception as e:
                print(f"Erro na inserção de teste: {e}")
                # Extrair informações do erro
                if hasattr(e, 'details') and e.details:
                    print(f"Detalhes: {e.details}")
                    
    except Exception as e:
        print(f"Erro ao verificar tabela: {e}")

def count_existing_records():
    try:
        result = supabase.table("service_orders").select("count", count="exact").execute()
        print(f"Registros existentes: {result.count}")
    except Exception as e:
        print(f"Erro ao contar registros: {e}")

print("Verificando estrutura da tabela service_orders...")
check_table_structure()
print()
count_existing_records()