/**
 * SISTEMA DE VALIDAÇÃO EMPRESARIAL ROBUSTO
 * 
 * Substitui o DateValidator frágil por um sistema enterprise-grade
 * que valida TODOS os aspectos dos dados antes de inserir no banco.
 */

interface ValidationResult {
  isValid: boolean;
  normalizedValue: any;
  originalValue: any;
  errors: string[];
  warnings: string[];
  confidence: 'high' | 'medium' | 'low';
}

interface DataValidationReport {
  totalRecords: number;
  validRecords: number;
  rejectedRecords: number;
  warnings: number;
  rejectionReasons: Record<string, number>;
  sampleRejected: Array<{
    rowIndex: number;
    originalData: any;
    errors: string[];
  }>;
}

class EnterpriseDataValidator {
  private readonly CURRENT_YEAR = new Date().getFullYear();
  private readonly CURRENT_MONTH = new Date().getMonth() + 1;
  private readonly MIN_BUSINESS_YEAR = 2000;
  private readonly MAX_FUTURE_MONTHS = 1; // Máximo 1 mês no futuro
  
  private validationReport: DataValidationReport = {
    totalRecords: 0,
    validRecords: 0,
    rejectedRecords: 0,
    warnings: 0,
    rejectionReasons: {},
    sampleRejected: []
  };

  /**
   * VALIDAÇÃO ROBUSTA DE DATAS
   */
  validateDate(rawDate: any, rowIndex: number): ValidationResult {
    const result: ValidationResult = {
      isValid: false,
      normalizedValue: null,
      originalValue: rawDate,
      errors: [],
      warnings: [],
      confidence: 'low'
    };

    // 1. VALIDAÇÃO BÁSICA
    if (!rawDate || rawDate === '' || rawDate === null || rawDate === undefined) {
      result.errors.push('Data vazia ou nula');
      return result;
    }

    // 2. CONVERSÃO SEGURA
    let parsedDate: Date | null = null;
    
    try {
      parsedDate = this.safeDateParse(rawDate);
    } catch (error) {
      result.errors.push(`Erro no parsing: ${(error as Error).message}`);
      return result;
    }

    if (!parsedDate || isNaN(parsedDate.getTime())) {
      result.errors.push('Data inválida após conversão');
      return result;
    }

    // 3. VALIDAÇÕES DE SANIDADE EMPRESARIAL
    const year = parsedDate.getFullYear();
    const month = parsedDate.getMonth() + 1;
    const day = parsedDate.getDate();

    // Validar ano
    if (year < this.MIN_BUSINESS_YEAR) {
      result.errors.push(`Ano muito antigo: ${year} (mínimo: ${this.MIN_BUSINESS_YEAR})`);
      return result;
    }

    if (year > this.CURRENT_YEAR + 1) {
      result.errors.push(`Ano muito futuro: ${year} (máximo: ${this.CURRENT_YEAR + 1})`);
      return result;
    }

    // Validar datas futuras impossíveis
    if (year === this.CURRENT_YEAR && month > this.CURRENT_MONTH + this.MAX_FUTURE_MONTHS) {
      result.errors.push(`Data futura impossível: ${month}/${year} (mês atual: ${this.CURRENT_MONTH})`);
      return result;
    }

    // Validar dia do mês
    if (day < 1 || day > 31) {
      result.errors.push(`Dia inválido: ${day}`);
      return result;
    }

    // Validar mês
    if (month < 1 || month > 12) {
      result.errors.push(`Mês inválido: ${month}`);
      return result;
    }

    // 4. WARNINGS PARA DADOS SUSPEITOS
    if (year === this.CURRENT_YEAR && month > this.CURRENT_MONTH) {
      result.warnings.push(`Data futura: ${month}/${year} - verifique se está correto`);
      result.confidence = 'medium';
    } else if (year < 2019) {
      result.warnings.push(`Data muito antiga: ${year} - pode estar fora do escopo de negócio`);
      result.confidence = 'medium';
    } else {
      result.confidence = 'high';
    }

    // 5. SUCESSO
    result.isValid = true;
    result.normalizedValue = parsedDate;
    
    return result;
  }

  /**
   * PARSING SEGURO DE DATAS COM MÚLTIPLOS FORMATOS
   */
  private safeDateParse(rawDate: any): Date {
    // Número (Excel serial)
    if (typeof rawDate === 'number') {
      return this.parseExcelSerial(rawDate);
    }

    // String
    if (typeof rawDate === 'string') {
      return this.parseStringDate(rawDate.trim());
    }

    // Date object
    if (rawDate instanceof Date) {
      return rawDate;
    }

    throw new Error(`Tipo de data não suportado: ${typeof rawDate}`);
  }

  /**
   * PARSING DE SERIAL EXCEL ROBUSTO
   */
  private parseExcelSerial(serial: number): Date {
    if (serial < 1 || serial > 50000) {
      throw new Error(`Serial Excel inválido: ${serial}`);
    }

    const date = new Date((serial - 25569) * 86400 * 1000);
    
    if (isNaN(date.getTime())) {
      throw new Error(`Serial Excel resultou em data inválida: ${serial}`);
    }

    return date;
  }

  /**
   * PARSING DE STRING COM MÚLTIPLOS FORMATOS
   */
  private parseStringDate(dateStr: string): Date {
    // Remover horários se houver
    const cleanDate = dateStr.split(' ')[0];

    // Tentar formatos comuns
    const formats = [
      this.tryDDMMYYYY.bind(this),
      this.tryMMDDYYYY.bind(this),
      this.tryYYYYMMDD.bind(this),
      this.tryDDMMYY.bind(this),
      this.tryMMDDYY.bind(this)
    ];

    for (const formatter of formats) {
      try {
        const result = formatter(cleanDate);
        if (result) return result;
      } catch (error) {
        // Continuar tentando outros formatos
      }
    }

    throw new Error(`Formato de data não reconhecido: ${dateStr}`);
  }

  /**
   * FORMATO DD/MM/YYYY ou DD-MM-YYYY
   */
  private tryDDMMYYYY(dateStr: string): Date | null {
    const match = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (!match) return null;

    const day = parseInt(match[1]);
    const month = parseInt(match[2]);
    const year = parseInt(match[3]);

    return new Date(year, month - 1, day);
  }

  /**
   * FORMATO MM/DD/YYYY ou MM-DD-YYYY
   */
  private tryMMDDYYYY(dateStr: string): Date | null {
    const match = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (!match) return null;

    const month = parseInt(match[1]);
    const day = parseInt(match[2]);
    const year = parseInt(match[3]);

    // Validar se faz sentido como MM/DD
    if (month > 12 || day > 31) return null;

    return new Date(year, month - 1, day);
  }

  /**
   * FORMATO YYYY-MM-DD
   */
  private tryYYYYMMDD(dateStr: string): Date | null {
    const match = dateStr.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
    if (!match) return null;

    const year = parseInt(match[1]);
    const month = parseInt(match[2]);
    const day = parseInt(match[3]);

    return new Date(year, month - 1, day);
  }

  /**
   * FORMATO DD/MM/YY com LÓGICA EMPRESARIAL INTELIGENTE
   */
  private tryDDMMYY(dateStr: string): Date | null {
    const match = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/);
    if (!match) return null;

    const day = parseInt(match[1]);
    const month = parseInt(match[2]);
    let year = parseInt(match[3]);

    // LÓGICA EMPRESARIAL INTELIGENTE PARA ANOS DE 2 DÍGITOS
    const currentYear2Digit = this.CURRENT_YEAR % 100;
    
    if (year <= currentYear2Digit + 5) {
      // 00-30 = 2000-2030 (assumir futuro próximo)
      year = 2000 + year;
    } else {
      // 31-99 = 1931-1999 (assumir passado)
      year = 1900 + year;
    }

    return new Date(year, month - 1, day);
  }

  /**
   * FORMATO MM/DD/YY
   */
  private tryMMDDYY(dateStr: string): Date | null {
    const match = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/);
    if (!match) return null;

    const month = parseInt(match[1]);
    const day = parseInt(match[2]);
    let year = parseInt(match[3]);

    // Validar se faz sentido como MM/DD
    if (month > 12 || day > 31) return null;

    // Mesma lógica de ano
    const currentYear2Digit = this.CURRENT_YEAR % 100;
    
    if (year <= currentYear2Digit + 5) {
      year = 2000 + year;
    } else {
      year = 1900 + year;
    }

    return new Date(year, month - 1, day);
  }

  /**
   * VALIDAÇÃO DE STATUS
   */
  validateStatus(rawStatus: any): ValidationResult {
    const result: ValidationResult = {
      isValid: false,
      normalizedValue: null,
      originalValue: rawStatus,
      errors: [],
      warnings: [],
      confidence: 'high'
    };

    if (!rawStatus || rawStatus === '' || rawStatus === null) {
      result.errors.push('Status vazio ou nulo');
      return result;
    }

    const status = String(rawStatus).trim().toUpperCase();
    const validStatuses = ['G', 'GO', 'GU'];

    if (!validStatuses.includes(status)) {
      result.errors.push(`Status inválido: "${status}". Valores válidos: ${validStatuses.join(', ')}`);
      return result;
    }

    result.isValid = true;
    result.normalizedValue = status;
    return result;
  }

  /**
   * VALIDAÇÃO DE CAMPOS OBRIGATÓRIOS
   */
  validateRequiredField(value: any, fieldName: string): ValidationResult {
    const result: ValidationResult = {
      isValid: false,
      normalizedValue: null,
      originalValue: value,
      errors: [],
      warnings: [],
      confidence: 'high'
    };

    if (!value || value === '' || value === null || value === undefined) {
      result.errors.push(`Campo obrigatório "${fieldName}" está vazio`);
      return result;
    }

    const normalized = String(value).trim();
    if (normalized === '') {
      result.errors.push(`Campo obrigatório "${fieldName}" contém apenas espaços`);
      return result;
    }

    result.isValid = true;
    result.normalizedValue = normalized;
    return result;
  }

  /**
   * GERAR RELATÓRIO DE VALIDAÇÃO
   */
  generateValidationReport(): DataValidationReport {
    return { ...this.validationReport };
  }

  /**
   * RESETAR RELATÓRIO
   */
  resetValidationReport(): void {
    this.validationReport = {
      totalRecords: 0,
      validRecords: 0,
      rejectedRecords: 0,
      warnings: 0,
      rejectionReasons: {},
      sampleRejected: []
    };
  }

  /**
   * REGISTRAR REJEIÇÃO
   */
  private recordRejection(rowIndex: number, originalData: any, errors: string[]): void {
    this.validationReport.rejectedRecords++;
    
    errors.forEach(error => {
      this.validationReport.rejectionReasons[error] = 
        (this.validationReport.rejectionReasons[error] || 0) + 1;
    });

    // Manter amostra das primeiras 20 rejeições
    if (this.validationReport.sampleRejected.length < 20) {
      this.validationReport.sampleRejected.push({
        rowIndex,
        originalData,
        errors
      });
    }
  }
}

export { EnterpriseDataValidator, ValidationResult, DataValidationReport };