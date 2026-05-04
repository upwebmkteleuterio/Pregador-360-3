import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Trash2, Check, ExternalLink, CreditCard, Sparkles, Loader2, Save, AlertCircle } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useStore, Plan } from '@/src/store/useStore';
import { databaseService } from '../services/databaseService';
import { Skeleton } from '../components/ui/Skeleton';

export default function AdminPlans() {
  const navigate = useNavigate();
  const { plans, updatePlan, addPlan, deletePlan, setPlans } = useStore();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(true);

  const formatCurrency = (value: any) => {
    if (typeof value === 'number') {
      return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    const digits = value.toString().replace(/\D/g, '');
    const floatValue = parseInt(digits) / 100;
    if (isNaN(floatValue)) return '0,00';
    return floatValue.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  useEffect(() => {
    const refreshPlans = async () => {
      try {
        const { data } = await databaseService.fetchPlans();
        if (data) {
          setPlans(data.map((p: any) => ({
            id: p.id,
            name: p.name,
            description: p.description || '',
            price: formatCurrency(p.price || 0),
            credits: p.credits || 0,
            paymentLink: p.payment_link || '',
            kiwifyProductId: p.kiwify_product_id || '',
            features: p.features || [],
            recommended: p.is_recommended || false,
            type: p.type || 'pro'
          })));
        }
      } catch (err) {
        console.error("Erro ao sincronizar planos:", err);
      } finally {
        setTimeout(() => setIsRefreshing(false), 500);
      }
    };
    refreshPlans();
  }, [setPlans]);

  const handleSave = async (id: string) => {
    setLoadingId(id);
    const plan = plans.find(p => p.id === id);
    if (!plan) return;

    try {
      const { error } = await databaseService.savePlan(plan);
      if (error) throw error;
      alert('Plano atualizado com sucesso!');
    } catch (err: any) {
      console.error("[AdminPlans] Save error:", err);
      alert(`Erro ao salvar: ${err.message || 'Verifique as permissões'}`);
    } finally {
      setLoadingId(null);
    }
  };

  const handleTypeToggle = (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;
    if (plan.type === 'pro') {
      updatePlan(planId, { type: 'free', price: '0,00', paymentLink: '' });
    } else {
      updatePlan(planId, { type: 'pro' });
    }
  };

  const handlePriceChange = (planId: string, value: string) => {
    const maskedValue = formatCurrency(value);
    updatePlan(planId, { price: maskedValue });
  };

  const updateBenefit = (planId: string, index: number, value: string) => {
    const plan = plans.find(p => p.id === planId);
    if (plan) {
      const newFeatures = [...plan.features];
      newFeatures[index] = value;
      updatePlan(planId, { features: newFeatures });
    }
  };

  const addBenefit = (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (plan) {
      updatePlan(planId, { features: [...plan.features, 'Novo benefício'] });
    }
  };

  const removeBenefit = (planId: string, index: number) => {
    const plan = plans.find(p => p.id === planId);
    if (plan) {
      updatePlan(planId, { features: plan.features.filter((_, i) => i !== index) });
    }
  };

  const createNewPlan = async () => {
    const name = prompt('Nome do novo plano:');
    if (!name) return;
    
    const newPlan: Partial<Plan> = {
      name,
      description: 'Descrição do plano',
      price: '0,00',
      credits: 30,
      paymentLink: '',
      kiwifyProductId: '',
      features: [],
      recommended: false,
      type: 'pro'
    };

    try {
      const { data, error } = await databaseService.savePlan(newPlan);
      if (data && !error) {
        addPlan({
          ...data,
          price: formatCurrency(data.price || 0),
          paymentLink: data.payment_link || '',
          kiwifyProductId: data.kiwify_product_id || '',
          recommended: data.is_recommended || false
        } as Plan);
      }
    } catch (err) {
      alert('Erro ao criar plano.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este plano permanentemente?')) return;
    try {
      const { error } = await databaseService.deletePlan(id);
      if (!error) {
        deletePlan(id);
      }
    } catch (err) {
      alert('Erro ao excluir.');
    }
  };

  if (isRefreshing) {
    return (
      <div className="space-y-8 pb-32">
        <div className="flex items-center gap-4">
          <Skeleton className="size-12 rounded-xl" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid gap-6">
          {[1, 2].map(i => (
            <div key={i} className="p-8 rounded-[2.5rem] border border-[var(--border-color)] bg-[var(--bg-card)] space-y-6">
              <Skeleton className="h-20 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-32">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="p-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl text-[var(--text-secondary)] hover:text-yellow-500 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-xl text-yellow-500 font-bold">Gestão de Planos</h1>
      </div>

      <div className="grid gap-6">
        {plans.map((plan) => (
          <div 
            key={plan.id}
            className={cn(
              "p-8 rounded-[2.5rem] border bg-[var(--bg-card)] transition-all relative overflow-hidden",
              plan.recommended ? "border-yellow-500 shadow-2xl shadow-yellow-500/5" : "border-[var(--border-color)]"
            )}
          >
            {loadingId === plan.id && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-10 flex items-center justify-center">
                <Loader2 className="animate-spin text-yellow-500" size={32} />
              </div>
            )}

            <div className="grid gap-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1 flex-1 mr-4">
                  <input 
                    value={plan.name || ''}
                    onChange={(e) => updatePlan(plan.id, { name: e.target.value })}
                    className="text-2xl font-bold bg-transparent text-[var(--text-primary)] border-b border-transparent focus:border-yellow-500 outline-none w-full"
                    placeholder="Nome do Plano"
                  />
                  <input 
                    value={plan.description || ''}
                    onChange={(e) => updatePlan(plan.id, { description: e.target.value })}
                    className="text-xs text-[var(--text-secondary)] bg-transparent border-b border-transparent focus:border-yellow-500 outline-none w-full"
                    placeholder="Breve descrição"
                  />
                </div>
                
                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => handleTypeToggle(plan.id)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all",
                      plan.type === 'free' ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-[var(--bg-main)] text-[var(--text-secondary)] border-[var(--border-color)]"
                    )}
                  >
                    {plan.type === 'free' ? 'PLANO GRATUITO' : 'TIPO: PREMIUM'}
                  </button>
                  
                  <button 
                    onClick={() => handleSave(plan.id)}
                    className="p-2 bg-yellow-500 text-zinc-950 rounded-lg flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
                  >
                    <Save size={14} /> SALVAR
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest pl-1">VALOR MENSAL (R$)</label>
                  <div className="relative">
                    <input 
                      type="text"
                      value={plan.price || '0,00'}
                      disabled={plan.type === 'free'}
                      onChange={(e) => handlePriceChange(plan.id, e.target.value)}
                      className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl p-4 text-sm text-[var(--text-primary)] focus:border-yellow-500 outline-none disabled:opacity-50 text-right font-mono"
                    />
                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] opacity-50" size={16} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest pl-1">CRÉDITOS IA</label>
                  <input 
                    type="number"
                    value={plan.credits || 0}
                    onChange={(e) => updatePlan(plan.id, { credits: parseInt(e.target.value) || 0 })}
                    className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl p-4 text-sm text-[var(--text-primary)] focus:border-yellow-500 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest pl-1">ID DO PRODUTO (KIWIFY)</label>
                <input 
                  type="text"
                  value={plan.kiwifyProductId || ''}
                  onChange={(e) => updatePlan(plan.id, { kiwifyProductId: e.target.value })}
                  className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl p-4 text-xs text-yellow-500/70 focus:border-yellow-500 outline-none"
                  placeholder="Ex: 7b5dc633-..."
                />
              </div>

              {plan.type === 'pro' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest pl-1">LINK DE PAGAMENTO</label>
                  <input 
                    type="text"
                    value={plan.paymentLink || ''}
                    onChange={(e) => updatePlan(plan.id, { paymentLink: e.target.value })}
                    className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl p-4 text-xs text-blue-400 focus:border-yellow-500 outline-none"
                    placeholder="https://..."
                  />
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between pl-1">
                  <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">BENEFÍCIOS</label>
                  <button onClick={() => addBenefit(plan.id)} className="p-1 px-3 bg-yellow-500/10 text-yellow-500 rounded-lg text-[10px] font-bold flex items-center gap-1 hover:bg-yellow-500">
                    <Plus size={12} /> ADD
                  </button>
                </div>
                <div className="space-y-2">
                  {(plan.features || []).map((feature, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-3 p-4 bg-[var(--bg-main)] rounded-xl border border-[var(--border-color)] group/item transition-all focus-within:border-yellow-500/50">
                      <input 
                        value={feature || ''}
                        onChange={(e) => updateBenefit(plan.id, idx, e.target.value)}
                        className="bg-transparent text-xs text-[var(--text-primary)] outline-none w-full font-medium"
                      />
                      <button onClick={() => removeBenefit(plan.id, idx)} className="p-1 text-red-500 opacity-0 group-hover/item:opacity-100">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-[var(--border-color)]">
                <button
                  onClick={() => updatePlan(plan.id, { recommended: !plan.recommended })}
                  className={cn(
                    "flex-1 py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                    plan.recommended ? "bg-yellow-500 text-zinc-950" : "bg-[var(--border-color)] text-[var(--text-secondary)]"
                  )}
                >
                  {plan.recommended ? 'RECOMENDADO' : 'DEFINIR RECOMENDADO'}
                </button>
                <button onClick={() => handleDelete(plan.id)} className="p-4 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all">
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button 
        onClick={createNewPlan}
        className="w-full py-8 bg-[var(--bg-card)] border-2 border-dashed border-[var(--border-color)] rounded-[2rem] text-[var(--text-secondary)] hover:text-yellow-500 hover:border-yellow-500/50 transition-all flex flex-col items-center gap-2"
      >
        <Plus size={32} />
        <span className="text-sm font-bold uppercase tracking-widest">Novo Plano</span>
      </button>
    </div>
  );
}
