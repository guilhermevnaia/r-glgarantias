import pandas as pd
import os
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client

# Carregar variáveis de ambiente
load_dotenv("S:/comp-glgarantias/r-glgarantias/backend/.env")

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not supabase_url or not supabase_key:
    print("Erro: Variáveis de ambiente não configuradas")
    exit(1)

# Inicializar cliente Supabase
supabase: Client = create_client(supabase_url, supabase_key)

def prepare_record(row):
    """Preparar registro com apenas campos básicos"""
    record = {
        'order_number': str(row['order_number']).strip(),
        'order_date': row['order_date'].strftime('%Y-%m-%d'),
        'order_status': str(row['order_status']).strip(),
        'parts_total': float(row['parts_total']) if pd.notna(row['parts_total']) else 0.0,
        'labor_total': float(row['labor_total']) if pd.notna(row['labor_total']) else 0.0,
        'grand_total': float(row['grand_total']) if pd.notna(row['grand_total']) else 0.0,
        'calculation_verified': bool(row['calculation_verified']) if 'calculation_verified' in row else False
    }
    
    # Campos opcionais
    optional_fields = {
        'engine_manufacturer': 'engine_manufacturer',
        'engine_description': 'engine_description',
        'vehicle_model': 'vehicle_model',
        'raw_defect_description': 'raw_defect_description',
        'responsible_mechanic': 'responsible_mechanic',
        'original_parts_value': 'original_parts_value'
    }
    
    for field, db_field in optional_fields.items():
        if field in row and pd.notna(row[field]) and str(row[field]).strip():
            if field == 'original_parts_value':
                record[db_field] = float(row[field])
            else:
                record[db_field] = str(row[field]).strip()
    
    return record

def main():
    print("Iniciando upload simples...")
    
    # Carregar dados processados
    csv_file = "processed_backup_20250729_173203.csv"
    if not os.path.exists(csv_file):
        print(f"Arquivo não encontrado: {csv_file}")
        return
    
    print(f"Carregando dados de: {csv_file}")
    df = pd.read_csv(csv_file)
    df['order_date'] = pd.to_datetime(df['order_date'])
    
    print(f"Total de registros: {len(df)}")
    
    # Limpar tabela existente
    print("Limpando tabela existente...")
    try:
        supabase.table("service_orders").delete().neq('id', 0).execute()
        print("Tabela limpa com sucesso")
    except Exception as e:
        print(f"Erro ao limpar tabela: {e}")
    
    # Upload em lotes
    batch_size = 100
    total_success = 0
    total_errors = 0
    
    for i in range(0, len(df), batch_size):
        batch = df.iloc[i:i + batch_size]
        records = []
        
        print(f"Processando lote {i//batch_size + 1}: registros {i+1} a {min(i+batch_size, len(df))}")
        
        for _, row in batch.iterrows():
            try:
                record = prepare_record(row)
                records.append(record)
            except Exception as e:
                print(f"Erro ao preparar registro {row.get('order_number', 'unknown')}: {e}")
                total_errors += 1
        
        # Upload do lote
        if records:
            try:
                result = supabase.table("service_orders").insert(records).execute()
                success_count = len(records)
                total_success += success_count
                print(f"  Upload bem-sucedido: {success_count} registros")
            except Exception as e:
                print(f"  Erro no upload do lote: {e}")
                total_errors += len(records)
    
    print(f"\nResumo final:")
    print(f"  Total processados: {len(df)}")
    print(f"  Enviados com sucesso: {total_success}")
    print(f"  Erros: {total_errors}")
    
    # Verificar contagem final
    try:
        result = supabase.table("service_orders").select("count", count="exact").execute()
        final_count = result.count
        print(f"  Registros na tabela: {final_count}")
        
        if final_count == total_success:
            print("SUCESSO: Upload completado corretamente!")
        else:
            print(f"AVISO: Discrepância - enviados: {total_success}, na tabela: {final_count}")
            
    except Exception as e:
        print(f"Erro ao verificar contagem final: {e}")

if __name__ == "__main__":
    main()