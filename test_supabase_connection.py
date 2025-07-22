import os
from supabase import create_client, Client

supabase_url = "https://njdmpdpglpidamparwtr.supabase.co"
supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qZG1wZHBnbHBpZGFtcGFyd3RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4NDc4ODYsImV4cCI6MjA2ODQyMzg4Nn0.lecWLobNMt4cCCo3E18AYfMoINvcdSPKxqETgIhXmzc"

try:
    supabase: Client = create_client(supabase_url, supabase_key)
    response = supabase.from_('service_orders').select('*').limit(1).execute()
    print("Conexão com o Supabase bem-sucedida! Tabela 'service_orders' acessível.")
    print(response.data)
except Exception as e:
    print(f"Erro ao conectar ou consultar o Supabase: {e}")


