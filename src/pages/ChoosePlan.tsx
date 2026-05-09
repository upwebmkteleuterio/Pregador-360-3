import React from 'react';
import { useStore } from '@/src/store/useStore';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Check, Zap, ShieldCheck, HelpCircle } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export default function ChoosePlan() {
  const navigate = useNavigate();
  const { plans, subscription, auth } = useStore();

  const handleSelectPlan = (planId: string, type: 'free' | 'pro', paymentLink?: string) => {
    const isCurrent = subscription.planId === planId;
    if (isCurrent) return;

    if (type === 'free') {
      navigate('/profile');
      return;
    }

    if (paymentLink) {
      try {
        const checkoutUrl = new URL(paymentLink);
        if (auth.user?.name) checkoutUrl.searchParams.append('name', auth.user.name);
        if (auth.user?.email) checkoutUrl.searchParams.append('email', auth.user.email);
        
        window.open(checkoutUrl.toString(), '_blank');
      } catch (e) {
        window.open(paymentLink, '_blank');
      }
    } else {
      alert('Link de pagamento não configurado.');
    }
  };

  return (
    <div className="space-y-12 pb-32">
       <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="p-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl text-[var(--text-secondary)] hover:text-yellow-500 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-xl text-yellow-500 font-bold">Assinaturas</h1>
      </div>

      <div className="text-center space-y-4 px-4">
        <h2 className="text-4xl font-bold text-yellow-500 leading-tight">Escolha seu Plano</h2>
        <p className="text-[var(--text-secondary)] text-sm leading-relaxed max-w-xs mx-auto">
          Potencialize seu ministério com o melhor da tecnologia homilética. Selecione o acesso que melhor atende ao seu chamado.
        </p>
      </div>

      <div className="space-y-8">
        {plans.map((plan) => {
          const isCurrent = subscription.planId === plan.id;

          return (
            <div 
              key={plan.id}
              className={cn(
                "relative p-8 rounded-[2.5rem] border transition-all",
                plan.recommended 
                  ? "bg-[var(--bg-card)] border-yellow-500 shadow-2xl shadow-yellow-500/5 scale-[1.02]" 
                  : "bg-[var(--bg-card)] border-[var(--border-color)] opacity-80",
                isCurrent && "border-green-500/50"
              )}
            >
              {plan.recommended && (
                <div className="absolute -top-3 right-8 px-4 py-1 bg-yellow-500 text-zinc-950 text-[10px] font-bold uppercase tracking-widest rounded-full">
                  Recomendado
                </div>
              )}

              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-3xl font-bold text-[var(--text-primary)]">{plan.name}</h3>
                  <p className="text-[var(--text-secondary)] text-xs leading-relaxed">{plan.description}</p>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-xl text-[var(--text-secondary)]">R$</span>
                  <span className="text-5xl font-bold text-[var(--text-primary)]">{plan.price}</span>
                  <span className="text-[var(--text-secondary)]">/mês</span>
                </div>

                <div className="space-y-4 pt-4">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className={cn(
                        "h-5 w-5 rounded-full flex items-center justify-center",
                        plan.recommended ? "bg-yellow-500/20 text-yellow-500" : "bg-[var(--bg-main)] text-[var(--text-secondary)]"
                      )}>
                        {plan.recommended ? <Zap size={10} fill="currentColor" /> : <Check size={12} />}
                      </div>
                      <span className="text-xs text-[var(--text-primary)] font-medium">{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleSelectPlan(plan.id, plan.type, plan.paymentLink)}
                  className={cn(
                    "w-full py-5 rounded-2xl font-bold uppercase tracking-[0.2em] transition-all active:scale-[0.98]",
                    isCurrent 
                      ? "bg-green-500/10 text-green-500 border border-green-500/20" 
                      : plan.recommended
                        ? "bg-yellow-500 text-zinc-950 shadow-lg shadow-yellow-500/20"
                        : "bg-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  )}
                >
                  {isCurrent ? 'Plano Atual' : (plan.type === 'free' ? 'Voltar ao Básico' : 'Assinar Agora')}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-8 pt-12">
        <h3 className="text-2xl font-bold text-center text-[var(--text-primary)]">Perguntas Frequentes</h3>
        <div className="space-y-4">
          <div className="p-6 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl space-y-3">
             <div className="flex items-center gap-3 text-yellow-500">
                <HelpCircle size={18} />
                <h4 className="font-bold text-sm">Posso cancelar a qualquer momento?</h4>
             </div>
             <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
               Sim, você pode cancelar sua assinatura a qualquer momento. Seu acesso continuará ativo até o final do período já pago, sem multas ou taxas ocultas.
             </p>
          </div>
          <div className="p-6 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl space-y-3">
             <div className="flex items-center gap-3 text-yellow-500">
                <ShieldCheck size={18} />
                <h4 className="font-bold text-sm">Meus dados e esboços estão seguros?</h4>
             </div>
             <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
               Absolutamente. Utilizamos criptografia de ponta a ponta e servidores dedicados para garantir que sua propriedade intelectual e dados pessoais permaneceram estritamente confidenciais.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}