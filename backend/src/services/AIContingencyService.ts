import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export class AIContingencyService {
  private static instance: AIContingencyService;
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;

  static getInstance(): AIContingencyService {
    if (!AIContingencyService.instance) {
      AIContingencyService.instance = new AIContingencyService();
    }
    return AIContingencyService.instance;
  }

  // Iniciar sistema de contingência (executa a cada 5 minutos)
  startContingencySystem(): void {
    if (this.intervalId) return; // Já está rodando
    
    console.log('🤖 SISTEMA DE CONTINGÊNCIA DE IA INICIADO');
    console.log('   Verificação automática a cada 5 minutos');
    
    // Execução imediata
    this.checkAndClassifyMissing();
    
    // Execução periódica
    this.intervalId = setInterval(() => {
      this.checkAndClassifyMissing();
    }, 5 * 60 * 1000); // 5 minutos
  }

  stopContingencySystem(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('🛑 Sistema de contingência de IA parado');
    }
  }

  // Verificar e classificar defeitos não classificados
  async checkAndClassifyMissing(): Promise<void> {
    if (this.isRunning) {
      console.log('⏳ Verificação de IA já em andamento, pulando...');
      return;
    }

    this.isRunning = true;
    
    try {
      console.log('🔍 Verificando defeitos não classificados...');
      
      // Contar defeitos e classificações
      const { count: totalDefects } = await supabase
        .from('service_orders')
        .select('*', { count: 'exact', head: true })
        .not('raw_defect_description', 'is', null)
        .neq('raw_defect_description', '');

      const { count: totalClassifications } = await supabase
        .from('defect_classifications')
        .select('*', { count: 'exact', head: true });

      const missingCount = totalDefects - totalClassifications;
      
      if (missingCount <= 0) {
        console.log(`✅ Todos os ${totalDefects} defeitos estão classificados`);
        return;
      }

      console.log(`❌ Encontrados ${missingCount} defeitos sem classificação`);
      console.log(`   Total defeitos: ${totalDefects}`);
      console.log(`   Total classificações: ${totalClassifications}`);
      
      // Buscar defeitos não classificados
      const { data: unclassified } = await supabase
        .from('service_orders')
        .select(`
          id, 
          order_number, 
          raw_defect_description,
          defect_classifications!left(id)
        `)
        .not('raw_defect_description', 'is', null)
        .neq('raw_defect_description', '')
        .is('defect_classifications.id', null)
        .limit(100); // Processar até 100 por vez

      if (!unclassified || unclassified.length === 0) {
        console.log('✅ Nenhum defeito não classificado encontrado');
        return;
      }

      console.log(`🔄 Classificando ${unclassified.length} defeitos...`);
      
      const classifications = unclassified.map(order => {
        const classification = this.classifyDefect(order.raw_defect_description);
        return {
          service_order_id: order.id,
          category_id: classification.categoryId,
          ai_confidence: classification.confidence,
          ai_reasoning: `CONTINGÊNCIA: ${classification.reasoning}`,
          original_defect_description: order.raw_defect_description.substring(0, 500),
          created_at: new Date().toISOString()
        };
      });

      const { error } = await supabase
        .from('defect_classifications')
        .insert(classifications);

      if (error) {
        console.error('❌ Erro na classificação de contingência:', error.message);
      } else {
        console.log(`✅ ${classifications.length} defeitos classificados pela contingência`);
      }

    } catch (error) {
      console.error('❌ Erro no sistema de contingência:', error);
    } finally {
      this.isRunning = false;
    }
  }

  // Função de classificação robusta
  private classifyDefect(description: string): { categoryId: number, confidence: number, reasoning: string } {
    const desc = description.toLowerCase();
    
    // Vazamentos (categoria 27)
    if (desc.match(/vaza(mento|ndo|va|r)?|escorre|goteja|pinga|perdeu.*oleo|vazou/)) {
      return { categoryId: 27, confidence: 0.85, reasoning: "Vazamento detectado" };
    }
    
    // Ruídos (categoria 33)
    if (desc.match(/barulho|ruido|ruído|estalo|chiado|rangendo|fazendo.*barulho/)) {
      return { categoryId: 33, confidence: 0.8, reasoning: "Ruído detectado" };
    }
    
    // Folgas mecânicas (categoria 33)
    if (desc.match(/folga|frouxo|solto|bamboleando|balançando|com.*folga/)) {
      return { categoryId: 33, confidence: 0.8, reasoning: "Folga mecânica" };
    }
    
    // Quebras e fraturas (categoria 36)
    if (desc.match(/quebr(a|ou|ado)|romp(eu|ido)|part(iu|ido)|trinca(do|s)?|rachado|perdeu.*pastilha/)) {
      return { categoryId: 36, confidence: 0.9, reasoning: "Quebra/fratura" };
    }
    
    // Problemas de temperatura (categoria 26)
    if (desc.match(/superaquecimento|aquec(eu|endo)|quente|temperatura|fervendo/)) {
      return { categoryId: 26, confidence: 0.8, reasoning: "Problema térmico" };
    }
    
    // Problemas com óleo (categoria 27)
    if (desc.match(/o?óleo|lubrific|graxa|passou.*oleo/)) {
      return { categoryId: 27, confidence: 0.7, reasoning: "Problema de lubrificação" };
    }
    
    // Desgaste (categoria 28)
    if (desc.match(/desgast(e|ou|ado)|gast(o|ou)|consumo|usado/)) {
      return { categoryId: 28, confidence: 0.7, reasoning: "Desgaste detectado" };
    }
    
    // Problemas elétricos (categoria 25)
    if (desc.match(/eletric|elétric|fio|cabo|sensor|bobina/)) {
      return { categoryId: 25, confidence: 0.75, reasoning: "Problema elétrico" };
    }
    
    // Combustão/motor (categoria 26)
    if (desc.match(/combustão|queima|fumaça|não.*funciona|motor.*parou/)) {
      return { categoryId: 26, confidence: 0.7, reasoning: "Problema de funcionamento" };
    }
    
    // Padrão - outros defeitos (categoria 28)
    return { categoryId: 28, confidence: 0.5, reasoning: "Classificação automática geral" };
  }

  // Método para verificação manual
  async manualCheck(): Promise<{ totalDefects: number, totalClassifications: number, missingCount: number }> {
    const { count: totalDefects } = await supabase
      .from('service_orders')
      .select('*', { count: 'exact', head: true })
      .not('raw_defect_description', 'is', null)
      .neq('raw_defect_description', '');

    const { count: totalClassifications } = await supabase
      .from('defect_classifications')
      .select('*', { count: 'exact', head: true });

    const missingCount = Math.max(0, totalDefects - totalClassifications);

    return { totalDefects, totalClassifications, missingCount };
  }
}