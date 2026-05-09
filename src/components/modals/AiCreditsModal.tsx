"use client";

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, User, CreditCard, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '@/src/store/useStore';
import { ModalBase } from './ModalBase';

export function AiCreditsModal() {
  const { modals, setModalState, subscription, auth } = useStore();
  const navigate = useNavigate();

  const totalCredits = subscription.totalCredits || 30;
  const remaining = subscription.credits;
  
  const percentage = Math.min(100, Math.max(0, (remaining / totalCredits) * 100));
  const consumed = Math.max(0, totalCredits - remaining);

  const getStatusDisplay = () => {
    if (subscription.planType === 'free') return 'Gratuito';
    return subscription.status === 'active' ? 'Ativo' : 'Pendente';
  };

  return (
    <ModalBase
      title="Créditos de IA"
      isOpen={modals.aiCreditsOpen}
      onClose={() => setModalState('aiCreditsOpen', false)}
      type="side"
    >
      <div className="flex flex-col h-full">
        <div className="flex-1 space-y-8 no-scrollbar">
          <div className="p-6 bg-[var(--border-color)]/30 rounded-[2rem] border border-[var(--border-color)]">
            <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest block mb-1">Status Atual</span>
            <div className="flex justify-between items-end mb-6">
              <div>
                <p className="text-xl font-bold text-[var(--text-primary)]">{subscription.planName}</p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">Status: {getStatusDisplay()}</p>
              </div>
              <Sparkles className="text-yellow-500" size={24} />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                <span className="text-[var(--text-secondary)]">Saldo Disponível</span>
                <span className="text-[var(--text-primary)] font-mono">{remaining} / {totalCredits}</span>
              </div>
              <div className="h-2 bg-[var(--bg-main)] rounded-full overflow-hidden border border-[var(--border-color)]/50">
                <motion.div 
                  initial={false}
                  animate={{ width: `${percentage}%` }}
                  transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                  className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 bg-[var(--border-color)]/30 rounded-[2rem] border border-[var(--border-color)]">
              <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest block mb-1">Disponíveis</span>
              <p className="text-2xl font-bold text-[var(--text-primary)] font-mono">{remaining}</p>
            </div>
            <div className="p-6 bg-[var(--border-color)]/30 rounded-[2rem] border border-[var(--border-color)]">
              <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest block mb-1">Consumidos</span>
              <p className="text-2xl font-bold text-yellow-500/70 font-mono">{consumed}</p>
            </div>
          </div>

          <div className="pt-4 space-y-4">
            <button
              onClick={() => {
                setModalState('aiCreditsOpen', false);
                navigate('/plans');
              }}
              className="w-full py-4 rounded-2xl bg-yellow-500 text-zinc-950 font-bold text-sm uppercase tracking-widest hover:bg-yellow-400 active:scale-95 transition-all shadow-lg shadow-yellow-500/20"
            >
              Turbinar Créditos
            </button>

            <div className="p-5 bg-[var(--bg-main)]/50 rounded-2xl border border-[var(--border-color)]/50 space-y-3">
              <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.15em] mb-1">Tabela de Consumo</p>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[var(--text-secondary)]">Geração de Sermão</span>
                <span className="font-bold text-yellow-500">-1 crédito</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[var(--text-secondary)]">Geração de Ilustração</span>
                <span className="font-bold text-yellow-500">-1 crédito</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[var(--text-secondary)]">Pesquisa Bíblica IA</span>
                <span className="font-bold text-yellow-500">-1 crédito</span>
              </div>
            </div>

            {auth.user?.isAdmin && (
              <div className="pt-6 border-t border-[var(--border-color)] space-y-3">
                <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest px-2 mb-1">Administração</p>
                <AdminLink icon={<User size={18}/>} label="Usuários" onClick={() => navigate('/admin/users')} />
                <AdminLink icon={<CreditCard size={18}/>} label="Planos" onClick={() => navigate('/admin/plans')} />
              </div>
            )}
          </div>
        </div>

        <div className="pt-8 text-center mt-auto border-t border-[var(--border-color)] border-dashed">
          <p className="text-[10px] text-[var(--text-secondary)]">
            Seus créditos são renovados mensalmente.
          </p>
        </div>
      </div>
    </ModalBase>
  );
}

function AdminLink({ icon, label, onClick }: { icon: any, label: string, onClick: () => void }) {
  const { setModalState } = useStore();
  return (
    <button
      onClick={() => {
        setModalState('aiCreditsOpen', false);
        onClick();
      }}
      className="w-full flex items-center justify-between p-4 bg-[var(--border-color)]/20 rounded-2xl border border-[var(--border-color)] hover:border-yellow-500/50 transition-all group"
    >
      <div className="flex items-center gap-3">
        <span className="text-yellow-500">{icon}</span>
        <span className="text-sm font-semibold text-[var(--text-primary)]">{label}</span>
      </div>
      <ChevronRight size={16} className="text-[var(--text-secondary)] group-hover:text-yellow-500" />
    </button>
  );
}