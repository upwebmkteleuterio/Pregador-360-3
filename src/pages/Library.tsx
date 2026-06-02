import React, { useEffect, useMemo } from 'react';
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

  // Limpa a busca e filtros ao sair da tela (unmount)
  useEffect(() => {
    return () => {
      setLibraryState({ searchQuery: '', selectedTag: null });
    };
  }, [setLibraryState]);

  // 1. Filtra itens baseados em busca e tipo (Sermão/Ilustração)
  // Estes itens servirão de base para as tags que aparecerão no filtro
  const itemsInCurrentCategory = useMemo(() => {
    return items.filter(item => {
      const searchLower = library.searchQuery.toLowerCase();
      const matchesSearch = !library.searchQuery || 
                          item.title.toLowerCase().includes(searchLower) ||
                          item.topic.toLowerCase().includes(searchLower);
      
      const matchesFilter = library.filter === 'Todos' || item.type === library.filter;
      
      return matchesSearch && matchesFilter;
    });
  }, [items, library.searchQuery, library.filter]);

  // 2. Extrai dinamicamente as tags disponíveis apenas dos itens que passaram no filtro acima
  const availableTags = useMemo(() => {
    const uniqueTagNames = new Set<string>();
    
    itemsInCurrentCategory.forEach(item => {
      if (item.tags && Array.isArray(item.tags)) {
        item.tags.forEach(t => {
          if (t && typeof t === 'string') {
            uniqueTagNames.add(t);
          }
        });
      }
    });
    
    // Mapeia os nomes para os objetos de tag completos (para obter as cores) e ordena alfabeticamente
    return Array.from(uniqueTagNames)
      .map(tagName => {
        return allTags.find(t => t.name === tagName) || { id: tagName, name: tagName, color: '#71717a' };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [itemsInCurrentCategory, allTags]);

  // 3. Aplica o filtro final de tag selecionada para a lista de itens
  const filteredItems = useMemo(() => {
    if (!library.selectedTag) return itemsInCurrentCategory;
    return itemsInCurrentCategory.filter(item => 
      item.tags && item.tags.includes(library.selectedTag!)
    );
  }, [itemsInCurrentCategory, library.selectedTag]);

  return (
    <div className="space-y-8 pb-32 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold text-[var(--text-primary)] flex items-center gap-3">
          Biblioteca
        </h1>
        <button 
          onClick={() => navigate('/')}
          className="p-3 bg-yellow-500 text-zinc-950 rounded-2xl shadow-lg shadow-yellow-500/20 active:scale-[0.98] transition-transform"
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

      <div className="flex p-1 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)]/50">
        {(['Todos', 'Sermão', 'Ilustração'] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => setLibraryState({ filter, selectedTag: null })}
            className={cn(
              "flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all",
              library.filter === filter 
                ? "bg-[var(--bg-main)] text-[var(--text-primary)] shadow-md" 
                : "text-[var(--text-secondary)] hover:text-yellow-500"
            )}
          >
            {filter === 'Todos' ? 'Todos' : filter === 'Sermão' ? 'Sermões' : 'Ilustrações'}
          </button>
        ))}
      </div>

      {/* Filtro de Tags Horizontal - Extraído dinamicamente da lista abaixo */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 -mx-2 px-2 scroll-smooth">
        <button
          onClick={() => setLibraryState({ selectedTag: null })}
          className={cn(
            "flex-shrink-0 px-5 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all border",
            !library.selectedTag 
              ? "bg-yellow-500 text-zinc-950 border-yellow-500 shadow-lg shadow-yellow-500/10" 
              : "bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-yellow-500/30"
          )}
        >
          Todas as Tags
        </button>
        {availableTags.map((tag) => (
          <button
            key={tag.id}
            onClick={() => setLibraryState({ selectedTag: tag.name })}
            className={cn(
              "flex-shrink-0 flex items-center gap-2.5 px-5 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all border",
              library.selectedTag === tag.name 
                ? "bg-yellow-500 text-zinc-950 border-yellow-500 shadow-lg shadow-yellow-500/10" 
                : "bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-yellow-500/30"
            )}
          >
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: tag.color }} />
            {tag.name}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <div 
              key={item.id}
              className="bg-[var(--bg-card)]/50 border border-[var(--border-color)] rounded-[2rem] p-6 space-y-5 relative overflow-hidden group hover:bg-[var(--bg-card)]/80 hover:border-yellow-500/20 transition-all active:scale-[0.99] cursor-default"
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
                    <span className="text-[10px] font-medium text-[var(--text-secondary)] opacity-60">
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
                    const tagConfig = allTags.find(t => t.name === tagName);
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
                    title="Excluir"
                  >
                    <Trash2 size={20} />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      duplicateItem(item.id);
                    }}
                    className="p-2.5 text-[var(--text-secondary)] hover:text-yellow-500 transition-colors"
                    title="Duplicar"
                  >
                    <Copy size={20} />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setModalState('tagModalOpen', true, item.id);
                    }}
                    className="p-2.5 text-[var(--text-secondary)] hover:text-yellow-500 transition-colors"
                    title="Gerenciar Tags"
                  >
                    <TagIcon size={20} />
                  </button>
                </div>
                
                <button 
                  onClick={() => navigate(`/view/${item.id}`)}
                  className="flex items-center gap-3 px-8 py-3.5 bg-yellow-500 text-zinc-950 font-bold text-xs uppercase tracking-widest rounded-2xl hover:bg-yellow-400 active:scale-95 transition-all shadow-lg shadow-yellow-500/10"
                >
                  Abrir Conteúdo
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-24 space-y-6 bg-[var(--bg-card)]/30 border border-dashed border-[var(--border-color)] rounded-[2.5rem]">
            <div className="h-20 w-20 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-full flex items-center justify-center mx-auto text-[var(--text-secondary)] opacity-40">
              <Search size={40} />
            </div>
            <div className="space-y-2">
              <p className="text-[var(--text-primary)] font-bold">Nenhum item encontrado</p>
              <p className="text-[var(--text-secondary)] text-sm px-10">Tente ajustar seus filtros ou busca para encontrar o que procura.</p>
            </div>
            <button 
              onClick={() => {
                setLibraryState({ searchQuery: '', selectedTag: null });
                navigate('/');
              }}
              className="text-yellow-500 font-bold text-xs uppercase tracking-widest hover:underline"
            >
              Criar Novo Conteúdo
            </button>
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