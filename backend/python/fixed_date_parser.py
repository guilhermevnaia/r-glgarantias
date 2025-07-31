#!/usr/bin/env python3
"""
PARSER DE DATAS CORRIGIDO

Corrigir o bug de parsing de datas que estava causando 
as datas futuras impossíveis.
"""

import pandas as pd
import numpy as np
from datetime import datetime
import re

def parse_date_fixed(raw_date):
    """
    Parser de data CORRIGIDO que detecta o formato automaticamente
    """
    if pd.isna(raw_date) or raw_date == '' or raw_date is None:
        return None
    
    # Se já é datetime
    if isinstance(raw_date, datetime):
        return raw_date
    
    # String
    if isinstance(raw_date, str):
        clean_date = raw_date.strip()
        if not clean_date:
            return None
        
        # DETECTAR FORMATO YYYY-MM-DD ou YYYY-MM-DD HH:MM:SS
        if re.match(r'^\d{4}-\d{1,2}-\d{1,2}', clean_date):
            # Formato ISO - NÃO usar dayfirst
            try:
                parsed = pd.to_datetime(clean_date, errors='coerce', dayfirst=False)
                if pd.notna(parsed):
                    return parsed.to_pydatetime()
            except Exception:
                pass
        else:
            # Outros formatos - usar dayfirst=True para DD/MM/YYYY brasileiro
            try:
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
    
    # Forçar conversão final
    try:
        parsed = pd.to_datetime(str(raw_date), errors='coerce', dayfirst=False)
        if pd.notna(parsed):
            return parsed.to_pydatetime()
    except Exception:
        pass
    
    return None

def test_date_parser():
    """
    Testar o parser corrigido com as datas problemáticas
    """
    test_dates = [
        "2025-01-08 00:00:00",
        "2025-01-09 00:00:00", 
        "2025-01-10 00:00:00",
        "2025-02-10 00:00:00",
        "2025-02-12 00:00:00",
        "08/01/2025",  # DD/MM/YYYY brasileiro
        "10-02-2025",  # DD-MM-YYYY brasileiro
        "2024-12-25",  # Formato ISO
        45678  # Serial Excel
    ]
    
    print("TESTE DO PARSER DE DATAS CORRIGIDO:")
    print("=" * 50)
    
    for raw_date in test_dates:
        parsed = parse_date_fixed(raw_date)
        print(f"Original: {raw_date}")
        print(f"Parseado: {parsed}")
        if parsed:
            print(f"Formato:  {parsed.strftime('%Y-%m-%d (%d/%m/%Y)')}")
        print("-" * 30)

if __name__ == '__main__':
    test_date_parser()