import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '@/src/store/useStore';
import { Sparkles, Loader2, Info, Tag, Quote, BookOpen, Search, ChevronRight, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { motion } from 'motion/react';
import { consultBibleAi, BibleAiResult } from '@/src/services/bibleService';

export default function BibleSearch() {
  const navigate = useNavigate();
  const { setGeneratorForm, auth, setModalState, setSubscriptionState } = useStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState(() => localStorage.getItem('bible_search_query') || '');
  const [result, setResult] = useState<BibleAiResult | null>(() => {
    const saved = localStorage.getItem('bible_search_result');
    return saved ? JSON.parse(saved) : null;
  });
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('bible_search_query', query);
  }, [query]);

  useEffect(() => {
    if (result) {
      localStorage.setItem('bible_search_result', JSON.stringify(result));
    }
  }, [result]);

  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [result]);

  const handleAiSearch = async () => {
    if (!query.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      if (!auth.user?.id) throw new Error("Usuário não autenticado.");
      const data = await consultBibleAi(query);
      
      if (data.remainingCredits !== undefined) {
        setSubscriptionState({ credits: data.remainingCredits });
      }
      
      setResult(data);
    } catch (err: any) {
      console.error('Erro na busca IA:', err);
      if (err.message === 'INSUFFICIENT_CREDITS') {
        setSubscriptionState({ credits: 0 });
        setModalState('aiCreditsOpen', true);
      } else {
        setError(err instanceof Error ? err.message : 'Houve um problema ao consultar a Inteligência Bíblica.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExportToSermon = (text: string) => {
    setGeneratorForm({ topic: text });
    navigate('/');
  };

  const handleExportToNote = () => {
    if (!result) return;
    navigate('/notes/edit/new', { 
      state: { 
        title: `Estudo: ${query}`,
        content: result.cleanDisplayContent 
      } 
    });
  };

  return (
    <div className="space-y-8 pb-32 max-w-4xl mx-auto px-4 md:px-0 animate-in fade-in duration-700">
      <header className="text-center space-y-4 pt-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-500/10 rounded-full border border-yellow-500/20 mb-2">
          <BookOpen className="text-yellow-500" size={32} />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] tracking-tight">
          Pesquisa Bíblica <span className="text-yellow-500">IA</span>
        </h1>
        <p className="text-[var(--text-secondary)] text-sm max-w-md mx-auto leading-relaxed">
          Encontre versículos, explicações teológicas e temas para suas pregações através do nosso assistente especializado.
        </p>
      </header>

      <section className="space-y-6 max-w-2xl mx-auto">
        <div className="space-y-4">
          <label className="text-[10px] font-bold tracking-widest text-[var(--text-secondary)] uppercase">
            TEMA, VERSÍCULO OU DÚVIDA BÍBLICA
          </label>
          <div className="relative group">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAiSearch()}
              placeholder="Ex: João 3:16 ou 'A Graça de Deus'"
              className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl px-5 py-4 pl-12 focus:outline-none focus:border-yellow-500/50 transition-all group-hover:border-[var(--border-color)] text-[var(--text-primary)] text-lg placeholder:text-[var(--text-secondary)]"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-yellow-500 transition-colors" size={20} />
          </div>
        </div>

        <button
          onClick={handleAiSearch}
          disabled={loading || !query.trim()}
          className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl font-bold uppercase tracking-widest transition-all relative overflow-hidden bg-yellow-500 text-zinc-950 shadow-xl shadow-yellow-500/20 active:scale-[0.98]"
        >
          {loading ? (
            <><Loader2 className="animate-spin" size={20} /> Consultando...</>
          ) : (
            <><Sparkles size={20} /> Consultar</>
          )}
        </button>
      </section>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 p-6 bg-red-500/10 border border-red-500/20 rounded-3xl text-red-400 text-sm max-w-2xl mx-auto"
        >
          <Info size={24} className="shrink-0" />
          <p>{error}</p>
        </motion.div>
      )}

      {result ? (
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-3xl mx-auto space-y-8" ref={resultRef}>
          <article className="space-y-4">
            <div className="markdown-body prose prose-invert prose-sm max-w-none text-[var(--text-primary)] font-sans leading-relaxed bg-[var(--bg-card)]/50 p-6 md:p-10 rounded-[2.5rem] border border-[var(--border-color)] shadow-2xl">
              <ReactMarkdown>{result.cleanDisplayContent}</ReactMarkdown>
            </div>

            <footer className="flex flex-col items-center gap-6 pt-4">
              <div className="h-px w-full bg-[var(--border-color)]/50" />
              <div className="flex flex-col md:flex-row items-center justify-between w-full gap-4 px-2">
                <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Fim do Resultado</span>
                <button 
                  onClick={handleExportToNote}
                  className="flex items-center justify-center gap-3 px-8 py-4 bg-yellow-500 text-zinc-950 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-yellow-400 transition-all active:scale-95 shadow-lg shadow-yellow-500/20"
                >
                  <FileText size={18} /> Salvar como nota
                </button>
              </div>
            </footer>
          </article>
          
          {(result.themes.length > 0 || result.verses.length > 0) && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-3xl p-6 text-center">
                <h3 className="font-bold text-yellow-500 text-lg mb-2">Exportação Inteligente</h3>
                <p className="text-[var(--text-secondary)] text-xs leading-relaxed max-w-md mx-auto">
                  Identificamos temas e textos bíblicos na sua pesquisa. Clique nos itens abaixo para 
                  <span className="text-[var(--text-primary)]"> exportar para o seu próximo sermão</span>.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.themes.length > 0 && (
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest px-2 block">Temas Encontrados</span>
                    {result.themes.map((theme, i) => (
                      <ThemeCard key={i} theme={theme} onClick={() => handleExportToSermon(theme)} />
                    ))}
                  </div>
                )}

                {result.verses.length > 0 && (
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest px-2 block">Textos Bíblicos</span>
                    {result.verses.map((verse, i) => (
                      <VerseCard key={i} verse={verse} onClick={() => handleExportToSermon(verse)} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : !loading && (
        <div className="text-center py-20 opacity-20">
          <Sparkles size={64} className="mx-auto mb-4 text-[var(--text-secondary)]" />
          <p className="text-[var(--text-primary)]/50">Aguardando sua consulta bíblica...</p>
        </div>
      )}

      {loading && <LoadingState />}

      <style>{`
        .markdown-body ul { list-style-type: disc; margin-left: 1.5rem; margin-bottom: 1rem; }
        .markdown-body ol { list-style-type: decimal; margin-left: 1.5rem; margin-bottom: 1rem; }
        .markdown-body strong { color: var(--text-primary); font-weight: bold; }
        .markdown-body h1, .markdown-body h2, .markdown-body h3 { 
          font-weight: bold; color: #EAB308; margin-top: 1.5rem; margin-bottom: 0.75rem;
        }
        .markdown-body p { margin-bottom: 1rem; line-height: 1.8; color: var(--text-primary); opacity: 0.9; }
        .markdown-body blockquote { border-left: 4px solid #EAB308; padding-left: 1rem; color: var(--text-secondary); margin-bottom: 1rem; }
      `}</style>
    </div>
  );
}

function ThemeCard({ theme, onClick }: { theme: string; onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center justify-between gap-4 p-5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl group hover:border-yellow-500/50 transition-all text-left"
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-500 group-hover:bg-yellow-500 group-hover:text-zinc-950 transition-colors">
          <Tag size={18} />
        </div>
        <span className="text-[var(--text-primary)] text-sm font-medium group-hover:text-yellow-500 transition-colors">{theme}</span>
      </div>
      <ChevronRight size={16} className="text-[var(--text-secondary)] group-hover:text-yellow-500 transition-colors" />
    </button>
  );
}

function VerseCard({ verse, onClick }: { verse: string; onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center justify-between gap-4 p-5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl group hover:border-yellow-500/50 transition-all text-left"
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-[var(--border-color)] flex items-center justify-center text-[var(--text-secondary)] group-hover:bg-yellow-500 group-hover:text-zinc-950 transition-colors">
          <Quote size={18} />
        </div>
        <span className="text-[var(--text-primary)] text-sm font-medium group-hover:text-yellow-500 transition-colors line-clamp-2">{verse}</span>
      </div>
      <ChevronRight size={16} className="text-[var(--text-secondary)] group-hover:text-yellow-500 transition-colors" />
    </button>
  );
}

function LoadingState() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-pulse">
      <div className="h-64 bg-[var(--bg-card)]/50 rounded-[2.5rem] border border-[var(--border-color)]" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-24 bg-[var(--bg-card)] rounded-2xl" />
        <div className="h-24 bg-[var(--bg-card)] rounded-2xl" />
      </div>
    </div>
  );
}