import React from 'react';
import { useStore } from '@/src/store/useStore';
import { cn } from '@/src/lib/utils';
import { Search, Plus, Tag, Trash2, Copy, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Library() {
  const navigate = useNavigate();
  const { 
    items, 
    library, 
    setLibraryState, 
    setModalState, 
    duplicateItem, 
    tags 
  } = useStore();

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(library.searchQuery.toLowerCase()) ||
                        item.topic.toLowerCase().includes(library.searchQuery.toLowerCase());
    const matchesFilter = library.filter === 'Todos' || item.type === library.filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8 pb-32">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold text-[var(--text-primary)] flex items-center gap-3">
          Biblioteca
        </h1>
        <button 
          onClick={() => navigate('/')}
          className="p-3 bg-yellow-500 text-zinc-950 rounded-2xl shadow-lg shadow-yellow-500/20 active:scale-[0.98]"
        >
          <Plus size={24} />
        </button>
      </div>

      <div className="relative group">
        <input
          type="text"
          value={library.searchQuery}
          onChange={(e) => setLibraryState({ searchQuery: e.target.value })}
          placeholder="Buscar sermões, notas, ilustrações..."
          className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl px-5 py-4 pl-12 focus:outline-none focus:border-yellow-500/50 transition-all group-hover:border-[var(--border-color)] text-[var(--text-primary)]"
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-yellow-500 transition-colors" size={20} />
      </div>

      <div className="flex p-1 bg-[var(--bg-card)] rounded-xl">
        {(['Todos', 'Sermão', 'Ilustração'] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => setLibraryState({ filter })}
            className={cn(
              "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
              library.filter === filter 
                ? "bg-[var(--border-color)] text-[var(--text-primary)] shadow-lg" 
                : "text-[var(--text-secondary)] hover:text-yellow-500"
            )}
          >
            {filter === 'Todos' ? 'Todos' : filter === 'Sermão' ? 'Sermões' : 'Ilustrações'}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <div 
              key={item.id}
              className="bg-[var(--bg-card)]/50 border border-[var(--border-color)] rounded-3xl p-5 space-y-4 relative overflow-hidden group hover:border-[var(--border-color)] transition-all active:scale-[0.99]"
            >
              <div 
                className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-500/40" 
                style={{ backgroundColor: item.type === 'Sermão' ? '#EAB308' : '#3B82F6' }}
              />
              
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold tracking-widest text-[var(--text-secondary)] uppercase px-2 py-0.5 border border-[var(--border-color)] rounded">
                      {item.type}
                    </span>
                    <span className="text-[10px] font-bold text-[var(--text-secondary)]">
                      {new Date(item.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-[var(--text-primary)] leading-tight">
                    {item.title}
                  </h3>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {item.tags.map(tagName => {
                  const tagConfig = tags.find(t => t.name === tagName);
                  return (
                    <div 
                      key={tagName}
                      className="flex items-center gap-1.5 px-3 py-1 bg-[var(--border-color)] rounded-full text-[10px] font-bold text-[var(--text-secondary)]"
                    >
                      <Tag size={10} style={{ color: tagConfig?.color || '#71717a' }} />
                      {tagName}
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[var(--border-color)]/50">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => {
                      setModalState('deleteConfirmOpen', true, item.id);
                    }}
                    className="p-2 text-[var(--text-secondary)] hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                  <button 
                    onClick={() => duplicateItem(item.id)}
                    className="p-2 text-[var(--text-secondary)] hover:text-yellow-500 transition-colors"
                  >
                    <Copy size={18} />
                  </button>
                  <button 
                    onClick={() => setModalState('tagModalOpen', true, item.id)}
                    className="p-2 text-[var(--text-secondary)] hover:text-yellow-500 transition-colors"
                  >
                    <Tag size={18} />
                  </button>
                </div>
                
                <button 
                  onClick={() => navigate(`/view/${item.id}`)}
                  className="flex items-center gap-2 px-6 py-3 bg-[var(--border-color)] rounded-2xl text-[var(--text-secondary)] font-semibold text-sm hover:bg-yellow-500 hover:text-zinc-950 transition-all active:scale-[0.95]"
                >
                  Abrir
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-24 space-y-4">
            <div className="h-16 w-16 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-full flex items-center justify-center mx-auto text-[var(--text-secondary)]">
              <Search size={32} />
            </div>
            <div className="text-[var(--text-secondary)]">Nenhum item encontrado</div>
            <button 
              onClick={() => navigate('/')}
              className="text-yellow-500 font-bold text-sm"
            >
              Comece a criar agora
            </button>
          </div>
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
