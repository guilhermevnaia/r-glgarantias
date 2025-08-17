import pandas as pd
import numpy as np

try:
    excel_file = '../GLú-Garantias.xlsx'
    
    # Ler todas as abas disponíveis
    xl_file = pd.ExcelFile(excel_file)
    print(f'ABAS DISPONIVEIS NA PLANILHA: {xl_file.sheet_names}')
    
    # Analisar cada aba
    for sheet_name in xl_file.sheet_names:
        print(f'\n=== ABA: {sheet_name} ===')
        try:
            df = pd.read_excel(excel_file, sheet_name=sheet_name)
            print(f'Linhas: {len(df)}')
            print(f'Colunas: {list(df.columns)[:10]}...')  # Primeiras 10 colunas
            
            # Se for uma aba com dados financeiros, mostrar alguns valores
            if any(col in df.columns for col in ['Total', 'TotalProd_OSv', 'Peças', 'Serviços']):
                print('DADOS FINANCEIROS ENCONTRADOS:')
                for i, row in df.head(3).iterrows():
                    # Tentar encontrar colunas de valores
                    parts_cols = [col for col in df.columns if 'prod' in col.lower() or 'peça' in col.lower()]
                    service_cols = [col for col in df.columns if 'serv' in col.lower() or 'serviço' in col.lower()]
                    total_cols = [col for col in df.columns if 'total' in col.lower()]
                    
                    if parts_cols:
                        parts_val = row.get(parts_cols[0], 0)
                    if service_cols:
                        service_val = row.get(service_cols[0], 0)
                    if total_cols:
                        total_val = row.get(total_cols[0], 0)
                        
                    print(f'  Linha {i}: Possível estrutura encontrada')
        except Exception as e:
            print(f'Erro ao ler aba {sheet_name}: {e}')
    
    # Verificar se há colunas com os valores que o usuário mencionou
    print(f'\n=== PROCURANDO VALORES ESPECÍFICOS ===')
    df_main = pd.read_excel(excel_file, sheet_name='Tabela')
    
    # Procurar por valores específicos que o usuário mencionou
    target_values = [54.0, 175.0, 126.0, 110.0, 465.0, 115.0, 239.0, 85.0, 144.5, 20.0]
    
    for target in target_values:
        # Procurar em todas as colunas numéricas
        for col in df_main.select_dtypes(include=[np.number]).columns:
            matches = df_main[df_main[col] == target]
            if len(matches) > 0:
                print(f'Valor {target} encontrado na coluna {col} ({len(matches)} ocorrências)')
                
    # Verificar colunas específicas mencionadas
    print(f'\n=== COLUNAS FINANCEIRAS PRINCIPAIS ===')
    financial_cols = ['TotalProd_OSv', 'TotalServ_OSv', 'Total_OSv']
    for col in financial_cols:
        if col in df_main.columns:
            print(f'{col}: min={df_main[col].min()}, max={df_main[col].max()}, média={df_main[col].mean():.2f}')
            
except Exception as e:
    print(f'Erro geral: {e}')