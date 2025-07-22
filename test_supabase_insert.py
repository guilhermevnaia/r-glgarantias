import os
from supabase import create_client, Client

supabase_url = "https://njdmpdpglpidamparwtr.supabase.co"
supabase_service_role_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qZG1wZHBnbHBpZGFtcGFyd3RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjg0Nzg4NiwiZXhwIjoyMDY4NDIzODg2fQ.jIPp_CrjZZZ17hfjj7ok4cXw-5wOr7pPIwkG76RNJxw"

try:
    supabase: Client = create_client(supabase_url, supabase_service_role_key)
    
    # Tentar inserir um log de teste
    data = {
        "upload_id": "test-uuid-123",
        "filename": "test_file.xlsx",
        "file_size": 1024,
        "status": "TEST_STARTED",
        "processed_at": "2025-07-22T10:00:00Z"
    }
    response = supabase.from_("file_processing_logs").insert(data).execute()
    
    if response.data:
        print("Inserção de teste no Supabase bem-sucedida!")
        print(response.data)
    else:
        print("Erro na inserção de teste:", response.error)

except Exception as e:
    print(f"Erro ao conectar ou inserir no Supabase: {e}")


