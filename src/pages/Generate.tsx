import React, { useState } from 'react';
import { useStore, MessageTone, ItemType } from '@/src/store/useStore';
import { cn } from '@/src/lib/utils';
import { Sparkles, Mic, FileText, Lightbulb, Loader2, BookOpen, Heart, Flame, MessageSquareWarning, Wind, GraduationCap, Users, Layers, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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

const EPISODE_OPTIONS = [4, 6, 8, 10];

export default function Generate() {
  const navigate = useNavigate();
  const { generatorForm, setGeneratorForm, addItem, auth, setSubscriptionState, setModalState } = useStore();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, stage: 'idle' as 'idle' | 'ai' | 'saving' });
  
  const handleGenerate = async () => {
    if (!generatorForm.topic.trim() || !auth.user?.id) return;
    
    setLoading(true);
    setProgress({ current: 0, total: generatorForm.type === 'Série' ? generatorForm.episodes : 1, stage: 'ai' });
    
    try {
      const data = await generateAIContent(
        generatorForm.type,
        generatorForm.topic,
        generatorForm.tone,
        generatorForm.episodes
      );

      if (data.remainingCredits !== undefined) {
        setSubscriptionState({ credits: data.remainingCredits });
      }

      if (generatorForm.type === 'Série' && data.episodes) {
        setProgress(prev => ({ ...prev, stage: 'saving' }));
        
        // 1. Salva o item "Pai" da série
        const seriesId = await databaseService.saveNewContent({
          type: 'Série',
          title: data.title,
          topic: data.topic || generatorForm.topic,
          tone: generatorForm.tone,
          content: `Série de ${data.episodes.length} episódios.`
        });

        if (seriesId) {
          const seriesItem = {
            id: seriesId,
            type: 'Série' as const,
            title: data.title,
            topic: data.topic || generatorForm.topic,
            tone: generatorForm.tone,
            content: `Série de ${data.episodes.length} episódios.`,
            tags: [],
            createdAt: new Date().toISOString(),
            versions: []
          };
          addItem(seriesItem);

          // 2. Salva cada episódio sequencialmente para atualizar o progresso visual
          for (let i = 0; i < data.episodes.length; i++) {
            const ep = data.episodes[i];
            const epId = await databaseService.saveNewContent({
              type: 'Sermão',
              title: ep.title,
              topic: generatorForm.topic,
              tone: generatorForm.tone,
              content: ep.content,
              parentSeriesId: seriesId
            });

            if (epId) {
              addItem({
                id: epId,
                type: 'Sermão',
                title: ep.title,
                topic: generatorForm.topic,
                tone: generatorForm.tone,
                content: ep.content,
                tags: [],
                createdAt: new Date().toISOString(),
                parentSeriesId: seriesId,
                versions: [{
                  id: crypto.randomUUID(),
                  title: ep.title,
                  content: ep.content,
                  createdAt: new Date().toISOString(),
                  label: 'IA'
                }]
              });
            }
            setProgress(prev => ({ ...prev, current: i + 1 }));
          }

          // 3. Navega para a tela da série
          navigate(`/series/${seriesId}`);
        }
      } else {
        // Geração normal (Sermão ou Ilustração)
        setProgress(prev => ({ ...prev, stage: 'saving' }));
        const contentId = await databaseService.saveNewContent({
          type: generatorForm.type,
          title: data.title,
          topic: data.topic || generatorForm.topic,
          tone: generatorForm.tone,
          content: data.content
        });

        if (contentId) {
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
          setProgress(prev => ({ ...prev, current: 1 }));
          navigate(`/view/${contentId}`);
        }
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
      setProgress({ current: 0, total: 0, stage: 'idle' });
    }
  };

  const types: { label: ItemType; icon: any }[] = [
    { label: 'Sermão', icon: FileText },
    { label: 'Série', icon: Layers },
    { label: 'Ilustração', icon: Lightbulb },
  ];

  const progressPercentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

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
            x: generatorForm.type === 'Sermão' ? 0 : generatorForm.type === 'Série' ? '100%' : '200%',
            left: 4,
            right: 4,
            width: 'calc(33.33% - 4px)'
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
        {types.map((type) => (
          <button
            key={type.label}
            onClick={() => setGeneratorForm({ type: type.label })}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-xs sm:text-sm font-medium transition-all relative z-10",
              generatorForm.type === type.label 
                ? "text-[var(--text-primary)]" 
                : "text-[var(--text-secondary)] hover:text-yellow-500"
            )}
          >
            <type.icon size={16} />
            {type.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <label className="text-[10px] font-bold tracking-widest text-[var(--text-secondary)] uppercase">
          {generatorForm.type === 'Sermão' ? 'TEMA OU VERSÍCULO BASE' : generatorForm.type === 'Série' ? 'TEMA CENTRAL DA SÉRIE' : 'ASSUNTO DA ILUSTRAÇÃO'}
        </label>
        <div className="relative group">
          <input
            type="text"
            value={generatorForm.topic}
            onChange={(e) => setGeneratorForm({ topic: e.target.value })}
            placeholder={
              generatorForm.type === 'Sermão' 
                ? "Ex: João 3:16 ou 'Amor Incondicional'" 
                : generatorForm.type === 'Série'
                  ? "Ex: 'O Fruto do Espírito' ou 'Caminhada com Abraão'"
                  : "Ex: 'O valor do tempo' ou 'Mãos de um pai'"
            }
            className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl px-5 py-4 pl-12 focus:outline-none focus:border-yellow-500/50 transition-all group-hover:border-[var(--border-color)] text-[var(--text-primary)]"
          />
          <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-yellow-500 transition-colors" size={20} />
        </div>
      </div>

      {generatorForm.type === 'Série' && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <label className="text-[10px] font-bold tracking-widest text-[var(--text-secondary)] uppercase">
            NÚMERO DE EPISÓDIOS
          </label>
          <div className="grid grid-cols-4 gap-2">
            {EPISODE_OPTIONS.map((num) => (
              <button
                key={num}
                onClick={() => setGeneratorForm({ episodes: num })}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all text-center",
                  generatorForm.episodes === num
                    ? "bg-yellow-500/5 border-yellow-500 text-yellow-500 shadow-glow"
                    : "bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-yellow-500 font-medium"
                )}
              >
                <div className={cn(
                  "p-2 rounded-lg",
                  generatorForm.episodes === num ? "bg-yellow-500 text-zinc-950" : "bg-[var(--border-color)] text-[var(--text-secondary)]"
                )}>
                  <Layers size={16} />
                </div>
                <span className="text-[10px] sm:text-xs leading-tight font-bold">{num} Episódios</span>
              </button>
            ))}
          </div>
        </motion.div>
      )}
 
      {(generatorForm.type === 'Sermão' || generatorForm.type === 'Série') && (
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
              : "bg-[var(--bg-card)] text-[var(--text-secondary)] cursor-not-allowed"
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
              Gerar {generatorForm.type === 'Série' ? 'Série Completa' : 'conteúdo'}
            </>
          )}
        </button>

        <AnimatePresence>
          {loading && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[2rem] p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500">
                    {progress.stage === 'ai' ? <Sparkles size={18} className="animate-pulse" /> : <Loader2 size={18} className="animate-spin" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-widest">
                      {progress.stage === 'ai' ? 'Consultando Inteligência' : 'Organizando Episódios'}
                    </p>
                    <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-[0.15em] mt-0.5">
                      {progress.stage === 'ai' ? 'Articulando temas bíblicos...' : `Salvando ${progress.current} de ${progress.total}`}
                    </p>
                  </div>
                </div>
                {progress.stage === 'saving' && progress.current === progress.total && (
                  <CheckCircle2 size={20} className="text-green-500 animate-bounce" />
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)]">
                  <span>Progresso Geral</span>
                  <span>{Math.round(progressPercentage)}%</span>
                </div>
                <div className="h-1.5 bg-[var(--bg-main)] rounded-full overflow-hidden border border-[var(--border-color)]/30">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400"
                  />
                </div>
              </div>

              <p className="text-center text-[10px] text-[var(--text-secondary)] italic">
                {generatorForm.type === 'Série' 
                  ? "Sua série está sendo preparada com profundidade teológica. Por favor, não feche a página." 
                  : "Preparando seu conteúdo personalizado..."}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        .shadow-glow {
          box-shadow: 0 0 20px rgba(234, 179, 8, 0.1);
        }
      `}</style>
    </div>
  );
}