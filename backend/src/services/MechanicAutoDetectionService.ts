import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export class MechanicAutoDetectionService {
  
  /**
   * Detecta e registra novos mecânicos automaticamente
   * @param mechanicNames Array de nomes de mecânicos encontrados na planilha
   */
  async detectAndRegisterNewMechanics(mechanicNames: string[]): Promise<{ 
    newMechanics: string[]; 
    totalProcessed: number; 
  }> {
    console.log('🔍 Iniciando detecção automática de mecânicos...');
    
    if (!mechanicNames || mechanicNames.length === 0) {
      console.log('⚠️ Nenhum mecânico para processar');
      return { newMechanics: [], totalProcessed: 0 };
    }

    // Filtrar mecânicos válidos (remover nulos, vazios e TESTE)
    const validMechanicNames = mechanicNames
      .filter(name => name && name.trim())
      .map(name => name.trim())
      .filter(name => name !== 'TESTE' && name.toLowerCase() !== 'teste')
      .filter((name, index, arr) => arr.indexOf(name) === index); // Remover duplicatas

    console.log(`🔍 ${validMechanicNames.length} mecânicos válidos encontrados:`, validMechanicNames);

    if (validMechanicNames.length === 0) {
      return { newMechanics: [], totalProcessed: 0 };
    }

    try {
      // 1. Verificar quais mecânicos já estão registrados na tabela system_mechanics
      const { data: existingMechanics, error: fetchError } = await supabase
        .from('system_mechanics')
        .select('name')
        .in('name', validMechanicNames);

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('❌ Erro ao buscar mecânicos existentes:', fetchError);
        return { newMechanics: [], totalProcessed: 0 };
      }

      const existingNames = (existingMechanics || []).map(m => m.name);
      const newMechanicNames = validMechanicNames.filter(name => !existingNames.includes(name));

      console.log(`📊 Mecânicos existentes: ${existingNames.length}`);
      console.log(`🆕 Novos mecânicos detectados: ${newMechanicNames.length}`, newMechanicNames);

      if (newMechanicNames.length === 0) {
        console.log('✅ Nenhum mecânico novo para registrar');
        return { newMechanics: [], totalProcessed: validMechanicNames.length };
      }

      // 2. Preparar dados dos novos mecânicos
      const newMechanicsData = newMechanicNames.map(name => ({
        name,
        email: null,
        active: true,
        auto_detected: true, // Flag para indicar que foi detectado automaticamente
        first_appearance_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      // 3. Inserir novos mecânicos na tabela system_mechanics
      const { data: insertedMechanics, error: insertError } = await supabase
        .from('system_mechanics')
        .insert(newMechanicsData)
        .select();

      if (insertError) {
        console.error('❌ Erro ao inserir novos mecânicos:', insertError);
        
        // Se a tabela não existir, criar as estruturas necessárias
        if (insertError.code === 'PGRST116') {
          console.log('📋 Tabela system_mechanics não existe. Registrando apenas para logs...');
          console.log('🆕 Mecânicos que seriam registrados:', newMechanicNames);
          
          return { 
            newMechanics: newMechanicNames, 
            totalProcessed: validMechanicNames.length 
          };
        }
        
        return { newMechanics: [], totalProcessed: 0 };
      }

      console.log(`✅ ${newMechanicNames.length} novos mecânicos registrados automaticamente!`);
      console.log('📝 Mecânicos registrados:', newMechanicNames.join(', '));

      // 4. Log da atividade
      this.logMechanicDetection(newMechanicNames);

      return { 
        newMechanics: newMechanicNames, 
        totalProcessed: validMechanicNames.length 
      };

    } catch (error) {
      console.error('❌ Erro interno na detecção automática de mecânicos:', error);
      return { newMechanics: [], totalProcessed: 0 };
    }
  }

  /**
   * Busca todos os mecânicos (automáticos + manuais) com data de registro
   */
  async getAllMechanicsWithRegistrationDate(): Promise<any[]> {
    try {
      console.log('👨‍🔧 Buscando todos os mecânicos com data de cadastro...');

      // 1. Buscar mecânicos da tabela system_mechanics (se existir)
      const { data: systemMechanics, error: systemError } = await supabase
        .from('system_mechanics')
        .select('*')
        .order('created_at', { ascending: false });

      let registeredMechanics: any[] = [];
      
      if (systemError && systemError.code !== 'PGRST116') {
        console.error('❌ Erro ao buscar mecânicos do sistema:', systemError);
      } else if (systemMechanics) {
        registeredMechanics = systemMechanics;
        console.log(`✅ ${registeredMechanics.length} mecânicos registrados encontrados`);
      }

      // 2. Buscar mecânicos únicos dos service_orders
      const { data: orders, error: ordersError } = await supabase
        .from('service_orders')
        .select('responsible_mechanic, order_date')
        .not('responsible_mechanic', 'is', null)
        .order('order_date', { ascending: true });

      if (ordersError) {
        console.error('❌ Erro ao buscar ordens:', ordersError);
        return registeredMechanics.map(mech => ({
          id: mech.id,
          name: mech.name,
          email: mech.email,
          active: mech.active,
          totalOrders: 0,
          created_at: mech.created_at,
          registeredAt: mech.created_at
        }));
      }

      // 3. Processar dados para obter primeira aparição de cada mecânico
      const mechanicFirstAppearance: { [key: string]: string } = {};
      const mechanicOrderCounts: { [key: string]: number } = {};

      orders?.forEach(order => {
        const mechanic = order.responsible_mechanic?.trim();
        if (mechanic && mechanic !== 'TESTE') {
          // Primeira aparição
          if (!mechanicFirstAppearance[mechanic] || order.order_date < mechanicFirstAppearance[mechanic]) {
            mechanicFirstAppearance[mechanic] = order.order_date;
          }
          
          // Contagem de ordens
          mechanicOrderCounts[mechanic] = (mechanicOrderCounts[mechanic] || 0) + 1;
        }
      });

      // 4. Combinar dados registrados com dados dos service_orders
      const allMechanicNames = new Set([
        ...registeredMechanics.map(m => m.name),
        ...Object.keys(mechanicFirstAppearance)
      ]);

      const combinedMechanics = Array.from(allMechanicNames).map((name, index) => {
        const registeredMechanic = registeredMechanics.find(m => m.name === name);
        const firstAppearanceDate = mechanicFirstAppearance[name];
        const totalOrders = mechanicOrderCounts[name] || 0;

        return {
          id: registeredMechanic?.id || (1000 + index), // ID temporário para não registrados
          name,
          email: registeredMechanic?.email || null,
          active: registeredMechanic?.active !== undefined ? registeredMechanic.active : true,
          totalOrders,
          created_at: registeredMechanic?.created_at || firstAppearanceDate || new Date().toISOString(),
          registeredAt: registeredMechanic?.created_at || firstAppearanceDate || new Date().toISOString(),
          auto_detected: registeredMechanic?.auto_detected || false,
          first_appearance_date: firstAppearanceDate || registeredMechanic?.created_at
        };
      });

      // Ordenar por data de registro (mais recentes primeiro)
      combinedMechanics.sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime());

      console.log(`✅ Total: ${combinedMechanics.length} mecânicos (${registeredMechanics.length} registrados + ${combinedMechanics.length - registeredMechanics.length} detectados)`);
      
      return combinedMechanics;

    } catch (error) {
      console.error('❌ Erro interno ao buscar mecânicos com data:', error);
      return [];
    }
  }

  /**
   * Log de atividades de detecção
   */
  private async logMechanicDetection(newMechanics: string[]): Promise<void> {
    try {
      const logEntry = {
        event_type: 'mechanic_auto_detection',
        details: {
          detected_mechanics: newMechanics,
          count: newMechanics.length,
          timestamp: new Date().toISOString()
        },
        created_at: new Date().toISOString()
      };

      // Tentar inserir no log (se a tabela existir)
      await supabase
        .from('system_logs')
        .insert([logEntry]);

      console.log('📝 Log de detecção salvo');
    } catch (error) {
      // Ignorar erros de log silenciosamente
      console.log('⚠️ Não foi possível salvar log de detecção');
    }
  }
}

export const mechanicAutoDetection = new MechanicAutoDetectionService();