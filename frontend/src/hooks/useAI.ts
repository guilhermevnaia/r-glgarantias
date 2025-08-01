import { useState, useEffect } from 'react';
import { aiService, DefectClassification, AIStats } from '@/services/aiService';

/**
 * Hook para gerenciar dados da IA
 */
export function useAI() {
  const [classifications, setClassifications] = useState<DefectClassification[]>([]);
  const [stats, setStats] = useState<AIStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar dados iniciais
  useEffect(() => {
    loadAIData();
  }, []);

  const loadAIData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [classificationsData, statsData] = await Promise.all([
        aiService.getClassifications(),
        aiService.getStats()
      ]);

      setClassifications(classificationsData);
      setStats(statsData);
    } catch (err) {
      setError('Erro ao carregar dados da IA');
      console.error('Erro no useAI:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    await aiService.forceRefresh();
    await loadAIData();
  };

  return {
    classifications,
    stats,
    loading,
    error,
    refreshData,
    getClassificationForOrder: aiService.getClassificationForOrder.bind(aiService),
    getDisplayDefect: aiService.getDisplayDefect.bind(aiService)
  };
}

/**
 * Hook para classificação de uma order específica
 */
export function useOrderClassification(serviceOrderId: number) {
  const [classification, setClassification] = useState<DefectClassification | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (serviceOrderId) {
      aiService.getClassificationForOrder(serviceOrderId)
        .then(setClassification)
        .finally(() => setLoading(false));
    }
  }, [serviceOrderId]);

  return { classification, loading };
}