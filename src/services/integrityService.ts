import { supabase } from '../integrations/supabase/client';

export interface IntegrityReport {
  strategy: string;
  status: 'success' | 'error';
  count: number;
  error?: any;
  latency: number;
  details?: string;
}

export const integrityService = {
  runDeepScan: async (tableName: string, userId: string): Promise<IntegrityReport[]> => {
    const reports: IntegrityReport[] = [];
    
    // 1. Scan de RLS (Verdade do Usuário Autenticado)
    const s1 = performance.now();
    const { data: userData, error: err1 } = await supabase
      .from(tableName)
      .select('*', { count: 'exact' });

    reports.push({
      strategy: `RLS Scan [${tableName}]`,
      status: err1 ? 'error' : 'success',
      count: userData?.length || 0,
      error: err1,
      latency: performance.now() - s1,
      details: err1 ? diagnoseError(err1) : 'Permissões OK'
    });

    // 2. Validação de Schema (Head Check)
    const s2 = performance.now();
    const { error: err2 } = await supabase
      .from(tableName)
      .select('id')
      .limit(1);

    reports.push({
      strategy: `Schema Validation [${tableName}]`,
      status: err2 ? 'error' : 'success',
      count: err2 ? 0 : 1,
      error: err2,
      latency: performance.now() - s2,
      details: err2 ? diagnoseError(err2) : 'Estrutura da Tabela OK'
    });

    return reports;
  }
};

function diagnoseError(err: any): string {
  if (err.code === 'PGRST301') return 'Acesso Negado (RLS impedindo leitura/escrita)';
  if (err.code === '42P01') return 'Tabela Inexistente no Banco de Dados';
  if (err.code === '23502') return 'Violação de Campo Obrigatório (Null constraint)';
  if (err.code === '42703') return 'Coluna Inexistente (Schema dessincronizado)';
  if (err.message?.includes('JWT')) return 'Sessão Expirada ou Token Inválido';
  return err.message || 'Erro de Comunicação com Supabase';
}