import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ServiceOrder {
  id: number;
  order_number: string;
  order_date: string;
  engine_manufacturer: string | null;
  engine_description: string | null;
  vehicle_model: string | null;
  raw_defect_description: string | null;
  original_defect_description?: string | null; // ✅ DEFEITO ORIGINAL COMO CHEGA DO EXCEL
  responsible_mechanic: string | null;
  parts_total: string | null;
  labor_total: string | null;
  grand_total: string | null;
  order_status: string;
}

interface FilterState {
  dateRange: {
    startDate: string;
    endDate: string;
    preset: string;
  };
  status: string[];
  mechanics: string[];
  models: string[];
  defectKeywords: string[];
}

export const exportToRichPDF = async (
  orders: ServiceOrder[],
  filters: FilterState
): Promise<void> => {
  try {
    const doc = new jsPDF();
    let currentY = 20;

    // ===== CABEÇALHO PROFISSIONAL COM LOGO =====
    doc.setFillColor(37, 99, 235); // Blue-600
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), 50, 'F');
    
    // Adicionar logo (convertido para base64)
    try {
      // Logo compacta para melhor qualidade no PDF
      const logoBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAAAoCAYAAAAIeF9DAAAACXBIWXMAAAsTAAALEwEAmpwYAAAF0WlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78i iglkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNy4yLWMwMDAgNzkuMWI2NWE3OWI0LCAyMDIyLzA2LzEzLTIyOjAxOjAxICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpypmY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjQuMCAoTWFjaW50b3NoKSIgeG1wOkNyZWF0ZURhdGU9IjIwMjUtMDEtMjBUMTQ6NDc6NDctMDM6MDAiIHhtcDpNZXRhZGF0YURhdGU9IjIwMjUtMDEtMjBUMTQ6NDc6NDctMDM6MDAiIHhtcDpNb2RpZnlEYXRlPSIyMDI1LTAxLTIwVDE0OjQ3OjQ3LTAzOjAwIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjY5ZDM4YmM1LTM4ZTAtNDI0Ny1hMzBkLTNmOWNiMzM3NzM0YyIgeG1wTU06RG9jdW1lbnRJRD0iYWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOjIyYzFkOTZiLTM5ZTAtYzQ0Ny1iMzE1LTJmOWNiMzM3NzM0YyIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOjY5ZDM4YmM1LTM4ZTAtNDI0Ny1hMzBkLTNmOWNiMzM3NzM0YyIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjY5ZDM4YmM1LTM4ZTAtNDI0Ny1hMzBkLTNmOWNiMzM3NzM0YyIgc3RFdnQ6d2hlbj0iMjAyNS0wMS0yMFQxNDo0Nzo0Ny0wMzowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDI0LjAgKE1hY2ludG9zaCkiLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+';
      
      // Adicionar logo no cabeçalho (posição à direita)
      const logoWidth = 40;
      const logoHeight = 30;
      const logoX = doc.internal.pageSize.getWidth() - logoWidth - 20;
      const logoY = 10;
      
      doc.addImage(logoBase64, 'PNG', logoX, logoY, logoWidth, logoHeight);
    } catch (error) {
          }
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('RELATÓRIO EXECUTIVO DE GARANTIAS', 20, 30);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Sistema GLú - Retífica de Motores', 20, 40);
    
    currentY = 70;

    // ===== INFORMAÇÕES DO RELATÓRIO =====
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMAÇÕES DO RELATÓRIO', 20, currentY);
    currentY += 15;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    // Período
    let periodText = '';
    switch (filters.dateRange.preset) {
      case 'thisMonth': periodText = 'Este Mês'; break;
      case 'lastMonth': periodText = 'Mês Anterior'; break;
      case 'thisQuarter': periodText = 'Este Trimestre'; break;
      case 'thisYear': periodText = 'Este Ano'; break;
      case 'lastYear': periodText = 'Ano Anterior'; break;
      case 'all': periodText = 'Todos os Períodos'; break;
      default: periodText = 'Período Personalizado';
    }
    
    doc.text(`Período: ${periodText}`, 20, currentY);
    doc.text(`Data de Geração: ${new Date().toLocaleDateString('pt-BR')}`, 20, currentY + 10);
    doc.text(`Hora de Geração: ${new Date().toLocaleTimeString('pt-BR')}`, 20, currentY + 20);
    
    currentY += 35;

    // ===== RESUMO EXECUTIVO =====
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMO EXECUTIVO', 20, currentY);
    currentY += 20;

    // Calcular métricas
    const totalOrders = orders.length;
    const totalValue = orders.reduce((sum, order) => sum + (parseFloat(order.grand_total) || 0), 0);
    const avgValue = totalOrders > 0 ? totalValue / totalOrders : 0;
    
    const statusDistribution = orders.reduce((acc, order) => {
      acc[order.order_status] = (acc[order.order_status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const manufacturerDistribution = orders.reduce((acc, order) => {
      const mfg = order.engine_manufacturer || 'N/A';
      acc[mfg] = (acc[mfg] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

         // Métricas principais com boxes visuais
     doc.setFontSize(12);
     doc.setFont('helvetica', 'bold');
     doc.text('Métricas Principais:', 20, currentY);
     currentY += 20;

     // Box para Total de OS
     doc.setFillColor(37, 99, 235); // Blue-600
     doc.rect(25, currentY - 5, 60, 25, 'F');
     doc.setTextColor(255, 255, 255);
     doc.setFontSize(10);
     doc.text('Total OS', 30, currentY + 5);
     doc.setFontSize(14);
     doc.setFont('helvetica', 'bold');
     doc.text(totalOrders.toLocaleString('pt-BR'), 30, currentY + 18);
     
     // Box para Valor Total
     doc.setFillColor(255, 59, 48); // Vermelho
     doc.rect(95, currentY - 5, 70, 25, 'F');
     doc.setTextColor(255, 255, 255);
     doc.setFontSize(10);
     doc.text('Valor Total', 100, currentY + 5);
     doc.setFontSize(12);
     doc.setFont('helvetica', 'bold');
     const valueText = totalValue >= 1000000 ? 
       `R$ ${(totalValue / 1000000).toFixed(1)}M` : 
       `R$ ${(totalValue / 1000).toFixed(0)}k`;
     doc.text(valueText, 100, currentY + 18);
     
     // Box para Valor Médio
     doc.setFillColor(255, 149, 0); // Laranja
     doc.rect(175, currentY - 5, 70, 25, 'F');
     doc.setTextColor(255, 255, 255);
     doc.setFontSize(10);
     doc.text('Média/OS', 180, currentY + 5);
     doc.setFontSize(12);
     doc.setFont('helvetica', 'bold');
     const avgText = avgValue >= 1000 ? 
       `R$ ${(avgValue / 1000).toFixed(0)}k` : 
       `R$ ${avgValue.toFixed(0)}`;
     doc.text(avgText, 180, currentY + 18);
     
          currentY += 35;

     // ===== SEPARADOR VISUAL =====
     doc.setDrawColor(37, 99, 235); // Blue-600
     doc.setLineWidth(2);
     doc.line(20, currentY, doc.internal.pageSize.getWidth() - 20, currentY);
     currentY += 20;

     // ===== DISTRIBUIÇÃO POR STATUS =====
     doc.setFontSize(14);
     doc.setFont('helvetica', 'bold');
     doc.text('DISTRIBUIÇÃO POR STATUS DE GARANTIA', 20, currentY);
     currentY += 15;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
         Object.entries(statusDistribution).forEach(([status, count]) => {
       const percentage = (count / totalOrders * 100).toFixed(1);
       const statusText = status === 'G' ? 'Garantia' : 
                         status === 'GO' ? 'Garantia Oficina' : 
                         status === 'GU' ? 'Garantia Usinagem' : 'Status Desconhecido';
       
       doc.text(`• ${status} - ${statusText}: ${count} (${percentage}%)`, 25, currentY);
       currentY += 10;
     });

         currentY += 10;

     // ===== GRÁFICO DE PIZZA - STATUS DE GARANTIA =====
     doc.setFontSize(14);
     doc.setFont('helvetica', 'bold');
     doc.text('GRÁFICO - DISTRIBUIÇÃO POR STATUS', 20, currentY);
     currentY += 20;

     // Criar gráfico de pizza visual
     const pieChartX = 30;
     const pieChartY = currentY;
     const pieChartRadius = 25;
     
     // Cores para cada status
     const statusColors = {
       'G': [255, 59, 48],    // Vermelho
       'GO': [255, 149, 0],   // Laranja
       'GU': [255, 204, 0]    // Amarelo
     };
     
     let currentAngle = 0;
     Object.entries(statusDistribution).forEach(([status, count]) => {
       const percentage = count / totalOrders;
       const angle = percentage * 2 * Math.PI;
       
       if (percentage > 0) {
         const color = statusColors[status as keyof typeof statusColors] || [100, 100, 100];
         doc.setFillColor(color[0], color[1], color[2]);
         
         // Desenhar fatia do gráfico
         doc.ellipse(pieChartX, pieChartY, pieChartRadius, pieChartRadius, 'F', currentAngle, currentAngle + angle);
         
         // Adicionar legenda
         const legendX = pieChartX + pieChartRadius + 40;
         const legendY = currentY + (currentAngle * pieChartRadius);
         
         doc.setFillColor(color[0], color[1], color[2]);
         doc.circle(legendX, legendY, 3, 'F');
         
         doc.setTextColor(0, 0, 0);
         doc.setFontSize(10);
         const statusText = status === 'G' ? 'Garantia' : 
                           status === 'GO' ? 'Garantia Oficina' : 
                           status === 'GU' ? 'Garantia Usinagem' : 'Status Desconhecido';
         doc.text(`${status} - ${statusText}: ${count} (${(percentage * 100).toFixed(1)}%)`, legendX + 8, legendY + 2);
         
         currentAngle += angle;
       }
     });
     
     currentY += 80;

     // ===== SEPARADOR VISUAL =====
     doc.setDrawColor(37, 99, 235); // Blue-600
     doc.setLineWidth(2);
     doc.line(20, currentY, doc.internal.pageSize.getWidth() - 20, currentY);
     currentY += 20;

     // ===== GRÁFICO DE BARRAS - TOP FABRICANTES =====
     doc.setFontSize(14);
     doc.setFont('helvetica', 'bold');
     doc.text('GRÁFICO - TOP FABRICANTES', 20, currentY);
     currentY += 20;

     // Criar gráfico de barras horizontal
     const barChartX = 30;
     const barChartY = currentY;
     const barChartWidth = 120;
     const barHeight = 8;
     const barSpacing = 12;
     
     const topManufacturers = Object.entries(manufacturerDistribution)
       .sort(([,a], [,b]) => b - a)
       .slice(0, 5);
     
     const maxCount = Math.max(...topManufacturers.map(([,count]) => count));
     
     topManufacturers.forEach(([manufacturer, count], index) => {
       const barY = barChartY + (index * barSpacing);
       const barLength = (count / maxCount) * barChartWidth;
       
       // Desenhar barra
       doc.setFillColor(37, 99, 235); // Blue-600
       doc.rect(barChartX, barY, barLength, barHeight, 'F');
       
       // Adicionar texto
       doc.setTextColor(0, 0, 0);
       doc.setFontSize(9);
       doc.text(manufacturer, barChartX + barLength + 5, barY + 6);
       doc.text(`${count} (${(count / totalOrders * 100).toFixed(1)}%)`, barChartX + barLength + 5, barY + 15);
     });
     
          currentY += (topManufacturers.length * barSpacing) + 20;

     // ===== SEPARADOR VISUAL =====
     doc.setDrawColor(37, 99, 235); // Blue-600
     doc.setLineWidth(2);
     doc.line(20, currentY, doc.internal.pageSize.getWidth() - 20, currentY);
     currentY += 20;

     // ===== ANÁLISE FINANCEIRA =====
     doc.setFontSize(14);
     doc.setFont('helvetica', 'bold');
     doc.text('ANÁLISE FINANCEIRA DETALHADA', 20, currentY);
     currentY += 15;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    // Calcular totais por categoria
    const totalParts = orders.reduce((sum, order) => sum + (parseFloat(order.parts_total) || 0), 0);
    const totalLabor = orders.reduce((sum, order) => sum + (parseFloat(order.labor_total) || 0), 0);
    
    doc.text(`• Total em Peças: R$ ${totalParts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 25, currentY);
    doc.text(`• Total em Mão de Obra: R$ ${totalLabor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 25, currentY + 10);
    doc.text(`• Total Geral: R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 25, currentY + 20);
    
         // Calcular médias
     const avgParts = totalOrders > 0 ? totalParts / totalOrders : 0;
     const avgLabor = totalOrders > 0 ? totalLabor / totalOrders : 0;
     
     doc.text(`• Média por Peças: R$ ${avgParts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 25, currentY + 30);
     doc.text(`• Média por Mão de Obra: R$ ${avgLabor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 25, currentY + 40);
     
     currentY += 60;

     // ===== GRÁFICO DE BARRAS - ANÁLISE FINANCEIRA =====
     doc.setFontSize(14);
     doc.setFont('helvetica', 'bold');
     doc.text('GRÁFICO - DISTRIBUIÇÃO FINANCEIRA', 20, currentY);
     currentY += 20;

     // Criar gráfico de barras vertical para valores financeiros
     const financeChartX = 30;
     const financeChartY = currentY;
     const financeChartWidth = 120;
     const financeChartHeight = 50;
     const barWidth = 25;
     
     // Desenhar eixos
     doc.setDrawColor(100, 100, 100);
     doc.setLineWidth(0.5);
     doc.line(financeChartX, financeChartY, financeChartX + financeChartWidth, financeChartY); // Eixo X
     doc.line(financeChartX, financeChartY, financeChartX, financeChartY - financeChartHeight); // Eixo Y
     
     // Desenhar linhas de grade
     doc.setDrawColor(200, 200, 200);
     doc.setLineWidth(0.2);
     for (let i = 1; i <= 4; i++) {
       const gridY = financeChartY - (i * financeChartHeight / 4);
       doc.line(financeChartX, gridY, financeChartX + financeChartWidth, gridY);
     }
     
     // Dados financeiros
     const financeData = [
       { label: 'Peças', value: totalParts, color: [255, 59, 48] },      // Vermelho
       { label: 'M.O.', value: totalLabor, color: [255, 149, 0] },       // Laranja
       { label: 'Total', value: totalValue, color: [37, 99, 235] }       // Azul
     ];
     
     const maxFinanceValue = Math.max(...financeData.map(d => d.value));
     
     financeData.forEach((item, index) => {
       const barX = financeChartX + (index * (financeChartWidth / 3)) + 10;
       const barHeight = (item.value / maxFinanceValue) * financeChartHeight;
       
       // Desenhar barra
       doc.setFillColor(item.color[0], item.color[1], item.color[2]);
       doc.rect(barX, financeChartY - barHeight, barWidth, barHeight, 'F');
       
       // Adicionar rótulo
       doc.setTextColor(0, 0, 0);
       doc.setFontSize(8);
       doc.text(item.label, barX + 5, financeChartY + 5);
       
       // Adicionar valor
       doc.setFontSize(7);
       const valueText = item.value >= 1000000 ? 
         `R$ ${(item.value / 1000000).toFixed(1)}M` : 
         `R$ ${(item.value / 1000).toFixed(0)}k`;
       doc.text(valueText, barX + 2, financeChartY - barHeight - 5);
     });
     
          currentY += 90;

     // ===== SEPARADOR VISUAL =====
     doc.setDrawColor(37, 99, 235); // Blue-600
     doc.setLineWidth(2);
     doc.line(20, currentY, doc.internal.pageSize.getWidth() - 20, currentY);
     currentY += 20;

     // ===== ANÁLISE TEMPORAL =====
     doc.setFontSize(14);
     doc.setFont('helvetica', 'bold');
     doc.text('ANÁLISE TEMPORAL', 20, currentY);
     currentY += 15;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    // Agrupar por mês
    const monthlyData = orders.reduce((acc, order) => {
      const date = new Date(order.order_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!acc[monthKey]) {
        acc[monthKey] = { count: 0, value: 0 };
      }
      
      acc[monthKey].count++;
      acc[monthKey].value += parseFloat(order.grand_total) || 0;
      
      return acc;
    }, {} as Record<string, { count: number; value: number }>);

         // Top 6 meses para gráfico
     const topMonths = Object.entries(monthlyData)
       .sort(([,a], [,b]) => b.value - a.value)
       .slice(0, 6);
     
     currentY += 20;

     // ===== GRÁFICO DE LINHA - ANÁLISE TEMPORAL =====
     doc.setFontSize(14);
     doc.setFont('helvetica', 'bold');
     doc.text('GRÁFICO - EVOLUÇÃO TEMPORAL (TOP 6 MESES)', 20, currentY);
     currentY += 20;

     // Criar gráfico de linha
     const lineChartX = 30;
     const lineChartY = currentY;
     const lineChartWidth = 140;
     const lineChartHeight = 60;
     
     // Desenhar eixos
     doc.setDrawColor(100, 100, 100);
     doc.setLineWidth(0.5);
     doc.line(lineChartX, lineChartY, lineChartX + lineChartWidth, lineChartY); // Eixo X
     doc.line(lineChartX, lineChartY, lineChartX, lineChartY - lineChartHeight); // Eixo Y
     
     // Desenhar linhas de grade
     doc.setDrawColor(200, 200, 200);
     doc.setLineWidth(0.2);
     for (let i = 1; i <= 4; i++) {
       const gridY = lineChartY - (i * lineChartHeight / 4);
       doc.line(lineChartX, gridY, lineChartX + lineChartWidth, gridY);
     }
     
     // Desenhar linha do gráfico
     doc.setDrawColor(37, 99, 235); // Blue-600
     doc.setLineWidth(2);
     
     const maxValue = Math.max(...topMonths.map(([,data]) => data.value));
     const points: [number, number][] = [];
     
     topMonths.forEach(([month, data], index) => {
       const [year, monthNum] = month.split('-');
       const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
       const monthName = monthNames[parseInt(monthNum) - 1];
       
       const x = lineChartX + (index / (topMonths.length - 1)) * lineChartWidth;
       const y = lineChartY - (data.value / maxValue) * lineChartHeight;
       
       points.push([x, y]);
       
       // Adicionar ponto no gráfico
       doc.setFillColor(37, 99, 235);
       doc.circle(x, y, 3, 'F');
       
       // Adicionar rótulo do mês
       doc.setTextColor(0, 0, 0);
       doc.setFontSize(8);
       doc.text(monthName, x - 10, lineChartY + 5);
     });
     
     // Conectar pontos com linhas
     for (let i = 1; i < points.length; i++) {
       doc.line(points[i-1][0], points[i-1][1], points[i][0], points[i][1]);
     }
     
     // Adicionar valores dos meses
     doc.setFontSize(9);
     doc.setTextColor(100, 100, 100);
     topMonths.forEach(([month, data], index) => {
       const [year, monthNum] = month.split('-');
       const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
       const monthName = monthNames[parseInt(monthNum) - 1];
       
       doc.text(`${monthName}/${year}: ${data.count} OS - R$ ${data.value.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`, 25, currentY);
       currentY += 10;
     });
     
     currentY += 20;

    // ===== RODAPÉ PROFISSIONAL =====
    const pageCount = doc.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      const pageHeight = doc.internal.pageSize.getHeight();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Linha decorativa
      doc.setDrawColor(37, 99, 235); // Blue-600
      doc.setLineWidth(0.5);
      doc.line(20, pageHeight - 40, pageWidth - 20, pageHeight - 40);
      
      // Informações do rodapé
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      doc.text(`Sistema de Garantias GLú - Retífica de Motores`, 20, pageHeight - 30);
      doc.text(`Relatório gerado automaticamente`, 20, pageHeight - 20);
      doc.text(`Página ${i} de ${pageCount}`, pageWidth - 50, pageHeight - 20);
      
      // Logo ou marca d'água
      doc.setFontSize(8);
      doc.setTextColor(200, 200, 200);
      doc.text('GLú Garantias', pageWidth - 30, pageHeight - 10);
    }

    // ===== SALVAR ARQUIVO =====
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `relatorio-garantias-profissional-${timestamp}.pdf`;
    doc.save(filename);
    
    return Promise.resolve();
  } catch (error) {
    console.error('Erro ao gerar PDF rico:', error);
    throw error;
  }
};
