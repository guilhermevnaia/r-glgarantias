#!/usr/bin/env python3
"""
INVESTIGAÇÃO DE DATAS FUTURAS IMPOSSÍVEIS

Analisar exatamente como o sistema está interpretando as datas
que resultam em setembro-dezembro de 2025 (impossível).
"""

import pandas as pd
import numpy as np
from datetime import datetime

def investigate_future_dates(file_path: str):
    """
    Investigar as 31 datas futuras impossíveis
    """
    print("INVESTIGANDO DATAS FUTURAS IMPOSSIVEIS...")
    
    # Ler Excel
    df = pd.read_excel(
        file_path,
        sheet_name='Tabela',
        engine='openpyxl',
        dtype=str,
        na_filter=False
    )
    
    print(f"Total de linhas: {len(df)}")
    
    # Encontrar as linhas com datas futuras impossíveis
    future_dates_analysis = []
    
    for index, row in df.iterrows():
        order_number = str(row.get('NOrdem_OSv', '')).strip()
        raw_date = row.get('Data_OSv', '')
        raw_status = str(row.get('Status_OSv', '')).strip()
        
        # Verificar se tem dados básicos
        if not order_number or not raw_date or not raw_status:
            continue
            
        # Verificar se status é válido
        if raw_status.upper() not in {'G', 'GO', 'GU'}:
            continue
        
        # Tentar parsear a data
        parsed_date = parse_date_robust(raw_date)
        if parsed_date is None:
            continue
            
        # Verificar se é 2025 e mês futuro impossível
        if parsed_date.year == 2025 and parsed_date.month > 7:  # Julho é mês 7
            future_dates_analysis.append({
                'excel_row': index + 2,
                'order_number': order_number,
                'raw_date_original': raw_date,
                'raw_date_type': type(raw_date).__name__,
                'raw_date_str': str(raw_date),
                'parsed_date': parsed_date.isoformat(),
                'year': parsed_date.year,
                'month': parsed_date.month,
                'day': parsed_date.day,
                'status': raw_status,
                'is_excel_serial': isinstance(raw_date, (int, float)),
                'excel_serial_value': raw_date if isinstance(raw_date, (int, float)) else None
            })
    
    print(f"Encontradas {len(future_dates_analysis)} datas futuras impossiveis")
    
    # Analisar padrões
    if future_dates_analysis:
        print("\nANALISE DAS DATAS FUTURAS IMPOSSIVEIS:")
        
        # Agrupar por mês
        month_counts = {}
        for item in future_dates_analysis:
            month = item['month']
            month_counts[month] = month_counts.get(month, 0) + 1
        
        print("Por mês:")
        for month, count in sorted(month_counts.items()):
            month_names = {8: 'Agosto', 9: 'Setembro', 10: 'Outubro', 11: 'Novembro', 12: 'Dezembro'}
            print(f"  {month_names.get(month, f'Mês {month}')}: {count} registros")
        
        # Mostrar primeiros 10 exemplos com detalhes
        print(f"\nPRIMEIROS 10 EXEMPLOS DETALHADOS:")
        for i, item in enumerate(future_dates_analysis[:10]):
            print(f"\n{i+1}. Linha Excel {item['excel_row']} - OS {item['order_number']}")
            print(f"   Data original: {item['raw_date_original']} (tipo: {item['raw_date_type']})")
            print(f"   Data interpretada: {item['parsed_date']}")
            print(f"   Status: {item['status']}")
            if item['is_excel_serial']:
                print(f"   Valor serial Excel: {item['excel_serial_value']}")
                # Converter serial do Excel manualmente para debug
                manual_date = convert_excel_serial_manual(item['excel_serial_value'])
                print(f"   Conversao manual: {manual_date}")
        
        # Verificar se todas são seriais do Excel
        serial_count = sum(1 for item in future_dates_analysis if item['is_excel_serial'])
        print(f"\nTIPOS DE DADOS:")
        print(f"   Seriais do Excel: {serial_count}")
        print(f"   Strings/Outros: {len(future_dates_analysis) - serial_count}")
        
        # Analisar valores seriais
        if serial_count > 0:
            serials = [item['excel_serial_value'] for item in future_dates_analysis if item['is_excel_serial']]
            print(f"\nANALISE DOS SERIAIS:")
            print(f"   Menor serial: {min(serials)}")
            print(f"   Maior serial: {max(serials)}")
            print(f"   Media: {sum(serials)/len(serials):.2f}")

def parse_date_robust(raw_date):
    """
    Parsing robusto de data (mesmo algoritmo do sistema principal)
    """
    if pd.isna(raw_date) or raw_date == '' or raw_date is None:
        return None
    
    # Se já é datetime
    if isinstance(raw_date, datetime):
        return raw_date
    
    # String
    if isinstance(raw_date, str):
        try:
            clean_date = raw_date.strip()
            if not clean_date:
                return None
            
            parsed = pd.to_datetime(clean_date, errors='coerce', dayfirst=True)
            if pd.notna(parsed):
                return parsed.to_pydatetime()
        except Exception:
            pass
    
    # Número (Excel serial)
    if isinstance(raw_date, (int, float)):
        try:
            if 1 <= raw_date <= 50000:
                parsed = pd.to_datetime(raw_date, origin='1899-12-30', unit='D')
                if pd.notna(parsed):
                    return parsed.to_pydatetime()
        except Exception:
            pass
    
    # Forçar conversão
    try:
        parsed = pd.to_datetime(str(raw_date), errors='coerce')
        if pd.notna(parsed):
            return parsed.to_pydatetime()
    except Exception:
        pass
    
    return None

def convert_excel_serial_manual(serial_number):
    """
    Conversão manual do serial do Excel para debug
    """
    try:
        # Excel usa 1900-01-01 como origem, mas tem bug do ano bissexto
        # Pandas usa 1899-12-30 para corrigir isso
        base_date = datetime(1899, 12, 30)
        delta_days = int(serial_number)
        result_date = base_date + pd.Timedelta(days=delta_days)
        return result_date.strftime('%Y-%m-%d')
    except:
        return f"Erro na conversão de {serial_number}"

if __name__ == '__main__':
    import sys
    if len(sys.argv) != 2:
        print("Uso: python date_investigation.py <arquivo.xlsx>")
        sys.exit(1)
    
    investigate_future_dates(sys.argv[1])