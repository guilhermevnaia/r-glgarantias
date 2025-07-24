#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import pandas as pd
import numpy as np
from datetime import datetime

def analyze_excel_step_by_step(file_path):
    print("=" * 70)
    print("ANALISE STEP-BY-STEP - PLANILHA GLU-GARANTIAS")
    print("=" * 70)
    
    try:
        # PASSO 1: LEITURA BRUTA
        print("\nPASSO 1: LENDO PLANILHA...")
        df_raw = pd.read_excel(file_path, sheet_name='Tabela')
        print(f"   Total de linhas: {df_raw.shape[0]}")
        print(f"   Total de colunas: {df_raw.shape[1]}")
        
        # PASSO 2: VERIFICAR COLUNAS OBRIGATÓRIAS
        print("\nPASSO 2: VERIFICANDO COLUNAS OBRIGATORIAS...")
        required_cols = ['NOrdem_OSv', 'Data_OSv', 'Status_OSv']
        
        for col in required_cols:
            if col in df_raw.columns:
                print(f"   OK: {col}")
            else:
                print(f"   ERRO: {col} nao encontrada")
                return None
        
        # PASSO 3: REMOVER LINHAS COMPLETAMENTE VAZIAS
        print("\nPASSO 3: REMOVENDO LINHAS VAZIAS...")
        df_clean = df_raw.dropna(how='all').copy()
        print(f"   Antes: {df_raw.shape[0]} linhas")
        print(f"   Depois: {df_clean.shape[0]} linhas")
        
        # PASSO 4: FILTRAR CAMPOS OBRIGATÓRIOS NÃO NULOS
        print("\nPASSO 4: FILTRANDO CAMPOS OBRIGATORIOS...")
        for col in required_cols:
            before = len(df_clean)
            df_clean = df_clean.dropna(subset=[col])
            after = len(df_clean)
            print(f"   {col}: {before} -> {after} linhas ({before-after} removidas)")
        
        # PASSO 5: ANÁLISE DE STATUS
        print("\nPASSO 5: ANALISANDO STATUS...")
        status_counts = df_clean['Status_OSv'].value_counts()
        print("   Distribuicao completa de status:")
        for status, count in status_counts.items():
            print(f"     '{status}': {count}")
        
        # Filtrar apenas G, GO, GU
        valid_status = df_clean['Status_OSv'].isin(['G', 'GO', 'GU'])
        df_status = df_clean[valid_status].copy()
        print(f"   Apos filtro G/GO/GU: {len(df_status)} linhas")
        
        # PASSO 6: ANÁLISE DE DATAS
        print("\nPASSO 6: ANALISANDO DATAS...")
        print("   Tipos de data encontrados:")
        
        date_samples = df_status['Data_OSv'].dropna().head(10)
        for i, date_val in enumerate(date_samples):
            print(f"     {i+1}: {date_val} (tipo: {type(date_val)})")
        
        # Converter datas
        def convert_excel_date(date_val):
            if pd.isna(date_val):
                return None
            
            # Se já é datetime
            if isinstance(date_val, pd.Timestamp):
                return date_val
            
            # Se é número Excel
            if isinstance(date_val, (int, float)):
                try:
                    # Conversão Excel serial para datetime
                    return pd.Timestamp('1900-01-01') + pd.Timedelta(days=date_val-2)
                except:
                    return None
            
            # Se é string
            if isinstance(date_val, str):
                try:
                    return pd.to_datetime(date_val)
                except:
                    return None
            
            return None
        
        print("   Convertendo datas...")
        df_status['date_converted'] = df_status['Data_OSv'].apply(convert_excel_date)
        
        # Remover datas inválidas
        before_date = len(df_status)
        df_dates = df_status.dropna(subset=['date_converted']).copy()
        after_date = len(df_dates)
        print(f"   Conversao de datas: {before_date} -> {after_date} linhas")
        
        # PASSO 7: ANÁLISE DO RANGE DE DATAS
        print("\nPASSO 7: ANALISANDO RANGE DE DATAS...")
        if len(df_dates) > 0:
            min_date = df_dates['date_converted'].min()
            max_date = df_dates['date_converted'].max()
            print(f"   Data minima: {min_date.strftime('%Y-%m-%d')}")
            print(f"   Data maxima: {max_date.strftime('%Y-%m-%d')}")
            
            # Distribuição por ano
            df_dates['year'] = df_dates['date_converted'].dt.year
            year_dist = df_dates['year'].value_counts().sort_index()
            print("   Distribuicao por ano (ANTES do filtro 2019):")
            for year, count in year_dist.items():
                print(f"     {year}: {count}")
        
        # PASSO 8: FILTRO DE DATA >= 2019
        print("\nPASSO 8: APLICANDO FILTRO >= 2019...")
        before_2019 = len(df_dates)
        df_final = df_dates[df_dates['year'] >= 2019].copy()
        after_2019 = len(df_final)
        print(f"   Antes filtro 2019: {before_2019}")
        print(f"   Depois filtro 2019: {after_2019}")
        print(f"   Removidos: {before_2019 - after_2019}")
        
        # RESULTADO FINAL
        print("\n" + "=" * 70)
        print("RESULTADO FINAL")
        print("=" * 70)
        print(f"TOTAL VALIDADO: {len(df_final)} registros")
        
        if len(df_final) > 0:
            print("\nDistribuicao por STATUS:")
            final_status = df_final['Status_OSv'].value_counts()
            for status, count in final_status.items():
                pct = (count/len(df_final))*100
                print(f"   {status}: {count} ({pct:.1f}%)")
            
            print("\nDistribuicao por ANO:")
            final_years = df_final['year'].value_counts().sort_index()
            for year, count in final_years.items():
                pct = (count/len(df_final))*100
                print(f"   {year}: {count} ({pct:.1f}%)")
            
            print(f"\nRANGE FINAL: {df_final['date_converted'].min().strftime('%Y-%m-%d')} a {df_final['date_converted'].max().strftime('%Y-%m-%d')}")
        
        print("=" * 70)
        return df_final
        
    except Exception as e:
        print(f"ERRO: {e}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    result = analyze_excel_step_by_step("GLú-Garantias.xlsx")