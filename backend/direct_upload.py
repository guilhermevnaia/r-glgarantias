#!/usr/bin/env python3
"""
Upload direto via Python - mais estável para arquivos grandes
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'python'))

from excel_processor import DefinitiveExcelProcessor
import json
from supabase import create_client, Client
from dotenv import load_dotenv

def direct_upload():
    print("UPLOAD DIRETO VIA PYTHON")
    print("=" * 50)
    
    # Carregar variáveis de ambiente
    load_dotenv()
    
    # Configurar Supabase
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    
    if not url or not key:
        print("❌ Erro: Variáveis SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontradas")
        return
    
    supabase: Client = create_client(url, key)
    
    # Processar Excel
    file_path = "S:/comp-glgarantias/r-glgarantias/GLú-Garantias.xlsx"
    
    print(f"📁 Processando arquivo: {file_path}")
    
    processor = DefinitiveExcelProcessor()
    result = processor.process_excel_file(file_path)
    
    if not result.success:
        print(f"❌ Erro no processamento: {result.errors}")
        return
    
    print(f"✅ Processamento concluído: {result.valid_rows} registros válidos")
    
    # Inserir no banco em batches
    data = result.data
    batch_size = 50
    inserted = 0
    
    print(f"💾 Inserindo {len(data)} registros em batches de {batch_size}...")
    
    for i in range(0, len(data), batch_size):
        batch = data[i:i + batch_size]
        
        try:
            response = supabase.table('service_orders').insert(batch).execute()
            inserted += len(batch)
            print(f"   ✅ Batch {i//batch_size + 1}: {len(batch)} registros inseridos")
            
        except Exception as e:
            print(f"   ❌ Erro no batch {i//batch_size + 1}: {e}")
    
    print(f"🎉 Upload concluído: {inserted} registros inseridos")
    
    # Verificar dados de agosto
    print("\n🔍 Verificando dados de agosto...")
    
    august_data = supabase.table('service_orders').select('*').gte('order_date', '2025-08-01').lte('order_date', '2025-08-31').execute()
    
    if august_data.data:
        print(f"📊 Registros de agosto: {len(august_data.data)}")
        
        total_parts = sum(float(row.get('parts_total', 0)) for row in august_data.data)
        total_labor = sum(float(row.get('labor_total', 0)) for row in august_data.data)
        
        print(f"💰 Parts Total (já dividido por 2): R$ {total_parts:.2f}")
        print(f"💰 Parts Original: R$ {total_parts * 2:.2f}")
        print(f"💰 Labor Total: R$ {total_labor:.2f}")
        
        # Verificar se bate com os valores esperados
        expected_total = 465.00
        actual_total = total_parts * 2
        
        if abs(actual_total - expected_total) < 1:
            print("✅ Valores de agosto estão corretos!")
        else:
            print(f"❌ Valores não batem: Esperado R$ {expected_total:.2f}, Atual R$ {actual_total:.2f}")

if __name__ == "__main__":
    direct_upload()