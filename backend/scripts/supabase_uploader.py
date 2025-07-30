import pandas as pd
import os
import sys
from datetime import datetime
from typing import Dict, List, Optional, Any
import logging
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client
import json

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('supabase_upload.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class SupabaseUploader:
    """Classe para upload de dados processados para Supabase"""
    
    def __init__(self, env_path: str = None):
        """Inicializar cliente Supabase"""
        if env_path:
            load_dotenv(env_path)
        else:
            load_dotenv()
            
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        
        if not self.supabase_url or not self.supabase_key:
            raise ValueError("Variáveis SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar configuradas")
            
        self.supabase: Client = create_client(self.supabase_url, self.supabase_key)
        logger.info("✅ Cliente Supabase inicializado")
        
        # Configurações de upload
        self.batch_size = 1000  # Tamanho do lote para upload
        self.table_name = "service_orders"
        
    def test_connection(self) -> bool:
        """Testar conexão com Supabase"""
        try:
            # Tentar fazer uma query simples
            result = self.supabase.table(self.table_name).select("count", count="exact").limit(1).execute()
            logger.info("✅ Conexão com Supabase testada com sucesso")
            return True
        except Exception as e:
            logger.error(f"❌ Erro ao testar conexão: {e}")
            return False
    
    def get_table_info(self) -> Dict:
        """Obter informações sobre a tabela"""
        try:
            # Verificar se tabela existe e obter estrutura
            result = self.supabase.table(self.table_name).select("*").limit(1).execute()
            
            info = {
                "table_exists": True,
                "sample_record": result.data[0] if result.data else None,
                "total_records": None
            }
            
            # Contar registros existentes
            count_result = self.supabase.table(self.table_name).select("count", count="exact").execute()
            info["total_records"] = count_result.count if hasattr(count_result, 'count') else 0
            
            logger.info(f"📋 Tabela {self.table_name}: {info['total_records']} registros existentes")
            return info
            
        except Exception as e:
            logger.error(f"❌ Erro ao obter informações da tabela: {e}")
            return {"table_exists": False, "error": str(e)}
    
    def clear_table(self, confirm: bool = False) -> bool:
        """Limpar todos os dados da tabela (usar com cuidado!)"""
        if not confirm:
            logger.warning("⚠️ clear_table() chamado sem confirmação")
            return False
            
        try:
            # Deletar todos os registros
            result = self.supabase.table(self.table_name).delete().neq('id', 0).execute()
            logger.info(f"🗑️ Tabela {self.table_name} limpa")
            return True
            
        except Exception as e:
            logger.error(f"❌ Erro ao limpar tabela: {e}")
            return False
    
    def prepare_record(self, row: pd.Series) -> Dict:
        """Preparar um registro para upload"""
        record = {}
        
        # Campos obrigatórios
        record['order_number'] = str(row['order_number']).strip()
        record['order_date'] = row['order_date'].strftime('%Y-%m-%d') if pd.notna(row['order_date']) else None
        record['order_status'] = str(row['order_status']).strip()
        
        # Campos opcionais (usando nomes corretos)
        if 'engine_manufacturer' in row and pd.notna(row['engine_manufacturer']) and str(row['engine_manufacturer']).strip():
            record['engine_manufacturer'] = str(row['engine_manufacturer']).strip()
        
        if 'engine_description' in row and pd.notna(row['engine_description']) and str(row['engine_description']).strip():
            record['engine_description'] = str(row['engine_description']).strip()
            
        if 'vehicle_model' in row and pd.notna(row['vehicle_model']) and str(row['vehicle_model']).strip():
            record['vehicle_model'] = str(row['vehicle_model']).strip()
            
        # Usar raw_defect_description como defect_description
        if 'raw_defect_description' in row and pd.notna(row['raw_defect_description']) and str(row['raw_defect_description']).strip():
            record['raw_defect_description'] = str(row['raw_defect_description']).strip()
            
        if 'responsible_mechanic' in row and pd.notna(row['responsible_mechanic']) and str(row['responsible_mechanic']).strip():
            record['responsible_mechanic'] = str(row['responsible_mechanic']).strip()
        
        # Campos numéricos
        numeric_fields = ['parts_total', 'labor_total', 'grand_total', 'original_parts_value']
        for field in numeric_fields:
            if field in row and pd.notna(row[field]):
                record[field] = float(row[field])
            else:
                record[field] = 0.0
        
        # Campo booleano
        if 'calculation_verified' in row:
            record['calculation_verified'] = bool(row['calculation_verified'])
        else:
            record['calculation_verified'] = False
        
        return record
    
    def upload_batch(self, records: List[Dict]) -> Dict:
        """Upload de um lote de registros"""
        try:
            result = self.supabase.table(self.table_name).insert(records).execute()
            
            return {
                "success": True,
                "inserted_count": len(records),
                "data": result.data
            }
            
        except Exception as e:
            logger.error(f"❌ Erro no upload do lote: {e}")
            return {
                "success": False,
                "error": str(e),
                "inserted_count": 0
            }
    
    def upload_dataframe(self, df: pd.DataFrame, clear_existing: bool = False) -> Dict:
        """Upload completo de um DataFrame"""
        logger.info(f"🚀 Iniciando upload de {len(df)} registros para Supabase...")
        
        upload_stats = {
            "total_records": len(df),
            "successful_uploads": 0,
            "failed_uploads": 0,
            "batches_processed": 0,
            "errors": []
        }
        
        try:
            # Limpar tabela se solicitado
            if clear_existing:
                logger.info("🗑️ Limpando dados existentes...")
                self.clear_table(confirm=True)
            
            # Processar em lotes
            for i in range(0, len(df), self.batch_size):
                batch_df = df.iloc[i:i + self.batch_size]
                batch_records = []
                
                # Preparar registros do lote
                for _, row in batch_df.iterrows():
                    try:
                        record = self.prepare_record(row)
                        batch_records.append(record)
                    except Exception as e:
                        logger.error(f"❌ Erro ao preparar registro: {e}")
                        upload_stats["failed_uploads"] += 1
                        upload_stats["errors"].append(f"Registro {row.get('order_number', 'unknown')}: {e}")
                
                # Upload do lote
                if batch_records:
                    batch_result = self.upload_batch(batch_records)
                    
                    if batch_result["success"]:
                        upload_stats["successful_uploads"] += batch_result["inserted_count"]
                        logger.info(f"✅ Lote {upload_stats['batches_processed'] + 1}: {batch_result['inserted_count']} registros enviados")
                    else:
                        upload_stats["failed_uploads"] += len(batch_records)
                        upload_stats["errors"].append(f"Lote {upload_stats['batches_processed'] + 1}: {batch_result['error']}")
                        logger.error(f"❌ Falha no lote {upload_stats['batches_processed'] + 1}")
                
                upload_stats["batches_processed"] += 1
            
            # Relatório final
            logger.info("📊 Upload concluído:")
            logger.info(f"   Total de registros: {upload_stats['total_records']}")
            logger.info(f"   Enviados com sucesso: {upload_stats['successful_uploads']}")
            logger.info(f"   Falhas: {upload_stats['failed_uploads']}")
            logger.info(f"   Lotes processados: {upload_stats['batches_processed']}")
            
            if upload_stats["errors"]:
                logger.warning(f"⚠️ {len(upload_stats['errors'])} erros encontrados")
                
            return upload_stats
            
        except Exception as e:
            logger.error(f"❌ Erro crítico no upload: {e}")
            upload_stats["errors"].append(f"Erro crítico: {e}")
            return upload_stats
    
    def verify_upload(self, expected_count: int) -> Dict:
        """Verificar se o upload foi bem-sucedido"""
        try:
            result = self.supabase.table(self.table_name).select("count", count="exact").execute()
            actual_count = result.count if hasattr(result, 'count') else 0
            
            verification = {
                "expected_count": expected_count,
                "actual_count": actual_count,
                "match": actual_count == expected_count,
                "difference": actual_count - expected_count
            }
            
            if verification["match"]:
                logger.info(f"✅ Verificação bem-sucedida: {actual_count} registros na tabela")
            else:
                logger.warning(f"⚠️ Discrepância: esperado {expected_count}, encontrado {actual_count}")
                
            return verification
            
        except Exception as e:
            logger.error(f"❌ Erro na verificação: {e}")
            return {"error": str(e)}
    
    def get_sample_data(self, limit: int = 5) -> List[Dict]:
        """Obter amostra dos dados enviados"""
        try:
            result = self.supabase.table(self.table_name).select("*").limit(limit).execute()
            return result.data if result.data else []
        except Exception as e:
            logger.error(f"❌ Erro ao obter dados de amostra: {e}")
            return []

def main():
    """Função principal para teste"""
    try:
        # Inicializar uploader
        uploader = SupabaseUploader()
        
        # Testar conexão
        if not uploader.test_connection():
            return
        
        # Obter informações da tabela
        table_info = uploader.get_table_info()
        print(f"📋 Informações da tabela: {json.dumps(table_info, indent=2, default=str)}")
        
        # Verificar se há dados processados para upload
        processed_files = [
            "processed_data_GLú-Garantias.csv",
            "processed_data_GLu-Garantias-TesteReal.csv"
        ]
        
        for file_path in processed_files:
            if os.path.exists(file_path):
                logger.info(f"📁 Carregando dados processados: {file_path}")
                
                # Carregar dados
                df = pd.read_csv(file_path)
                df['order_date'] = pd.to_datetime(df['order_date'])
                
                print(f"📊 Dados carregados: {len(df)} registros")
                
                # Fazer upload
                upload_result = uploader.upload_dataframe(df, clear_existing=True)
                
                # Verificar upload
                verification = uploader.verify_upload(len(df))
                print(f"🔍 Verificação: {json.dumps(verification, indent=2)}")
                
                # Mostrar amostra
                sample = uploader.get_sample_data(3)
                print(f"📋 Amostra dos dados enviados:")
                for i, record in enumerate(sample, 1):
                    print(f"   {i}. Ordem: {record.get('order_number')} - Status: {record.get('order_status')} - Data: {record.get('order_date')}")
                
                break
        else:
            logger.warning("⚠️ Nenhum arquivo de dados processados encontrado")
            
    except Exception as e:
        logger.error(f"❌ Erro na execução principal: {e}")

if __name__ == "__main__":
    main()