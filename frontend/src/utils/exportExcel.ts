import * as XLSX from 'xlsx';

export interface ExportData {
  [key: string]: any;
}

export const exportToExcel = (data: ExportData[], filename: string, sheetName: string = 'Dados') => {
  try {
    // Criar workbook
    const workbook = XLSX.utils.book_new();
    
    // Criar worksheet com os dados
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Configurar largura das colunas automaticamente
    const colWidths = Object.keys(data[0] || {}).map(key => ({
      wch: Math.max(
        key.length,
        ...data.map(row => String(row[key] || '').length)
      )
    }));
    worksheet['!cols'] = colWidths;
    
    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // Salvar arquivo
    const fileName = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    
    return true;
  } catch (error) {
    console.error('Erro ao exportar para Excel:', error);
    return false;
  }
};

export const formatServiceOrdersForExport = (orders: any[], classifications?: any[]) => {
  return orders.map(order => {
    // 🤖 Usar classificação da IA se disponível
    let defectDescription = order.raw_defect_description || '';
    if (classifications) {
      const classification = classifications.find(c => c.service_order_id === order.id);
      if (classification && classification.defect_categories) {
        defectDescription = classification.defect_categories.category_name;
      }
    }
    
    return {
      'Número OS': order.order_number || '',
      'Data': order.order_date ? new Date(order.order_date).toLocaleDateString('pt-BR') : '',
      'Mecânico': order.responsible_mechanic || '',
      'Fabricante': order.engine_manufacturer || '',
      'Modelo Motor': order.engine_description || '',
      'Modelo Veículo': order.vehicle_model || '',
      'Defeito': defectDescription,
      'Valor Peças': parseFloat(order.parts_total || 0),
      'Valor Serviços': parseFloat(order.labor_total || 0),
      'Valor Total': parseFloat(order.parts_total || 0) + parseFloat(order.labor_total || 0),
      'Status': order.order_status || '',
      'Data Processamento': order.processed_at ? new Date(order.processed_at).toLocaleDateString('pt-BR') : ''
    };
  });
};

export const formatMechanicsForExport = (mechanics: any[]) => {
  return mechanics.map(mechanic => ({
    'Mecânico': mechanic.name || '',
    'Total Garantias': mechanic.totalWarranties || 0,
    'Custo Total': parseFloat(mechanic.totalCost || 0),
    'Custo Médio': parseFloat(mechanic.avgCostPerWarranty || 0),
    'Tipos de Defeitos': mechanic.defectTypes?.length || 0,
    'Fabricantes': mechanic.manufacturers?.join(', ') || '',
    'Modelos': mechanic.models?.join(', ') || '',
    'Última Garantia': mechanic.lastWarranty ? new Date(mechanic.lastWarranty).toLocaleDateString('pt-BR') : ''
  }));
};