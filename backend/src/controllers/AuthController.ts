import { Request, Response } from 'express';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import { body, validationResult } from 'express-validator';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export class AuthController {
  /**
   * Validações para login
   */
  static loginValidation = [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Email inválido'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Senha deve ter pelo menos 6 caracteres')
  ];

  /**
   * Validações para registro
   */
  static registerValidation = [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Email inválido'),
    body('password')
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Senha deve conter: 8+ caracteres, maiúscula, minúscula, número e símbolo'),
    body('name')
      .isLength({ min: 2, max: 100 })
      .trim()
      .escape()
      .withMessage('Nome deve ter entre 2 e 100 caracteres'),
    body('role')
      .isIn(['admin', 'manager', 'user'])
      .withMessage('Role deve ser: admin, manager ou user')
  ];

  /**
   * LOGIN - Autenticar usuário
   */
  async login(req: Request, res: Response) {
    try {
      // Verificar erros de validação
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Dados inválidos',
          details: errors.array()
        });
      }

      const { email, password } = req.body;

      // Buscar usuário no banco
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (error || !user) {
        return res.status(401).json({
          success: false,
          error: 'Credenciais inválidas',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Verificar senha
      const passwordMatch = await bcrypt.compare(password, user.password_hash);
      if (!passwordMatch) {
        return res.status(401).json({
          success: false,
          error: 'Credenciais inválidas',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Atualizar último login
      await supabase
        .from('users')
        .update({ 
          last_login: new Date().toISOString(),
          login_count: (user.login_count || 0) + 1
        })
        .eq('id', user.id);

      // Gerar JWT
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email, 
          role: user.role 
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
      );

      res.json({
        success: true,
        message: 'Login realizado com sucesso',
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            permissions: user.permissions || [],
            last_login: new Date().toISOString()
          }
        }
      });

    } catch (error) {
      console.error('Erro no login:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * REGISTER - Registrar novo usuário (apenas admins)
   */
  async register(req: Request, res: Response) {
    try {
      // Verificar erros de validação
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Dados inválidos',
          details: errors.array()
        });
      }

      const { email, password, name, role = 'user' } = req.body;

      // Verificar se email já existe
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'Email já está em uso',
          code: 'EMAIL_EXISTS'
        });
      }

      // Hash da senha
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Criar usuário
      const { data: newUser, error } = await supabase
        .from('users')
        .insert({
          email,
          name,
          role,
          password_hash: passwordHash,
          permissions: this.getDefaultPermissions(role),
          is_active: true,
          created_at: new Date().toISOString()
        })
        .select('id, email, name, role, permissions, created_at')
        .single();

      if (error) {
        console.error('Erro ao criar usuário:', error);
        return res.status(500).json({
          success: false,
          error: 'Erro ao criar usuário'
        });
      }

      res.status(201).json({
        success: true,
        message: 'Usuário criado com sucesso',
        data: {
          user: newUser
        }
      });

    } catch (error) {
      console.error('Erro no registro:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * PROFILE - Obter perfil do usuário autenticado
   */
  async getProfile(req: any, res: Response) {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('id, email, name, role, permissions, created_at, last_login, login_count')
        .eq('id', req.user.id)
        .single();

      if (error || !user) {
        return res.status(404).json({
          success: false,
          error: 'Usuário não encontrado'
        });
      }

      res.json({
        success: true,
        data: { user }
      });

    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * LOGOUT - Invalidar token (implementação simples)
   */
  async logout(req: Request, res: Response) {
    // Em uma implementação completa, você manteria uma blacklist de tokens
    res.json({
      success: true,
      message: 'Logout realizado com sucesso'
    });
  }

  /**
   * Obter permissões padrão por role
   */
  private getDefaultPermissions(role: string): string[] {
    const permissions = {
      admin: ['*'], // Todas as permissões
      manager: [
        'view_dashboard',
        'view_reports',
        'manage_service_orders',
        'manage_mechanics',
        'export_data',
        'view_ai_classifications'
      ],
      user: [
        'view_dashboard',
        'view_reports',
        'view_service_orders'
      ]
    };

    return permissions[role as keyof typeof permissions] || permissions.user;
  }

  /**
   * CHANGE PASSWORD - Alterar senha
   */
  async changePassword(req: any, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Dados inválidos',
          details: errors.array()
        });
      }

      const { currentPassword, newPassword } = req.body;

      // Buscar usuário atual
      const { data: user, error } = await supabase
        .from('users')
        .select('password_hash')
        .eq('id', req.user.id)
        .single();

      if (error || !user) {
        return res.status(404).json({
          success: false,
          error: 'Usuário não encontrado'
        });
      }

      // Verificar senha atual
      const passwordMatch = await bcrypt.compare(currentPassword, user.password_hash);
      if (!passwordMatch) {
        return res.status(401).json({
          success: false,
          error: 'Senha atual incorreta'
        });
      }

      // Hash da nova senha
      const saltRounds = 12;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      // Atualizar senha
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          password_hash: newPasswordHash,
          updated_at: new Date().toISOString()
        })
        .eq('id', req.user.id);

      if (updateError) {
        return res.status(500).json({
          success: false,
          error: 'Erro ao atualizar senha'
        });
      }

      res.json({
        success: true,
        message: 'Senha alterada com sucesso'
      });

    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Validações para alteração de senha
   */
  static changePasswordValidation = [
    body('currentPassword')
      .isLength({ min: 1 })
      .withMessage('Senha atual é obrigatória'),
    body('newPassword')
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Nova senha deve conter: 8+ caracteres, maiúscula, minúscula, número e símbolo')
  ];
}