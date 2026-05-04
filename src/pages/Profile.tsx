import React from 'react';
import { useStore } from '@/src/store/useStore';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/src/lib/utils';
import { 
  CreditCard, 
  Download, 
  CalendarClock, 
  Edit2, 
  Zap, 
  LogOut,
} from 'lucide-react';

export default function Profile() {
  const navigate = useNavigate();
  const { auth, subscription, setAuthState } = useStore();

  React.useEffect(() => {
    if (!auth.isAuthenticated) {
      navigate('/login');
    }
  }, [auth.isAuthenticated, navigate]);

  if (!auth.isAuthenticated) {
    return null;
  }

  const handleLogout = () => {
    setAuthState({ isAuthenticated: false, user: null });
    navigate('/');
  };

  const history = [
    { date: '15 de Outubro, 2023', amount: 'R$ 49,00', status: 'Pago com sucesso' },
    { date: '15 de Setembro, 2023', amount: 'R$ 49,00', status: 'Pago com sucesso' },
    { date: '15 de Agosto, 2023', amount: 'R$ 49,00', status: 'Pago com sucesso' },
  ];

  const getPlanName = () => {
    switch(subscription.plan) {
      case 'Free': return 'Plano Gratuito';
      case 'Premium': return 'Plano Pro';
      default: return 'Carregando...';
    }
  };

  const planPrice = () => {
    switch(subscription.plan) {
      case 'Free': return '0';
      case 'Premium': return '39,90';
      default: return '--';
    }
  };

  const isActive = subscription.plan === 'Free' || subscription.status === 'active';

  return (
    <div className="space-y-8 pb-32">
       <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold text-[var(--text-primary)] leading-tight">Assinatura</h1>
        <button 
          onClick={handleLogout}
          className="p-3 bg-red-500/10 text-red-500 rounded-xl"
        >
          <LogOut size={20} />
        </button>
      </div>

      <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
        Gerencie seu plano, métodos de pagamento e visualize seu histórico de faturamento.
      </p>

      {/* Plan Card */}
      <div className="relative p-8 rounded-[2.5rem] bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-main)] border border-[var(--border-color)] shadow-2xl overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
          <Zap size={120} />
        </div>

        <div className="space-y-8 relative">
          <div className="flex justify-between items-start">
             <div className="space-y-1">
                <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest pl-1">Seu Plano</span>
                <h3 className="text-3xl font-bold text-[var(--text-primary)]">{getPlanName()}</h3>
             </div>
             <div className={cn(
               "inline-flex items-center gap-2 px-3 py-1 rounded-full border",
               isActive
                ? "bg-green-500/10 border-green-500/20"
                : "bg-red-500/10 border-red-500/20"
             )}>
                <div className={cn(
                  "h-2 w-2 rounded-full animate-pulse",
                  isActive ? "bg-green-500" : "bg-red-500"
                )} />
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-widest",
                  isActive ? "text-green-500" : "text-red-500"
                )}>
                  {isActive ? 'Ativo' : 'Inativo'}
                </span>
             </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-xl text-[var(--text-secondary)]">R$</span>
            <span className="text-5xl font-bold text-[var(--text-primary)]">{planPrice()}</span>
            <span className="text-[var(--text-secondary)]">/mês</span>
          </div>

          <div className="flex items-center gap-3 p-4 bg-[var(--bg-main)]/50 rounded-2xl border border-[var(--border-color)]/50">
             <CalendarClock size={20} className="text-yellow-500" />
             <p className="text-xs text-[var(--text-secondary)]">
               Próxima renovação em <span className="text-[var(--text-primary)] font-bold">{subscription.nextRenewalDate}</span>
             </p>
          </div>

          <div className="space-y-3">
             <button 
              onClick={() => navigate('/plans')}
              className="w-full py-4 bg-yellow-500 text-zinc-950 rounded-2xl font-bold uppercase tracking-widest active:scale-[0.98] transition-all shadow-lg shadow-yellow-500/10"
             >
               Mudar Plano
             </button>
             <button className="w-full py-4 bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:text-red-500/70 transition-colors">
               Cancelar Assinatura
             </button>
          </div>
        </div>
      </div>

      {/* Payment Method */}
      <div className="space-y-4 pt-4">
        <h3 className="text-2xl font-bold text-[var(--text-primary)]">Forma de Pagamento</h3>
        <div className="p-6 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl flex items-center justify-between group">
           <div className="flex items-center gap-4">
              <div className="h-12 w-16 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl flex items-center justify-center p-2">
                 <img src="https://upload.wikimedia.org/wikipedia/commons/b/b7/MasterCard_Logo.svg" alt="Mastercard" className="h-full w-auto" />
              </div>
              <div className="space-y-1">
                 <div className="flex items-center gap-2">
                    <span className="text-[var(--text-secondary)] text-xs">•••• •••• ••••</span>
                    <span className="text-[var(--text-primary)] font-mono font-bold">4242</span>
                 </div>
                 <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-widest">Expira em 12/25</p>
              </div>
           </div>
           <button className="p-3 text-[var(--text-secondary)] hover:text-yellow-500 transition-colors">
              <Edit2 size={20} />
           </button>
        </div>
      </div>

      {/* Billing History */}
      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between">
           <h3 className="text-2xl font-bold text-[var(--text-primary)] leading-tight">Histórico de Pagamentos</h3>
           <button className="text-xs text-yellow-500/70 font-bold uppercase tracking-[0.2em]">Ver todos</button>
        </div>
        <div className="space-y-3">
          {history.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-5 bg-[var(--bg-card)]/50 border border-[var(--border-color)] rounded-3xl group hover:border-[var(--border-color)] transition-all">
               <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl flex items-center justify-center text-yellow-500">
                     <CreditCard size={20} />
                  </div>
                  <div className="space-y-1">
                     <div className="text-sm font-bold text-[var(--text-primary)]">{item.date}</div>
                     <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest">{item.status}</span>
                     </div>
                  </div>
               </div>
               <div className="flex flex-col items-end gap-1">
                  <span className="text-sm font-bold text-[var(--text-primary)]">{item.amount}</span>
                  <button className="text-[var(--text-secondary)] hover:text-yellow-500 transition-colors">
                     <Download size={16} />
                  </button>
               </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center py-12 px-6">
         <p className="text-xs text-[var(--text-secondary)] leading-relaxed max-w-xs mx-auto">
           Dúvidas sobre o faturamento? <button className="text-yellow-500 font-bold">Entre em contato com o suporte.</button>
         </p>
      </div>
    </div>
  );
}