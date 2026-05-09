import React from 'react';
import { ReceiptText, CheckCircle2, Calendar, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/src/store/useStore';
import { cn } from '@/src/lib/utils';

export default function Subscription() {
  const navigate = useNavigate();
  const { subscription, payments, plans } = useStore();

  const currentPlanData = plans.find(p => p.id === subscription.planId);
  const planPrice = currentPlanData?.price || (subscription.planType === 'free' ? '0,00' : '39,90');

  const isActive = subscription.planType === 'free' || subscription.status === 'active';

  const getStatusColor = (status: string) => {
    switch(status.toLowerCase()) {
      case 'paid': 
      case 'success':
      case 'succeeded':
        return 'text-green-500';
      case 'pending':
        return 'text-yellow-500';
      default:
        return 'text-red-500';
    }
  };

  const getStatusText = (status: string) => {
    switch(status.toLowerCase()) {
      case 'paid': 
      case 'success':
      case 'succeeded':
        return 'Pago com sucesso';
      case 'pending':
        return 'Pendente';
      default:
        return 'Falhou';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 pt-8 pb-24">
      <button 
        onClick={() => navigate(-1)}
        className="md:hidden flex items-center gap-2 text-[var(--text-secondary)] mb-8 active:scale-95 transition-transform"
      >
        <ChevronLeft size={20} />
        <span className="text-sm font-bold uppercase tracking-widest font-sans">Voltar</span>
      </button>

      <header className="mb-12">
        <h1 className="text-4xl md:text-[3.5rem] text-[var(--text-primary)] leading-tight tracking-tight">
          Assinatura
        </h1>
        <p className="font-sans text-[var(--text-secondary)] text-sm mt-2 max-w-lg">
          Gerencie seu plano ministerial e visualize seu histórico de faturamento.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        <div className="lg:col-span-7 flex flex-col gap-8">
          <section className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[2rem] p-8 md:p-10 relative overflow-hidden group shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none transition-all duration-700 group-hover:bg-yellow-500/20" />
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="font-sans text-xs font-bold uppercase tracking-widest text-yellow-500 mb-2 block">
                    Seu Plano Atual
                  </span>
                  <h2 className="text-2xl text-[var(--text-primary)]">{subscription.planName}</h2>
                </div>
                <div className="bg-[var(--bg-card)]/50 px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-[var(--border-color)]/50">
                  <span className={cn(
                    "w-2 h-2 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)]",
                    isActive ? "bg-green-500 animate-pulse" : "bg-red-500"
                  )} />
                  <span className="font-sans text-[10px] text-[var(--text-secondary)] font-bold uppercase">
                    {isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>

              <div className="mb-10">
                <div className="flex items-end gap-1">
                  <span className="text-xl text-[var(--text-secondary)] pb-1">R$</span>
                  <span className="text-5xl font-bold text-[var(--text-primary)] leading-none">{planPrice}</span>
                  <span className="font-sans text-[var(--text-secondary)] text-sm pb-1">/mês</span>
                </div>
                <p className="font-sans text-xs text-[var(--text-secondary)] mt-4 flex items-center gap-2">
                  <Calendar size={16} className="text-yellow-500" />
                  Próxima renovação em <span className="text-[var(--text-primary)] font-bold">{subscription.nextRenewalDate}</span>
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => navigate('/plans')}
                  className="bg-gradient-to-br from-yellow-400 to-yellow-600 text-zinc-950 font-bold py-4 px-6 rounded-2xl shadow-lg shadow-yellow-500/20 hover:scale-[1.02] active:scale-95 transition-all flex-1 text-center text-xs uppercase tracking-widest"
                >
                  Mudar Plano
                </button>
                <button className="bg-[var(--bg-main)] text-[var(--text-secondary)] font-medium py-4 px-6 rounded-2xl border border-[var(--border-color)] hover:text-red-500 transition-all flex-1 text-center text-xs uppercase tracking-widest">
                  Cancelar Assinatura
                </button>
              </div>
            </div>
          </section>

          <section className="bg-[var(--bg-card)]/50 rounded-[2rem] p-8 border border-[var(--border-color)]">
            <h3 className="text-xl text-[var(--text-primary)] mb-6">Informação de Faturamento</h3>
            <div className="bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--border-color)] flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-8 bg-[var(--bg-main)] rounded flex items-center justify-center border border-[var(--border-color)]">
                  <div className="flex -space-x-1.5">
                    <div className="w-4 h-4 rounded-full bg-zinc-700" />
                    <div className="w-4 h-4 rounded-full bg-zinc-600" />
                  </div>
                </div>
                <div>
                  <p className="font-sans text-xs text-[var(--text-primary)] font-bold tracking-widest">
                    PAGAMENTO PROCESSADO VIA GATEWAY
                  </p>
                  <p className="font-sans text-[9px] text-[var(--text-secondary)] font-bold uppercase mt-1">
                    Os dados do seu cartão são criptografados e geridos pelo provedor de pagamentos.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-5">
          <section className="bg-[var(--bg-card)]/50 rounded-[2rem] p-8 border border-[var(--border-color)] h-full">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl text-[var(--text-primary)]">Faturas</h3>
            </div>
            
            <div className="space-y-6">
              {payments.length > 0 ? (
                payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between group cursor-default">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center text-yellow-500">
                        <ReceiptText size={18} />
                      </div>
                      <div>
                        <p className="font-sans text-sm text-[var(--text-primary)] font-medium">
                          {new Date(payment.paid_at || payment.paid_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                        <p className={cn(
                          "font-sans text-[10px] uppercase font-bold flex items-center gap-1 mt-1",
                          getStatusColor(payment.status)
                        )}>
                          <CheckCircle2 size={10} />
                          {getStatusText(payment.status)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="font-sans text-sm text-[var(--text-primary)] font-bold">R$ {payment.amount.toFixed(2)}</span>
                      <span className="text-[9px] text-[var(--text-secondary)] uppercase font-bold">{payment.payment_method || 'Cartão'}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 opacity-30">
                  <ReceiptText size={32} className="mx-auto mb-3" />
                  <p className="text-xs font-bold uppercase tracking-widest">Nenhuma fatura encontrada</p>
                </div>
              )}
            </div>

            <div className="mt-12 pt-8 border-t border-[var(--border-color)] text-center">
              <p className="font-sans text-[11px] text-[var(--text-secondary)] max-w-xs mx-auto leading-relaxed">
                Dúvidas sobre o faturamento? <br />
                <button className="text-yellow-500 font-bold hover:underline">Entre em contato com o suporte</button>.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}