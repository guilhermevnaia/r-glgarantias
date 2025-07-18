"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateValidator = void 0;
class DateValidator {
    validateDate(rawDate) {
        // TESTAR TODOS OS FORMATOS POSSÍVEIS
        const formats = [
            'DD/MM/YYYY',
            'DD-MM-YYYY',
            'YYYY-MM-DD',
            'MM/DD/YYYY',
            // Excel pode vir como número (dias desde 1900)
            'excel-serial'
        ];
        for (const format of formats) {
            const parsed = this.tryParseDate(rawDate, format);
            if (parsed.isValid && parsed.date) {
                return {
                    isValid: true,
                    date: parsed.date,
                    originalValue: rawDate,
                    detectedFormat: format
                };
            }
        }
        return {
            isValid: false,
            date: null,
            originalValue: rawDate,
            error: `Cannot parse date: ${rawDate}`
        };
    }
    tryParseDate(value, format) {
        try {
            if (format === 'excel-serial' && typeof value === 'number') {
                // Excel armazena datas como números (dias desde 1900)
                const date = new Date((value - 25569) * 86400 * 1000);
                return { isValid: true, date };
            }
            if (typeof value === 'string') {
                // Tentar diferentes formatos de string
                let date = null;
                switch (format) {
                    case 'DD/MM/YYYY':
                        const ddmmyyyy = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
                        if (ddmmyyyy) {
                            date = new Date(parseInt(ddmmyyyy[3]), parseInt(ddmmyyyy[2]) - 1, parseInt(ddmmyyyy[1]));
                        }
                        break;
                    case 'DD-MM-YYYY':
                        const ddmmyyyy2 = value.match(/^(\d{1,2})-(\d{1,2})-(\d{4})/);
                        if (ddmmyyyy2) {
                            date = new Date(parseInt(ddmmyyyy2[3]), parseInt(ddmmyyyy2[2]) - 1, parseInt(ddmmyyyy2[1]));
                        }
                        break;
                    case 'YYYY-MM-DD':
                        const yyyymmdd = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
                        if (yyyymmdd) {
                            date = new Date(parseInt(yyyymmdd[1]), parseInt(yyyymmdd[2]) - 1, parseInt(yyyymmdd[3]));
                        }
                        break;
                    case 'MM/DD/YYYY':
                        const mmddyyyy = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
                        if (mmddyyyy) {
                            date = new Date(parseInt(mmddyyyy[3]), parseInt(mmddyyyy[1]) - 1, parseInt(mmddyyyy[2]));
                        }
                        break;
                }
                if (date && !isNaN(date.getTime())) {
                    return { isValid: true, date };
                }
            }
            // Tentar usar o construtor Date padrão como último recurso
            if (value instanceof Date) {
                return { isValid: true, date: value };
            }
            const fallbackDate = new Date(value);
            if (!isNaN(fallbackDate.getTime())) {
                return { isValid: true, date: fallbackDate };
            }
            return { isValid: false, error: `Unable to parse format ${format}` };
        }
        catch (error) {
            return { isValid: false, error: error.message };
        }
    }
    isDateAfter2019(date) {
        return date.getFullYear() >= 2019;
    }
}
exports.DateValidator = DateValidator;
