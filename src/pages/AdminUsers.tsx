"use client";

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, User, Mail, Shield, Search, Calendar, Loader2, AlertCircle, 
  Sparkles, DollarSign, Database, Activity, Filter, BarChart3 
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { supabase } from '@/src/integrations/supabase/client';

interface UserData {
  id: string;
  displayName: string;
  email: string;
  planName: string;
  createdAt: string;
}

export default function AdminUsers() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<UserData[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Define o mês atual local (ex: "2026-06") como padrão de forma segura contra fuso-horários
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  });

  // Gera dinamicamente a lista dos últimos 24 meses para seleção no dropdown
  const getAvailableMonths = () => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 24; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      options.push(`${y}-${m}`);
    }
    return options;
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Busca usuários via Edge Function
        const { data: userData, error: funcError } = await supabase.functions.invoke('admin-get-users');

        if (funcError) throw funcError;
        if (!userData) throw new Error("Nenhum dado retornado de usuários.");

        const formattedUsers: UserData[] = userData.map((u: any) => ({
          id: u.id,
          displayName: u.full_name || 'Usuário Sem Nome',
          email: u.email || 'N/A',
          planName: u.plans?.name || 'Gratuito',
          createdAt: u.updated_at ? new Date(u.updated_at).toLocaleDateString('pt-BR') : 'N/A',
        }));
        
        setUsers(formattedUsers);

        // 2. Busca logs de consumo de créditos e tokens do banco filtrando diretamente no banco (Database-side filtering)
        let query = supabase
          .from('credits_log')
          .select('user_id, prompt_tokens, candidates_tokens, total_tokens, estimated_cost_usd, created_at')
          .order('created_at', { ascending: false });

        if (selectedMonth !== 'all') {
          const [year, monthStr] = selectedMonth.split('-');
          const yearNum = parseInt(year, 10);
          const monthNum = parseInt(monthStr, 10);
          
          // Define os limites UTC seguros do mês selecionado
          const startDate = new Date(Date.UTC(yearNum, monthNum - 1, 1, 0, 0, 0)).toISOString();
          const endDate = new Date(Date.UTC(yearNum, monthNum, 1, 0, 0, 0)).toISOString();
          
          query = query
            .gte('created_at', startDate)
            .lt('created_at', endDate);
        }

        const { data: logsData, error: logsError } = await query;

        if (logsError) throw logsError;
        setLogs(logsData || []);

      } catch (err: any) {
        console.error("Erro ao carregar dados do painel de administração:", err);
        setError(err.message || "Erro de permissão ao carregar dados.");
        setUsers([]);
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedMonth]); // Recarrega os dados do banco toda vez que o mês selecionado é alterado

  const formatMonthLabel = (yearMonth: string) => {
    const [year, monthStr] = yearMonth.split('-');
    const monthNames = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    const monthIdx = parseInt(monthStr, 10) - 1;
    return `${monthNames[monthIdx]} de ${year}`;
  };

  // Métricas Globais (KPIs) com base nos logs filtrados no banco
  const totalTokens = logs.reduce((acc, log) => acc + (log.total_tokens || 0), 0);
  const totalCost = logs.reduce((acc, log) => acc + (Number(log.estimated_cost_usd) || 0), 0);
  const totalGenerations = logs.filter(log => log.total_tokens > 0).length;

  const avgTokensPerGen = totalGenerations > 0 ? Math.round(totalTokens / totalGenerations) : 0;
  const avgCostPerGen = totalGenerations > 0 ? (totalCost / totalGenerations) : 0;

  // Mapear logs de consumo agrupados por ID de usuário
  const userStatsMap = logs.reduce((acc: any, log) => {
    const userId = log.user_id;
    if (!acc[userId]) {
      acc[userId] = {
        tokens: 0,
        cost: 0,
        generations: 0
      };
    }
    acc[userId].tokens += (log.total_tokens || 0);
    acc[userId].cost += (Number(log.estimated_cost_usd) || 0);
    if (log.total_tokens > 0) {
      acc[userId].generations += 1;
    }
    return acc;
  }, {});

  const filteredUsers = users.filter(u =>
    u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-32">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl text-[var(--text-secondary)] hover:text-yellow-500 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex flex-col">
            <h1 className="text-xl text-yellow-500 font-bold">Painel de Usuários e IA</h1>
            <p className="text-[10px] text-[var(--text-secondary)] font-medium uppercase tracking-tighter">Observabilidade e Custos em Tempo Real</p>
          </div>
        </div>

        {/* Seletor Mensal de Custos */}
        <div className="flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border-color)] px-4 py-2 rounded-2xl w-full sm:w-auto">
          <Filter size={16} className="text-yellow-500" />
          <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider hidden md:inline">Período:</span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-transparent text-sm font-bold text-[var(--text-primary)] focus:outline-none cursor-pointer w-full sm:w-auto"
          >
            <option value="all" className="bg-[var(--bg-card)] text-zinc-900">Todos os Períodos</option>
            {getAvailableMonths().map(m => (
              <option key={m} value={m} className="bg-white text-zinc-900 font-semibold">
                {formatMonthLabel(m)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Seção de KPIs Globais no Topo */}
      {!loading && !error && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total de Tokens */}
          <div className="p-6 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[2rem] flex flex-col justify-between group hover:border-yellow-500/20 transition-all">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Tokens Consumidos</span>
              <Database className="text-yellow-500 group-hover:scale-110 transition-transform" size={20} />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-mono text-[var(--text-primary)] truncate">
                {totalTokens.toLocaleString('pt-BR')}
              </h2>
              <p className="text-[10px] text-[var(--text-secondary)] mt-1 uppercase tracking-tight">Prompt & Respostas</p>
            </div>
          </div>

          {/* Card 2: Custo Total */}
          <div className="p-6 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[2rem] flex flex-col justify-between group hover:border-yellow-500/20 transition-all">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Custo Estimado</span>
              <DollarSign className="text-yellow-500 group-hover:scale-110 transition-transform" size={20} />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-mono text-yellow-500 truncate">
                ${totalCost.toFixed(4)}
              </h2>
              <p className="text-[10px] text-[var(--text-secondary)] mt-1 uppercase tracking-tight">Conversão em USD</p>
            </div>
          </div>

          {/* Card 3: Média de Tokens */}
          <div className="p-6 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[2rem] flex flex-col justify-between group hover:border-yellow-500/20 transition-all">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Média por Geração</span>
              <Activity className="text-yellow-500 group-hover:scale-110 transition-transform" size={20} />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-mono text-[var(--text-primary)] truncate">
                {avgTokensPerGen.toLocaleString('pt-BR')}
              </h2>
              <p className="text-[10px] text-[var(--text-secondary)] mt-1 uppercase tracking-tight">Tokens por Clique</p>
            </div>
          </div>

          {/* Card 4: Custo Médio por Geração */}
          <div className="p-6 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[2rem] flex flex-col justify-between group hover:border-yellow-500/20 transition-all">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Custo Médio / Gen</span>
              <BarChart3 className="text-yellow-500 group-hover:scale-110 transition-transform" size={20} />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-mono text-yellow-500 truncate">
                ${avgCostPerGen.toFixed(5)}
              </h2>
              <p className="text-[10px] text-[var(--text-secondary)] mt-1 uppercase tracking-tight">Dólares por Clique</p>
            </div>
          </div>
        </div>
      )}

      {/* Caixa de Busca */}
      <div className="relative group">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar usuários por nome ou email..."
          className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl px-6 py-4 pl-12 focus:outline-none focus:border-yellow-500/50 transition-all"
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={20} />
      </div>

      {error && (
        <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-4 text-red-500 text-sm">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Lista de Usuários com Indicadores de Tokens individuais */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">
            {loading ? 'Carregando...' : `${filteredUsers.length} Usuários Encontrados`}
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-yellow-500" size={32} />
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredUsers.map((user) => {
              // Obter estatísticas do usuário no período selecionado
              const stats = userStatsMap[user.id] || { tokens: 0, cost: 0, generations: 0 };
              const avgUserTokens = stats.generations > 0 ? Math.round(stats.tokens / stats.generations) : 0;
              const avgUserCost = stats.generations > 0 ? (stats.cost / stats.generations) : 0;

              return (
                <div 
                  key={user.id}
                  className="p-6 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[2rem] hover:border-yellow-500/30 transition-all group"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 bg-yellow-500/10 rounded-2xl flex-shrink-0 flex items-center justify-center text-yellow-500">
                        <User size={24} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-[var(--text-primary)] group-hover:text-yellow-500 transition-colors truncate">
                          {user.displayName}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] break-all sm:truncate">
                          <Mail size={12} className="flex-shrink-0" />
                          {user.email}
                        </div>
                      </div>
                    </div>
                    
                    {/* Linha de Plano e Cadastro */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[var(--border-color)] border-dashed">
                      <div className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap",
                        user.planName === 'Gratuito' 
                          ? "bg-[var(--bg-main)] text-[var(--text-secondary)] border border-[var(--border-color)]"
                          : "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
                      )}>
                        <Shield size={10} />
                        {user.planName}
                      </div>

                      <div className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">
                        <Calendar size={12} className="text-yellow-500/50" />
                        <span className="opacity-60">Cadastrado em:</span>
                        <span className="text-[var(--text-primary)]">{user.createdAt}</span>
                      </div>
                    </div>

                    {/* Grade de Estatísticas Individuais de Tokens e Custos */}
                    <div className="mt-2 pt-4 border-t border-[var(--border-color)]/30 border-dashed grid grid-cols-3 gap-3 text-center">
                      <div className="bg-[var(--bg-main)]/50 p-3 rounded-2xl border border-[var(--border-color)]/50">
                        <span className="text-[9px] font-bold text-[var(--text-secondary)] uppercase block tracking-wider mb-1">Tokens Consumidos</span>
                        <span className="text-xs sm:text-sm font-bold text-[var(--text-primary)] font-mono">{stats.tokens.toLocaleString('pt-BR')}</span>
                      </div>
                      <div className="bg-[var(--bg-main)]/50 p-3 rounded-2xl border border-[var(--border-color)]/50">
                        <span className="text-[9px] font-bold text-[var(--text-secondary)] uppercase block tracking-wider mb-1">Custo Estimado</span>
                        <span className="text-xs sm:text-sm font-bold text-yellow-500 font-mono">${stats.cost.toFixed(4)}</span>
                      </div>
                      <div className="bg-[var(--bg-main)]/50 p-3 rounded-2xl border border-[var(--border-color)]/50 flex flex-col justify-center">
                        <span className="text-[9px] font-bold text-[var(--text-secondary)] uppercase block tracking-wider mb-1">Média por Clique</span>
                        <span className="text-[10px] font-bold text-[var(--text-primary)] font-mono leading-none">{stats.generations > 0 ? `${avgUserTokens.toLocaleString('pt-BR')} t` : '0 t'}</span>
                        <span className="text-[9px] text-yellow-500/80 font-mono mt-0.5 block leading-none">${avgUserCost.toFixed(5)}</span>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}