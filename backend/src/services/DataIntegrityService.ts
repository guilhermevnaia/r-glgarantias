import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface IntegrityCheckResult {
  timestamp: string;
  check_type: string;
  expected_count: number;
  actual_count: number;
  status: 'OK' | 'ERROR' | 'FIXED';
  details: string;
  error_details?: string;
}

export class DataIntegrityService {
  
  /**
   * Registra resultado de verificação de integridade
   */
  private async logIntegrityCheck(result: IntegrityCheckResult): Promise<void> {
    try {
      const { error } = await supabase
        .from('data_integrity_logs')
        .insert([{
          timestamp: result.timestamp,
          check_type: result.check_type,
          expected_count: result.expected_count,
          actual_count: result.actual_count,
          status: result.status,
          details: result.details,
          error_details: result.error_details
        }]);

      if (error) {
        console.error('❌ Erro ao salvar log de integridade:', error);
        console.log('💡 Dica: Execute o script create_integrity_table.py para criar a tabela data_integrity_logs');
      } else {
        console.log(`📝 Log de integridade salvo: ${result.check_type} - ${result.status}`);
      }
    } catch (error) {
      console.error('❌ Erro ao processar log de integridade:', error);
      console.log('💡 Dica: Execute o script create_integrity_table.py para criar a tabela data_integrity_logs');
    }
  }

  /**
   * Busca todos os registros do Supabase em lotes
   */
  private async fetchAllRecords(): Promise<any[]> {
    console.log('🔄 Iniciando busca completa de registros...');
    let allOrders: any[] = [];
    let supabasePage = 0;
    const pageSize = 1000;
    
    while (true) {
      const { data: pageData, error: fetchError } = await supabase
        .from('service_orders')
        .select('*')
        .order('order_date', { ascending: false })
        .range(supabasePage * pageSize, (supabasePage + 1) * pageSize - 1);

      if (fetchError) {
        console.error('❌ Erro ao buscar página:', supabasePage, fetchError);
        break;
      }

      if (!pageData || pageData.length === 0) {
        break;
      }

      allOrders = allOrders.concat(pageData);
      console.log(`📄 Página ${supabasePage + 1}: ${pageData.length} registros (total: ${allOrders.length})`);
      
      if (pageData.length < pageSize) {
        break;
      }
      
      supabasePage++;
    }
    
    console.log(`✅ Total de registros carregados: ${allOrders.length}`);
    return allOrders;
  }

  /**
   * Verifica integridade dos dados totais
   */
  async checkTotalRecordsIntegrity(): Promise<IntegrityCheckResult> {
    const timestamp = new Date().toISOString();
    
    try {
      // Buscar contagem direta
      const { count: directCount, error: countError } = await supabase
        .from('service_orders')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        const result: IntegrityCheckResult = {
          timestamp,
          check_type: 'TOTAL_RECORDS_COUNT',
          expected_count: 0,
          actual_count: 0,
          status: 'ERROR',
          details: 'Erro ao buscar contagem direta',
          error_details: countError.message
        };
        await this.logIntegrityCheck(result);
        return result;
      }

      // Buscar todos os registros via paginação
      const allRecords = await this.fetchAllRecords();
      
      const result: IntegrityCheckResult = {
        timestamp,
        check_type: 'TOTAL_RECORDS_COUNT',
        expected_count: directCount || 0,
        actual_count: allRecords.length,
        status: (directCount === allRecords.length) ? 'OK' : 'ERROR',
        details: `Contagem direta: ${directCount}, Busca paginada: ${allRecords.length}`
      };

      if (result.status === 'ERROR') {
        result.error_details = `Discrepância detectada entre contagem direta (${directCount}) e busca paginada (${allRecords.length})`;
      }

      await this.logIntegrityCheck(result);
      return result;

    } catch (error) {
      const result: IntegrityCheckResult = {
        timestamp,
        check_type: 'TOTAL_RECORDS_COUNT',
        expected_count: 0,
        actual_count: 0,
        status: 'ERROR',
        details: 'Erro durante verificação de integridade',
        error_details: error instanceof Error ? error.message : 'Erro desconhecido'
      };
      
      await this.logIntegrityCheck(result);
      return result;
    }
  }

  /**
   * Verifica integridade dos dados filtrados (2019-2025)
   */
  async checkValidDateRangeIntegrity(): Promise<IntegrityCheckResult> {
    const timestamp = new Date().toISOString();
    
    try {
      const allRecords = await this.fetchAllRecords();
      
      // Filtrar dados válidos (2019-2025)
      const validRecords = allRecords.filter(order => {
        if (!order.order_date) return false;
        const orderYear = new Date(order.order_date).getFullYear();
        return orderYear >= 2019 && orderYear <= 2025;
      });

      // Contar registros inválidos
      const invalidRecords = allRecords.filter(order => {
        if (!order.order_date) return true;
        const orderYear = new Date(order.order_date).getFullYear();
        return orderYear < 2019 || orderYear > 2025;
      });

      const result: IntegrityCheckResult = {
        timestamp,
        check_type: 'VALID_DATE_RANGE_2019_2025',
        expected_count: allRecords.length - invalidRecords.length,
        actual_count: validRecords.length,
        status: (validRecords.length === (allRecords.length - invalidRecords.length)) ? 'OK' : 'ERROR',
        details: `Total: ${allRecords.length}, Válidos (2019-2025): ${validRecords.length}, Inválidos: ${invalidRecords.length}`
      };

      if (invalidRecords.length > 0) {
        result.error_details = `Encontrados ${invalidRecords.length} registros fora do range 2019-2025`;
      }

      await this.logIntegrityCheck(result);
      return result;

    } catch (error) {
      const result: IntegrityCheckResult = {
        timestamp,
        check_type: 'VALID_DATE_RANGE_2019_2025',
        expected_count: 0,
        actual_count: 0,
        status: 'ERROR',
        details: 'Erro durante verificação de range de datas',
        error_details: error instanceof Error ? error.message : 'Erro desconhecido'
      };
      
      await this.logIntegrityCheck(result);
      return result;
    }
  }

  /**
   * Verifica integridade dos cálculos financeiros
   */
  async checkFinancialCalculationsIntegrity(): Promise<IntegrityCheckResult> {
    const timestamp = new Date().toISOString();
    
    try {
      const allRecords = await this.fetchAllRecords();
      
      // Filtrar dados válidos (2019-2025)
      const validRecords = allRecords.filter(order => {
        if (!order.order_date) return false;
        const orderYear = new Date(order.order_date).getFullYear();
        return orderYear >= 2019 && orderYear <= 2025;
      });

      let calculationErrors = 0;
      let totalCalculatedValue = 0;
      
      validRecords.forEach(order => {
        const partsValue = parseFloat(order.original_parts_value || order.parts_total || 0);
        const laborValue = parseFloat(order.labor_total || 0);
        
        // Verificar se valores são números válidos
        if (isNaN(partsValue) || isNaN(laborValue)) {
          calculationErrors++;
        } else {
          // Aplicar correção: peças divididas por 2
          const correctedPartsValue = partsValue / 2;
          totalCalculatedValue += correctedPartsValue + laborValue;
        }
      });

      const result: IntegrityCheckResult = {
        timestamp,
        check_type: 'FINANCIAL_CALCULATIONS',
        expected_count: validRecords.length,
        actual_count: validRecords.length - calculationErrors,
        status: calculationErrors === 0 ? 'OK' : 'ERROR',
        details: `Registros processados: ${validRecords.length}, Erros de cálculo: ${calculationErrors}, Valor total calculado: R$ ${totalCalculatedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      };

      if (calculationErrors > 0) {
        result.error_details = `${calculationErrors} registros com valores inválidos (NaN)`;
      }

      await this.logIntegrityCheck(result);
      return result;

    } catch (error) {
      const result: IntegrityCheckResult = {
        timestamp,
        check_type: 'FINANCIAL_CALCULATIONS',
        expected_count: 0,
        actual_count: 0,
        status: 'ERROR',
        details: 'Erro durante verificação de cálculos financeiros',
        error_details: error instanceof Error ? error.message : 'Erro desconhecido'
      };
      
      await this.logIntegrityCheck(result);
      return result;
    }
  }

  /**
   * Executa verificação completa de integridade
   */
  async performCompleteIntegrityCheck(): Promise<IntegrityCheckResult[]> {
    console.log('🔍 Iniciando verificação completa de integridade dos dados...');
    
    const results: IntegrityCheckResult[] = [];
    
    // Verificar integridade total de registros
    console.log('📊 Verificando contagem total de registros...');
    results.push(await this.checkTotalRecordsIntegrity());
    
    // Verificar integridade do range de datas
    console.log('📅 Verificando range de datas válidas...');
    results.push(await this.checkValidDateRangeIntegrity());
    
    // Verificar integridade dos cálculos financeiros
    console.log('💰 Verificando cálculos financeiros...');
    results.push(await this.checkFinancialCalculationsIntegrity());
    
    // Resumo dos resultados
    const okCount = results.filter(r => r.status === 'OK').length;
    const errorCount = results.filter(r => r.status === 'ERROR').length;
    const fixedCount = results.filter(r => r.status === 'FIXED').length;
    
    console.log(`✅ Verificação completa finalizada: ${okCount} OK, ${errorCount} ERROS, ${fixedCount} CORRIGIDOS`);
    
    return results;
  }

  /**
   * Busca logs de integridade recentes
   */
  async getRecentIntegrityLogs(limit: number = 50): Promise<any[]> {
    try {
      const { data: logs, error } = await supabase
        .from('data_integrity_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ Erro ao buscar logs de integridade:', error);
        return [];
      }

      return logs || [];
    } catch (error) {
      console.error('❌ Erro ao processar logs de integridade:', error);
      return [];
    }
  }
}