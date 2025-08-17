import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { mechanicAutoDetection } from '../services/MechanicAutoDetectionService';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export class SettingsController {
  
  // === MÉTODOS DE MECÂNICOS ===
  
  async getMechanics(req: Request, res: Response) {
    try {
      console.log('👨‍🔧 Buscando todos os mecânicos com data de cadastro...');

      // Usar o novo serviço que inclui data de cadastro correta
      const mechanics = await mechanicAutoDetection.getAllMechanicsWithRegistrationDate();

      console.log(`✅ Encontrados ${mechanics.length} mecânicos com data de cadastro`);
      
      res.json({
        success: true,
        data: mechanics || []
      });

    } catch (error) {
      console.error('❌ Erro interno ao buscar mecânicos:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async addMechanic(req: Request, res: Response) {
    try {
      const { name, email } = req.body;

      console.log('➕ Adicionando mecânico:', { name, email });

      // Validar dados obrigatórios
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Nome do mecânico é obrigatório' });
      }

      // Verificar se o mecânico já existe
      const { data: existing } = await supabase
        .from('system_mechanics')
        .select('id')
        .ilike('name', name.trim())
        .single();

      if (existing) {
        return res.status(400).json({ error: 'Mecânico com este nome já existe' });
      }

      // Criar mecânico
      const mechanicData = {
        name: name.trim(),
        email: email?.trim() || null,
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: newMechanic, error } = await supabase
        .from('system_mechanics')
        .insert([mechanicData])
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar mecânico:', error);
        return res.status(500).json({ error: 'Erro ao criar mecânico' });
      }

      // Calcular total de ordens
      const { count } = await supabase
        .from('service_orders')
        .select('*', { count: 'exact', head: true })
        .eq('responsible_mechanic', newMechanic.name);

      newMechanic.totalOrders = count || 0;

      console.log('✅ Mecânico criado:', newMechanic);
      res.status(201).json({
        success: true,
        message: 'Mecânico adicionado com sucesso',
        data: newMechanic
      });

    } catch (error) {
      console.error('❌ Erro interno ao adicionar mecânico:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async updateMechanic(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      console.log(`🔄 Atualizando mecânico ID: ${id}`, updateData);

      // Validar ID
      if (!id) {
        return res.status(400).json({ error: 'ID do mecânico é obrigatório' });
      }

      // Processar dados de atualização
      const processedData: any = {};
      
      if (updateData.name !== undefined) {
        if (!updateData.name.trim()) {
          return res.status(400).json({ error: 'Nome não pode estar vazio' });
        }
        processedData.name = updateData.name.trim();
      }

      if (updateData.email !== undefined) {
        processedData.email = updateData.email?.trim() || null;
      }

      if (updateData.active !== undefined) {
        processedData.active = Boolean(updateData.active);
      }

      processedData.updated_at = new Date().toISOString();

      // Verificar se o mecânico existe
      const { data: existingMechanic, error: fetchError } = await supabase
        .from('system_mechanics')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !existingMechanic) {
        return res.status(404).json({ error: 'Mecânico não encontrado' });
      }

      // Atualizar mecânico
      const { data: updatedMechanic, error } = await supabase
        .from('system_mechanics')
        .update(processedData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao atualizar mecânico:', error);
        return res.status(500).json({ error: 'Erro ao atualizar mecânico' });
      }

      // Calcular total de ordens
      const { count } = await supabase
        .from('service_orders')
        .select('*', { count: 'exact', head: true })
        .eq('responsible_mechanic', updatedMechanic.name);

      updatedMechanic.totalOrders = count || 0;

      console.log('✅ Mecânico atualizado:', updatedMechanic);
      res.json({
        success: true,
        message: 'Mecânico atualizado com sucesso',
        data: updatedMechanic
      });

    } catch (error) {
      console.error('❌ Erro interno ao atualizar mecânico:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async removeMechanic(req: Request, res: Response) {
    try {
      const { id } = req.params;

      console.log(`🗑️ Removendo mecânico ID: ${id}`);

      // Validar ID
      if (!id) {
        return res.status(400).json({ error: 'ID do mecânico é obrigatório' });
      }

      // Verificar se o mecânico existe
      const { data: existingMechanic, error: fetchError } = await supabase
        .from('system_mechanics')
        .select('name')
        .eq('id', id)
        .single();

      if (fetchError || !existingMechanic) {
        return res.status(404).json({ error: 'Mecânico não encontrado' });
      }

      // Verificar se há ordens de serviço associadas
      const { count } = await supabase
        .from('service_orders')
        .select('*', { count: 'exact', head: true })
        .eq('responsible_mechanic', existingMechanic.name);

      if (count && count > 0) {
        return res.status(400).json({ 
          error: `Não é possível remover o mecânico. Existem ${count} ordens de serviço associadas.` 
        });
      }

      // Remover mecânico
      const { error } = await supabase
        .from('system_mechanics')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Erro ao remover mecânico:', error);
        return res.status(500).json({ error: 'Erro ao remover mecânico' });
      }

      console.log('✅ Mecânico removido com sucesso');
      res.json({
        success: true,
        message: 'Mecânico removido com sucesso'
      });

    } catch (error) {
      console.error('❌ Erro interno ao remover mecânico:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // === MÉTODOS DE USUÁRIOS ===

  async getUsers(req: Request, res: Response) {
    try {
      console.log('👥 Buscando todos os usuários...');

      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .order('name');

      if (error && error.code === 'PGRST116') {
        // Tabela não existe, retornar dados mock
        console.log('📋 Tabela users não existe, retornando dados mock...');
        
        const mockUsers = [
          {
            id: 1,
            name: 'Admin Master',
            email: 'admin@glgarantias.com',
            role: 'admin',
            permissions: ['*'],
            is_active: true,
            email_verified: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          },
          {
            id: 2,
            name: 'Gerente',
            email: 'manager@glgarantias.com',
            role: 'manager',
            permissions: ['view_dashboard', 'view_reports', 'manage_service_orders', 'manage_mechanics', 'export_data'],
            is_active: true,
            email_verified: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          },
          {
            id: 3,
            name: 'Usuário',
            email: 'user@glgarantias.com',
            role: 'user',
            permissions: ['view_dashboard', 'view_reports', 'view_service_orders'],
            is_active: true,
            email_verified: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          }
        ];

        return res.json({
          success: true,
          data: mockUsers
        });
      } else if (error) {
        console.error('❌ Erro ao buscar usuários:', error);
        return res.status(500).json({ error: 'Erro ao buscar usuários' });
      }

      console.log(`✅ Retornando ${users?.length || 0} usuários`);
      res.json({
        success: true,
        data: users || []
      });

    } catch (error) {
      console.error('❌ Erro interno ao buscar usuários:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async addUser(req: Request, res: Response) {
    try {
      const { name, email, role } = req.body;

      console.log('➕ Adicionando usuário:', { name, email, role });

      // Validar dados obrigatórios
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Nome do usuário é obrigatório' });
      }

      if (!email || !email.trim()) {
        return res.status(400).json({ error: 'Email do usuário é obrigatório' });
      }

      if (!role || !['admin', 'user', 'manager'].includes(role)) {
        return res.status(400).json({ error: 'Função deve ser admin, manager ou user' });
      }

      // Verificar se o email já existe
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .ilike('email', email.trim())
        .single();

      if (existing) {
        return res.status(400).json({ error: 'Usuário com este email já existe' });
      }

      // Criar usuário com senha temporária (será alterada no primeiro login)
      const userData = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password_hash: '$2b$12$temporary.hash.for.first.login', // Hash temporário
        role: role,
        permissions: role === 'admin' 
          ? ['*'] 
          : role === 'manager'
            ? ['view_dashboard', 'view_reports', 'manage_service_orders', 'manage_mechanics', 'export_data']
            : ['view_dashboard', 'view_reports', 'view_service_orders'],
        is_active: true,
        email_verified: false,
        login_count: 0, // Para indicar que é primeiro acesso
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: newUser, error } = await supabase
        .from('users')
        .insert([userData])
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar usuário:', error);
        
        // Se a tabela não existir, retornar erro específico
        if (error.code === 'PGRST116') {
          return res.status(500).json({ 
            error: 'Tabela de usuários não existe. Execute o script de setup do banco de dados.' 
          });
        }
        
        return res.status(500).json({ error: 'Erro ao criar usuário no banco de dados' });
      }

      console.log('✅ Usuário criado:', newUser);
      res.status(201).json({
        success: true,
        message: 'Usuário adicionado com sucesso. O usuário deve definir sua senha no primeiro acesso.',
        data: newUser
      });

    } catch (error) {
      console.error('❌ Erro interno ao adicionar usuário:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async updateUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      console.log(`🔄 Atualizando usuário ID: ${id}`, updateData);

      // Validar ID
      if (!id) {
        return res.status(400).json({ error: 'ID do usuário é obrigatório' });
      }

      // Processar dados de atualização
      const processedData: any = {};
      
      if (updateData.name !== undefined) {
        if (!updateData.name.trim()) {
          return res.status(400).json({ error: 'Nome não pode estar vazio' });
        }
        processedData.name = updateData.name.trim();
      }

      if (updateData.email !== undefined) {
        if (!updateData.email.trim()) {
          return res.status(400).json({ error: 'Email não pode estar vazio' });
        }
        processedData.email = updateData.email.trim().toLowerCase();
      }

      if (updateData.role !== undefined) {
        if (!['admin', 'user', 'manager'].includes(updateData.role)) {
          return res.status(400).json({ error: 'Função deve ser admin, manager ou user' });
        }
        processedData.role = updateData.role;
        
        // Atualizar permissões baseado no role
        if (updateData.role === 'admin') {
          processedData.permissions = ['*'];
        } else if (updateData.role === 'manager') {
          processedData.permissions = ['view_dashboard', 'view_reports', 'manage_service_orders', 'manage_mechanics', 'export_data'];
        } else {
          processedData.permissions = ['view_dashboard', 'view_reports', 'view_service_orders'];
        }
      }

      if (updateData.is_active !== undefined) {
        processedData.is_active = Boolean(updateData.is_active);
      }

      processedData.updated_at = new Date().toISOString();

      // Verificar se o usuário existe
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError && fetchError.code === 'PGRST116') {
        // Tabela não existe, retornar erro específico
        return res.status(500).json({ 
          error: 'Tabela de usuários não existe. Execute o script de setup do banco de dados.' 
        });
      } else if (fetchError || !existingUser) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      // Atualizar usuário
      const { data: updatedUser, error } = await supabase
        .from('users')
        .update(processedData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao atualizar usuário:', error);
        return res.status(500).json({ error: 'Erro ao atualizar usuário' });
      }

      console.log('✅ Usuário atualizado:', updatedUser);
      res.json({
        success: true,
        message: 'Usuário atualizado com sucesso',
        data: updatedUser
      });

    } catch (error) {
      console.error('❌ Erro interno ao atualizar usuário:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async removeUser(req: Request, res: Response) {
    try {
      const { id } = req.params;

      console.log(`🗑️ Removendo usuário ID: ${id}`);

      // Validar ID
      if (!id) {
        return res.status(400).json({ error: 'ID do usuário é obrigatório' });
      }

      // Verificar se o usuário existe
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError && fetchError.code === 'PGRST116') {
        // Tabela não existe, retornar erro específico
        return res.status(500).json({ 
          error: 'Tabela de usuários não existe. Execute o script de setup do banco de dados.' 
        });
      } else if (fetchError || !existingUser) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      // Não permitir remover o último admin
      if (existingUser.role === 'admin') {
        const { count } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'admin')
          .eq('is_active', true);

        if (count && count <= 1) {
          return res.status(400).json({ 
            error: 'Não é possível remover o último administrador ativo do sistema' 
          });
        }
      }

      // Remover usuário
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Erro ao remover usuário:', error);
        return res.status(500).json({ error: 'Erro ao remover usuário' });
      }

      console.log('✅ Usuário removido com sucesso');
      res.json({
        success: true,
        message: 'Usuário removido com sucesso'
      });

    } catch (error) {
      console.error('❌ Erro interno ao remover usuário:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}