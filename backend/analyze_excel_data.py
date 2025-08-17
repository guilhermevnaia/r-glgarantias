import pandas as pd
import sys

try:
    # Ler a planilha Excel
    excel_file = '../GLú-Garantias.xlsx'
    df = pd.read_excel(excel_file, sheet_name='Tabela')
    
    print('ANALISANDO DADOS ORIGINAIS DA PLANILHA')
    print(f'Total de linhas na planilha: {len(df)}')
    print(f'Colunas disponíveis: {list(df.columns)}')
    
    # Filtrar dados de agosto 2024
    df['Data_OSv'] = pd.to_datetime(df['Data_OSv'], errors='coerce')
    august_data = df[(df['Data_OSv'].dt.year == 2024) & (df['Data_OSv'].dt.month == 8)]
    
    print(f'\nDADOS DE AGOSTO 2024 NA PLANILHA ({len(august_data)} registros):')
    if len(august_data) > 0:
        for i, row in august_data.head(5).iterrows():
            parts = row.get('TotalProd_OSv', 0) if pd.notna(row.get('TotalProd_OSv', 0)) else 0
            labor = row.get('TotalServ_OSv', 0) if pd.notna(row.get('TotalServ_OSv', 0)) else 0
            total = row.get('Total_OSv', 0) if pd.notna(row.get('Total_OSv', 0)) else 0
            order_num = row.get('NOrdem_OSv', 'N/A')
            print(f'OS {order_num}: Pecas={parts}, Servicos={labor}, Total={total}')
    
    # Filtrar dados de julho 2024
    july_data = df[(df['Data_OSv'].dt.year == 2024) & (df['Data_OSv'].dt.month == 7)]
    
    print(f'\nDADOS DE JULHO 2024 NA PLANILHA ({len(july_data)} registros):')
    if len(july_data) > 0:
        for i, row in july_data.head(10).iterrows():
            parts = row.get('TotalProd_OSv', 0) if pd.notna(row.get('TotalProd_OSv', 0)) else 0
            labor = row.get('TotalServ_OSv', 0) if pd.notna(row.get('TotalServ_OSv', 0)) else 0
            total = row.get('Total_OSv', 0) if pd.notna(row.get('Total_OSv', 0)) else 0
            order_num = row.get('NOrdem_OSv', 'N/A')
            print(f'OS {order_num}: Pecas={parts}, Servicos={labor}, Total={total}')
            
    # Verificar alguns valores específicos
    print(f'\nVERIFICACAO DE VALORES ESPECIFICOS:')
    sample_orders = ['117482', '117477', '117495', '117502', '117514']
    for order_num in sample_orders:
        order_data = df[df['NOrdem_OSv'].astype(str) == order_num]
        if len(order_data) > 0:
            row = order_data.iloc[0]
            parts = row.get('TotalProd_OSv', 0) if pd.notna(row.get('TotalProd_OSv', 0)) else 0
            labor = row.get('TotalServ_OSv', 0) if pd.notna(row.get('TotalServ_OSv', 0)) else 0
            total = row.get('Total_OSv', 0) if pd.notna(row.get('Total_OSv', 0)) else 0
            print(f'PLANILHA - OS {order_num}: Pecas={parts}, Servicos={labor}, Total={total}')
        else:
            print(f'OS {order_num} nao encontrada na planilha')
            
except Exception as e:
    print(f'Erro ao ler planilha: {e}')