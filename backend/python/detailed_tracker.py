#!/usr/bin/env python3
"""
RASTREAMENTO DETALHADO DE DADOS - GL GARANTIAS

Sistema para rastrear cada linha do Excel e identificar exatamente
onde estão os 2519 registros esperados vs 2488 encontrados.
"""

import pandas as pd
import numpy as np
import json
import sys
from datetime import datetime
from collections import defaultdict, Counter
import argparse

class DetailedDataTracker:
    """
    Rastreador detalhado que analisa CADA linha do Excel
    e identifica exatamente onde estão as perdas de dados
    """
    
    def __init__(self):
        self.tracking_data = {
            'total_rows_read': 0,
            'detailed_analysis': {
                'missing_fields': [],
                'invalid_status': [],
                'invalid_dates': [],
                'year_out_of_range': [],
                'future_dates': [],
                'valid_records': []
            },
            'year_distribution': defaultdict(int),
            'status_distribution': defaultdict(int),
            'rejection_reasons': defaultdict(int),
            'sample_data': {
                'first_10_valid': [],
                'first_10_rejected': [],
                'year_samples': defaultdict(list)
            }
        }
        
        self.VALID_STATUSES = {'G', 'GO', 'GU'}
        self.MIN_YEAR = 2019
        self.MAX_YEAR = 2025
        self.CURRENT_YEAR = datetime.now().year
        self.CURRENT_MONTH = datetime.now().month
    
    def track_excel_file(self, file_path: str) -> dict:
        """
        Rastreamento completo linha por linha do Excel
        """
        print(f"Iniciando rastreamento detalhado: {file_path}")
        
        # 1. LER EXCEL
        try:
            df = pd.read_excel(
                file_path,
                sheet_name='Tabela',
                engine='openpyxl',
                dtype=str,
                na_filter=False
            )
            print(f"Total de linhas lidas: {len(df)}")
            self.tracking_data['total_rows_read'] = len(df)
        except Exception as e:
            return {'error': f'Erro ao ler Excel: {str(e)}'}
        
        # 2. ANALISAR CADA LINHA
        for index, row in df.iterrows():
            self._analyze_single_row(row, index + 2)  # +2 porque Excel começa na linha 2
        
        # 3. GERAR RELATÓRIO FINAL
        return self._generate_detailed_report()
    
    def _analyze_single_row(self, row: pd.Series, excel_row_number: int):
        """
        Analisar uma linha específica e categorizar
        """
        # Dados básicos da linha
        order_number = str(row.get('NOrdem_OSv', '')).strip()
        raw_date = row.get('Data_OSv', '')
        raw_status = str(row.get('Status_OSv', '')).strip()
        
        row_data = {
            'excel_row': excel_row_number,
            'order_number': order_number,
            'raw_date': str(raw_date),
            'raw_status': raw_status,
            'rejection_reason': None,
            'processed_date': None,
            'year': None
        }
        
        # VERIFICAÇÃO 1: Campos obrigatórios
        if not order_number or not raw_date or not raw_status:
            missing_fields = []
            if not order_number: missing_fields.append('order_number')
            if not raw_date: missing_fields.append('date')
            if not raw_status: missing_fields.append('status')
            
            row_data['rejection_reason'] = f"Campos faltando: {', '.join(missing_fields)}"
            self.tracking_data['detailed_analysis']['missing_fields'].append(row_data)
            self.tracking_data['rejection_reasons']['missing_fields'] += 1
            return
        
        # VERIFICAÇÃO 2: Status válido
        status = raw_status.upper()
        self.tracking_data['status_distribution'][status] += 1
        
        if status not in self.VALID_STATUSES:
            row_data['rejection_reason'] = f"Status inválido: '{status}' (válidos: G, GO, GU)"
            self.tracking_data['detailed_analysis']['invalid_status'].append(row_data)
            self.tracking_data['rejection_reasons']['invalid_status'] += 1
            return
        
        # VERIFICAÇÃO 3: Data válida
        parsed_date = self._parse_date_robust(raw_date)
        if parsed_date is None:
            row_data['rejection_reason'] = f"Data inválida: '{raw_date}'"
            self.tracking_data['detailed_analysis']['invalid_dates'].append(row_data)
            self.tracking_data['rejection_reasons']['invalid_date'] += 1
            return
        
        row_data['processed_date'] = parsed_date.isoformat()
        year = parsed_date.year
        row_data['year'] = year
        
        # VERIFICAÇÃO 4: Range de ano
        if year < self.MIN_YEAR or year > self.MAX_YEAR:
            row_data['rejection_reason'] = f"Ano fora do range: {year} (range: {self.MIN_YEAR}-{self.MAX_YEAR})"
            self.tracking_data['detailed_analysis']['year_out_of_range'].append(row_data)
            self.tracking_data['rejection_reasons']['year_out_of_range'] += 1
            return
        
        # VERIFICAÇÃO 5: Datas futuras impossíveis
        if year == self.CURRENT_YEAR and parsed_date.month > self.CURRENT_MONTH + 1:
            row_data['rejection_reason'] = f"Data futura impossível: {parsed_date.strftime('%m/%Y')} (mês atual: {self.CURRENT_MONTH})"
            self.tracking_data['detailed_analysis']['future_dates'].append(row_data)
            self.tracking_data['rejection_reasons']['future_dates'] += 1
            return
        
        # LINHA VÁLIDA
        self.tracking_data['detailed_analysis']['valid_records'].append(row_data)
        self.tracking_data['year_distribution'][year] += 1
        
        # Amostras para análise  
        if len(self.tracking_data['sample_data']['first_10_valid']) < 10:
            row_data['engine_manufacturer'] = str(row.get('Fabricante_Mot', '')).strip()
            row_data['vehicle_model'] = str(row.get('ModeloVei_Osv', '')).strip()
            self.tracking_data['sample_data']['first_10_valid'].append(row_data)
        
        # Amostras por ano
        if len(self.tracking_data['sample_data']['year_samples'][year]) < 3:
            self.tracking_data['sample_data']['year_samples'][year].append(row_data)
    
    def _parse_date_robust(self, raw_date) -> datetime:
        """
        Parsing robusto de data (mesmo algoritmo do sistema principal)
        """
        if pd.isna(raw_date) or raw_date == '' or raw_date is None:
            return None
        
        # Se já é datetime
        if isinstance(raw_date, datetime):
            return raw_date
        
        # String
        if isinstance(raw_date, str):
            clean_date = raw_date.strip()
            if not clean_date:
                return None
            
            # PARSING CORRIGIDO - detectar formato automaticamente
            import re
            if re.match(r'^\d{4}-\d{1,2}-\d{1,2}', clean_date):
                # Formato ISO YYYY-MM-DD - NÃO usar dayfirst
                try:
                    parsed = pd.to_datetime(clean_date, errors='coerce', dayfirst=False)
                    if pd.notna(parsed):
                        return parsed.to_pydatetime()
                except Exception:
                    pass
            else:
                # Outros formatos - usar dayfirst=True
                try:
                    parsed = pd.to_datetime(clean_date, errors='coerce', dayfirst=True)
                    if pd.notna(parsed):
                        return parsed.to_pydatetime()
                except Exception:
                    pass
        
        # Número (Excel serial)
        if isinstance(raw_date, (int, float)):
            try:
                if 1 <= raw_date <= 50000:
                    parsed = pd.to_datetime(raw_date, origin='1899-12-30', unit='D')
                    if pd.notna(parsed):
                        return parsed.to_pydatetime()
            except Exception:
                pass
        
        # Forçar conversão
        try:
            parsed = pd.to_datetime(str(raw_date), errors='coerce')
            if pd.notna(parsed):
                return parsed.to_pydatetime()
        except Exception:
            pass
        
        return None
    
    def _generate_detailed_report(self) -> dict:
        """
        Gerar relatório detalhado com todas as informações
        """
        total_valid = len(self.tracking_data['detailed_analysis']['valid_records'])
        total_rejected = (
            len(self.tracking_data['detailed_analysis']['missing_fields']) +
            len(self.tracking_data['detailed_analysis']['invalid_status']) +
            len(self.tracking_data['detailed_analysis']['invalid_dates']) +
            len(self.tracking_data['detailed_analysis']['year_out_of_range']) +
            len(self.tracking_data['detailed_analysis']['future_dates'])
        )
        
        # Análise detalhada por ano (>=2019)
        year_analysis = {}
        for year in range(2019, 2026):
            year_count = self.tracking_data['year_distribution'][year]
            year_analysis[str(year)] = {
                'total_records': year_count,
                'percentage': round((year_count / total_valid * 100), 2) if total_valid > 0 else 0,
                'sample_orders': [
                    {
                        'order_number': sample['order_number'],
                        'excel_row': sample['excel_row'],
                        'date': sample['processed_date']
                    }
                    for sample in self.tracking_data['sample_data']['year_samples'].get(year, [])
                ]
            }
        
        report = {
            'summary': {
                'total_rows_read': self.tracking_data['total_rows_read'],
                'total_valid_records': total_valid,
                'total_rejected_records': total_rejected,
                'expected_target': 2519,
                'current_result': total_valid,
                'missing_records': 2519 - total_valid if total_valid < 2519 else 0,
                'mathematical_verification': self.tracking_data['total_rows_read'] == (total_valid + total_rejected)
            },
            
            'rejection_breakdown': {
                'missing_fields': {
                    'count': len(self.tracking_data['detailed_analysis']['missing_fields']),
                    'percentage': round(len(self.tracking_data['detailed_analysis']['missing_fields']) / self.tracking_data['total_rows_read'] * 100, 2),
                    'sample_rows': [
                        {
                            'excel_row': item['excel_row'],
                            'order_number': item['order_number'],
                            'reason': item['rejection_reason']
                        }
                        for item in self.tracking_data['detailed_analysis']['missing_fields'][:5]
                    ]
                },
                'invalid_status': {
                    'count': len(self.tracking_data['detailed_analysis']['invalid_status']),
                    'percentage': round(len(self.tracking_data['detailed_analysis']['invalid_status']) / self.tracking_data['total_rows_read'] * 100, 2),
                    'status_found': dict(self.tracking_data['status_distribution']),
                    'sample_rows': [
                        {
                            'excel_row': item['excel_row'],
                            'order_number': item['order_number'],
                            'invalid_status': item['raw_status'],
                            'reason': item['rejection_reason']
                        }
                        for item in self.tracking_data['detailed_analysis']['invalid_status'][:5]
                    ]
                },
                'invalid_dates': {
                    'count': len(self.tracking_data['detailed_analysis']['invalid_dates']),
                    'percentage': round(len(self.tracking_data['detailed_analysis']['invalid_dates']) / self.tracking_data['total_rows_read'] * 100, 2),
                    'sample_rows': [
                        {
                            'excel_row': item['excel_row'],
                            'order_number': item['order_number'],
                            'raw_date': item['raw_date'],
                            'reason': item['rejection_reason']
                        }
                        for item in self.tracking_data['detailed_analysis']['invalid_dates'][:5]
                    ]
                },
                'year_out_of_range': {
                    'count': len(self.tracking_data['detailed_analysis']['year_out_of_range']),
                    'percentage': round(len(self.tracking_data['detailed_analysis']['year_out_of_range']) / self.tracking_data['total_rows_read'] * 100, 2),
                    'sample_rows': [
                        {
                            'excel_row': item['excel_row'],
                            'order_number': item['order_number'],
                            'year': item['year'],
                            'date': item['processed_date'],
                            'reason': item['rejection_reason']
                        }
                        for item in self.tracking_data['detailed_analysis']['year_out_of_range'][:5]
                    ]
                },
                'future_dates': {
                    'count': len(self.tracking_data['detailed_analysis']['future_dates']),
                    'percentage': round(len(self.tracking_data['detailed_analysis']['future_dates']) / self.tracking_data['total_rows_read'] * 100, 2),
                    'sample_rows': [
                        {
                            'excel_row': item['excel_row'],
                            'order_number': item['order_number'],
                            'date': item['processed_date'],
                            'reason': item['rejection_reason']
                        }
                        for item in self.tracking_data['detailed_analysis']['future_dates'][:5]
                    ]
                }
            },
            
            'year_distribution_analysis': year_analysis,
            
            'data_quality_insights': {
                'most_common_rejection': max(self.tracking_data['rejection_reasons'].items(), key=lambda x: x[1]) if self.tracking_data['rejection_reasons'] else ('none', 0),
                'status_distribution_all': dict(self.tracking_data['status_distribution']),
                'data_completeness_score': round((total_valid / self.tracking_data['total_rows_read']) * 100, 2),
                'target_achievement': round((total_valid / 2519) * 100, 2) if total_valid <= 2519 else round((2519 / total_valid) * 100, 2)
            },
            
            'sample_valid_data': self.tracking_data['sample_data']['first_10_valid'][:5],
            
            'recommendations': self._generate_recommendations(total_valid)
        }
        
        return report
    
    def _generate_recommendations(self, total_valid: int) -> list:
        """
        Gerar recomendações baseadas na análise
        """
        recommendations = []
        
        if total_valid < 2519:
            recommendations.append(f"FALTAM {2519 - total_valid} registros para atingir o target de 2519")
            
        # Análise das principais causas de rejeição
        top_rejection = max(self.tracking_data['rejection_reasons'].items(), key=lambda x: x[1]) if self.tracking_data['rejection_reasons'] else None
        
        if top_rejection:
            cause, count = top_rejection
            recommendations.append(f"Principal causa de rejeição: {cause} ({count} registros)")
            
            if cause == 'invalid_status':
                recommendations.append("Revisar regras de status - considerar aceitar outros status além de G, GO, GU")
            elif cause == 'year_out_of_range':
                recommendations.append("Revisar range de anos - considerar expandir além de 2019-2025")
            elif cause == 'invalid_date':
                recommendations.append("Revisar parsing de datas - pode haver formatos não reconhecidos")
        
        return recommendations

def main():
    parser = argparse.ArgumentParser(description='Rastreamento Detalhado de Dados - GL Garantias')
    parser.add_argument('file_path', help='Caminho para o arquivo Excel')
    parser.add_argument('--output', '-o', help='Arquivo de saída JSON')
    
    args = parser.parse_args()
    
    tracker = DetailedDataTracker()
    report = tracker.track_excel_file(args.file_path)
    
    # Salvar ou imprimir resultado
    result_json = json.dumps(report, ensure_ascii=False, indent=2)
    
    if args.output:
        with open(args.output, 'w', encoding='utf-8') as f:
            f.write(result_json)
        print(f"Relatório detalhado salvo em: {args.output}")
    else:
        print(result_json)

if __name__ == '__main__':
    main()