import * as XLSX from 'xlsx';
import { DateValidator } from '../validators/DateValidator';

interface ProcessingResult {
  data: any[];
  summary: {
    totalRows: number;
    validRows: number;
    removedByStatus: number;
    removedByInvalidDate: number;
    removedByYearRange: number;
    statusDistribution: Record<string, number>;
    yearDistribution: Record<string, number>;
  };
}

class CleanDataProcessor {
  
  async processExcelData(buffer: Buffer): Promise<ProcessingResult> {
    console.log('🔧 Iniciando processamento OTIMIZADO da planilha...');
    const startTime = Date.now();
    
    // 1. VALIDAR BUFFER
    if (!buffer || buffer.length === 0) {
      throw new Error('Arquivo vazio ou corrompido');
    }
    
    console.log(`📁 Tamanho do arquivo: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);
    
    // 2. LER PLANILHA (OTIMIZADO)
    let workbook;
    try {
      workbook = XLSX.read(buffer, { type: 'buffer' });
    } catch (error) {
      console.error('❌ Erro ao ler planilha:', error);
      throw new Error('Erro ao processar arquivo Excel - arquivo pode estar corrompido');
    }
    
    // 3. VALIDAR ESTRUTURA
    if (!workbook || !workbook.Sheets) {
      throw new Error('Erro ao ler estrutura da planilha - arquivo pode estar corrompido');
    }
    
    console.log('📋 Abas encontradas:', workbook.SheetNames.join(', '));
    
    if (!workbook.SheetNames.includes('Tabela')) {
      throw new Error(`Aba "Tabela" não encontrada. Abas disponíveis: ${workbook.SheetNames.join(', ')}`);
    }
    
    const worksheet = workbook.Sheets['Tabela'];
    
    if (!worksheet) {
      throw new Error('Planilha "Tabela" está vazia ou corrompida');
    }
    
    // 2. CONVERTER PARA ARRAY (MAIS EFICIENTE)
    const allRows = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1, 
      defval: null,
      raw: false // Evita conversões desnecessárias
    });
    
    const headers = allRows[0] as string[];
    const dataRows = allRows.slice(1);
    
    console.log(`📊 Total de linhas na planilha: ${dataRows.length} (${((Date.now() - startTime) / 1000).toFixed(1)}s)`);
    
    // 3. MAPEAR COLUNAS
    const colIndexMap = {
      orderNumber: headers.indexOf('NOrdem_OSv'),
      orderDate: headers.indexOf('Data_OSv'),
      orderStatus: headers.indexOf('Status_OSv'),
      engineMfg: headers.indexOf('Fabricante_Mot'),
      engineDesc: headers.indexOf('Descricao_Mot'),
      vehicleModel: headers.indexOf('ModeloVei_Osv'),
      defectDesc: headers.indexOf('ObsCorpo_OSv'),
      mechanic: headers.indexOf('RazaoSocial_Cli'),
      partsTotal: headers.indexOf('TotalProd_OSv'),
      laborTotal: headers.indexOf('TotalServ_OSv'),
      grandTotal: headers.indexOf('Total_OSv')
    };
    
    // Verificar se colunas obrigatórias existem
    if (colIndexMap.orderNumber === -1 || colIndexMap.orderDate === -1 || colIndexMap.orderStatus === -1) {
      throw new Error('Colunas obrigatórias não encontradas');
    }
    
    // 4. FILTROS COMBINADOS (OTIMIZADO)
    console.log('🔍 Aplicando filtros combinados...');
    const validStatuses = new Set(['G', 'GO', 'GU']); // Set é mais rápido para lookup
    
    const statusDistribution: Record<string, number> = {};
    let removedByStatus = 0;
    
    // Filtrar campos obrigatórios e status em uma única passada
    const rowsWithValidStatus = dataRows.filter((row: any) => {
      // Verificar campos obrigatórios
      if (!row[colIndexMap.orderNumber] || 
          !row[colIndexMap.orderDate] || 
          !row[colIndexMap.orderStatus]) {
        return false;
      }
      
      // Verificar status válido
      const status = String(row[colIndexMap.orderStatus]).trim();
      statusDistribution[status] = (statusDistribution[status] || 0) + 1;
      
      if (!validStatuses.has(status)) {
        removedByStatus++;
        return false;
      }
      
      return true;
    });
    
    console.log(`   Linhas válidas após filtros: ${rowsWithValidStatus.length}`);
    console.log(`   Removidas por status inválido: ${removedByStatus}`);
    
    // 6. CONVERTER E FILTRAR DATAS
    console.log('📅 Processando datas...');
    const dateValidator = new DateValidator();
    const validRows: any[] = [];
    const yearDistribution: Record<string, number> = {};
    
    let removedByInvalidDate = 0;
    let removedByYearRange = 0;
    
    for (const row of rowsWithValidStatus as any[]) {
      const dateValue = row[colIndexMap.orderDate];
      const dateValidation = dateValidator.validateDate(dateValue);
      
      if (dateValidation.isValid && dateValidation.date) {
        const year = dateValidation.date.getFullYear();
        
        // Aplicar filtro para anos válidos (2019-2025 apenas)
        if (year >= 2019 && year <= 2025) {
          yearDistribution[year.toString()] = (yearDistribution[year.toString()] || 0) + 1;
          
          // Transformar dados
          const transformedRow = this.transformRow(row, colIndexMap, dateValidation.date);
          validRows.push(transformedRow);
        } else {
          removedByYearRange++;
        }
      } else {
        removedByInvalidDate++;
      }
    }
    
    console.log(`   Após filtro de data: ${validRows.length} (removidos por data inválida: ${removedByInvalidDate}, removidos por ano fora do range: ${removedByYearRange})`);
    
    // Distribuição final por status
    const finalStatusDist: Record<string, number> = {};
    validRows.forEach(row => {
      const status = row.order_status;
      finalStatusDist[status] = (finalStatusDist[status] || 0) + 1;
    });
    
    console.log('✅ Processamento concluído:');
    console.log(`   Total válido: ${validRows.length}`);
    console.log('   Por status:');
    Object.entries(finalStatusDist).forEach(([status, count]) => {
      const pct = ((count / validRows.length) * 100).toFixed(1);
      console.log(`     ${status}: ${count} (${pct}%)`);
    });
    
    console.log('   Por ano:');
    Object.entries(yearDistribution).sort().forEach(([year, count]) => {
      const pct = ((count / validRows.length) * 100).toFixed(1);
      console.log(`     ${year}: ${count} (${pct}%)`);
    });
    
    return {
      data: validRows,
      summary: {
        totalRows: dataRows.length,
        validRows: validRows.length,
        removedByStatus,
        removedByInvalidDate,
        removedByYearRange,
        statusDistribution: finalStatusDist,
        yearDistribution
      }
    };
  }
  
  private transformRow(row: any[], colIndexMap: any, validDate: Date): any {
    const originalPartsValue = parseFloat(row[colIndexMap.partsTotal]) || 0;
    const partsTotal = originalPartsValue / 2; // Divisão por 2 conforme regra
    const laborTotal = parseFloat(row[colIndexMap.laborTotal]) || 0;
    const grandTotal = parseFloat(row[colIndexMap.grandTotal]) || 0;
    
    const calculationVerified = Math.abs((partsTotal + laborTotal) - grandTotal) < 0.01;
    
    return {
      order_number: String(row[colIndexMap.orderNumber]).trim(),
      order_date: validDate,
      engine_manufacturer: row[colIndexMap.engineMfg] ? String(row[colIndexMap.engineMfg]).trim() : null,
      engine_description: row[colIndexMap.engineDesc] ? String(row[colIndexMap.engineDesc]).trim() : null,
      vehicle_model: row[colIndexMap.vehicleModel] ? String(row[colIndexMap.vehicleModel]).trim() : null,
      raw_defect_description: row[colIndexMap.defectDesc] ? String(row[colIndexMap.defectDesc]).trim() : null,
      responsible_mechanic: row[colIndexMap.mechanic] ? String(row[colIndexMap.mechanic]).trim() : null,
      parts_total: partsTotal,
      labor_total: laborTotal,
      grand_total: grandTotal,
      order_status: String(row[colIndexMap.orderStatus]).trim(),
      original_parts_value: originalPartsValue,
      calculation_verified: calculationVerified
    };
  }
}

export { CleanDataProcessor, ProcessingResult };
