import React, { useEffect, useMemo, useRef } from 'react';
import { useStore } from '@/src/store/useStore';
import { Search, Plus, StickyNote, ChevronRight, Trash2, Tag as TagIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/src/lib/utils';

export default function NotesList() {
  const navigate = useNavigate();
  const { notes, notesLibrary, setNotesLibraryState, setModalState, tags: allTags } = useStore();

  const scrollRef = useRef<HTMLDivElement>(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  // Limpa a busca ao sair da tela (unmount)
  useEffect(() => {
    return () => {
      setNotesLibraryState({ searchQuery: '', selectedTag: null });
    };
  }, [setNotesLibraryState]);

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

  // 1. Filtragem primária por busca
  const baseNotes = useMemo(() => {
    if (!notes) return [];
    return notes.filter(note => 
      note.title.toLowerCase().includes(notesLibrary.searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(notesLibrary.searchQuery.toLowerCase())
    );
  }, [notes, notesLibrary.searchQuery]);

  // 2. Tags disponíveis no sistema
  const availableTags = useMemo(() => {
    if (!allTags) return [];
    return [...allTags].sort((a, b) => a.name.localeCompare(b.name));
  }, [allTags]);

  // 3. Filtragem final por tag
  const filteredNotes = useMemo(() => {
    if (!notesLibrary.selectedTag) return baseNotes;
    
    const selected = notesLibrary.selectedTag.toLowerCase().trim();
    return baseNotes.filter(note => {
      if (!note.tags || !Array.isArray(note.tags)) return false;
      return note.tags.some(t => t && t.toLowerCase().trim() === selected);
    });
  }, [baseNotes, notesLibrary.selectedTag]);

  return (
    <div className="space-y-8 pb-32 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-[var(--text-primary)]">Minhas Notas</h1>
        <p className="text-[var(--text-secondary)] text-sm">Reflexões, estudos e pensamentos diários na presença da Palavra.</p>
      </div>

      <div className="relative group">
        <input
          type="text"
          value={notesLibrary.searchQuery}
          onChange={(e) => setNotesLibraryState({ searchQuery: e.target.value, selectedTag: null })}
          placeholder="Buscar nas anotações..."
          className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl px-5 py-4 pl-12 focus:outline-none focus:border-yellow-500/50 transition-all group-hover:border-[var(--border-color)] text-[var(--text-primary)] shadow-sm"
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-yellow-500 transition-colors" size={20} />
      </div>

      {/* Filtro de Tags Horizontal */}
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
            onClick={() => setNotesLibraryState({ selectedTag: null })}
            className={cn(
              "flex-shrink-0 px-6 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-[0.15em] transition-all border",
              !notesLibrary.selectedTag 
                ? "bg-yellow-500 text-zinc-950 border-yellow-500 shadow-xl shadow-yellow-500/10 scale-105 z-10" 
                : "bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-yellow-500/30"
            )}
          >
            Todas as Tags
          </button>
          
          {availableTags.map((tag) => {
            const isActive = notesLibrary.selectedTag === tag.name;
            return (
              <button
                key={tag.id}
                onClick={() => setNotesLibraryState({ selectedTag: tag.name })}
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

      <div className="grid gap-4">
        {filteredNotes.map((note) => (
          <div 
            key={note.id}
            onClick={() => navigate(`/notes/edit/${note.id}`)}
            className="bg-[var(--bg-card)]/50 border border-[var(--border-color)] rounded-[2rem] p-6 space-y-4 relative group hover:bg-[var(--bg-card)]/80 hover:border-yellow-500/20 transition-all active:scale-[0.99] cursor-pointer"
          >
            <div className="flex justify-between items-start">
               <div className="space-y-2">
                <span className="text-[10px] font-bold text-[var(--text-secondary)]">
                  {new Date(note.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
                <h3 className="text-xl font-bold text-[var(--text-primary)] leading-tight group-hover:text-yellow-500 transition-colors">
                  {note.title || 'Nota sem título'}
                </h3>
                <p className="text-[var(--text-secondary)] text-sm line-clamp-3 leading-relaxed opacity-70">
                  {note.content || 'Comece a escrever...'}
                </p>
              </div>
              <div className="text-[var(--text-secondary)] opacity-50">
                <StickyNote size={20} />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {note.tags.map(tagName => {
                 const tagConfig = allTags.find(t => t.name.toLowerCase().trim() === tagName.toLowerCase().trim());
                 return (
                   <span key={tagName} className="px-3 py-1.5 bg-[var(--bg-main)] rounded-xl text-[9px] font-bold text-[var(--text-secondary)] flex items-center gap-1.5 border border-[var(--border-color)]">
                     <TagIcon size={10} style={{ color: tagConfig?.color || '#71717a' }} />
                     <span className="uppercase tracking-wider">{tagName}</span>
                   </span>
                 );
              })}
            </div>

            <div className="flex items-center justify-between pt-5 border-t border-[var(--border-color)]/50">
              <div className="flex gap-4">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setModalState('deleteConfirmOpen', true, note.id);
                  }}
                  className="p-2.5 text-[var(--text-secondary)] hover:text-red-500 transition-colors"
                >
                  <Trash2 size={20} />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setModalState('tagModalOpen', true, note.id);
                  }}
                  className="p-2.5 text-[var(--text-secondary)] hover:text-yellow-500 transition-colors"
                >
                  <TagIcon size={20} />
                </button>
              </div>
              
              <div className="flex items-center gap-2 text-yellow-500 font-bold text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                Abrir Nota
                <ChevronRight size={18} />
              </div>
            </div>
          </div>
        ))}

        {filteredNotes.length === 0 && (
          <div className="text-center py-24 opacity-30">
            <StickyNote size={48} className="mx-auto mb-4 text-[var(--text-secondary)]" />
            <p className="text-sm font-bold uppercase tracking-widest text-[var(--text-secondary)]">Nenhuma nota encontrada</p>
          </div>
        )}
      </div>

      <button
        onClick={() => navigate('/notes/edit/new')}
        className="fixed bottom-28 right-6 w-14 h-14 bg-yellow-500 text-zinc-950 rounded-2xl shadow-xl shadow-yellow-500/20 flex items-center justify-center active:scale-[0.9] transition-all z-10"
      >
        <Plus size={28} />
      </button>

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