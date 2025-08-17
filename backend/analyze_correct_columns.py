import pandas as pd

try:
    excel_file = '../GLú-Garantias.xlsx'
    df = pd.read_excel(excel_file, sheet_name='Tabela')
    
    print('=== ANÁLISE DAS COLUNAS CORRETAS ===')
    print(f'Colunas encontradas: {list(df.columns)}')
    
    # Localizar as colunas corretas
    correct_parts_col = 'TOT. PÇ' if 'TOT. PÇ' in df.columns else None
    correct_service_col = 'TOT. SERV.' if 'TOT. SERV.' in df.columns else None  
    correct_total_col = 'TOT' if 'TOT' in df.columns else None
    
    wrong_parts_col = 'TotalProd_OSv'
    wrong_service_col = 'TotalServ_OSv' 
    wrong_total_col = 'Total_OSv'
    
    print(f'\nCOLUNAS CORRETAS ENCONTRADAS:')
    print(f'Peças: {correct_parts_col}')
    print(f'Serviços: {correct_service_col}') 
    print(f'Total: {correct_total_col}')
    
    print(f'\nCOLUNAS ERRADAS QUE ESTÁVAMOS USANDO:')
    print(f'Peças: {wrong_parts_col}')
    print(f'Serviços: {wrong_service_col}')
    print(f'Total: {wrong_total_col}')
    
    # Filtrar dados de agosto 2024 com colunas corretas
    df['Data_OSv'] = pd.to_datetime(df['Data_OSv'], errors='coerce')
    august_data = df[(df['Data_OSv'].dt.year == 2024) & (df['Data_OSv'].dt.month == 8)]
    
    print(f'\n=== AGOSTO 2024 - VALORES CORRETOS ===')
    if len(august_data) > 0:
        for i, row in august_data.head(5).iterrows():
            order_num = row.get('NOrdem_OSv', 'N/A')
            
            # Valores corretos
            correct_parts = row.get(correct_parts_col, 0) if pd.notna(row.get(correct_parts_col, 0)) else 0
            correct_service = row.get(correct_service_col, 0) if pd.notna(row.get(correct_service_col, 0)) else 0
            correct_total = row.get(correct_total_col, 0) if pd.notna(row.get(correct_total_col, 0)) else 0
            
            # Valores errados que estávamos usando
            wrong_parts = row.get(wrong_parts_col, 0) if pd.notna(row.get(wrong_parts_col, 0)) else 0
            wrong_service = row.get(wrong_service_col, 0) if pd.notna(row.get(wrong_service_col, 0)) else 0
            wrong_total = row.get(wrong_total_col, 0) if pd.notna(row.get(wrong_total_col, 0)) else 0
            
            print(f'OS {order_num}:')
            print(f'  CORRETO:  Peças={correct_parts}, Serviços={correct_service}, Total={correct_total}')
            print(f'  ERRADO:   Peças={wrong_parts}, Serviços={wrong_service}, Total={wrong_total}')
            print()
    
    # Verificar valores específicos mencionados pelo usuário
    print(f'=== VERIFICAÇÃO DOS VALORES MENCIONADOS ===')
    target_august = [54.0, 175.0, 126.0, 110.0, 465.0]
    
    for target in target_august:
        matches = august_data[august_data[correct_parts_col] == target]
        if len(matches) > 0:
            print(f'Valor {target} encontrado em agosto na coluna correta!')
            for _, match in matches.iterrows():
                print(f'  OS {match["NOrdem_OSv"]}: {match[correct_parts_col]}')
        
    # Filtrar dados de julho 2024 com colunas corretas
    july_data = df[(df['Data_OSv'].dt.year == 2024) & (df['Data_OSv'].dt.month == 7)]
    
    print(f'\n=== JULHO 2024 - VALORES CORRETOS ===')
    if len(july_data) > 0:
        for i, row in july_data.head(10).iterrows():
            order_num = row.get('NOrdem_OSv', 'N/A')
            
            correct_parts = row.get(correct_parts_col, 0) if pd.notna(row.get(correct_parts_col, 0)) else 0
            correct_service = row.get(correct_service_col, 0) if pd.notna(row.get(correct_service_col, 0)) else 0
            correct_total = row.get(correct_total_col, 0) if pd.notna(row.get(correct_total_col, 0)) else 0
            
            print(f'OS {order_num}: Peças={correct_parts}, Serviços={correct_service}, Total={correct_total}')
            
except Exception as e:
    print(f'Erro: {e}')