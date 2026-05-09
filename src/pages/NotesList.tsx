import React, { useEffect } from 'react';
import { useStore } from '@/src/store/useStore';
import { Search, Plus, StickyNote, ChevronRight, Trash2, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function NotesList() {
  const navigate = useNavigate();
  const { notes, notesLibrary, setNotesLibraryState, setModalState, tags } = useStore();

  // Limpa a busca ao sair da tela (unmount)
  useEffect(() => {
    return () => {
      setNotesLibraryState({ searchQuery: '' });
    };
  }, [setNotesLibraryState]);

  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(notesLibrary.searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(notesLibrary.searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-32">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-[var(--text-primary)]">Minhas Notas</h1>
        <p className="text-[var(--text-secondary)] text-sm">Reflexões, estudos e pensamentos diários na presença da Palavra.</p>
      </div>

      <div className="relative group">
        <input
          type="text"
          value={notesLibrary.searchQuery}
          onChange={(e) => setNotesLibraryState({ searchQuery: e.target.value })}
          placeholder="Buscar nas anotações..."
          className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl px-5 py-4 pl-12 focus:outline-none focus:border-yellow-500/50 transition-all group-hover:border-[var(--border-color)] text-[var(--text-primary)]"
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-yellow-500 transition-colors" size={20} />
      </div>

      <div className="grid gap-4">
        {filteredNotes.map((note) => (
          <div 
            key={note.id}
            onClick={() => navigate(`/notes/edit/${note.id}`)}
            className="bg-[var(--bg-card)]/50 border border-[var(--border-color)] rounded-3xl p-6 space-y-4 relative group hover:border-[var(--border-color)] transition-all active:scale-[0.99] cursor-pointer"
          >
            <div className="flex justify-between items-start">
               <div className="space-y-2">
                <span className="text-[10px] font-bold text-[var(--text-secondary)]">
                  {new Date(note.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
                <h3 className="text-xl font-bold text-[var(--text-primary)] leading-tight">
                  {note.title || 'Nota sem título'}
                </h3>
                <p className="text-[var(--text-secondary)] text-sm line-clamp-3 leading-relaxed">
                  {note.content || 'Comece a escrever...'}
                </p>
              </div>
              <div className="text-[var(--text-secondary)] opacity-50">
                <StickyNote size={20} />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {note.tags.map(tagName => {
                 const tagConfig = tags.find(t => t.name === tagName);
                 return (
                   <span key={tagName} className="px-3 py-1 bg-[var(--border-color)] rounded-full text-[10px] font-bold text-[var(--text-primary)] flex items-center gap-1.5 border border-[var(--border-color)]/50">
                     <Tag size={10} style={{ color: tagConfig?.color || '#71717a' }} />
                     {tagName}
                   </span>
                 );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[var(--border-color)]/50">
              <div className="flex gap-4">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setModalState('deleteConfirmOpen', true, note.id);
                  }}
                  className="p-2 text-[var(--text-secondary)] hover:text-red-500 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setModalState('tagModalOpen', true, note.id);
                  }}
                  className="p-2 text-[var(--text-secondary)] hover:text-yellow-500 transition-colors"
                >
                  <Tag size={18} />
                </button>
              </div>
              
              <div className="text-[var(--text-secondary)] group-hover:text-yellow-500 transition-colors">
                <ChevronRight size={20} />
              </div>
            </div>
          </div>
        ))}

        {filteredNotes.length === 0 && (
          <div className="text-center py-24 opacity-30">
            <StickyNote size={48} className="mx-auto mb-4 text-[var(--text-secondary)]" />
            <p className="text-[var(--text-secondary)]">Nenhuma nota encontrada</p>
          </div>
        )}
      </div>

      <button
        onClick={() => navigate('/notes/edit/new')}
        className="fixed bottom-28 right-6 w-14 h-14 bg-yellow-500 text-zinc-950 rounded-2xl shadow-xl shadow-yellow-500/20 flex items-center justify-center active:scale-[0.9] transition-all z-10"
      >
        <Plus size={28} />
      </button>
    </div>
  );
}