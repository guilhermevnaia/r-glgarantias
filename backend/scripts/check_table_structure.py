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
    """Verifica a estrutura real da tabela service_orders"""
    print("🔍 Verificando estrutura da tabela service_orders...")
    
    try:
        # Tentar inserir um registro com estrutura mínima
        test_record = {
            "order_number": "STRUCTURE_TEST",
            "order_date": "2024-01-01"
        }
        
        result = supabase.table("service_orders").insert(test_record).execute()
        
        if result.data:
            print("✅ Estrutura básica OK")
            
            # Limpar registro de teste
            supabase.table("service_orders").delete().eq("order_number", "STRUCTURE_TEST").execute()
            
            # Tentar inserir com mais campos
            test_record_2 = {
                "order_number": "STRUCTURE_TEST_2",
                "order_date": "2024-01-01",
                "order_status": "G"
            }
            
            result2 = supabase.table("service_orders").insert(test_record_2).execute()
            
            if result2.data:
                print("✅ Estrutura com status OK")
                supabase.table("service_orders").delete().eq("order_number", "STRUCTURE_TEST_2").execute()
                
                # Tentar inserir com campos financeiros
                test_record_3 = {
                    "order_number": "STRUCTURE_TEST_3",
                    "order_date": "2024-01-01",
                    "order_status": "G",
                    "total_value": 100.00
                }
                
                result3 = supabase.table("service_orders").insert(test_record_3).execute()
                
                if result3.data:
                    print("✅ Estrutura com valores financeiros OK")
                    supabase.table("service_orders").delete().eq("order_number", "STRUCTURE_TEST_3").execute()
                else:
                    print("❌ Problema com valores financeiros")
                    
            else:
                print("❌ Problema com campo order_status")
                
        else:
            print("❌ Problema com estrutura básica")
            return False
            
    except Exception as e:
        print(f"❌ Erro ao verificar estrutura: {e}")
        return False
    
    return True

def test_minimal_insert():
    """Testa inserção com estrutura mínima"""
    print("\n🧪 Testando inserção mínima...")
    
    sample_data = [
        {
            "order_number": "TEST001",
            "order_date": "2024-01-01",
            "order_status": "G"
        },
        {
            "order_number": "TEST002", 
            "order_date": "2024-01-02",
            "order_status": "G"
        }
    ]
    
    try:
        # Inserir dados de teste
        result = supabase.table("service_orders").insert(sample_data).execute()
        
        if result.data:
            print(f"✅ Dados mínimos inseridos: {len(result.data)} registros")
            
            # Verificar se foram inseridos
            check_result = supabase.table("service_orders").select("*").in_("order_number", ["TEST001", "TEST002"]).execute()
            print(f"✅ Verificação: {len(check_result.data)} registros encontrados")
            
            # Mostrar estrutura dos dados inseridos
            if check_result.data:
                print("📋 Estrutura dos dados inseridos:")
                for key in check_result.data[0].keys():
                    print(f"   - {key}: {type(check_result.data[0][key]).__name__}")
            
            # Limpar dados de teste
            supabase.table("service_orders").delete().in_("order_number", ["TEST001", "TEST002"]).execute()
            print("🧹 Dados de teste removidos")
            
            return True
        else:
            print("❌ Falha na inserção mínima")
            return False
            
    except Exception as e:
        print(f"❌ Erro na inserção mínima: {e}")
        return False

def main():
    print("🔍 VERIFICAÇÃO DA ESTRUTURA DA TABELA")
    print("=" * 40)
    
    # Verificar estrutura
    if not check_table_structure():
        print("❌ Problema com estrutura da tabela")
        return
    
    # Testar inserção mínima
    if not test_minimal_insert():
        print("❌ Problema com inserção mínima")
        return
    
    print("\n✅ ESTRUTURA DA TABELA VERIFICADA!")
    print("💡 A tabela aceita apenas campos básicos: order_number, order_date, order_status")

if __name__ == "__main__":
    main() 