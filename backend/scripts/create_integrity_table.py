import os
from dotenv import load_dotenv
from supabase import create_client, Client
import requests
import json

load_dotenv("S:/comp-glgarantias/r-glgarantias/backend/.env")

supabase_url = os.getenv("SUPABASE_URL")
supabase_service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not supabase_url or not supabase_service_role_key:
    print("Erro: Variáveis de ambiente não configuradas.")
    exit()

def create_integrity_table_via_rest():
    """Cria a tabela data_integrity_logs via REST API do Supabase"""
    
    # URL para executar SQL via REST API
    sql_url = f"{supabase_url}/rest/v1/rpc/exec_sql"
    
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
    
    -- Criar índices para melhor performance
    CREATE INDEX IF NOT EXISTS idx_data_integrity_logs_timestamp ON data_integrity_logs(timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_data_integrity_logs_check_type ON data_integrity_logs(check_type);
    CREATE INDEX IF NOT EXISTS idx_data_integrity_logs_status ON data_integrity_logs(status);
    """
    
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {supabase_service_role_key}',
        'apikey': supabase_service_role_key
    }
    
    try:
        # Tentar criar via função RPC (se existir)
        response = requests.post(
            sql_url,
            headers=headers,
            json={'sql': create_table_sql}
        )
        
        if response.status_code == 200:
            print("✅ Tabela data_integrity_logs criada com sucesso via REST API!")
            return True
        else:
            print(f"❌ Erro ao criar tabela via REST API: {response.status_code}")
            print(f"Resposta: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Erro ao criar tabela via REST API: {e}")
        return False

def create_integrity_table_via_supabase_client():
    """Tenta criar a tabela usando o cliente Supabase"""
    
    supabase: Client = create_client(supabase_url, supabase_service_role_key)
    
    try:
        # Tentar inserir um registro de teste para forçar a criação da tabela
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
        
        return True
        
    except Exception as e:
        print(f"❌ Erro ao criar tabela via cliente Supabase: {e}")
        return False

def test_integrity_table():
    """Testa se a tabela data_integrity_logs está funcionando"""
    
    supabase: Client = create_client(supabase_url, supabase_service_role_key)
    
    try:
        # Tentar inserir um registro de teste
        test_log = {
            "check_type": "FINAL_TEST",
            "expected_count": 1,
            "actual_count": 1,
            "status": "OK",
            "details": "Teste final da tabela data_integrity_logs"
        }
        
        result = supabase.table("data_integrity_logs").insert(test_log).execute()
        print("✅ Tabela data_integrity_logs está funcionando perfeitamente!")
        
        # Deletar o registro de teste
        if result.data and result.data[0]:
            supabase.table("data_integrity_logs").delete().eq("id", result.data[0]['id']).execute()
            print("Registro de teste removido.")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro ao testar tabela: {e}")
        return False

def main():
    print("🔧 Criando tabela data_integrity_logs no Supabase...")
    print()
    
    # Primeiro, tentar criar via REST API
    print("1. Tentando criar via REST API...")
    if create_integrity_table_via_rest():
        print("✅ Sucesso!")
    else:
        print("❌ Falhou, tentando método alternativo...")
        
        # Se falhar, tentar via cliente Supabase
        print("2. Tentando criar via cliente Supabase...")
        if create_integrity_table_via_supabase_client():
            print("✅ Sucesso!")
        else:
            print("❌ Falhou.")
            print()
            print("📋 INSTRUÇÕES MANUAIS:")
            print("1. Acesse o Supabase Dashboard")
            print("2. Vá para SQL Editor")
            print("3. Execute o seguinte SQL:")
            print()
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
            return
    
    print()
    print("3. Testando tabela criada...")
    if test_integrity_table():
        print("🎉 Tabela data_integrity_logs criada e funcionando!")
        print("✅ O sistema de monitoramento de integridade agora deve funcionar corretamente.")
    else:
        print("❌ Ainda há problemas com a tabela.")

if __name__ == "__main__":
    main() 