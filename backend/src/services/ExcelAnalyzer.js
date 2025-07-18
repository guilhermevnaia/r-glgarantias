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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExcelAnalyzer = void 0;
const XLSX = __importStar(require("xlsx"));
class ExcelAnalyzer {
    analyzeFile(buffer) {
        const workbook = XLSX.read(buffer);
        const worksheet = workbook.Sheets['Tabela']; // Nome exato da aba
        if (!worksheet) {
            throw new Error('A planilha deve conter uma aba chamada "Tabela"');
        }
        const allData = XLSX.utils.sheet_to_json(worksheet);
        // Implementar lógica para extrair cabeçalhos e mapear colunas se necessário
        // Por enquanto, vamos focar na contagem e filtragem
        const analysis = {
            totalRows: allData.length,
            rowsWithData: 0,
            rowsAfterDateFilter: 0,
            rowsAfterStatusFilter: 0,
            finalValidRows: 0,
            rowsWithInvalidDates: [],
            rowsWithInvalidStatus: [],
            rowsWithMissingData: [],
        };
        // Placeholder para as funções de validação que serão implementadas em DateValidator e RobustDataProcessor
        // Por enquanto, apenas para simular a contagem
        const isValidDate = (row) => {
            // Lógica de validação de data (>= 2019)
            const rawDate = row['Data_OSv'];
            if (!rawDate)
                return false; // Data ausente
            try {
                const date = new Date(rawDate);
                return date.getFullYear() >= 2019;
            }
            catch (e) {
                return false;
            }
        };
        const isValidStatus = (row) => {
            var _a;
            // Lógica de validação de status (G, GO, GU)
            const status = (_a = row['Status_OSv']) === null || _a === void 0 ? void 0 : _a.toString().trim().toUpperCase();
            return ['G', 'GO', 'GU'].includes(status);
        };
        const hasRequiredData = (row) => {
            // Lógica para verificar se a linha tem dados mínimos
            const requiredFields = ['NOrdem_Osv', 'Data_OSv', 'Status_OSv'];
            return requiredFields.every(field => row[field] !== undefined && row[field] !== null && row[field].toString().trim() !== '');
        };
        const passesAllFilters = (row) => {
            return hasRequiredData(row) && isValidDate(row) && isValidStatus(row);
        };
        allData.forEach(row => {
            if (hasRequiredData(row)) {
                analysis.rowsWithData++;
            }
            else {
                analysis.rowsWithMissingData.push(row);
            }
            if (isValidDate(row)) {
                analysis.rowsAfterDateFilter++;
            }
            else {
                analysis.rowsWithInvalidDates.push(row);
            }
            if (isValidStatus(row)) {
                analysis.rowsAfterStatusFilter++;
            }
            else {
                analysis.rowsWithInvalidStatus.push(row);
            }
            if (passesAllFilters(row)) {
                analysis.finalValidRows++;
            }
        });
        return analysis;
    }
    extractHeaders(worksheet) {
        const headers = [];
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const cell = worksheet[XLSX.utils.encode_cell({ c: C, r: range.s.r })];
            if (cell && cell.v) {
                headers.push(cell.v.toString());
            }
        }
        return headers;
    }
    mapColumns(headers) {
        // Esta lógica será mais robusta quando lermos do system_settings
        const predefinedMapping = {
            'NOrdem_Osv': 'order_number',
            'Data_OSv': 'order_date',
            'Fabricante_Mot': 'engine_manufacturer',
            'Descricao_Mot': 'engine_description',
            'ModeloVei_Osv': 'vehicle_model',
            'ObsCorpo_OSv': 'raw_defect_description',
            'RazaoSocial_Cli': 'responsible_mechanic',
            'TotalProd_OSv': 'parts_total',
            'TotalServ_OSv': 'labor_total',
            'Total_OSv': 'grand_total',
            'Status_OSv': 'order_status',
        };
        const mapping = {};
        headers.forEach(header => {
            if (predefinedMapping[header]) {
                mapping[header] = predefinedMapping[header];
            }
        });
        return mapping;
    }
}
exports.ExcelAnalyzer = ExcelAnalyzer;
