import React, { useState } from 'react';
import { useStore, MessageTone, ItemType } from '@/src/store/useStore';
import { cn } from '@/src/lib/utils';
import { Sparkles, Mic, FileText, Lightbulb, Loader2, BookOpen, Heart, Flame, MessageSquareWarning, Wind, GraduationCap, Users, Layers, CheckCircle2, LayoutGrid, Crown, PenTool, Info, History } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { generateAIContent } from '../services/geminiService';
import { databaseService } from '../services/databaseService';
import { EstudoForm } from '../components/forms/EstudoForm';
import { EscritorForm } from '../components/forms/EscritorForm';
import { LiderancaForm } from '../components/forms/LiderancaForm';

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
  
  const handleGenerate = async (customType?: ItemType, customTopic?: string, extraParams?: any) => {
    const activeType = customType || generatorForm.type;
    const activeTopic = customTopic || generatorForm.topic;

    if (!activeTopic.trim() || !auth.user?.id) return;
    
    setLoading(true);
    setProgress({ current: 0, total: activeType === 'Série' ? generatorForm.episodes : 1, stage: 'ai' });
    
    try {
      const data = await generateAIContent(
        activeType,
        activeTopic,
        generatorForm.tone,
        generatorForm.episodes,
        extraParams
      );

      if (data.remainingCredits !== undefined) {
        setSubscriptionState({ credits: data.remainingCredits });
      }

      if (activeType === 'Série' && data.episodes) {
        setProgress(prev => ({ ...prev, stage: 'saving' }));
        
        // 1. Salva o item "Pai" da série
        const seriesId = await databaseService.saveNewContent({
          type: 'Série',
          title: data.title,
          topic: data.topic || activeTopic,
          tone: generatorForm.tone,
          content: `Série de ${data.episodes.length} episódios.`
        });

        if (seriesId) {
          const seriesItem = {
            id: seriesId,
            type: 'Série' as const,
            title: data.title,
            topic: data.topic || activeTopic,
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
              topic: activeTopic,
              tone: generatorForm.tone,
              content: ep.content,
              parentSeriesId: seriesId
            });

            if (epId) {
              addItem({
                id: epId,
                type: 'Sermão',
                title: ep.title,
                topic: activeTopic,
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
        // Geração normal (Sermão, Ilustração, Estudo, Escritor, Liderança)
        setProgress(prev => ({ ...prev, stage: 'saving' }));
        const contentId = await databaseService.saveNewContent({
          type: activeType,
          title: data.title,
          topic: data.topic || activeTopic,
          tone: generatorForm.tone,
          content: data.content
        });

        if (contentId) {
          addItem({
            id: contentId,
            type: activeType,
            title: data.title,
            topic: data.topic || activeTopic,
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
    { label: 'Recursos 360', icon: LayoutGrid },
  ];

  const progressPercentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  // Helper para verificar se o tipo ativo é uma sub-ferramenta de recursos 360
  const isRecurso360Active = ['Recursos 360', 'Estudo', 'Escritor', 'Liderança'].includes(generatorForm.type);

  return (
    <div className="space-y-8">
      <div>
        {isRecurso360Active ? (
          <>
            <h1 className="text-4xl font-bold tracking-tight">
              Recursos <span className="text-yellow-500">360</span>
            </h1>
            <p className="mt-2 text-[var(--text-secondary)] text-sm leading-relaxed max-w-lg">
              Ferramentas poderosas para fortalecer seu ministério, discipulado, escrita e liderança com excelência.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-4xl font-bold tracking-tight">
              Criar <span className="text-yellow-500">Inspiração</span>
            </h1>
            <p className="mt-2 text-[var(--text-secondary)] text-sm leading-relaxed max-w-xs">
              Deixe os recursos digitais auxiliarem sua próxima mensagem com profundidade, revelação, propósito e transformação de vidas!
            </p>
          </>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 p-1 bg-[var(--bg-card)] rounded-[1.25rem] relative">
        {types.map((type) => {
          const isActive = type.label === 'Recursos 360' ? isRecurso360Active : generatorForm.type === type.label;
          return (
            <button
              key={type.label}
              onClick={() => setGeneratorForm({ type: type.label })}
              className={cn(
                "flex items-center justify-center gap-2 py-3.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all relative z-10",
                isActive
                  ? "text-[var(--text-primary)]"
                  : "text-[var(--text-secondary)] hover:text-yellow-500"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabBackground"
                  className="absolute inset-0 bg-[var(--border-color)]/70 dark:bg-[var(--border-color)]/30 rounded-xl shadow-lg -z-10 border border-yellow-500/10"
                  transition={{ type: "spring", stiffness: 350, damping: 26 }}
                />
              )}
              <type.icon size={16} />
              {type.label}
            </button>
          );
        })}
      </div>

      {generatorForm.type === 'Recursos 360' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="space-y-4">
            <h2 className="text-[10px] font-bold tracking-widest text-[var(--text-secondary)] uppercase">
              Escolha uma ferramenta
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Estudos para Grupos Pequenos */}
              <div className="bg-[var(--bg-card)]/50 border border-[var(--border-color)] rounded-[2rem] p-6 md:p-8 flex flex-col items-center hover:bg-[var(--bg-card)]/80 hover:border-yellow-500/20 transition-all group">
                <div className="flex items-center justify-center h-16 w-16 bg-yellow-500/10 text-yellow-500 rounded-2xl mb-6 transition-transform group-hover:scale-105">
                  <Users size={28} />
                </div>
                <h3 className="text-xl font-bold text-[var(--text-primary)] text-center leading-tight mb-3">
                  Estudos para<br />Grupos Pequenos
                </h3>
                <p className="text-xs text-[var(--text-secondary)] text-center leading-relaxed mb-6 flex-1 opacity-85">
                  Gere estudos bíblicos completos para células e pequenos grupos com quebra-gelo, perguntas, resumo e oração.
                </p>
                <button
                  onClick={() => setGeneratorForm({ type: 'Estudo' })}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-bold rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-yellow-500/10"
                >
                  <Sparkles size={16} />
                  Acessar
                </button>
              </div>

              {/* Card 2: Escritor */}
              <div className="bg-[var(--bg-card)]/50 border border-[var(--border-color)] rounded-[2rem] p-6 md:p-8 flex flex-col items-center hover:bg-[var(--bg-card)]/80 hover:border-yellow-500/20 transition-all group">
                <div className="flex items-center justify-center h-16 w-16 bg-yellow-500/10 text-yellow-500 rounded-2xl mb-6 transition-transform group-hover:scale-105">
                  <PenTool size={28} />
                </div>
                <h3 className="text-xl font-bold text-[var(--text-primary)] text-center leading-tight mb-3">
                  Escritor
                </h3>
                <p className="text-xs text-[var(--text-secondary)] text-center leading-relaxed mb-6 flex-1 opacity-85">
                  Desenvolva livros cristãos com esboço completo: introdução, 12 capítulos resumidos e conclusão.
                </p>
                <button
                  onClick={() => setGeneratorForm({ type: 'Escritor' })}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-bold rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-yellow-500/10"
                >
                  <Sparkles size={16} />
                  Acessar
                </button>
              </div>

              {/* Card 3: Liderança */}
              <div className="bg-[var(--bg-card)]/50 border border-[var(--border-color)] rounded-[2rem] p-6 md:p-8 flex flex-col items-center hover:bg-[var(--bg-card)]/80 hover:border-yellow-500/20 transition-all group">
                <div className="flex items-center justify-center h-16 w-16 bg-yellow-500/10 text-yellow-500 rounded-2xl mb-6 transition-transform group-hover:scale-105">
                  <Crown size={28} />
                </div>
                <h3 className="text-xl font-bold text-[var(--text-primary)] text-center leading-tight mb-3">
                  Liderança
                </h3>
                <p className="text-xs text-[var(--text-secondary)] text-center leading-relaxed mb-6 flex-1 opacity-85">
                  Conteúdos profundos sobre liderança cristã, vida do líder, oração, crescimento da igreja e muito mais.
                </p>
                <button
                  onClick={() => setGeneratorForm({ type: 'Liderança' })}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-bold rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-yellow-500/10"
                >
                  <Sparkles size={16} />
                  Acessar
                </button>
              </div>
            </div>
          </div>

          {/* Info Banner & History */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-5 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl">
            <div className="flex items-center gap-4 text-left">
              <div className="p-3 bg-yellow-500/10 text-yellow-500 rounded-xl flex-shrink-0">
                <Info size={24} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[var(--text-primary)]">Recursos 360</h4>
                <p className="text-xs text-[var(--text-secondary)]">Tudo o que você precisa para equipar, edificar e expandir o Reino de Deus.</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/library')}
              className="flex items-center gap-2 px-5 py-3 bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] hover:border-yellow-500/50 rounded-xl text-xs font-bold transition-all active:scale-95 flex-shrink-0 shadow-sm"
            >
              <History size={16} className="text-yellow-500" />
              Ver Histórico
            </button>
          </div>
        </div>
      )}

      {/* Formulário do Estudo */}
      {generatorForm.type === 'Estudo' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setGeneratorForm({ type: 'Recursos 360' })}
              className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] hover:text-yellow-500"
            >
              ← Voltar
            </button>
            <div className="h-4 w-px bg-[var(--border-color)]" />
            <span className="text-xs font-bold uppercase text-yellow-500">Estudo de Célula</span>
          </div>
          <EstudoForm
            initialTopic={generatorForm.topic}
            loading={loading}
            onSubmit={(data) => handleGenerate('Estudo', data.topic, { level: data.level, language: data.language })}
          />
        </div>
      )}

      {/* Formulário do Escritor */}
      {generatorForm.type === 'Escritor' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setGeneratorForm({ type: 'Recursos 360' })}
              className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] hover:text-yellow-500"
            >
              ← Voltar
            </button>
            <div className="h-4 w-px bg-[var(--border-color)]" />
            <span className="text-xs font-bold uppercase text-yellow-500">Escritor</span>
          </div>
          <EscritorForm
            initialTopic={generatorForm.topic}
            loading={loading}
            onSubmit={(data) => handleGenerate('Escritor', data.topic, { chapters: data.chapters, language: data.language })}
          />
        </div>
      )}

      {/* Formulário do Liderança */}
      {generatorForm.type === 'Liderança' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setGeneratorForm({ type: 'Recursos 360' })}
              className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] hover:text-yellow-500"
            >
              ← Voltar
            </button>
            <div className="h-4 w-px bg-[var(--border-color)]" />
            <span className="text-xs font-bold uppercase text-yellow-500">Liderança</span>
          </div>
          <LiderancaForm
            initialTopic={generatorForm.topic}
            loading={loading}
            onSubmit={(data) => handleGenerate('Liderança', data.topic, { focus: data.focus, language: data.language })}
          />
        </div>
      )}

      {!isRecurso360Active && (
        <>
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
    </>
  )}

      <style>{`
        .shadow-glow {
          box-shadow: 0 0 20px rgba(234, 179, 8, 0.1);
        }
      `}</style>
    </div>
  );
}