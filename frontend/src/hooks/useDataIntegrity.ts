import { useState, useEffect, useCallback } from 'react';
import { apiService } from '@/services/api';

interface IntegrityCheck {
  timestamp: string;
  check_type: string;
  expected_count: number;
  actual_count: number;
  status: 'OK' | 'ERROR' | 'FIXED';
  details: string;
  error_details?: string;
}

interface IntegrityStatus {
  isHealthy: boolean;
  lastCheck: string | null;
  hasRecentErrors: boolean;
  errorCount: number;
  checks: IntegrityCheck[];
}

interface UseDataIntegrityReturn {
  integrityStatus: IntegrityStatus | null;
  isLoading: boolean;
  error: string | null;
  checkIntegrity: () => Promise<void>;
  forceRefresh: () => Promise<void>;
}

export const useDataIntegrity = (): UseDataIntegrityReturn => {
  const [integrityStatus, setIntegrityStatus] = useState<IntegrityStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Verifica status de saúde da integridade
   */
  const checkHealthStatus = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/v1/integrity/health`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setIntegrityStatus({
          isHealthy: result.status === 'HEALTHY',
          lastCheck: result.data.last_check,
          hasRecentErrors: result.data.has_recent_errors,
          errorCount: 0, // será preenchido por checkIntegrity se necessário
          checks: []
        });
      } else {
        throw new Error(result.message || 'Erro desconhecido');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao verificar integridade';
      setError(errorMessage);
      console.error('❌ Erro ao verificar status de integridade:', err);
    }
  }, []);

  /**
   * Executa verificação completa de integridade
   */
  const checkIntegrity = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🔍 Frontend: Executando verificação de integridade...');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/v1/integrity/check/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        const data = result.data;
        setIntegrityStatus({
          isHealthy: data.error_count === 0,
          lastCheck: data.timestamp,
          hasRecentErrors: data.error_count > 0,
          errorCount: data.error_count,
          checks: data.checks
        });

        console.log(`✅ Verificação concluída: ${data.ok_count} OK, ${data.error_count} erros`);
        
        // Log detalhado para debug
        data.checks.forEach((check: IntegrityCheck) => {
          if (check.status === 'ERROR') {
            console.warn(`⚠️ ${check.check_type}: ${check.details}`);
            if (check.error_details) {
              console.warn(`   Detalhes: ${check.error_details}`);
            }
          }
        });
      } else {
        throw new Error(result.message || 'Erro desconhecido');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao executar verificação';
      setError(errorMessage);
      console.error('❌ Erro durante verificação de integridade:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Força atualização do status
   */
  const forceRefresh = useCallback(async (): Promise<void> => {
    await checkHealthStatus();
    await checkIntegrity();
  }, [checkHealthStatus, checkIntegrity]);

  /**
   * Verifica integridade quando o hook é montado
   */
  useEffect(() => {
    checkHealthStatus();
  }, [checkHealthStatus]);

  /**
   * Configurar verificação periódica (a cada 10 minutos)
   */
  useEffect(() => {
    const interval = setInterval(() => {
      checkHealthStatus();
    }, 10 * 60 * 1000); // 10 minutos

    return () => clearInterval(interval);
  }, [checkHealthStatus]);

  return {
    integrityStatus,
    isLoading,
    error,
    checkIntegrity,
    forceRefresh
  };
};

/**
 * Hook específico para verificar integridade de contagem de registros
 */
export const useRecordCountVerification = (expectedCount: number) => {
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [actualCount, setActualCount] = useState<number | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const verifyCount = useCallback(async () => {
    setIsChecking(true);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/v1/integrity/check/total-records`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        const actual = result.data.actual_count;
        
        setActualCount(actual);
        setIsValid(actual === expectedCount);
        
        if (actual !== expectedCount) {
          console.warn(`⚠️ Discrepância de contagem: esperado ${expectedCount}, encontrado ${actual}`);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao verificar contagem:', error);
      setIsValid(false);
    } finally {
      setIsChecking(false);
    }
  }, [expectedCount]);

  useEffect(() => {
    if (expectedCount > 0) {
      verifyCount();
    }
  }, [expectedCount, verifyCount]);

  return { isValid, actualCount, isChecking, verifyCount };
};