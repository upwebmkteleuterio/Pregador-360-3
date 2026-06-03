import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '@/src/store/useStore';
import { ChevronLeft, FileText, ChevronRight, Layers } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export default function SeriesView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { items } = useStore();

  const series = items.find(i => i.id === id && i.type === 'Série');
  const episodes = items.filter(i => i.parentSeriesId === id).sort((a, b) => {
    // Ordena por Ep. X no título
    const aNum = parseInt(a.title.match(/\[Ep\.\s*(\d+)\]/)?.[1] || '0');
    const bNum = parseInt(b.title.match(/\[Ep\.\s*(\d+)\]/)?.[1] || '0');
    return aNum - bNum;
  });

  if (!series) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-[var(--text-secondary)]">
        <h2 className="text-xl font-bold mb-4">Série não encontrada</h2>
        <button onClick={() => navigate('/library')} className="px-6 py-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl text-yellow-500 font-bold active:scale-95 transition-transform">
          Voltar para Biblioteca
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/library')}
          className="p-3 bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-yellow-500 transition-colors rounded-xl"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Layers size={14} className="text-violet-500" />
            <span className="text-[10px] font-bold text-violet-500 uppercase tracking-widest">Série</span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] leading-tight">{series.title}</h1>
        </div>
      </div>

      <div className="p-6 bg-violet-500/5 border border-violet-500/10 rounded-3xl">
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          <span className="text-[var(--text-primary)] font-bold">Tema Central:</span> {series.topic}
        </p>
        <div className="flex items-center gap-2 mt-3">
          <div className="px-3 py-1 bg-violet-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg">
            {episodes.length} Episódios
          </div>
          <div className="px-3 py-1 bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-secondary)] text-[10px] font-bold uppercase tracking-widest rounded-lg">
            Tom: {series.tone}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em] px-2">Cronograma da Série</h2>
        
        {episodes.length > 0 ? (
          episodes.map((episode) => (
            <button
              key={episode.id}
              onClick={() => navigate(`/view/${episode.id}`)}
              className="w-full bg-[var(--bg-card)]/50 border border-[var(--border-color)] rounded-[1.5rem] p-5 flex items-center justify-between group hover:border-yellow-500/30 transition-all active:scale-[0.98]"
            >
              <div className="flex items-center gap-4 text-left">
                <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center text-yellow-500 group-hover:bg-yellow-500 group-hover:text-zinc-950 transition-all">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-[var(--text-primary)] group-hover:text-yellow-500 transition-colors">
                    {episode.title}
                  </h3>
                  <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider mt-1 opacity-60">
                    Sermão Detalhado
                  </p>
                </div>
              </div>
              <ChevronRight size={18} className="text-[var(--text-secondary)] group-hover:text-yellow-500 transition-all" />
            </button>
          ))
        ) : (
          <div className="text-center py-12 border-2 border-dashed border-[var(--border-color)] rounded-3xl opacity-30">
            <p className="text-xs font-bold uppercase tracking-widest">Nenhum episódio gerado ainda</p>
          </div>
        )}
      </div>
    </div>
  );
}