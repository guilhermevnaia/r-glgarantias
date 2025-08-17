#!/usr/bin/env python3
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'python'))

from excel_processor import DefinitiveExcelProcessor
import json

def simple_upload():
    print("UPLOAD DIRETO VIA PYTHON")
    print("=" * 50)
    
    # Processar Excel
    file_path = "S:/comp-glgarantias/r-glgarantias/GLú-Garantias.xlsx"
    
    print(f"Processando arquivo: {file_path}")
    
    processor = DefinitiveExcelProcessor()
    result = processor.process_excel_file(file_path)
    
    if not result.success:
        print(f"Erro no processamento: {result.errors}")
        return
    
    print(f"Processamento concluido: {result.valid_rows} registros validos")
    
    # Salvar resultado em JSON para debug
    with open('processed_data.json', 'w', encoding='utf-8') as f:
        json.dump(result.data, f, indent=2, ensure_ascii=False)
    
    print("Dados salvos em processed_data.json")
    
    # Verificar dados de agosto
    august_data = [row for row in result.data if row['order_date'].startswith('2025-08')]
    
    if august_data:
        print(f"\nRegistros de agosto: {len(august_data)}")
        
        total_parts = sum(float(row.get('parts_total', 0)) for row in august_data)
        total_labor = sum(float(row.get('labor_total', 0)) for row in august_data)
        
        print(f"Parts Total (ja dividido por 2): R$ {total_parts:.2f}")
        print(f"Parts Original: R$ {total_parts * 2:.2f}")
        print(f"Labor Total: R$ {total_labor:.2f}")
        
        # Mostrar registros individuais
        print("\nRegistros individuais de agosto:")
        for i, row in enumerate(august_data, 1):
            print(f"{i}. OS: {row['order_number']} - Parts: R$ {row['parts_total']:.2f} - Labor: R$ {row['labor_total']:.2f}")

if __name__ == "__main__":
    simple_upload()