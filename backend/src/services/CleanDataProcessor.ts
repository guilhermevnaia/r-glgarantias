import * as XLSX from 'xlsx';
import { DateValidator } from '../validators/DateValidator';
import { mechanicAutoDetection } from './MechanicAutoDetectionService';

interface ProcessingResult {
  data: any[];
  summary: {
    totalRows: number;
    validRows: number;
    removedByMissingFields: number;
    removedByStatus: number;
    removedByInvalidDate: number;
    removedByYearRange: number;
    statusDistribution: Record<string, number>;
    yearDistribution: Record<string, number>;
    // Debug info
    totalRemoved: number;
    expectedValid: number;
    mathematicallyCorrect: boolean;
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
    console.log(`📋 Cabeçalhos encontrados: ${headers.join(', ')}`);
    
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
    console.log(`🔍 Mapeamento de colunas:`, colIndexMap);
    
    const missingColumns = [];
    if (colIndexMap.orderNumber === -1) missingColumns.push('NOrdem_OSv');
    if (colIndexMap.orderDate === -1) missingColumns.push('Data_OSv');
    if (colIndexMap.orderStatus === -1) missingColumns.push('Status_OSv');
    
    if (missingColumns.length > 0) {
      throw new Error(`Colunas obrigatórias não encontradas: ${missingColumns.join(', ')}`);
    }
    
    // 4. FILTROS COMBINADOS (OTIMIZADO)
    console.log('🔍 Aplicando filtros combinados...');
    const validStatuses = new Set(['G', 'GO', 'GU']); // Set é mais rápido para lookup
    
    const statusDistribution: Record<string, number> = {};
    let removedByStatus = 0;
    let removedByMissingFields = 0;
    
    // Filtrar campos obrigatórios e status em uma única passada
    const rowsWithValidStatus = dataRows.filter((row: any, index: number) => {
      // Verificar campos obrigatórios
      const orderNumber = row[colIndexMap.orderNumber];
      const orderDate = row[colIndexMap.orderDate];
      const orderStatus = row[colIndexMap.orderStatus];
      
      if (!orderNumber || !orderDate || !orderStatus) {
        removedByMissingFields++;
        if (index < 5) { // Log apenas as primeiras 5 para não sobrecarregar
          console.log(`❌ Linha ${index + 2}: Campos obrigatórios faltando - OS: ${orderNumber}, Data: ${orderDate}, Status: ${orderStatus}`);
        }
        return false;
      }
      
      // Verificar status válido
      const status = String(orderStatus).trim();
      statusDistribution[status] = (statusDistribution[status] || 0) + 1;
      
      if (!validStatuses.has(status)) {
        removedByStatus++;
        if (index < 5) {
          console.log(`❌ Linha ${index + 2}: Status inválido "${status}" - OS: ${orderNumber}`);
        }
        return false;
      }
      
      return true;
    });
    
    console.log(`   Linhas válidas após filtros: ${rowsWithValidStatus.length}`);
    console.log(`   Removidas por campos obrigatórios faltando: ${removedByMissingFields}`);
    console.log(`   Removidas por status inválido: ${removedByStatus}`);
    console.log(`   Distribuição de status encontrados:`, statusDistribution);
    
    // 6. CONVERTER E FILTRAR DATAS
    console.log('📅 Processando datas...');
    const dateValidator = new DateValidator();
    const validRows: any[] = [];
    const yearDistribution: Record<string, number> = {};
    
    let removedByInvalidDate = 0;
    let removedByYearRange = 0;
    let processedDateCount = 0;
    
    for (const [index, row] of (rowsWithValidStatus as any[]).entries()) {
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
          processedDateCount++;
        } else {
          removedByYearRange++;
          if (index < 5) {
            console.log(`❌ Linha ${index + 2}: Ano fora do range (${year}) - OS: ${row[colIndexMap.orderNumber]}, Data: ${dateValue}`);
          }
        }
      } else {
        removedByInvalidDate++;
        if (index < 5) {
          console.log(`❌ Linha ${index + 2}: Data inválida - OS: ${row[colIndexMap.orderNumber]}, Data: ${dateValue}, Erro: ${dateValidation.error}`);
        }
      }
    }
    
    console.log(`   Após filtro de data: ${validRows.length} (removidos por data inválida: ${removedByInvalidDate}, removidos por ano fora do range: ${removedByYearRange})`);
    
    // Distribuição final por status
    const finalStatusDist: Record<string, number> = {};
    validRows.forEach(row => {
      const status = row.order_status;
      finalStatusDist[status] = (finalStatusDist[status] || 0) + 1;
    });
    
    // VERIFICAÇÃO MATEMÁTICA COMPLETA
    const totalRemoved = removedByMissingFields + removedByStatus + removedByInvalidDate + removedByYearRange;
    const expectedValid = dataRows.length - totalRemoved;
    
    console.log('✅ Processamento concluído:');
    console.log(`📊 RESUMO MATEMÁTICO:`);
    console.log(`   Total linhas Excel: ${dataRows.length}`);
    console.log(`   - Campos obrigatórios faltando: ${removedByMissingFields}`);
    console.log(`   - Status inválido: ${removedByStatus}`);
    console.log(`   - Data inválida: ${removedByInvalidDate}`);
    console.log(`   - Ano fora do range (2019-2025): ${removedByYearRange}`);
    console.log(`   = Total removido: ${totalRemoved}`);
    console.log(`   = Esperado válido: ${expectedValid}`);
    console.log(`   = Real processado: ${validRows.length}`);
    console.log(`   ${expectedValid === validRows.length ? '✅ MATEMÁTICA CORRETA' : '❌ DIFERENÇA DETECTADA!'}`);
    
    console.log('   Por status final:');
    Object.entries(finalStatusDist).forEach(([status, count]) => {
      const pct = ((count / validRows.length) * 100).toFixed(1);
      console.log(`     ${status}: ${count} (${pct}%)`);
    });
    
    console.log('   Por ano:');
    Object.entries(yearDistribution).sort().forEach(([year, count]) => {
      const pct = ((count / validRows.length) * 100).toFixed(1);
      console.log(`     ${year}: ${count} (${pct}%)`);
    });
    
    // 🔍 DETECÇÃO AUTOMÁTICA DE MECÂNICOS
    try {
      const mechanicNames = validRows
        .map(row => row.responsible_mechanic)
        .filter(name => name && name.trim());
      
      if (mechanicNames.length > 0) {
        console.log('🔍 Iniciando detecção automática de mecânicos...');
        const detectionResult = await mechanicAutoDetection.detectAndRegisterNewMechanics(mechanicNames);
        
        if (detectionResult.newMechanics.length > 0) {
          console.log(`✅ ${detectionResult.newMechanics.length} novos mecânicos detectados e registrados automaticamente!`);
          console.log(`📝 Novos mecânicos: ${detectionResult.newMechanics.join(', ')}`);
        } else {
          console.log('ℹ️ Nenhum mecânico novo detectado');
        }
      }
    } catch (error) {
      console.error('⚠️ Erro na detecção automática de mecânicos (não crítico):', error);
    }
    
    return {
      data: validRows,
      summary: {
        totalRows: dataRows.length,
        validRows: validRows.length,
        removedByMissingFields,
        removedByStatus,
        removedByInvalidDate,
        removedByYearRange,
        statusDistribution: finalStatusDist,
        yearDistribution,
        // Debug info
        totalRemoved,
        expectedValid,
        mathematicallyCorrect: expectedValid === validRows.length
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
