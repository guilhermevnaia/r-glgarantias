import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv("S:/comp-glgarantias/r-glgarantias/backend/.env")

supabase_url = os.getenv("SUPABASE_URL")
supabase_service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not supabase_url or not supabase_service_role_key:
    print("Erro: Variáveis de ambiente não configuradas.")
    exit()

def check_and_create_table():
    """Verifica se a tabela existe e tenta criar via query direta"""
    
    supabase: Client = create_client(supabase_url, supabase_service_role_key)
    
    try:
        # Primeiro, tentar fazer uma consulta simples para ver se a tabela existe
        result = supabase.table("data_integrity_logs").select("*").limit(1).execute()
        print("Tabela data_integrity_logs já existe!")
        return True
        
    except Exception as e:
        print(f"Tabela não existe ou erro: {e}")
        print("Por favor, execute o SQL manual no Supabase Dashboard:")
        print("""
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

CREATE INDEX IF NOT EXISTS idx_data_integrity_logs_timestamp ON data_integrity_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_data_integrity_logs_check_type ON data_integrity_logs(check_type);
CREATE INDEX IF NOT EXISTS idx_data_integrity_logs_status ON data_integrity_logs(status);
        """)
        return False

if __name__ == "__main__":
    check_and_create_table()