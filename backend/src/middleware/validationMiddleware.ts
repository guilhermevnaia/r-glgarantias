import { body, query, param, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import DOMPurify from 'isomorphic-dompurify';

/**
 * Middleware para processar erros de validação
 */
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Dados inválidos',
      details: errors.array().map(error => ({
        field: error.type === 'field' ? (error as any).path : 'unknown',
        message: error.msg,
        value: error.type === 'field' ? (error as any).value : undefined
      }))
    });
  }
  
  next();
};

/**
 * Sanitização de HTML para prevenir XSS
 */
export const sanitizeHTML = (req: Request, res: Response, next: NextFunction) => {
  const sanitizeValue = (value: any): any => {
    if (typeof value === 'string') {
      return DOMPurify.sanitize(value, { 
        ALLOWED_TAGS: [], // Remove todas as tags HTML
        ALLOWED_ATTR: [] // Remove todos os atributos
      }).trim();
    }
    
    if (Array.isArray(value)) {
      return value.map(sanitizeValue);
    }
    
    if (value && typeof value === 'object') {
      const sanitized: any = {};
      for (const [key, val] of Object.entries(value)) {
        sanitized[key] = sanitizeValue(val);
      }
      return sanitized;
    }
    
    return value;
  };

  // Sanitizar body
  if (req.body) {
    req.body = sanitizeValue(req.body);
  }

  // Sanitizar query params
  if (req.query) {
    req.query = sanitizeValue(req.query);
  }

  next();
};

/**
 * Validações para Service Orders
 */
export const serviceOrderValidation = [
  body('order_number')
    .isLength({ min: 1, max: 50 })
    .trim()
    .escape()
    .withMessage('Número da ordem deve ter entre 1 e 50 caracteres'),
  
  body('client_name')
    .isLength({ min: 2, max: 200 })
    .trim()
    .escape()
    .withMessage('Nome do cliente deve ter entre 2 e 200 caracteres'),
  
  body('vehicle_brand')
    .optional()
    .isLength({ max: 100 })
    .trim()
    .escape()
    .withMessage('Marca do veículo deve ter até 100 caracteres'),
  
  body('defect_description')
    .isLength({ min: 5, max: 1000 })
    .trim()
    .withMessage('Descrição do defeito deve ter entre 5 e 1000 caracteres'),
  
  body('parts_total')
    .isFloat({ min: 0, max: 999999.99 })
    .withMessage('Total de peças deve ser um número válido'),
  
  body('labor_total')
    .isFloat({ min: 0, max: 999999.99 })
    .withMessage('Total de mão de obra deve ser um número válido'),
  
  body('order_date')
    .isISO8601()
    .toDate()
    .withMessage('Data da ordem deve ser uma data válida')
];

/**
 * Validações para AI Classification
 */
export const aiClassificationValidation = [
  body('defectDescription')
    .isLength({ min: 3, max: 1000 })
    .trim()
    .withMessage('Descrição do defeito deve ter entre 3 e 1000 caracteres')
    .matches(/^[a-zA-ZÀ-ÿ0-9\s\.,\-\(\)\/]+$/)
    .withMessage('Descrição contém caracteres inválidos')
];

/**
 * Validações para Categories
 */
export const categoryValidation = [
  body('category_name')
    .isLength({ min: 2, max: 100 })
    .trim()
    .escape()
    .withMessage('Nome da categoria deve ter entre 2 e 100 caracteres')
    .matches(/^[a-zA-ZÀ-ÿ\s\-]+$/)
    .withMessage('Nome da categoria deve conter apenas letras, espaços e hífens'),
  
  body('description')
    .isLength({ min: 10, max: 500 })
    .trim()
    .withMessage('Descrição deve ter entre 10 e 500 caracteres'),
  
  body('color_hex')
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Cor deve ser um hex válido (ex: #FF0000)'),
  
  body('keywords')
    .isArray({ min: 1, max: 20 })
    .withMessage('Deve haver entre 1 e 20 palavras-chave'),
  
  body('keywords.*')
    .isLength({ min: 2, max: 50 })
    .trim()
    .escape()
    .withMessage('Cada palavra-chave deve ter entre 2 e 50 caracteres')
];

/**
 * Validações para Upload
 */
export const uploadValidation = [
  body('upload_type')
    .isIn(['excel', 'csv'])
    .withMessage('Tipo de upload deve ser excel ou csv'),
  
  // Middleware customizado para validar arquivo
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum arquivo foi enviado'
      });
    }
    
    const allowedMimes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];
    
    if (!allowedMimes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        error: 'Tipo de arquivo não permitido. Use Excel (.xlsx) ou CSV.'
      });
    }
    
    // Verificar tamanho (máximo 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        error: 'Arquivo muito grande. Máximo 50MB permitido.'
      });
    }
    
    next();
  }
];

/**
 * Validações para Query Parameters
 */
export const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .toInt()
    .withMessage('Página deve ser um número entre 1 e 10000'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .toInt()
    .withMessage('Limite deve ser um número entre 1 e 1000'),
  
  query('sort')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Ordenação deve ser asc ou desc'),
  
  query('search')
    .optional()
    .isLength({ max: 200 })
    .trim()
    .escape()
    .withMessage('Busca deve ter até 200 caracteres')
];

/**
 * Validações para Date Range
 */
export const dateRangeValidation = [
  query('start_date')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Data inicial deve ser uma data válida (ISO 8601)'),
  
  query('end_date')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Data final deve ser uma data válida (ISO 8601)')
    .custom((value, { req }) => {
      if (req.query?.start_date && value) {
        const startDate = new Date(req.query.start_date as string);
        const endDate = new Date(value);
        
        if (endDate < startDate) {
          throw new Error('Data final deve ser posterior à data inicial');
        }
        
        // Máximo 2 anos de diferença
        const diffYears = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
        if (diffYears > 2) {
          throw new Error('Período máximo permitido é de 2 anos');
        }
      }
      return true;
    })
];

/**
 * Validações para ID Parameters
 */
export const idValidation = [
  param('id')
    .isInt({ min: 1 })
    .toInt()
    .withMessage('ID deve ser um número inteiro positivo')
];

/**
 * Validações para User Management
 */
export const userValidation = [
  body('name')
    .isLength({ min: 2, max: 100 })
    .trim()
    .escape()
    .withMessage('Nome deve ter entre 2 e 100 caracteres')
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
    .withMessage('Nome deve conter apenas letras e espaços'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),
  
  body('role')
    .isIn(['admin', 'manager', 'user'])
    .withMessage('Role deve ser: admin, manager ou user'),
  
  body('permissions')
    .optional()
    .isArray()
    .withMessage('Permissões devem ser uma lista')
];

/**
 * Middleware para prevenir SQL Injection
 */
export const preventSQLInjection = (req: Request, res: Response, next: NextFunction) => {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
    /([\';]|--|\|\||&&)/g,
    /(\bOR\b|\bAND\b).*?[\=\<\>]/gi
  ];
  
  const checkValue = (value: any): boolean => {
    if (typeof value === 'string') {
      return sqlPatterns.some(pattern => pattern.test(value));
    }
    
    if (Array.isArray(value)) {
      return value.some(checkValue);
    }
    
    if (value && typeof value === 'object') {
      return Object.values(value).some(checkValue);
    }
    
    return false;
  };
  
  const hasSQLInjection = 
    checkValue(req.body) || 
    checkValue(req.query) || 
    checkValue(req.params);
  
  if (hasSQLInjection) {
    return res.status(400).json({
      success: false,
      error: 'Dados contêm padrões não permitidos',
      code: 'INVALID_INPUT_PATTERN'
    });
  }
  
  next();
};