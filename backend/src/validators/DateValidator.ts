interface DateValidationResult {
  isValid: boolean;
  date: Date | null;
  originalValue: any;
  detectedFormat?: string;
  error?: string;
}

interface ParseResult {
  isValid: boolean;
  date?: Date;
  error?: string;
}

class DateValidator {
  private debugCount = 0;
  
  validateDate(rawDate: any): DateValidationResult {
    // Logs apenas para debug das primeiras validações
    if (this.debugCount < 5) {
      console.log(`🔍 Validating date: ${rawDate} (type: ${typeof rawDate})`);
      this.debugCount++;
    }
    
    // TESTAR FORMATO EXCEL PRIMEIRO se for número
    if (typeof rawDate === 'number') {
      const formats = ['excel-serial'];
      for (const format of formats) {
        const parsed = this.tryParseDate(rawDate, format);
        if (parsed.isValid && parsed.date) {
          if (this.debugCount <= 5) {
            console.log(`✅ Parsed as ${format}: ${parsed.date.toISOString().split('T')[0]}`);
          }
          return {
            isValid: true,
            date: parsed.date,
            originalValue: rawDate,
            detectedFormat: format
          };
        }
      }
    }
    // NOVO: Tentar converter string numérica como serial Excel
    if (typeof rawDate === 'string' && /^\d+$/.test(rawDate)) {
      const serial = parseInt(rawDate, 10);
      const parsed = this.tryParseDate(serial, 'excel-serial');
      if (parsed.isValid && parsed.date) {
        if (this.debugCount <= 5) {
          console.log(`✅ Parsed as excel-serial (from string): ${parsed.date.toISOString().split('T')[0]}`);
        }
        return {
          isValid: true,
          date: parsed.date,
          originalValue: rawDate,
          detectedFormat: 'excel-serial-string'
        };
      }
    }

    // TESTAR FORMATOS STRING se for string
    if (typeof rawDate === 'string') {
      const formats = [
        'DD/MM/YYYY',
        'DD-MM-YYYY',
        'YYYY-MM-DD',
        'MM/DD/YYYY',
        'YYYY/MM/DD',
        'YYYYMMDD',
        'DDMMYYYY',
        'DD MMMM YYYY', // mês por extenso em português
      ];
      
      for (const format of formats) {
        const parsed = this.tryParseDate(rawDate, format);
        if (parsed.isValid && parsed.date) {
          if (this.debugCount <= 5) {
            console.log(`✅ Parsed as ${format}: ${parsed.date.toISOString().split('T')[0]}`);
          }
          return {
            isValid: true,
            date: parsed.date,
            originalValue: rawDate,
            detectedFormat: format
          };
        }
      }
    }

    // NOVO: Aceitar objetos Date diretamente
    if (rawDate instanceof Date && !isNaN(rawDate.getTime())) {
      if (this.debugCount <= 5) {
        console.log(`✅ Parsed as Date object: ${rawDate.toISOString().split('T')[0]}`);
      }
      return {
        isValid: true,
        date: rawDate,
        originalValue: rawDate,
        detectedFormat: 'Date-object'
      };
    }

    if (this.debugCount <= 5) {
      console.log(`❌ Failed to parse date: ${rawDate}`);
    }
    return {
      isValid: false,
      date: null,
      originalValue: rawDate,
      error: `Cannot parse date: ${rawDate}`
    };
  }

  private tryParseDate(value: any, format: string): ParseResult {
    try {
      if (format === 'excel-serial' && typeof value === 'number') {
        // CONVERSÃO UNIVERSAL DE DATAS EXCEL
        // Fórmula correta: (excel_value - 25569) * 86400 * 1000
        
        if (value < 30000) { // Datas antes de ~1982 são improváveis
          return { isValid: false, error: `Invalid Excel serial date: ${value} (must be a plausible number)` };
        }
        
        const date = new Date((value - 25569) * 86400 * 1000);
        
        // Verificar se a data é válida e plausível
        if (!isNaN(date.getTime()) && date.getFullYear() >= 1980) {
          if (this.debugCount <= 5) {
            console.log(`📅 Excel serial ${value} -> ${date.toISOString().split('T')[0]}`);
          }
          return { isValid: true, date };
        }
        
        return { isValid: false, error: `Invalid or implausible Excel serial date: ${value}` };
      }

      if (typeof value === 'string') {
        let date: Date | null = null;

        switch (format) {
          case 'DD/MM/YYYY':
            // Aceita datas com ano completo ou abreviado: 'DD/MM/YYYY' ou 'DD/MM/YY'
            const ddmmyyyy = value.match(/^\s*(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:\s+[\d:]+)?/);
            if (ddmmyyyy) {
              let year = parseInt(ddmmyyyy[3]);
              // Se ano tem 2 dígitos, assumir século baseado no contexto do negócio
              if (year < 100) {
                // Para datas de OS: anos 00-23 = 2000-2023, anos 24-99 = 1924-1999
                year = year <= 23 ? 2000 + year : 1900 + year;
              }
              date = new Date(year, parseInt(ddmmyyyy[2]) - 1, parseInt(ddmmyyyy[1]));
            }
            break;
          case 'DD-MM-YYYY':
            // Aceita também datas com hora: 'DD-MM-YYYY HH:mm:ss'
            const ddmmyyyy2 = value.match(/^\s*(\d{1,2})-(\d{1,2})-(\d{4})(?:\s{1,}\d{2}:\d{2}:\d{2})?/);
            if (ddmmyyyy2) {
              date = new Date(parseInt(ddmmyyyy2[3]), parseInt(ddmmyyyy2[2]) - 1, parseInt(ddmmyyyy2[1]));
            }
            break;
          case 'YYYY-MM-DD':
            // Aceita também datas com hora: 'YYYY-MM-DD HH:mm:ss'
            const yyyymmdd = value.match(/^\s*(\d{4})-(\d{1,2})-(\d{1,2})(?:\s{1,}\d{2}:\d{2}:\d{2})?/);
            if (yyyymmdd) {
              date = new Date(parseInt(yyyymmdd[1]), parseInt(yyyymmdd[2]) - 1, parseInt(yyyymmdd[3]));
            }
            break;
          case 'MM/DD/YYYY':
            // Aceita datas com ano completo ou abreviado: 'MM/DD/YYYY' ou 'MM/DD/YY'
            const mmddyyyy = value.match(/^\s*(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:\s+[\d:]+)?/);
            if (mmddyyyy) {
              let year = parseInt(mmddyyyy[3]);
              // Se ano tem 2 dígitos, assumir século baseado no contexto do negócio
              if (year < 100) {
                // Para datas de OS: anos 00-23 = 2000-2023, anos 24-99 = 1924-1999
                year = year <= 23 ? 2000 + year : 1900 + year;
              }
              date = new Date(year, parseInt(mmddyyyy[1]) - 1, parseInt(mmddyyyy[2]));
            }
            break;
          case 'YYYY/MM/DD':
            const yyyyslashmmdd = value.match(/^\s*(\d{4})\/(\d{1,2})\/(\d{1,2})(?:\s{1,}\d{2}:\d{2}:\d{2})?/);
            if (yyyyslashmmdd) {
              date = new Date(parseInt(yyyyslashmmdd[1]), parseInt(yyyyslashmmdd[2]) - 1, parseInt(yyyyslashmmdd[3]));
            }
            break;
          case 'YYYYMMDD':
            const yyyymmddplain = value.match(/^(\d{4})(\d{2})(\d{2})$/);
            if (yyyymmddplain) {
              date = new Date(parseInt(yyyymmddplain[1]), parseInt(yyyymmddplain[2]) - 1, parseInt(yyyymmddplain[3]));
            }
            break;
          case 'DDMMYYYY':
            const ddmmyyyyplain = value.match(/^(\d{2})(\d{2})(\d{4})$/);
            if (ddmmyyyyplain) {
              date = new Date(parseInt(ddmmyyyyplain[3]), parseInt(ddmmyyyyplain[2]) - 1, parseInt(ddmmyyyyplain[1]));
            }
            break;
          case 'DD MMMM YYYY':
            // Aceita datas como '15 fevereiro 2007' (mês por extenso em português)
            const ddmmmmyyyy = value.match(/^\s*(\d{1,2})\s+([a-zçãéíóúâêôûàèìòù]+)\s+(\d{4})/i);
            if (ddmmmmyyyy) {
              const meses = [
                'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
                'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
              ];
              const mesIndex = meses.findIndex(m => m === ddmmmmyyyy[2].toLowerCase());
              if (mesIndex !== -1) {
                date = new Date(parseInt(ddmmmmyyyy[3]), mesIndex, parseInt(ddmmmmyyyy[1]));
              }
            }
            break;
        }

        if (date && !isNaN(date.getTime())) {
          return { isValid: true, date };
        }
      }

      // Tentar usar o construtor Date padrão apenas se for Date object
      if (value instanceof Date) {
        return { isValid: true, date: value };
      }

      return { isValid: false, error: `Unable to parse format ${format}` };

    } catch (error) {
      return { isValid: false, error: (error as Error).message };
    }
  }

  isDateAfter2019(date: Date): boolean {
    return date.getFullYear() >= 2019;
  }
}

export { DateValidator, DateValidationResult };

