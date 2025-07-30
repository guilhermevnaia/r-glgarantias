#!/usr/bin/env python3
"""
Pipeline completo de processamento de dados Excel para Supabase
Combina o processamento de Excel (excel_processor.py) com upload para Supabase (supabase_uploader.py)
"""

import os
import sys
import json
from datetime import datetime
from pathlib import Path
import logging
import argparse

# Importar nossas classes
from excel_processor import ExcelProcessor
from supabase_uploader import SupabaseUploader

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('complete_pipeline.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class CompletePipeline:
    """Pipeline completo de processamento de dados"""
    
    def __init__(self, env_path: str = None):
        """Inicializar pipeline"""
        self.excel_processor = ExcelProcessor()
        self.supabase_uploader = SupabaseUploader(env_path)
        self.results = {
            "processing_stats": {},
            "upload_stats": {},
            "verification": {},
            "start_time": datetime.now(),
            "end_time": None,
            "success": False
        }
    
    def run_pipeline(self, excel_file_path: str, clear_existing: bool = True) -> dict:
        """Executar pipeline completo"""
        logger.info("🚀 Iniciando pipeline completo de processamento de dados")
        logger.info(f"   Arquivo Excel: {excel_file_path}")
        logger.info(f"   Limpar dados existentes: {clear_existing}")
        
        try:
            # 1. Verificar arquivo Excel
            if not os.path.exists(excel_file_path):
                raise FileNotFoundError(f"Arquivo Excel não encontrado: {excel_file_path}")
            
            # 2. Testar conexão Supabase
            logger.info("🔗 Testando conexão com Supabase...")
            if not self.supabase_uploader.test_connection():
                raise ConnectionError("Falha na conexão com Supabase")
            
            # 3. Obter informações da tabela atual
            logger.info("📋 Obtendo informações da tabela atual...")
            table_info = self.supabase_uploader.get_table_info()
            logger.info(f"   Registros existentes: {table_info.get('total_records', 0)}")
            
            # 4. Processar arquivo Excel
            logger.info("📊 Processando arquivo Excel...")
            df_processed, processing_stats = self.excel_processor.process_excel_file(excel_file_path)
            self.results["processing_stats"] = processing_stats
            
            if len(df_processed) == 0:
                raise ValueError("Nenhum registro válido encontrado após processamento")
            
            logger.info(f"✅ Processamento Excel concluído: {len(df_processed)} registros válidos")
            
            # 5. Salvar dados processados (backup)
            backup_file = f"processed_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
            self.excel_processor.save_processed_data(df_processed, backup_file)
            logger.info(f"💾 Backup salvo: {backup_file}")
            
            # 6. Upload para Supabase
            logger.info("⬆️ Enviando dados para Supabase...")
            upload_stats = self.supabase_uploader.upload_dataframe(df_processed, clear_existing)
            self.results["upload_stats"] = upload_stats
            
            # 7. Verificar upload
            logger.info("🔍 Verificando upload...")
            verification = self.supabase_uploader.verify_upload(len(df_processed))
            self.results["verification"] = verification
            
            # 8. Obter amostra dos dados
            sample_data = self.supabase_uploader.get_sample_data(5)
            
            # 9. Relatório final
            self.results["end_time"] = datetime.now()
            self.results["success"] = (
                upload_stats["successful_uploads"] > 0 and 
                verification.get("match", False)
            )
            
            # Log do relatório final
            self.log_final_report(sample_data)
            
            return self.results
            
        except Exception as e:
            logger.error(f"❌ Erro crítico no pipeline: {e}")
            self.results["end_time"] = datetime.now()
            self.results["error"] = str(e)
            self.results["success"] = False
            return self.results
    
    def log_final_report(self, sample_data: list):
        """Gerar relatório final detalhado"""
        logger.info("📋 RELATÓRIO FINAL DO PIPELINE")
        logger.info("=" * 50)
        
        # Tempo de execução
        duration = self.results["end_time"] - self.results["start_time"]
        logger.info(f"⏱️ Tempo de execução: {duration}")
        
        # Estatísticas de processamento
        if self.results["processing_stats"]:
            stats = self.results["processing_stats"]
            logger.info("📊 ESTATÍSTICAS DE PROCESSAMENTO:")
            logger.info(f"   Total de linhas iniciais: {stats.get('total_rows', 0)}")
            logger.info(f"   Removidas por dados vazios: {stats.get('removed_by_missing_data', 0)}")
            logger.info(f"   Removidas por status inválido: {stats.get('removed_by_status', 0)}")
            logger.info(f"   Removidas por data inválida: {stats.get('removed_by_invalid_date', 0)}")
            logger.info(f"   Removidas por ano fora do range: {stats.get('removed_by_year_range', 0)}")
            logger.info(f"   ✅ REGISTROS VÁLIDOS FINAIS: {stats.get('final_valid_rows', 0)}")
            
            # Distribuição por status
            if 'status_distribution' in stats:
                logger.info("   📈 Distribuição por status:")
                for status, count in stats['status_distribution'].items():
                    logger.info(f"      {status}: {count}")
            
            # Distribuição por ano
            if 'year_distribution' in stats:
                logger.info("   📅 Distribuição por ano:")
                for year, count in sorted(stats['year_distribution'].items()):
                    logger.info(f"      {year}: {count}")
        
        # Estatísticas de upload
        if self.results["upload_stats"]:
            upload = self.results["upload_stats"]
            logger.info("⬆️ ESTATÍSTICAS DE UPLOAD:")
            logger.info(f"   Total enviado: {upload.get('successful_uploads', 0)}")
            logger.info(f"   Falhas: {upload.get('failed_uploads', 0)}")
            logger.info(f"   Lotes processados: {upload.get('batches_processed', 0)}")
            
            if upload.get('errors'):
                logger.warning(f"   ⚠️ Erros encontrados: {len(upload['errors'])}")
        
        # Verificação
        if self.results["verification"]:
            verify = self.results["verification"]
            logger.info("🔍 VERIFICAÇÃO:")
            logger.info(f"   Esperado: {verify.get('expected_count', 0)}")
            logger.info(f"   Encontrado: {verify.get('actual_count', 0)}")
            logger.info(f"   ✅ Match: {verify.get('match', False)}")
            
            if not verify.get('match', False):
                logger.warning(f"   ⚠️ Diferença: {verify.get('difference', 0)}")
        
        # Amostra dos dados
        if sample_data:
            logger.info("📋 AMOSTRA DOS DADOS ENVIADOS:")
            for i, record in enumerate(sample_data, 1):
                order_num = record.get('order_number', 'N/A')
                status = record.get('order_status', 'N/A')
                date = record.get('order_date', 'N/A')
                total = record.get('grand_total', 0)
                logger.info(f"   {i}. #{order_num} | {status} | {date} | R$ {total:.2f}")
        
        # Status final
        if self.results["success"]:
            logger.info("🎉 PIPELINE EXECUTADO COM SUCESSO!")
        else:
            logger.error("❌ PIPELINE FINALIZADO COM FALHAS")
            if "error" in self.results:
                logger.error(f"   Erro: {self.results['error']}")
        
        logger.info("=" * 50)
    
    def save_results(self, output_file: str):
        """Salvar resultados em arquivo JSON"""
        try:
            # Converter datetime para string para JSON
            results_copy = self.results.copy()
            if results_copy["start_time"]:
                results_copy["start_time"] = results_copy["start_time"].isoformat()
            if results_copy["end_time"]:
                results_copy["end_time"] = results_copy["end_time"].isoformat()
            
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(results_copy, f, indent=2, ensure_ascii=False, default=str)
            
            logger.info(f"📄 Resultados salvos em: {output_file}")
            
        except Exception as e:
            logger.error(f"❌ Erro ao salvar resultados: {e}")

def main():
    """Função principal"""
    parser = argparse.ArgumentParser(description='Pipeline completo de processamento Excel -> Supabase')
    parser.add_argument('--excel', '-e', help='Caminho para arquivo Excel')
    parser.add_argument('--env', help='Caminho para arquivo .env')
    parser.add_argument('--no-clear', action='store_true', help='Não limpar dados existentes')
    parser.add_argument('--output', '-o', help='Arquivo para salvar resultados JSON')
    
    args = parser.parse_args()
    
    # Arquivos Excel disponíveis
    available_files = [
        "S:/comp-glgarantias/r-glgarantias/GLú-Garantias.xlsx",
        "S:/comp-glgarantias/r-glgarantias/GLu-Garantias-TesteReal.xlsx"
    ]
    
    # Determinar arquivo Excel
    excel_file = None
    if args.excel:
        excel_file = args.excel
    else:
        # Usar o primeiro arquivo encontrado
        for file_path in available_files:
            if os.path.exists(file_path):
                excel_file = file_path
                break
    
    if not excel_file:
        logger.error("❌ Nenhum arquivo Excel encontrado")
        logger.info("Arquivos procurados:")
        for f in available_files:
            logger.info(f"   - {f}")
        return 1
    
    try:
        # Inicializar pipeline
        pipeline = CompletePipeline(args.env)
        
        # Executar pipeline
        clear_existing = not args.no_clear
        results = pipeline.run_pipeline(excel_file, clear_existing)
        
        # Salvar resultados se solicitado
        if args.output:
            pipeline.save_results(args.output)
        
        # Retornar código de saída
        return 0 if results["success"] else 1
        
    except Exception as e:
        logger.error(f"❌ Erro na execução: {e}")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)