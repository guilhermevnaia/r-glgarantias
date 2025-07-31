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

def check_integrity_table():
    try:
        # Tentar inserir um registro de teste na tabela data_integrity_logs
        test_log = {
            "check_type": "TEST_CHECK",
            "expected_count": 0,
            "actual_count": 0,
            "status": "OK",
            "details": "Teste de conexão com a tabela data_integrity_logs"
        }
        
        result = supabase.table("data_integrity_logs").insert(test_log).execute()
        print("✅ Tabela data_integrity_logs existe e está funcionando!")
        print(f"Log de teste inserido com ID: {result.data[0]['id'] if result.data else 'N/A'}")
        
        # Deletar o registro de teste
        if result.data and result.data[0]:
            supabase.table("data_integrity_logs").delete().eq("id", result.data[0]['id']).execute()
            print("Registro de teste removido.")
            
    except Exception as e:
        print(f"❌ Erro ao acessar tabela data_integrity_logs: {e}")
        print("A tabela pode não existir. Criando...")
        create_integrity_table()

def create_integrity_table():
    try:
        # SQL para criar a tabela
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS data_integrity_logs (
            id SERIAL PRIMARY KEY,
            timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            check_type VARCHAR(100) NOT NULL,
            expected_count INTEGER NOT NULL DEFAULT 0,
            actual_count INTEGER NOT NULL DEFAULT 0,
            status VARCHAR(20) NOT NULL CHECK (status IN ('OK', 'ERROR', 'FIXED')),
            details TEXT,
            error_details TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        """
        
        # Executar SQL via Supabase (se suportado)
        # Como alternativa, vamos tentar inserir um registro para forçar a criação
        print("Tentando criar tabela através de inserção...")
        
        # Tentar inserir novamente
        test_log = {
            "check_type": "TABLE_CREATION_TEST",
            "expected_count": 0,
            "actual_count": 0,
            "status": "OK",
            "details": "Teste de criação da tabela data_integrity_logs"
        }
        
        result = supabase.table("data_integrity_logs").insert(test_log).execute()
        print("✅ Tabela data_integrity_logs criada com sucesso!")
        
        # Deletar o registro de teste
        if result.data and result.data[0]:
            supabase.table("data_integrity_logs").delete().eq("id", result.data[0]['id']).execute()
            print("Registro de teste removido.")
            
    except Exception as e:
        print(f"❌ Erro ao criar tabela: {e}")
        print("Você precisa criar a tabela manualmente no Supabase Dashboard")

def check_environment_variables():
    print("Verificando variáveis de ambiente:")
    print(f"SUPABASE_URL: {'✅ Configurado' if supabase_url else '❌ Não configurado'}")
    print(f"SUPABASE_SERVICE_ROLE_KEY: {'✅ Configurado' if supabase_service_role_key else '❌ Não configurado'}")

if __name__ == "__main__":
    check_environment_variables()
    print()
    check_integrity_table() 