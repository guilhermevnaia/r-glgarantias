import pandas as pd
import openpyxl
from datetime import datetime

# Ler a planilha GLú-Garantias.xlsx
try:
    # Tentar ler a aba "Tabela"
    df = pd.read_excel("GLú-Garantias.xlsx", sheet_name="Tabela")
    print(f"✅ Planilha carregada com sucesso!")
    print(f"📊 Total de linhas: {len(df)}")
    print(f"📊 Total de colunas: {len(df.columns)}")
    print("\n🔍 Colunas encontradas:")
    for i, col in enumerate(df.columns):
        print(f"  {i+1}. {col}")
    
    # Verificar se as colunas esperadas existem
    colunas_esperadas = ['NOrdem_OSv', 'Data_OSv', 'Status_OSv', 'TotalProd_OSv', 'TotalServ_OSv', 'Total_OSv']
    colunas_faltando = [col for col in colunas_esperadas if col not in df.columns]
    
    if colunas_faltando:
        print(f"\n❌ Colunas faltando: {colunas_faltando}")
    else:
        print(f"\n✅ Todas as colunas esperadas estão presentes!")
    
    # Análise dos dados
    print(f"\n📈 ANÁLISE DOS DADOS:")
    
    # 1. Verificar dados não nulos
    dados_nao_nulos = df.dropna(subset=['NOrdem_OSv', 'Data_OSv', 'Status_OSv'])
    print(f"  Linhas com dados obrigatórios não nulos: {len(dados_nao_nulos)}")
    
    # 2. Verificar datas válidas (>= 2019)
    if 'Data_OSv' in df.columns:
        try:
            # Converter para datetime
            df['Data_OSv_parsed'] = pd.to_datetime(df['Data_OSv'], errors='coerce')
            datas_validas = df[df['Data_OSv_parsed'].dt.year >= 2019]
            print(f"  Linhas com datas >= 2019: {len(datas_validas)}")
            
            # Verificar datas inválidas
            datas_invalidas = df[df['Data_OSv_parsed'].isna()]
            print(f"  Linhas com datas inválidas: {len(datas_invalidas)}")
        except Exception as e:
            print(f"  ❌ Erro ao processar datas: {e}")
    
    # 3. Verificar status válidos (G, GO, GU)
    if 'Status_OSv' in df.columns:
        status_validos = df[df['Status_OSv'].isin(['G', 'GO', 'GU'])]
        print(f"  Linhas com status válidos (G, GO, GU): {len(status_validos)}")
        
        # Contar status únicos
        print(f"  Status únicos encontrados: {df['Status_OSv'].value_counts().to_dict()}")
    
    # 4. Verificar cálculos (TotalProd_OSv / 2 + TotalServ_OSv = Total_OSv)
    if all(col in df.columns for col in ['TotalProd_OSv', 'TotalServ_OSv', 'Total_OSv']):
        try:
            df['TotalProd_OSv_num'] = pd.to_numeric(df['TotalProd_OSv'], errors='coerce')
            df['TotalServ_OSv_num'] = pd.to_numeric(df['TotalServ_OSv'], errors='coerce')
            df['Total_OSv_num'] = pd.to_numeric(df['Total_OSv'], errors='coerce')
            
            # Calcular o total esperado (TotalProd_OSv / 2 + TotalServ_OSv)
            df['Total_Calculado'] = (df['TotalProd_OSv_num'] / 2) + df['TotalServ_OSv_num']
            
            # Verificar diferenças (tolerância de 0.01)
            df['Calculo_Correto'] = abs(df['Total_Calculado'] - df['Total_OSv_num']) < 0.01
            calculos_corretos = df[df['Calculo_Correto'] == True]
            print(f"  Linhas com cálculos corretos: {len(calculos_corretos)}")
            
        except Exception as e:
            print(f"  ❌ Erro ao verificar cálculos: {e}")
    
    # 5. Filtros combinados (dados válidos finais)
    try:
        filtro_final = (
            df['Data_OSv_parsed'].dt.year >= 2019
        ) & (
            df['Status_OSv'].isin(['G', 'GO', 'GU'])
        ) & (
            df['NOrdem_OSv'].notna()
        ) & (
            df['Data_OSv'].notna()
        ) & (
            df['Status_OSv'].notna()
        )
        
        dados_finais_validos = df[filtro_final]
        print(f"  🎯 DADOS FINAIS VÁLIDOS: {len(dados_finais_validos)}")
        
        # Mostrar algumas amostras
        if len(dados_finais_validos) > 0:
            print(f"\n📋 AMOSTRA DOS DADOS VÁLIDOS (primeiras 5 linhas):")
            colunas_mostrar = ['NOrdem_OSv', 'Data_OSv', 'Status_OSv', 'TotalProd_OSv', 'TotalServ_OSv', 'Total_OSv']
            print(dados_finais_validos[colunas_mostrar].head().to_string())
        
    except Exception as e:
        print(f"  ❌ Erro ao aplicar filtros finais: {e}")
    
    # 6. Resumo final
    print(f"\n📊 RESUMO FINAL:")
    print(f"  Total de linhas na planilha: {len(df)}")
    print(f"  Linhas com dados obrigatórios: {len(dados_nao_nulos) if 'dados_nao_nulos' in locals() else 'N/A'}")
    print(f"  Linhas com datas válidas (>= 2019): {len(datas_validas) if 'datas_validas' in locals() else 'N/A'}")
    print(f"  Linhas com status válidos: {len(status_validos) if 'status_validos' in locals() else 'N/A'}")
    print(f"  Linhas finais válidas: {len(dados_finais_validos) if 'dados_finais_validos' in locals() else 'N/A'}")
    
except Exception as e:
    print(f"❌ Erro ao ler a planilha: {e}")

