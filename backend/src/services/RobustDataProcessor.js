"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RobustDataProcessor = void 0;
const XLSX = __importStar(require("xlsx"));
const ExcelAnalyzer_1 = require("./ExcelAnalyzer");
const DateValidator_1 = require("../validators/DateValidator");
class RobustDataProcessor {
    processExcelData(buffer) {
        return __awaiter(this, void 0, void 0, function* () {
            const analyzer = new ExcelAnalyzer_1.ExcelAnalyzer();
            const dateValidator = new DateValidator_1.DateValidator();
            // 1. ANÁLISE INICIAL DETALHADA
            const analysis = analyzer.analyzeFile(buffer);
            console.log('📊 ANÁLISE INICIAL:', analysis);
            // 2. PROCESSAR LINHA POR LINHA
            const workbook = XLSX.read(buffer);
            const worksheet = workbook.Sheets['Tabela'];
            if (!worksheet) {
                throw new Error('A planilha deve conter uma aba chamada "Tabela"');
            }
            const allRows = XLSX.utils.sheet_to_json(worksheet);
            const processingLog = {
                totalRows: allRows.length,
                processedRows: 0,
                validRows: 0,
                errors: [],
                warnings: []
            };
            const validData = [];
            for (let i = 0; i < allRows.length; i++) {
                const row = allRows[i];
                const rowNumber = i + 2; // +2 porque Excel começa em 1 e tem header
                try {
                    // VALIDAR CADA CAMPO INDIVIDUALMENTE
                    const validationResult = this.validateRow(row, rowNumber, dateValidator);
                    if (validationResult.isValid && validationResult.data) {
                        validData.push(validationResult.data);
                        processingLog.validRows++;
                    }
                    else {
                        processingLog.errors.push({
                            row: rowNumber,
                            data: row,
                            errors: validationResult.errors || []
                        });
                    }
                    processingLog.processedRows++;
                }
                catch (error) {
                    processingLog.errors.push({
                        row: rowNumber,
                        data: row,
                        errors: [`Processing error: ${error.message}`]
                    });
                }
            }
            // 3. COMPARAR COM EXPECTATIVA
            console.log('📈 RESULTADO FINAL:');
            console.log(`Total no Excel: ${allRows.length}`);
            console.log(`Processadas: ${processingLog.processedRows}`);
            console.log(`Válidas: ${processingLog.validRows}`);
            console.log(`Perdidas: ${allRows.length - processingLog.validRows}`);
            return {
                data: validData,
                log: processingLog,
                analysis: analysis
            };
        });
    }
    validateRow(row, rowNumber, dateValidator) {
        var _a;
        const errors = [];
        // VALIDAR DATA
        const dateValidation = dateValidator.validateDate(row['Data_OSv']); // Nome exato da coluna
        if (!dateValidation.isValid) {
            errors.push(`Invalid date: ${dateValidation.error}`);
        }
        // VALIDAR STATUS
        const status = (_a = row['Status_OSv']) === null || _a === void 0 ? void 0 : _a.toString().trim().toUpperCase();
        if (!['G', 'GO', 'GU'].includes(status)) {
            errors.push(`Invalid status: ${status}`);
        }
        // VALIDAR CAMPOS OBRIGATÓRIOS
        const requiredFields = ['NOrdem_Osv', 'Data_OSv', 'Status_OSv'];
        for (const field of requiredFields) {
            if (!row[field] || row[field].toString().trim() === '') {
                errors.push(`Missing required field: ${field}`);
            }
        }
        // VALIDAR FILTRO DE DATA (>= 2019)
        if (dateValidation.isValid && dateValidation.date && !dateValidator.isDateAfter2019(dateValidation.date)) {
            errors.push(`Date before 2019: ${dateValidation.date}`);
        }
        if (errors.length > 0) {
            return {
                isValid: false,
                errors: errors,
                rowNumber: rowNumber,
                originalData: row
            };
        }
        return {
            isValid: true,
            data: this.transformRow(row, dateValidation.date),
            rowNumber: rowNumber
        };
    }
    transformRow(row, validatedDate) {
        var _a, _b, _c, _d, _e, _f, _g;
        // Aplicar regras de negócio
        const originalPartsValue = parseFloat(row['TotalProd_OSv']) || 0;
        const partsTotal = originalPartsValue / 2; // Dividir por 2
        const laborTotal = parseFloat(row['TotalServ_OSv']) || 0;
        const grandTotal = parseFloat(row['Total_OSv']) || 0;
        // Verificar se a soma bate
        const calculationVerified = Math.abs((partsTotal + laborTotal) - grandTotal) < 0.01; // Tolerância de 1 centavo
        return {
            order_number: (_a = row['NOrdem_Osv']) === null || _a === void 0 ? void 0 : _a.toString().trim(),
            order_date: validatedDate,
            engine_manufacturer: ((_b = row['Fabricante_Mot']) === null || _b === void 0 ? void 0 : _b.toString().trim()) || null,
            engine_description: ((_c = row['Descricao_Mot']) === null || _c === void 0 ? void 0 : _c.toString().trim()) || null,
            vehicle_model: ((_d = row['ModeloVei_Osv']) === null || _d === void 0 ? void 0 : _d.toString().trim()) || null,
            raw_defect_description: ((_e = row['ObsCorpo_OSv']) === null || _e === void 0 ? void 0 : _e.toString().trim()) || null,
            responsible_mechanic: ((_f = row['RazaoSocial_Cli']) === null || _f === void 0 ? void 0 : _f.toString().trim()) || null,
            parts_total: partsTotal,
            labor_total: laborTotal,
            grand_total: grandTotal,
            order_status: (_g = row['Status_OSv']) === null || _g === void 0 ? void 0 : _g.toString().trim().toUpperCase(),
            original_parts_value: originalPartsValue,
            calculation_verified: calculationVerified
        };
    }
}
exports.RobustDataProcessor = RobustDataProcessor;
