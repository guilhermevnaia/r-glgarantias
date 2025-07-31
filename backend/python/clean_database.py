#!/usr/bin/env python3
"""
LIMPEZA COMPLETA DO BANCO DE DADOS SUPABASE
Limpar todas as tabelas para teste do sistema definitivo
"""

import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

def clean_database():
    """
    Limpar completamente o banco de dados
    """
    try:
        # Conectar ao Supabase
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        
        if not url or not key:
            print("ERRO: Variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontradas")
            return False
        
        supabase: Client = create_client(url, key)
        print("Conectado ao Supabase com sucesso")
        
        # 1. LIMPAR TABELA service_orders
        print("\n1. Limpando tabela service_orders...")
        result = supabase.table('service_orders').delete().neq('id', 0).execute()
        print(f"   Registros removidos da service_orders: {len(result.data) if result.data else 'Todos'}")
        
        # 2. LIMPAR TABELA upload_logs
        print("\n2. Limpando tabela upload_logs...")
        result = supabase.table('upload_logs').delete().neq('id', 0).execute()
        print(f"   Registros removidos da upload_logs: {len(result.data) if result.data else 'Todos'}")
        
        # 3. VERIFICAR SE LIMPEZA FOI COMPLETA
        print("\n3. Verificando limpeza...")
        
        # Contar service_orders
        count_orders = supabase.table('service_orders').select('id', count='exact').execute()
        orders_count = count_orders.count if hasattr(count_orders, 'count') else 0
        
        # Contar upload_logs  
        count_logs = supabase.table('upload_logs').select('id', count='exact').execute()
        logs_count = count_logs.count if hasattr(count_logs, 'count') else 0
        
        print(f"   service_orders restantes: {orders_count}")
        print(f"   upload_logs restantes: {logs_count}")
        
        if orders_count == 0 and logs_count == 0:
            print("\nBANCO DE DADOS COMPLETAMENTE LIMPO!")
            print("Pronto para teste do sistema definitivo")
            print("Proximo upload deve processar exatos 2.519 registros")
            return True
        else:
            print("\nLimpeza parcial - alguns registros podem ter restado")
            return False
            
    except Exception as e:
        print(f"\nERRO durante limpeza: {str(e)}")
        return False

def main():
    print("=" * 60)
    print("LIMPEZA COMPLETA DO BANCO DE DADOS - GL GARANTIAS")
    print("=" * 60)
    print("ATENCAO: Isso removera TODOS os dados das tabelas!")
    print("Objetivo: Preparar para teste do sistema definitivo")
    print()
    
    # Confirmar ação
    confirm = input("Deseja continuar? (digite 'SIM' para confirmar): ")
    if confirm.upper() != 'SIM':
        print("Operacao cancelada pelo usuario")
        return
    
    print("\nIniciando limpeza completa...")
    success = clean_database()
    
    if success:
        print("\n" + "=" * 60)
        print("LIMPEZA CONCLUIDA COM SUCESSO!")
        print("Sistema pronto para upload de teste")
        print("Esperamos processar 2.519 registros no proximo upload")
        print("=" * 60)
    else:
        print("\n" + "=" * 60)
        print("LIMPEZA FALHOU - Verificar logs acima")
        print("=" * 60)

if __name__ == '__main__':
    main()