#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ANÁLISE LIMPA DA PLANILHA GLÚ-GARANTIAS
Abordagem step-by-step com DataFrame para validação precisa
"""

import pandas as pd
import numpy as np
from datetime import datetime
import sys

def analyze_excel_clean(file_path):
    print("=" * 70)
    print("ANALISE LIMPA - PLANILHA GLU-GARANTIAS")
    print("=" * 70)
    
    try:
        # 1. LEITURA BRUTA DA PLANILHA
        print("\nPASSO 1: LENDO PLANILHA COMPLETA...")
        
        # Ler todas as abas primeiro
        excel_file = pd.ExcelFile(file_path)
        print(f"   Abas encontradas: {excel_file.sheet_names}")
        
        # Ler aba 'Tabela'
        if 'Tabela' not in excel_file.sheet_names:
            print("ERRO: Aba 'Tabela' nao encontrada!")
            return
        
        df_raw = pd.read_excel(file_path, sheet_name='Tabela')
        print(f"   Dimensoes originais: {df_raw.shape[0]} linhas x {df_raw.shape[1]} colunas")
        print(f"   Colunas: {list(df_raw.columns)}")
        
        # 2. IDENTIFICAR COLUNAS NECESSÁRIAS
        print("\nPASSO 2: MAPEANDO COLUNAS NECESSARIAS...")
        
        required_columns = {
            'NOrdem_OSv': 'order_number',
            'Data_OSv': 'order_date', 
            'Fabricante_Mot': 'engine_manufacturer',
            'Descricao_Mot': 'engine_description',
            'ModeloVei_Osv': 'vehicle_model',
            'ObsCorpo_OSv': 'raw_defect_description',
            'RazaoSocial_Cli': 'responsible_mechanic',
            'TotalProd_OSv': 'parts_total',
            'TotalServ_OSv': 'labor_total', 
            'Total_OSv': 'grand_total',
            'Status_OSv': 'order_status'
        }
        
        # Verificar quais colunas existem
        missing_cols = []
        existing_cols = {}
        
        for req_col, mapped_name in required_columns.items():
            if req_col in df_raw.columns:
                existing_cols[req_col] = mapped_name
                print(f"   ✅ {req_col} -> {mapped_name}")
            else:
                missing_cols.append(req_col)
                print(f"   ❌ {req_col} -> NÃO ENCONTRADA")
        
        if missing_cols:
            print(f"\n⚠️  Colunas obrigatórias faltando: {missing_cols}")
            return
        
        # 3. SELECIONAR APENAS COLUNAS NECESSÁRIAS
        print(f"\n📋 PASSO 3: SELECIONANDO APENAS COLUNAS NECESSÁRIAS...")
        df_selected = df_raw[list(existing_cols.keys())].copy()
        df_selected.columns = list(existing_cols.values())
        
        print(f"   DataFrame reduzido: {df_selected.shape[0]} linhas x {df_selected.shape[1]} colunas")
        
        # 4. ANÁLISE INICIAL DOS DADOS
        print(f"\n🔍 PASSO 4: ANÁLISE INICIAL DOS DADOS...")
        
        print(f"   Linhas com dados (não todas NaN): {df_selected.dropna(how='all').shape[0]}")
        print(f"   Valores únicos por coluna:")
        
        for col in df_selected.columns:
            non_null = df_selected[col].notna().sum()
            unique_vals = df_selected[col].nunique()
            print(f"     {col}: {non_null} valores ({unique_vals} únicos)")
        
        # 5. LIMPEZA BÁSICA
        print(f"\n🧹 PASSO 5: LIMPEZA BÁSICA...")
        
        # Remover linhas completamente vazias
        df_clean = df_selected.dropna(how='all').copy()
        print(f"   Após remover linhas vazias: {df_clean.shape[0]} linhas")
        
        # 6. ANÁLISE DE CAMPOS OBRIGATÓRIOS
        print(f"\n✅ PASSO 6: VERIFICANDO CAMPOS OBRIGATÓRIOS...")
        
        mandatory_fields = ['order_number', 'order_date', 'order_status']
        
        for field in mandatory_fields:
            null_count = df_clean[field].isna().sum()
            print(f"   {field}: {null_count} valores nulos")
        
        # Filtrar apenas registros com campos obrigatórios preenchidos
        df_mandatory = df_clean.dropna(subset=mandatory_fields).copy()
        print(f"   Após filtro de campos obrigatórios: {df_mandatory.shape[0]} linhas")
        
        # 7. ANÁLISE DE STATUS
        print(f"\n📊 PASSO 7: ANÁLISE DE STATUS...")
        
        status_counts = df_mandatory['order_status'].value_counts()
        print("   Distribuição de status:")
        for status, count in status_counts.items():
            print(f"     '{status}': {count} registros")
        
        # Filtrar apenas status válidos (G, GO, GU)
        valid_statuses = ['G', 'GO', 'GU']
        df_status_valid = df_mandatory[df_mandatory['order_status'].isin(valid_statuses)].copy()
        print(f"   Após filtro de status válidos (G/GO/GU): {df_status_valid.shape[0]} linhas")
        
        # 8. ANÁLISE DE DATAS
        print(f"\n📅 PASSO 8: ANÁLISE DE DATAS...")
        
        # Tentar converter datas
        df_dates = df_status_valid.copy()
        
        # Função para tentar converter diferentes formatos de data
        def convert_date_flexible(date_val):
            if pd.isna(date_val):
                return None
            
            # Se já é datetime
            if isinstance(date_val, datetime):
                return date_val
            
            # Se é número (serial Excel)
            if isinstance(date_val, (int, float)):
                try:
                    # Fórmula Excel para Python
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
        
        print("   Convertendo formatos de data...")
        df_dates['order_date_converted'] = df_dates['order_date'].apply(convert_date_flexible)
        
        # Remover datas que não puderam ser convertidas
        df_dates_valid = df_dates.dropna(subset=['order_date_converted']).copy()
        print(f"   Após conversão de datas: {df_dates_valid.shape[0]} linhas")
        
        # Análise das datas convertidas
        if len(df_dates_valid) > 0:
            min_date = df_dates_valid['order_date_converted'].min()
            max_date = df_dates_valid['order_date_converted'].max()
            print(f"   Range de datas: {min_date.strftime('%Y-%m-%d')} a {max_date.strftime('%Y-%m-%d')}")
            
            # Distribuição por ano
            df_dates_valid['year'] = df_dates_valid['order_date_converted'].dt.year
            year_counts = df_dates_valid['year'].value_counts().sort_index()
            print("   Distribuição por ano:")
            for year, count in year_counts.items():
                print(f"     {year}: {count} registros")
        
        # 9. FILTRO DE DATA >= 2019
        print(f"\n🎯 PASSO 9: APLICANDO FILTRO DE DATA >= 2019...")
        
        df_final = df_dates_valid[df_dates_valid['order_date_converted'].dt.year >= 2019].copy()
        print(f"   Após filtro >= 2019: {df_final.shape[0]} linhas")
        
        # 10. RESULTADO FINAL
        print(f"\n" + "=" * 70)
        print(f"📋 RESULTADO FINAL")
        print(f"=" * 70)
        print(f"✅ Total de registros válidos: {len(df_final)}")
        
        if len(df_final) > 0:
            print(f"📊 Distribuição por status:")
            final_status = df_final['order_status'].value_counts()
            for status, count in final_status.items():
                percentage = (count / len(df_final)) * 100
                print(f"   {status}: {count} registros ({percentage:.1f}%)")
            
            print(f"📅 Distribuição por ano:")
            final_years = df_final['year'].value_counts().sort_index()
            for year, count in final_years.items():
                percentage = (count / len(df_final)) * 100
                print(f"   {year}: {count} registros ({percentage:.1f}%)")
            
            print(f"📈 Range final: {df_final['order_date_converted'].min().strftime('%Y-%m-%d')} a {df_final['order_date_converted'].max().strftime('%Y-%m-%d')}")
        
        print(f"=" * 70)
        
        return df_final
        
    except Exception as e:
        print(f"❌ ERRO: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    file_path = "GLú-Garantias.xlsx"
    result = analyze_excel_clean(file_path)