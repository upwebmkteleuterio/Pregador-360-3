Episódios).">
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '@/src/store/useStore';
import { cn } from '@/src/lib/utils';
import { Search, Plus, Tag as TagIcon, Trash2, Copy, ChevronRight, ChevronLeft, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Library() {
  const navigate = useNavigate();
  const { 
    items, 
    library, 
    setLibraryState, 
    setModalState, 
    duplicateItem, 
    tags: allTags 
  } = useStore();

  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  // Limpa filtros específicos ao sair da tela
  useEffect(() => {
    return () => {
      setLibraryState({ searchQuery: '', selectedTag: null, filter: 'Sermão' });
    };
  }, [setLibraryState]);

  // Lógica de Scroll com o Mouse (Drag to Scroll)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    isDown.current = true;
    scrollRef.current.classList.add('active');
    startX.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeft.current = scrollRef.current.scrollLeft;
  };

  const handleMouseLeave = () => {
    isDown.current = false;
    if (scrollRef.current) scrollRef.current.classList.remove('active');
  };

  const handleMouseUp = () => {
    isDown.current = false;
    if (scrollRef.current) scrollRef.current.classList.remove('active');
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDown.current || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX.current) * 2;
    scrollRef.current.scrollLeft = scrollLeft.current - walk;
  };

  // 1. Filtragem primária (Busca + Tipo de Item)
  const baseItems = useMemo(() => {
    if (!items) return [];
    
    // Se estivermos vendo os episódios de uma série específica
    if (library.filter === 'Série' && selectedSeriesId) {
      const series = items.find(i => i.id === selectedSeriesId);
      if (!series) return [];
      
      // Filtra sermões que pertencem a esta série (baseado no tópico/título da série)
      return items.filter(item => 
        item.type === 'Sermão' && 
        (item.topic === series.title || item.title.includes(series.title))
      );
    }

    return items.filter(item => {
      const searchLower = library.searchQuery.toLowerCase().trim();
      const matchesSearch = !searchLower || 
                          (item.title && item.title.toLowerCase().includes(searchLower)) ||
                          (item.topic && item.topic.toLowerCase().includes(searchLower));
      
      const matchesFilter = item.type === library.filter;
      
      return matchesSearch && matchesFilter;
    });
  }, [items, library.searchQuery, library.filter, selectedSeriesId]);

  // 2. Extração Dinâmica de Tags
  const availableTags = useMemo(() => {
    const tagNamesFound = new Set<string>();
    baseItems.forEach(item => {
      if (item.tags && Array.isArray(item.tags)) {
        item.tags.forEach(t => { if (t) tagNamesFound.add(t.trim()); });
      }
    });
    return Array.from(tagNamesFound).map(name => {
      const config = allTags.find(t => t.name.toLowerCase().trim() === name.toLowerCase().trim());
      return { name, color: config?.color || '#71717a', id: config?.id || `temp-${name}` };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [baseItems, allTags]);

  // 3. Filtragem final (por Tag)
  const filteredItems = useMemo(() => {
    if (!library.selectedTag) return baseItems;
    const selected = library.selectedTag.toLowerCase().trim();
    return baseItems.filter(item => item.tags?.some(t => t.toLowerCase().trim() === selected));
  }, [baseItems, library.selectedTag]);

  const selectedSeries = items.find(i => i.id === selectedSeriesId);

  return (
    <div className="space-y-8 pb-32 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold text-[var(--text-primary)]">
          Biblioteca
        </h1>
        <button 
          onClick={() => navigate('/')}
          className="p-3 bg-yellow-500 text-zinc-950 rounded-2xl shadow-lg shadow-yellow-500/20 active:scale-[0.98] transition-all"
        >
          <Plus size={24} />
        </button>
      </div>

      <div className="relative group">
        <input
          type="text"
          value={library.searchQuery}
          onChange={(e) => setLibraryState({ searchQuery: e.target.value, selectedTag: null })}
          placeholder="Buscar sermões, notas, ilustrações..."
          className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl px-5 py-4 pl-12 focus:outline-none focus:border-yellow-500/50 transition-all group-hover:border-[var(--border-color)] text-[var(--text-primary)] shadow-sm"
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-yellow-500 transition-colors" size={20} />
      </div>

      <div className="space-y-6">
        {/* Abas de Categorias - Atualizadas */}
        <div className="flex p-1 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)]/50">
          {(['Sermão', 'Série', 'Ilustração'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => {
                setLibraryState({ filter, selectedTag: null });
                setSelectedSeriesId(null);
              }}
              className={cn(
                "flex-1 py-3 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all",
                library.filter === filter 
                  ? "bg-[var(--bg-main)] text-[var(--text-primary)] shadow-md" 
                  : "text-[var(--text-secondary)] hover:text-yellow-500"
              )}
            >
              {filter === 'Sermão' ? 'Sermões' : filter === 'Série' ? 'Séries' : 'Ilustrações'}
            </button>
          ))}
        </div>

        {/* Header de Navegação para Episódios */}
        {library.filter === 'Série' && selectedSeriesId && (
          <div className="flex items-center gap-4 bg-yellow-500/5 border border-yellow-500/10 p-4 rounded-2xl animate-in slide-in-from-left-4">
            <button 
              onClick={() => setSelectedSeriesId(null)}
              className="p-2 bg-yellow-500 text-zinc-950 rounded-xl active:scale-90 transition-transform"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <span className="text-[9px] font-bold text-yellow-500 uppercase tracking-widest">Série Selecionada</span>
              <h2 className="text-lg font-bold text-[var(--text-primary)] leading-tight">{selectedSeries?.title}</h2>
            </div>
          </div>
        )}

        {/* Filtro de Tags */}
        <div className="relative">
          <div 
            ref={scrollRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2 -mx-2 px-2 cursor-grab active:cursor-grabbing select-none"
          >
            <button
              onClick={() => setLibraryState({ selectedTag: null })}
              className={cn(
                "flex-shrink-0 px-6 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-[0.15em] transition-all border",
                !library.selectedTag 
                  ? "bg-yellow-500 text-zinc-950 border-yellow-500 shadow-xl shadow-yellow-500/10 scale-105 z-10" 
                  : "bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-yellow-500/30"
              )}
            >
              Todas as Tags
            </button>
            
            {availableTags.map((tag) => {
              const isActive = library.selectedTag?.toLowerCase().trim() === tag.name.toLowerCase().trim();
              return (
                <button
                  key={tag.id}
                  onClick={() => setLibraryState({ selectedTag: tag.name })}
                  className={cn(
                    "flex-shrink-0 flex items-center gap-3 px-6 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-[0.15em] transition-all border",
                    isActive 
                      ? "bg-yellow-500 text-zinc-950 border-yellow-500 shadow-xl shadow-yellow-500/10 scale-105 z-10" 
                      : "bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-yellow-500/30"
                  )}
                >
                  <div className={cn("h-2 w-2 rounded-full", isActive ? "bg-zinc-950" : "")} style={{ backgroundColor: isActive ? undefined : tag.color }} />
                  {tag.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Lista de Itens */}
      <div className="space-y-4 pt-4">
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <div 
              key={item.id}
              onClick={() => {
                if (item.type === 'Série' && !selectedSeriesId) {
                  setSelectedSeriesId(item.id);
                } else {
                  navigate(`/view/${item.id}`);
                }
              }}
              className="bg-[var(--bg-card)]/50 border border-[var(--border-color)] rounded-[2rem] p-6 space-y-5 relative overflow-hidden group hover:bg-[var(--bg-card)]/80 hover:border-yellow-500/20 transition-all active:scale-[0.99] cursor-pointer"
            >
              <div 
                className="absolute left-0 top-0 bottom-0 w-1.5 transition-colors" 
                style={{ backgroundColor: item.type === 'Sermão' ? '#EAB308' : item.type === 'Série' ? '#A855F7' : '#3B82F6' }}
              />
              
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-[9px] font-bold tracking-[0.15em] uppercase px-2 py-1 border rounded-lg",
                      item.type === 'Série' ? "bg-purple-500/10 border-purple-500/20 text-purple-400" : "bg-[var(--bg-main)] border-[var(--border-color)] text-[var(--text-secondary)]"
                    )}>
                      {item.type}
                    </span>
                    <span className="text-[10px] font-medium text-[var(--text-secondary)]">
                      • {new Date(item.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-[var(--text-primary)] leading-tight group-hover:text-yellow-500 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] line-clamp-1 opacity-70">
                    {item.type === 'Série' ? `${item.episodesCount || 0} Episódios planejados` : item.topic}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-5 border-t border-[var(--border-color)]/50">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setModalState('deleteConfirmOpen', true, item.id); }}
                    className="p-2.5 text-[var(--text-secondary)] hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); duplicateItem(item.id); }}
                    className="p-2.5 text-[var(--text-secondary)] hover:text-yellow-500 transition-colors"
                  >
                    <Copy size={20} />
                  </button>
                </div>
                
                <div className="flex items-center gap-3 px-8 py-3.5 bg-yellow-500 text-zinc-950 font-bold text-xs uppercase tracking-widest rounded-2xl group-hover:bg-yellow-400 transition-all shadow-lg shadow-yellow-500/10">
                  {item.type === 'Série' && !selectedSeriesId ? 'Ver Episódios' : 'Abrir Conteúdo'}
                  <ChevronRight size={16} />
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-24 opacity-30">
            {library.filter === 'Série' ? <Layers size={48} className="mx-auto mb-4 text-[var(--text-secondary)]" /> : <Search size={48} className="mx-auto mb-4 text-[var(--text-secondary)]" />}
            <p className="text-sm font-bold uppercase tracking-widest text-[var(--text-secondary)]">
              {library.filter === 'Série' ? 'Nenhuma série encontrada' : 'Nenhum item encontrado'}
            </p>
          </div>
        )}
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}