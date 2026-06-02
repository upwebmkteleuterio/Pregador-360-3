import React, { useEffect, useMemo, useRef } from 'react';
import { useStore } from '@/src/store/useStore';
import { cn } from '@/src/lib/utils';
import { Search, Plus, Tag as TagIcon, Trash2, Copy, ChevronRight } from 'lucide-react';
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

  const scrollRef = useRef<HTMLDivElement>(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  // Limpa filtros específicos ao sair da tela
  useEffect(() => {
    return () => {
      setLibraryState({ searchQuery: '', selectedTag: null });
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
  // Esta é a base para o que o usuário vê e para as tags que aparecerão no topo
  const baseItems = useMemo(() => {
    if (!items) return [];
    return items.filter(item => {
      const searchLower = library.searchQuery.toLowerCase().trim();
      const matchesSearch = !searchLower || 
                          (item.title && item.title.toLowerCase().includes(searchLower)) ||
                          (item.topic && item.topic.toLowerCase().includes(searchLower));
      
      const matchesFilter = library.filter === 'Todos' || item.type === library.filter;
      
      return matchesSearch && matchesFilter;
    });
  }, [items, library.searchQuery, library.filter]);

  // 2. Extração de Tags Dinâmicas baseada nos itens filtrados
  const availableTags = useMemo(() => {
    const tagNames = new Set<string>();
    
    // Coletamos todas as tags únicas dos itens atualmente listados
    baseItems.forEach(item => {
      if (Array.isArray(item.tags)) {
        item.tags.forEach(t => {
          if (typeof t === 'string' && t.trim()) {
            tagNames.add(t.trim());
          }
        });
      }
    });
    
    // Mapeamos os nomes para os objetos de configuração (cor, id)
    return Array.from(tagNames).map(name => {
      const config = allTags.find(t => t.name.toLowerCase().trim() === name.toLowerCase().trim());
      return {
        name: name,
        color: config?.color || '#71717a',
        id: config?.id || `temp-${name}`
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [baseItems, allTags]);

  // 3. Filtragem final pela tag selecionada
  const filteredItems = useMemo(() => {
    if (!library.selectedTag) return baseItems;
    
    const selected = library.selectedTag.toLowerCase().trim();
    return baseItems.filter(item => {
      if (!item.tags || !Array.isArray(item.tags)) return false;
      return item.tags.some(t => typeof t === 'string' && t.toLowerCase().trim() === selected);
    });
  }, [baseItems, library.selectedTag]);

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
        {/* Abas de Categorias */}
        <div className="flex p-1 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)]/50 max-w-md">
          {(['Todos', 'Sermão', 'Ilustração'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setLibraryState({ filter, selectedTag: null })}
              className={cn(
                "flex-1 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all",
                library.filter === filter 
                  ? "bg-[var(--bg-main)] text-[var(--text-primary)] shadow-md" 
                  : "text-[var(--text-secondary)] hover:text-yellow-500"
              )}
            >
              {filter === 'Todos' ? 'Todos' : filter === 'Sermão' ? 'Sermões' : 'Ilustrações'}
            </button>
          ))}
        </div>

        {/* Filtro de Tags Horizontal Dinâmico */}
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
                  <div 
                    className={cn(
                      "h-2 w-2 rounded-full",
                      isActive ? "bg-zinc-950" : ""
                    )} 
                    style={{ backgroundColor: isActive ? undefined : tag.color }} 
                  />
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
              onClick={() => navigate(`/view/${item.id}`)}
              className="bg-[var(--bg-card)]/50 border border-[var(--border-color)] rounded-[2rem] p-6 space-y-5 relative overflow-hidden group hover:bg-[var(--bg-card)]/80 hover:border-yellow-500/20 transition-all active:scale-[0.99] cursor-pointer"
            >
              <div 
                className="absolute left-0 top-0 bottom-0 w-1.5 transition-colors" 
                style={{ backgroundColor: item.type === 'Sermão' ? '#EAB308' : '#3B82F6' }}
              />
              
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold tracking-[0.15em] text-[var(--text-secondary)] uppercase px-2 py-1 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg">
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
                    {item.topic}
                  </p>
                </div>
              </div>

              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {item.tags.map(tagName => {
                    const tagConfig = allTags.find(t => t.name.toLowerCase().trim() === tagName.toLowerCase().trim());
                    return (
                      <div 
                        key={tagName}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-main)] rounded-xl text-[9px] font-bold text-[var(--text-secondary)] border border-[var(--border-color)]"
                      >
                        <TagIcon size={10} style={{ color: tagConfig?.color || '#71717a' }} />
                        <span className="uppercase tracking-wider">{tagName}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex items-center justify-between pt-5 border-t border-[var(--border-color)]/50">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setModalState('deleteConfirmOpen', true, item.id);
                    }}
                    className="p-2.5 text-[var(--text-secondary)] hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      duplicateItem(item.id);
                    }}
                    className="p-2.5 text-[var(--text-secondary)] hover:text-yellow-500 transition-colors"
                  >
                    <Copy size={20} />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setModalState('tagModalOpen', true, item.id);
                    }}
                    className="p-2.5 text-[var(--text-secondary)] hover:text-yellow-500 transition-colors"
                  >
                    <TagIcon size={20} />
                  </button>
                </div>
                
                <div className="flex items-center gap-3 px-8 py-3.5 bg-yellow-500 text-zinc-950 font-bold text-xs uppercase tracking-widest rounded-2xl group-hover:bg-yellow-400 transition-all shadow-lg shadow-yellow-500/10">
                  Abrir Conteúdo
                  <ChevronRight size={16} />
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-24 opacity-30">
            <Search size={48} className="mx-auto mb-4 text-[var(--text-secondary)]" />
            <p className="text-sm font-bold uppercase tracking-widest text-[var(--text-secondary)]">Nenhum item encontrado</p>
          </div>
        )}
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}