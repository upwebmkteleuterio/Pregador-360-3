import React, { useState } from 'react';
import { useStore, MessageTone, ItemType, ContentItem } from '@/src/store/useStore';
import { cn } from '@/src/lib/utils';
import { Sparkles, Mic, FileText, Lightbulb, ChevronRight, Clock, List, Loader2, BookOpen, Heart, Flame, MessageSquareWarning, Wind, GraduationCap, Users, Church } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { generateAIContent } from '../services/geminiService';
import { databaseService } from '../services/databaseService';

const TONES: { label: MessageTone; icon: any }[] = [
  { label: 'Inspirador', icon: Sparkles },
  { label: 'Exortativo', icon: MessageSquareWarning },
  { label: 'Teológico', icon: BookOpen },
  { label: 'Acolhedor', icon: Heart },
  { label: 'Confrontador', icon: Flame },
  { label: 'Evangelístico', icon: Mic },
  { label: 'Profético', icon: Wind },
  { label: 'Didático', icon: GraduationCap },
  { label: 'Pastoral', icon: Users },
];

export default function Generate() {
  const navigate = useNavigate();
  const { generatorForm, setGeneratorForm, addItem, auth, setSubscriptionState, setModalState } = useStore();
  const [loading, setLoading] = useState(false);
  
  const handleGenerate = async () => {
    if (!generatorForm.topic.trim() || !auth.user?.id) return;
    
    setLoading(true);
    try {
      const data = await generateAIContent(
        generatorForm.type,
        generatorForm.topic,
        generatorForm.tone,
        auth.user.id
      );

      // Persistir no Supabase
      const contentId = await databaseService.saveNewContent(auth.user.id, {
        type: generatorForm.type,
        title: data.title,
        topic: data.topic || generatorForm.topic,
        tone: generatorForm.tone,
        content: data.content
      });

      if (contentId) {
        // Atualizar créditos no store local com o valor real retornado pela IA (que já descontou)
        if (data.remainingCredits !== undefined) {
          setSubscriptionState({ credits: data.remainingCredits });
        }
        
        // Atualizar store local para feedback imediato
        addItem({
          id: contentId,
          type: generatorForm.type,
          title: data.title,
          topic: data.topic || generatorForm.topic,
          tone: generatorForm.tone,
          content: data.content,
          tags: [],
          createdAt: new Date().toISOString(),
          versions: [{
            id: crypto.randomUUID(),
            title: data.title,
            content: data.content,
            createdAt: new Date().toISOString(),
            label: 'IA'
          }]
        });
        navigate(`/view/${contentId}`);
      }
    } catch (error: any) {
      console.error('Generation failed:', error);
      if (error.message === 'INSUFFICIENT_CREDITS') {
        setSubscriptionState({ credits: 0 });
        setModalState('aiCreditsOpen', true);
      } else {
        alert('Falha ao gerar conteúdo. Verifique sua conexão e tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Criar <span className="text-yellow-500">Inspiração</span></h1>
        <p className="mt-2 text-[var(--text-secondary)] text-sm leading-relaxed max-w-xs">
          Deixe os recursos digitais auxiliarem sua próxima mensagem com profundidade, revelação, propósito e transformação de vidas!
        </p>
      </div>

      <div className="flex p-1 bg-[var(--bg-card)] rounded-xl relative overflow-hidden">
        <motion.div
          className="absolute inset-y-1 bg-[var(--border-color)] rounded-lg shadow-lg z-0 flex items-center justify-center overflow-hidden"
          initial={false}
          animate={{
            x: generatorForm.type === 'Sermão' ? 0 : '100%',
            left: 4,
            right: 4,
            width: 'calc(50% - 4px)'
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
        {/* Toggle de Tipo */}
        {(['Sermão', 'Ilustração'] as ItemType[]).map((type) => (
          <button
            key={type}
            onClick={() => setGeneratorForm({ type })}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all relative z-10",
              generatorForm.type === type 
                ? "text-[var(--text-primary)]" 
                : "text-[var(--text-secondary)] hover:text-yellow-500"
            )}
          >
            {type === 'Sermão' ? <FileText size={16} /> : <Lightbulb size={16} />}
            {type}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <label className="text-[10px] font-bold tracking-widest text-[var(--text-secondary)] uppercase">
          {generatorForm.type === 'Sermão' ? 'TEMA OU VERSÍCULO BASE' : 'ASSUNTO DA ILUSTRAÇÃO'}
        </label>
        <div className="relative group">
          <input
            type="text"
            value={generatorForm.topic}
            onChange={(e) => setGeneratorForm({ topic: e.target.value })}
            placeholder={generatorForm.type === 'Sermão' ? "Ex: João 3:16 ou 'Amor Incondicional'" : "Ex: 'O valor do tempo' ou 'Mãos de um pai'"}
            className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl px-5 py-4 pl-12 focus:outline-none focus:border-yellow-500/50 transition-all group-hover:border-[var(--border-color)]"
          />
          <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-yellow-500 transition-colors" size={20} />
        </div>
      </div>
 
      {generatorForm.type === 'Sermão' && (
        <div className="space-y-4">
          <label className="text-[10px] font-bold tracking-widest text-[var(--text-secondary)] uppercase">
            TOM DA MENSAGEM
          </label>
          <div className="grid grid-cols-3 gap-2">
            {TONES.map((tone) => (
              <button
                key={tone.label}
                onClick={() => setGeneratorForm({ tone: tone.label })}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all text-center",
                  generatorForm.tone === tone.label
                    ? "bg-yellow-500/5 border-yellow-500 text-yellow-500 shadow-glow"
                    : "bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-yellow-500 font-medium"
                )}
              >
                <div className={cn(
                  "p-2 rounded-lg",
                  generatorForm.tone === tone.label ? "bg-yellow-500 text-zinc-950" : "bg-[var(--border-color)] text-[var(--text-secondary)]"
                )}>
                  <tone.icon size={16} />
                </div>
                <span className="text-[10px] sm:text-xs leading-tight">{tone.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <button
          onClick={handleGenerate}
          disabled={!generatorForm.topic.trim() || loading}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-5 rounded-2xl font-bold uppercase tracking-widest transition-all relative overflow-hidden",
            generatorForm.topic.trim() && !loading
              ? "bg-yellow-500 text-zinc-950 shadow-xl shadow-yellow-500/20 active:scale-[0.98]"
              : "bg-[var(--border-color)] text-[var(--text-secondary)] cursor-not-allowed"
          )}
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Gerando...
            </>
          ) : (
            <>
              <Sparkles size={20} />
              Gerar conteúdo
            </>
          )}
        </button>

        {loading && (
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-xs text-[var(--text-secondary)] font-medium"
          >
            Gerando seu conteúdo. Aguarde, isso pode levar até 1 minuto<span className="animate-pulse">...</span>
          </motion.p>
        )}
      </div>

      <style>{`
        .shadow-glow {
          box-shadow: 0 0 20px rgba(234, 179, 8, 0.1);
        }
      `}</style>
    </div>
  );
}