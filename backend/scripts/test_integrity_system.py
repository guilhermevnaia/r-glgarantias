import os
from dotenv import load_dotenv
from supabase import create_client, Client
import json

load_dotenv("S:/comp-glgarantias/r-glgarantias/backend/.env")

supabase_url = os.getenv("SUPABASE_URL")
supabase_service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not supabase_url or not supabase_service_role_key:
    print("Erro: Variáveis de ambiente não configuradas.")
    exit()

supabase: Client = create_client(supabase_url, supabase_service_role_key)

def test_integrity_logs():
    """Testa o sistema de logs de integridade"""
    
    print("🧪 Testando sistema de logs de integridade...")
    print()
    
    # Teste 1: Inserir um log de teste
    print("1. Inserindo log de teste...")
    test_log = {
        "check_type": "SYSTEM_TEST",
        "expected_count": 100,
        "actual_count": 95,
        "status": "OK",
        "details": "Teste do sistema de integridade funcionando corretamente"
    }
    
    try:
        result = supabase.table("data_integrity_logs").insert(test_log).execute()
        
        if result.data and result.data[0]:
            log_id = result.data[0]['id']
            print(f"✅ Log inserido com sucesso! ID: {log_id}")
        else:
            print("❌ Erro: Log não foi inserido")
            return False
            
    except Exception as e:
        print(f"❌ Erro ao inserir log: {e}")
        return False
    
    # Teste 2: Buscar o log inserido
    print("2. Buscando log inserido...")
    try:
        result = supabase.table("data_integrity_logs").select("*").eq("id", log_id).execute()
        
        if result.data and result.data[0]:
            log = result.data[0]
            print(f"✅ Log encontrado: {log['check_type']} - {log['status']}")
            print(f"   Detalhes: {log['details']}")
        else:
            print("❌ Erro: Log não foi encontrado")
            return False
            
    except Exception as e:
        print(f"❌ Erro ao buscar log: {e}")
        return False
    
    # Teste 3: Buscar logs recentes
    print("3. Buscando logs recentes...")
    try:
        result = supabase.table("data_integrity_logs").select("*").order("timestamp", desc=True).limit(5).execute()
        
        if result.data:
            print(f"✅ Encontrados {len(result.data)} logs recentes")
            for log in result.data:
                print(f"   - {log['check_type']}: {log['status']} ({log['timestamp']})")
        else:
            print("ℹ️ Nenhum log encontrado")
            
    except Exception as e:
        print(f"❌ Erro ao buscar logs recentes: {e}")
        return False
    
    # Teste 4: Deletar o log de teste
    print("4. Removendo log de teste...")
    try:
        supabase.table("data_integrity_logs").delete().eq("id", log_id).execute()
        print("✅ Log de teste removido com sucesso!")
        
    except Exception as e:
        print(f"❌ Erro ao remover log: {e}")
        return False
    
    print()
    print("🎉 Todos os testes passaram! O sistema de integridade está funcionando corretamente.")
    return True

def test_service_orders_table():
    """Testa a tabela service_orders"""
    
    print("📊 Testando tabela service_orders...")
    
    try:
        # Contar registros
        result = supabase.table("service_orders").select("count", count="exact").execute()
        count = result.count if hasattr(result, 'count') else 0
        print(f"✅ Tabela service_orders: {count} registros")
        
        # Buscar alguns registros
        result = supabase.table("service_orders").select("*").limit(3).execute()
        if result.data:
            print(f"✅ Estrutura da tabela OK - {len(result.data)} registros de exemplo")
        else:
            print("ℹ️ Tabela service_orders está vazia")
            
    except Exception as e:
        print(f"❌ Erro ao testar service_orders: {e}")
        return False
    
    return True

def main():
    print("🔍 Teste Completo do Sistema de Integridade")
    print("=" * 50)
    print()
    
    # Testar tabela service_orders
    if not test_service_orders_table():
        print("❌ Falha no teste da tabela service_orders")
        return
    
    print()
    
    # Testar sistema de logs de integridade
    if test_integrity_logs():
        print()
        print("✅ SISTEMA DE INTEGRIDADE FUNCIONANDO PERFEITAMENTE!")
        print("💡 Agora você pode reiniciar o servidor backend e os logs serão salvos corretamente.")
    else:
        print()
        print("❌ PROBLEMAS DETECTADOS NO SISTEMA DE INTEGRIDADE")
        print("💡 Verifique se a tabela data_integrity_logs foi criada corretamente.")

if __name__ == "__main__":
    main() 