#!/usr/bin/env python3
"""
Upload da planilha correta com dados de agosto
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'python'))

from excel_processor import DefinitiveExcelProcessor
import json
from supabase import create_client, Client
from dotenv import load_dotenv

def upload_august_data():
    print("=" * 60)
    print("UPLOAD DA PLANILHA CORRETA COM DADOS DE AGOSTO")
    print("=" * 60)
    
    # Carregar variáveis de ambiente
    load_dotenv()
    
    # Configurar Supabase
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    
    if not url or not key:
        print("ERRO: Variáveis SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontradas")
        return False
    
    supabase: Client = create_client(url, key)
    
    # Processar Excel atualizado
    file_path = "S:/comp-glgarantias/r-glgarantias/GLú-Garantias.xlsx"
    
    print(f"1. Processando arquivo: {file_path}")
    
    processor = DefinitiveExcelProcessor()
    result = processor.process_excel_file(file_path)
    
    if not result.success:
        print(f"ERRO no processamento: {result.errors}")
        return False
    
    print(f"2. Processamento concluído: {result.valid_rows} registros válidos")
    
    # Verificar dados de agosto antes do upload
    august_data = [row for row in result.data if row['order_date'].startswith('2025-08')]
    
    print(f"3. Dados de agosto encontrados: {len(august_data)} registros")
    
    if august_data:
        total_parts = sum(float(row.get('parts_total', 0)) for row in august_data)
        total_labor = sum(float(row.get('labor_total', 0)) for row in august_data)
        
        print(f"   Parts Total (já dividido por 2): R$ {total_parts:.2f}")
        print(f"   Parts Original: R$ {(total_parts * 2):.2f}")
        print(f"   Labor Total: R$ {total_labor:.2f}")
        
        # Verificar se bate com esperado
        expected_total = 465.00
        actual_total = total_parts * 2
        
        if abs(actual_total - expected_total) < 1:
            print(f"   VALORES CORRETOS! Esperado: R$ {expected_total} | Atual: R$ {actual_total}")
        else:
            print(f"   VALORES INCORRETOS! Esperado: R$ {expected_total} | Atual: R$ {actual_total}")
            print("   Continuando mesmo assim...")
        
        print("\n   Registros individuais de agosto:")
        for i, row in enumerate(august_data, 1):
            parts_original = float(row['parts_total']) * 2
            print(f"     {i}. OS: {row['order_number']} - Parts Original: R$ {parts_original:.2f} - Labor: R$ {row['labor_total']:.2f}")
    else:
        print("   NENHUM DADO DE AGOSTO ENCONTRADO!")
        return False
    
    # Limpar dados existentes de 2025
    print("4. Limpando dados de 2025 existentes...")
    try:
        delete_result = supabase.table('service_orders').delete().gte('order_date', '2025-01-01').lte('order_date', '2025-12-31').execute()
        print("   Dados de 2025 removidos")
    except Exception as e:
        print(f"   Erro ao limpar 2025: {e}")
    
    # Inserir novos dados em batches
    data = result.data
    batch_size = 50
    inserted = 0
    errors = 0
    
    print(f"5. Inserindo {len(data)} registros em batches de {batch_size}...")
    
    for i in range(0, len(data), batch_size):
        batch = data[i:i + batch_size]
        
        try:
            response = supabase.table('service_orders').insert(batch).execute()
            inserted += len(batch)
            print(f"   Batch {i//batch_size + 1}: {len(batch)} registros inseridos")
            
        except Exception as e:
            print(f"   ERRO no batch {i//batch_size + 1}: {e}")
            errors += 1
    
    print(f"6. Upload concluído: {inserted} registros inseridos, {errors} erros")
    
    # Verificação final dos dados de agosto no banco
    print("7. Verificação final dos dados de agosto no banco...")
    
    try:
        august_check = supabase.table('service_orders').select('*').gte('order_date', '2025-08-01').lte('order_date', '2025-08-31').execute()
        
        if august_check.data:
            bank_total_parts = sum(float(row.get('parts_total', 0)) for row in august_check.data)
            bank_total_labor = sum(float(row.get('labor_total', 0)) for row in august_check.data)
            
            print(f"   Registros de agosto no banco: {len(august_check.data)}")
            print(f"   Parts Total (banco): R$ {bank_total_parts:.2f}")
            print(f"   Parts Original (banco): R$ {(bank_total_parts * 2):.2f}")
            print(f"   Labor Total (banco): R$ {bank_total_labor:.2f}")
            
            # Verificação final
            expected_total = 465.00
            actual_total = bank_total_parts * 2
            
            if abs(actual_total - expected_total) < 1:
                print(f"   SUCESSO! Dados de agosto estao corretos no banco!")
                print(f"     Esperado: R$ {expected_total} | Atual: R$ {actual_total}")
                return True
            else:
                print(f"   PROBLEMA! Valores nao batem!")
                print(f"     Esperado: R$ {expected_total} | Atual: R$ {actual_total}")
                return False
        else:
            print("   ERRO! Nenhum dado de agosto encontrado no banco!")
            return False
            
    except Exception as e:
        print(f"   Erro na verificação final: {e}")
        return False

if __name__ == "__main__":
    success = upload_august_data()
    if success:
        print("\n" + "=" * 60)
        print("UPLOAD CONCLUIDO COM SUCESSO!")
        print("Dados de agosto corretos no sistema!")
        print("Frontend deve exibir valores corretos agora!")
        print("=" * 60)
    else:
        print("\n" + "=" * 60)
        print("UPLOAD FALHOU!")
        print("Verifique os dados da planilha!")
        print("=" * 60)