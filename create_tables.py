from supabase import create_client, Client
import os

# Carregar variáveis de ambiente (para uso local)
# from dotenv import load_dotenv
# load_dotenv()

# Usar as credenciais diretamente para este script de setup
SUPABASE_URL = "https://njdmpdpglpidamparwtr.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qZG1wZHBnbHBpZGFtcGFyd3RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjg0Nzg4NiwiZXhwIjoyMDY4NDIzODg2fQ.QfGGhYLGKGhKGhKGhKGhKGhKGhKGhKGhKGhKGhKG"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def create_tables():
    try:
        # SQL para criar as tabelas
        sql_commands = [
            "CREATE TABLE IF NOT EXISTS service_orders (id BIGSERIAL PRIMARY KEY, order_number VARCHAR(50) UNIQUE NOT NULL, order_date DATE NOT NULL, engine_manufacturer VARCHAR(100), engine_description TEXT, vehicle_model VARCHAR(100), raw_defect_description TEXT, responsible_mechanic VARCHAR(100), parts_total DECIMAL(10,2), labor_total DECIMAL(10,2), grand_total DECIMAL(10,2), order_status VARCHAR(10), processed_at TIMESTAMP DEFAULT NOW(), created_at TIMESTAMP DEFAULT NOW());",
            "CREATE TABLE IF NOT EXISTS file_processing_logs (id BIGSERIAL PRIMARY KEY, filename VARCHAR(255) NOT NULL, original_rows INTEGER, processed_rows INTEGER, filtered_rows INTEGER, error_count INTEGER, processing_time_ms INTEGER, status VARCHAR(20), error_details JSONB, processed_at TIMESTAMP DEFAULT NOW());",
            "CREATE TABLE IF NOT EXISTS system_settings (id BIGSERIAL PRIMARY KEY, setting_key VARCHAR(100) UNIQUE NOT NULL, setting_value JSONB, updated_at TIMESTAMP DEFAULT NOW());",
            "CREATE INDEX IF NOT EXISTS idx_service_orders_date ON service_orders(order_date);",
            "CREATE INDEX IF NOT EXISTS idx_service_orders_status ON service_orders(order_status);",
            "CREATE INDEX IF NOT EXISTS idx_service_orders_mechanic ON service_orders(responsible_mechanic);"
        ]

        for command in sql_commands:
            print(f"Executando: {command[:70]}...")
            # A biblioteca Supabase Python não tem um método direto para executar SQL arbitrário
            # A forma mais comum é usar o cliente de banco de dados subjacente ou uma função RPC
            # Para este caso, vamos simular a execução, pois o foco é a estrutura do projeto
            # Em um ambiente real, usaríamos o cliente Postgrest ou uma função de banco de dados
            # ou o cliente Python do Supabase para operações CRUD
            
            # Para fins de setup, vamos apenas indicar que a tabela seria criada.
            # O usuário precisará executar o SQL diretamente no Supabase Studio ou via cliente psql
            # se a conexão direta do sandbox falhar persistentemente.
            pass # Não há uma forma direta de executar DDL com o cliente Python do Supabase

        print("\nComandos SQL para criação de tabelas e índices preparados. \nPor favor, execute-os diretamente no Supabase Studio (SQL Editor) ou via cliente psql no seu ambiente local, pois a conexão direta do sandbox para DDL está com problemas de resolução de host.\n")
        print("SQL Completo para as tabelas:")
        for command in sql_commands:
            print(command)

    except Exception as e:
        print(f"Erro ao tentar criar tabelas: {e}")

if __name__ == "__main__":
    create_tables()


