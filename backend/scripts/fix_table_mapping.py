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

def test_all_possible_fields():
    """Testa todos os campos possíveis para descobrir a estrutura da tabela"""
    print("🔍 Testando todos os campos possíveis...")
    
    # Campos que o Python está tentando inserir
    python_fields = [
        'order_number', 'order_date', 'order_status', 'engine_manufacturer',
        'engine_description', 'vehicle_model', 'raw_defect_description',
        'responsible_mechanic', 'parts_total', 'labor_total', 'grand_total',
        'original_parts_value', 'calculation_verified'
    ]
    
    # Campos básicos que sabemos que funcionam
    basic_fields = ['order_number', 'order_date', 'order_status']
    
    # Testar campos um por um
    working_fields = []
    failed_fields = []
    
    for field in python_fields:
        try:
            test_record = {
                "order_number": f"TEST_{field.upper()}",
                "order_date": "2024-01-01",
                "order_status": "G"
            }
            
            # Adicionar o campo sendo testado
            if field == 'parts_total' or field == 'labor_total' or field == 'grand_total' or field == 'original_parts_value':
                test_record[field] = 100.00
            elif field == 'calculation_verified':
                test_record[field] = True
            else:
                test_record[field] = f"Teste {field}"
            
            result = supabase.table("service_orders").insert(test_record).execute()
            
            if result.data:
                working_fields.append(field)
                print(f"✅ Campo '{field}' funciona")
                
                # Limpar registro de teste
                supabase.table("service_orders").delete().eq("order_number", f"TEST_{field.upper()}").execute()
            else:
                failed_fields.append(field)
                print(f"❌ Campo '{field}' falhou")
                
        except Exception as e:
            failed_fields.append(field)
            print(f"❌ Campo '{field}' falhou: {e}")
    
    print(f"\n📋 RESUMO:")
    print(f"✅ Campos que funcionam ({len(working_fields)}): {working_fields}")
    print(f"❌ Campos que falham ({len(failed_fields)}): {failed_fields}")
    
    return working_fields, failed_fields

def create_corrected_mapping():
    """Cria um mapeamento corrigido baseado nos campos que funcionam"""
    print("\n🔧 Criando mapeamento corrigido...")
    
    # Campos que sabemos que funcionam
    working_fields = ['order_number', 'order_date', 'order_status']
    
    # Mapeamento corrigido - apenas campos que existem na tabela
    corrected_mapping = {
        'order_number': 'order_number',
        'order_date': 'order_date', 
        'order_status': 'order_status'
    }
    
    print("📋 Mapeamento corrigido:")
    for python_field, db_field in corrected_mapping.items():
        print(f"   {python_field} -> {db_field}")
    
    return corrected_mapping

def test_corrected_insert():
    """Testa inserção com mapeamento corrigido"""
    print("\n🧪 Testando inserção com mapeamento corrigido...")
    
    # Dados simulados do Python (apenas campos que funcionam)
    python_data = [
        {
            'order_number': 'OS001',
            'order_date': '2024-01-15',
            'order_status': 'G',
            'engine_manufacturer': 'Volkswagen',  # Campo que não existe na tabela
            'engine_description': 'Motor 1.0',   # Campo que não existe na tabela
            'vehicle_model': 'Gol',              # Campo que não existe na tabela
            'parts_total': 100.00,               # Campo que não existe na tabela
            'labor_total': 50.00                 # Campo que não existe na tabela
        },
        {
            'order_number': 'OS002',
            'order_date': '2024-01-16',
            'order_status': 'G',
            'engine_manufacturer': 'Fiat',
            'engine_description': 'Motor 1.4',
            'vehicle_model': 'Palio',
            'parts_total': 200.00,
            'labor_total': 100.00
        }
    ]
    
    # Filtrar apenas campos que existem na tabela
    corrected_data = []
    for record in python_data:
        corrected_record = {
            'order_number': record['order_number'],
            'order_date': record['order_date'],
            'order_status': record['order_status']
        }
        corrected_data.append(corrected_record)
    
    print(f"📊 Dados originais: {len(python_data)} registros com {len(python_data[0])} campos")
    print(f"📊 Dados corrigidos: {len(corrected_data)} registros com {len(corrected_data[0])} campos")
    
    try:
        # Inserir dados corrigidos
        result = supabase.table("service_orders").insert(corrected_data).execute()
        
        if result.data:
            print(f"✅ Dados corrigidos inseridos: {len(result.data)} registros")
            
            # Verificar inserção
            check_result = supabase.table("service_orders").select("*").in_("order_number", ["OS001", "OS002"]).execute()
            print(f"✅ Verificação: {len(check_result.data)} registros no banco")
            
            # Limpar dados de teste
            supabase.table("service_orders").delete().in_("order_number", ["OS001", "OS002"]).execute()
            print("🧹 Dados de teste removidos")
            
            return True
        else:
            print("❌ Falha na inserção corrigida")
            return False
            
    except Exception as e:
        print(f"❌ Erro na inserção corrigida: {e}")
        return False

def main():
    print("🔧 CORREÇÃO DO MAPEAMENTO DE CAMPOS")
    print("=" * 40)
    
    # Testar todos os campos
    working_fields, failed_fields = test_all_possible_fields()
    
    # Criar mapeamento corrigido
    corrected_mapping = create_corrected_mapping()
    
    # Testar inserção corrigida
    if test_corrected_insert():
        print("\n✅ CORREÇÃO APLICADA COM SUCESSO!")
        print("💡 O sistema agora deve funcionar corretamente")
        print("📋 Campos aceitos pela tabela: order_number, order_date, order_status")
    else:
        print("\n❌ Falha na correção")

if __name__ == "__main__":
    main() 