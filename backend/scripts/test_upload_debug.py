import os
import json
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv("S:/comp-glgarantias/r-glgarantias/backend/.env")

supabase_url = os.getenv("SUPABASE_URL")
supabase_service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not supabase_url or not supabase_service_role_key:
    print("Erro: Variáveis de ambiente não configuradas.")
    exit()

supabase: Client = create_client(supabase_url, supabase_service_role_key)

def test_supabase_connection():
    """Testa conexão com Supabase"""
    print("🔍 Testando conexão com Supabase...")
    
    try:
        # Testar conexão básica
        result = supabase.table("service_orders").select("count", count="exact").execute()
        count = result.count if hasattr(result, 'count') else 0
        print(f"✅ Conexão OK - Registros na tabela service_orders: {count}")
        return True
    except Exception as e:
        print(f"❌ Erro na conexão: {e}")
        return False

def test_insert_sample_data():
    """Testa inserção de dados de exemplo"""
    print("\n🧪 Testando inserção de dados de exemplo...")
    
    sample_data = [
        {
            "order_number": "TEST001",
            "order_date": "2024-01-01",
            "order_status": "G",
            "customer_name": "Cliente Teste",
            "total_value": 100.00,
            "parts_total": 50.00,
            "labor_total": 50.00
        },
        {
            "order_number": "TEST002", 
            "order_date": "2024-01-02",
            "order_status": "G",
            "customer_name": "Cliente Teste 2",
            "total_value": 200.00,
            "parts_total": 100.00,
            "labor_total": 100.00
        }
    ]
    
    try:
        # Inserir dados de teste
        result = supabase.table("service_orders").insert(sample_data).execute()
        
        if result.data:
            print(f"✅ Dados de teste inseridos com sucesso! {len(result.data)} registros")
            
            # Verificar se foram inseridos
            check_result = supabase.table("service_orders").select("*").in_("order_number", ["TEST001", "TEST002"]).execute()
            print(f"✅ Verificação: {len(check_result.data)} registros encontrados")
            
            # Limpar dados de teste
            supabase.table("service_orders").delete().in_("order_number", ["TEST001", "TEST002"]).execute()
            print("🧹 Dados de teste removidos")
            
            return True
        else:
            print("❌ Falha na inserção de dados de teste")
            return False
            
    except Exception as e:
        print(f"❌ Erro na inserção de teste: {e}")
        return False

def check_table_structure():
    """Verifica a estrutura da tabela service_orders"""
    print("\n📋 Verificando estrutura da tabela service_orders...")
    
    try:
        # Tentar inserir um registro com estrutura mínima
        test_record = {
            "order_number": "STRUCTURE_TEST",
            "order_date": "2024-01-01"
        }
        
        result = supabase.table("service_orders").insert(test_record).execute()
        
        if result.data:
            print("✅ Estrutura da tabela OK")
            
            # Limpar registro de teste
            supabase.table("service_orders").delete().eq("order_number", "STRUCTURE_TEST").execute()
            return True
        else:
            print("❌ Problema com estrutura da tabela")
            return False
            
    except Exception as e:
        print(f"❌ Erro ao verificar estrutura: {e}")
        return False

def simulate_python_processing_result():
    """Simula o resultado do processamento Python"""
    print("\n🐍 Simulando resultado do processamento Python...")
    
    # Simular dados que o Python retornaria
    sample_data = [
        {
            "order_number": "OS001",
            "order_date": "2024-01-15",
            "order_status": "G",
            "customer_name": "João Silva",
            "total_value": 150.00,
            "parts_total": 75.00,
            "labor_total": 75.00,
            "vehicle_plate": "ABC1234",
            "mechanic_name": "Mecânico 1"
        },
        {
            "order_number": "OS002",
            "order_date": "2024-01-16", 
            "order_status": "G",
            "customer_name": "Maria Santos",
            "total_value": 300.00,
            "parts_total": 200.00,
            "labor_total": 100.00,
            "vehicle_plate": "XYZ5678",
            "mechanic_name": "Mecânico 2"
        }
    ]
    
    print(f"📊 Dados simulados: {len(sample_data)} registros")
    
    try:
        # Inserir dados simulados
        result = supabase.table("service_orders").insert(sample_data).execute()
        
        if result.data:
            print(f"✅ Dados simulados inseridos: {len(result.data)} registros")
            
            # Verificar inserção
            check_result = supabase.table("service_orders").select("*").in_("order_number", ["OS001", "OS002"]).execute()
            print(f"✅ Verificação: {len(check_result.data)} registros no banco")
            
            # Limpar dados simulados
            supabase.table("service_orders").delete().in_("order_number", ["OS001", "OS002"]).execute()
            print("🧹 Dados simulados removidos")
            
            return True
        else:
            print("❌ Falha na inserção de dados simulados")
            return False
            
    except Exception as e:
        print(f"❌ Erro na simulação: {e}")
        return False

def main():
    print("🔍 DEBUG COMPLETO DO SISTEMA DE UPLOAD")
    print("=" * 50)
    
    # Teste 1: Conexão
    if not test_supabase_connection():
        print("❌ Falha na conexão - abortando testes")
        return
    
    # Teste 2: Estrutura da tabela
    if not check_table_structure():
        print("❌ Problema com estrutura da tabela")
        return
    
    # Teste 3: Inserção de dados de exemplo
    if not test_insert_sample_data():
        print("❌ Problema com inserção básica")
        return
    
    # Teste 4: Simulação do processamento Python
    if not simulate_python_processing_result():
        print("❌ Problema com dados simulados")
        return
    
    print("\n🎉 TODOS OS TESTES PASSARAM!")
    print("✅ O sistema de upload está funcionando corretamente")
    print("💡 O problema pode estar no processamento Python ou na integração")

if __name__ == "__main__":
    main() 