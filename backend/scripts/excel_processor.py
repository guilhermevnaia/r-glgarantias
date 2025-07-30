import pandas as pd
import numpy as np
from datetime import datetime, date
import os
import sys
from typing import Dict, List, Tuple, Optional, Any
import logging
from pathlib import Path

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('excel_processing.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class DateValidator:
    """Validador de datas otimizado para pandas"""
    
    @staticmethod
    def parse_excel_date(date_value) -> Optional[datetime]:
        """Parse various date formats from Excel"""
        if pd.isna(date_value):
            return None
            
        # Se já é datetime
        if isinstance(date_value, (datetime, pd.Timestamp)):
            return pd.to_datetime(date_value)
            
        # Se é número (serial date do Excel)
        if isinstance(date_value, (int, float)):
            try:
                # Excel date serial (1900-01-01 = 1)
                if 1 <= date_value <= 100000:  # Range válido
                    base_date = datetime(1899, 12, 30)  # Excel base
                    return base_date + pd.Timedelta(days=date_value)
            except:
                pass
                
        # Se é string, tentar vários formatos
        if isinstance(date_value, str):
            date_formats = [
                '%d/%m/%Y', '%d-%m-%Y', '%Y-%m-%d',
                '%d/%m/%y', '%d-%m-%y', '%y-%m-%d',
                '%d.%m.%Y', '%d.%m.%y'
            ]
            
            for fmt in date_formats:
                try:
                    return datetime.strptime(str(date_value).strip(), fmt)
                except:
                    continue
        
        return None
    
    @staticmethod
    def is_valid_year(year: int) -> bool:
        """Validar se o ano está no range permitido"""
        return 2019 <= year <= 2025

class ExcelProcessor:
    """Processador de Excel otimizado com pandas"""
    
    def __init__(self):
        self.valid_statuses = {'G', 'GO', 'GU'}
        self.date_validator = DateValidator()
        
    def load_excel_file(self, file_path: str) -> pd.DataFrame:
        """Carregar arquivo Excel"""
        logger.info(f"📁 Carregando arquivo: {file_path}")
        
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Arquivo não encontrado: {file_path}")
            
        try:
            # Tentar carregar a aba 'Tabela'
            df = pd.read_excel(file_path, sheet_name='Tabela', engine='openpyxl')
            logger.info(f"✅ Arquivo carregado: {len(df)} linhas, {len(df.columns)} colunas")
            return df
            
        except Exception as e:
            logger.error(f"❌ Erro ao carregar Excel: {e}")
            raise
    
    def validate_columns(self, df: pd.DataFrame) -> Dict[str, str]:
        """Validar e mapear colunas necessárias"""
        required_columns = {
            'order_number': 'NOrdem_OSv',
            'order_date': 'Data_OSv', 
            'order_status': 'Status_OSv',
            'engine_manufacturer': 'Fabricante_Mot',
            'engine_description': 'Descricao_Mot',
            'vehicle_model': 'ModeloVei_Osv',
            'defect_description': 'ObsCorpo_OSv',
            'mechanic': 'RazaoSocial_Cli',
            'parts_total': 'TotalProd_OSv',
            'labor_total': 'TotalServ_OSv',
            'grand_total': 'Total_OSv'
        }
        
        missing_columns = []
        column_mapping = {}
        
        for field, excel_col in required_columns.items():
            if excel_col in df.columns:
                column_mapping[field] = excel_col
            else:
                missing_columns.append(excel_col)
                
        if missing_columns:
            raise ValueError(f"Colunas obrigatórias não encontradas: {missing_columns}")
            
        logger.info("✅ Todas as colunas obrigatórias encontradas")
        return column_mapping
    
    def clean_and_filter_data(self, df: pd.DataFrame, column_mapping: Dict[str, str]) -> Tuple[pd.DataFrame, Dict]:
        """Aplicar todos os filtros e limpezas de dados"""
        logger.info(f"🔧 Iniciando limpeza de {len(df)} registros...")
        
        stats = {
            'total_rows': len(df),
            'removed_by_missing_data': 0,
            'removed_by_status': 0,
            'removed_by_invalid_date': 0,
            'removed_by_year_range': 0,
            'final_valid_rows': 0,
            'status_distribution': {},
            'year_distribution': {}
        }
        
        # 1. Remover linhas com dados obrigatórios vazios
        required_fields = ['order_number', 'order_date', 'order_status']
        before_missing = len(df)
        
        for field in required_fields:
            col_name = column_mapping[field]
            df = df.dropna(subset=[col_name])
            df = df[df[col_name].astype(str).str.strip() != '']
            
        stats['removed_by_missing_data'] = before_missing - len(df)
        logger.info(f"   Após remover dados obrigatórios vazios: {len(df)} registros")
        
        # 2. Filtrar por status válido
        status_col = column_mapping['order_status']
        df['status_clean'] = df[status_col].astype(str).str.strip().str.upper()
        
        # Contar distribuição de status
        status_counts = df['status_clean'].value_counts()
        stats['status_distribution'] = status_counts.to_dict()
        
        before_status = len(df)
        df = df[df['status_clean'].isin(self.valid_statuses)]
        stats['removed_by_status'] = before_status - len(df)
        logger.info(f"   Após filtro de status: {len(df)} registros")
        
        # 3. Processar e filtrar datas
        date_col = column_mapping['order_date']
        logger.info("📅 Processando datas...")
        
        # Aplicar validação de data
        df['parsed_date'] = df[date_col].apply(self.date_validator.parse_excel_date)
        
        before_date = len(df)
        df = df.dropna(subset=['parsed_date'])
        stats['removed_by_invalid_date'] = before_date - len(df)
        logger.info(f"   Após validação de datas: {len(df)} registros")
        
        # 4. Filtrar por range de anos
        df['year'] = df['parsed_date'].dt.year
        year_counts = df['year'].value_counts()
        stats['year_distribution'] = year_counts.to_dict()
        
        before_year = len(df)
        valid_years = df['year'].apply(self.date_validator.is_valid_year)
        df = df[valid_years]
        stats['removed_by_year_range'] = before_year - len(df)
        logger.info(f"   Após filtro de anos (2019-2025): {len(df)} registros")
        
        stats['final_valid_rows'] = len(df)
        
        # Log estatísticas finais
        logger.info("📊 Estatísticas de limpeza:")
        logger.info(f"   Total inicial: {stats['total_rows']}")
        logger.info(f"   Removidos por dados vazios: {stats['removed_by_missing_data']}")
        logger.info(f"   Removidos por status: {stats['removed_by_status']}")
        logger.info(f"   Removidos por data inválida: {stats['removed_by_invalid_date']}")
        logger.info(f"   Removidos por ano fora do range: {stats['removed_by_year_range']}")
        logger.info(f"   Final válido: {stats['final_valid_rows']}")
        
        return df, stats
    
    def transform_data(self, df: pd.DataFrame, column_mapping: Dict[str, str]) -> pd.DataFrame:
        """Transformar dados para o formato final"""
        logger.info("🔄 Transformando dados...")
        
        # Preparar DataFrame final
        result_df = pd.DataFrame()
        
        # Campos básicos
        result_df['order_number'] = df[column_mapping['order_number']].astype(str).str.strip()
        result_df['order_date'] = df['parsed_date']
        result_df['order_status'] = df['status_clean']
        
        # Campos opcionais (com tratamento de nulos)
        optional_fields = {
            'engine_manufacturer': 'engine_manufacturer',
            'engine_description': 'engine_description', 
            'vehicle_model': 'vehicle_model',
            'defect_description': 'defect_description',
            'mechanic': 'mechanic'
        }
        
        for field, result_field in optional_fields.items():
            if field in column_mapping:
                col_data = df[column_mapping[field]].fillna('')
                result_df[result_field] = col_data.astype(str).str.strip()
                result_df[result_field] = result_df[result_field].replace('', None)
            else:
                result_df[result_field] = None
        
        # Campos numéricos com tratamento especial
        parts_col = column_mapping.get('parts_total')
        labor_col = column_mapping.get('labor_total') 
        total_col = column_mapping.get('grand_total')
        
        if parts_col:
            result_df['original_parts_value'] = pd.to_numeric(df[parts_col], errors='coerce').fillna(0)
            result_df['parts_total'] = result_df['original_parts_value'] / 2  # Regra de divisão por 2
        else:
            result_df['original_parts_value'] = 0
            result_df['parts_total'] = 0
            
        if labor_col:
            result_df['labor_total'] = pd.to_numeric(df[labor_col], errors='coerce').fillna(0)
        else:
            result_df['labor_total'] = 0
            
        if total_col:
            result_df['grand_total'] = pd.to_numeric(df[total_col], errors='coerce').fillna(0)
        else:
            result_df['grand_total'] = 0
        
        # Verificação de cálculo
        calculated_total = result_df['parts_total'] + result_df['labor_total']
        result_df['calculation_verified'] = np.abs(calculated_total - result_df['grand_total']) < 0.01
        
        # Campo adicional: raw_defect_description (alias para defect_description)
        result_df['raw_defect_description'] = result_df['defect_description']
        result_df['responsible_mechanic'] = result_df['mechanic']
        
        logger.info(f"✅ Transformação concluída: {len(result_df)} registros")
        
        return result_df
    
    def process_excel_file(self, file_path: str) -> Tuple[pd.DataFrame, Dict]:
        """Processar arquivo Excel completo"""
        logger.info(f"🚀 Iniciando processamento: {file_path}")
        
        try:
            # 1. Carregar arquivo
            df = self.load_excel_file(file_path)
            
            # 2. Validar colunas
            column_mapping = self.validate_columns(df)
            
            # 3. Limpar e filtrar dados
            clean_df, stats = self.clean_and_filter_data(df, column_mapping)
            
            # 4. Transformar dados
            final_df = self.transform_data(clean_df, column_mapping)
            
            logger.info("✅ Processamento concluído com sucesso!")
            return final_df, stats
            
        except Exception as e:
            logger.error(f"❌ Erro no processamento: {e}")
            raise
    
    def save_processed_data(self, df: pd.DataFrame, output_path: str):
        """Salvar dados processados"""
        logger.info(f"💾 Salvando dados processados: {output_path}")
        
        # Converter datetime para string para CSV
        df_save = df.copy()
        if 'order_date' in df_save.columns:
            df_save['order_date'] = df_save['order_date'].dt.strftime('%Y-%m-%d')
            
        df_save.to_csv(output_path, index=False, encoding='utf-8')
        logger.info(f"✅ Dados salvos: {len(df_save)} registros")

def main():
    """Função principal para teste"""
    processor = ExcelProcessor()
    
    # Arquivo de teste
    excel_files = [
        "S:/comp-glgarantias/r-glgarantias/GLú-Garantias.xlsx",
        "S:/comp-glgarantias/r-glgarantias/GLu-Garantias-TesteReal.xlsx"
    ]
    
    for excel_file in excel_files:
        if os.path.exists(excel_file):
            logger.info(f"📋 Processando: {excel_file}")
            
            try:
                df_result, stats = processor.process_excel_file(excel_file)
                
                # Salvar resultado
                output_file = f"processed_data_{Path(excel_file).stem}.csv"
                processor.save_processed_data(df_result, output_file)
                
                print(f"\n✅ Processamento concluído para {excel_file}")
                print(f"   Registros válidos: {len(df_result)}")
                print(f"   Arquivo salvo: {output_file}")
                
            except Exception as e:
                logger.error(f"❌ Erro ao processar {excel_file}: {e}")
        else:
            logger.warning(f"⚠️ Arquivo não encontrado: {excel_file}")

if __name__ == "__main__":
    main()