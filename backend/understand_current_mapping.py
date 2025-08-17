import pandas as pd

try:
    excel_file = '../GLú-Garantias.xlsx'
    df = pd.read_excel(excel_file, sheet_name='Tabela')
    
    print('=== ENTENDENDO O SISTEMA ATUAL ===')
    print(f'Total de colunas na planilha: {len(df.columns)}')
    
    # Listar TODAS as colunas
    print('\nTODAS AS COLUNAS DA PLANILHA:')
    for i, col in enumerate(df.columns):
        print(f'{i+1:2d}. {col}')
    
    # Identificar colunas financeiras
    print('\nPOSSIVEIS COLUNAS FINANCEIRAS:')
    financial_keywords = ['total', 'prod', 'serv', 'peça', 'pç', 'mão']
    for col in df.columns:
        if any(keyword.lower() in col.lower() for keyword in financial_keywords):
            print(f'   {col}')
    
    # Verificar o mapeamento atual do código
    print('\nMAPEAMENTO ATUAL DO CODIGO:')
    current_mapping = {
        'partsTotal': 'TOT. PÇ',
        'laborTotal': 'TOT. SERV.',  
        'grandTotal': 'TOT'
    }
    
    for key, col_name in current_mapping.items():
        if col_name in df.columns:
            print(f'   ✅ {key}: {col_name} (EXISTE)')
            # Mostrar alguns valores
            sample_values = df[col_name].dropna().head(3).tolist()
            print(f'      Exemplos: {sample_values}')
        else:
            print(f'   ❌ {key}: {col_name} (NÃO EXISTE)')
    
    # Verificar se existem outras colunas similares
    print('\nOUTRAS COLUNAS FINANCEIRAS POSSIVEIS:')
    other_financial = ['TotalProd_OSv', 'TotalServ_OSv', 'Total_OSv']
    for col_name in other_financial:
        if col_name in df.columns:
            print(f'   ✅ {col_name} (EXISTE)')
            sample_values = df[col_name].dropna().head(3).tolist()
            print(f'      Exemplos: {sample_values}')
        else:
            print(f'   ❌ {col_name} (NÃO EXISTE)')
    
    print('\nCONCLUSAO:')
    print('AS 3 COLUNAS FINANCEIRAS NO BANCO SÃO:')
    print('1. parts_total  <- vem da planilha')
    print('2. labor_total  <- vem da planilha') 
    print('3. grand_total  <- vem da planilha')
    
except Exception as e:
    print(f'Erro: {e}')