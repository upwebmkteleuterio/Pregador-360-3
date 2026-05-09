import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '@/src/store/useStore';
import { ChevronLeft, Save, Link as LinkIcon, Trash2, Tag as TagIcon, Loader2 } from 'lucide-react';
import { databaseService } from '../services/databaseService';

export default function NoteEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { notes, items, addNote, updateNote, deleteNote, setModalState } = useStore();

  const isNew = id === 'new';
  const existingNote = notes.find(n => n.id === id);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [linkedItemId, setLinkedItemId] = useState<string | undefined>(undefined);
  const [noteTags, setNoteTags] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (existingNote) {
      setTitle(existingNote.title);
      setContent(existingNote.content);
      setLinkedItemId(existingNote.linkedItemId);
      setNoteTags(existingNote.tags || []);
    } else if (isNew && location.state) {
      if (location.state.title) setTitle(location.state.title);
      if (location.state.content) setContent(location.state.content);
    }
  }, [existingNote, isNew, location.state]);

  const handleSave = async () => {
    setIsSaving(true);

    try {
      if (isNew) {
        const noteId = await databaseService.saveNote({
          title,
          content,
          linkedItemId,
        });

        if (noteId) {
          addNote({
            id: noteId,
            title,
            content,
            linkedItemId,
            tags: noteTags,
            createdAt: new Date().toISOString()
          });
        }
      } else if (existingNote) {
        const { error } = await databaseService.updateNote(existingNote.id, {
          title,
          content,
          linkedItemId
        });
        
        if (!error) {
          updateNote(existingNote.id, { title, content, linkedItemId, tags: noteTags });
        }
      }
      navigate('/notes');
    } catch (err) {
      console.error('Erro ao salvar nota:', err);
      alert('Houve um erro ao salvar sua nota no servidor.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!existingNote) return;
    if (confirm('Deseja excluir esta nota?')) {
      try {
        const { error } = await databaseService.deleteNote(existingNote.id);
        if (!error) {
          deleteNote(existingNote.id);
          navigate('/notes');
        }
      } catch (err) {
        alert('Erro ao excluir nota do servidor.');
      }
    }
  };

  return (
    <div className="space-y-8 pb-32">
       <EditorHeader onBack={() => navigate('/notes')} />

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest ml-1">
            Vincular a Conteúdo
          </label>
          <div className="relative">
            <select
              value={linkedItemId || ''}
              onChange={(e) => setLinkedItemId(e.target.value || undefined)}
              className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 pl-12 text-sm text-[var(--text-primary)] outline-none focus:border-yellow-500/30 transition-all appearance-none"
            >
              <option value="">Nenhum vínculo</option>
              {items.map(item => (
                <option key={item.id} value={item.id} className="bg-[var(--bg-card)]">{item.type}: {item.title}</option>
              ))}
            </select>
            <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-secondary)] text-[8px]">▼</div>
          </div>
        </div>

        <div className="space-y-4">
          <TagSection 
            tags={noteTags} 
            isNew={isNew} 
            onAddTag={() => setModalState('tagModalOpen', true, id)} 
          />

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título da Nota"
            className="w-full bg-transparent border-none text-3xl font-bold text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/30 outline-none"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Comece a registrar seus pensamentos, reflexões ou insights aqui..."
            className="w-full bg-transparent border-none text-[var(--text-secondary)] leading-relaxed outline-none resize-none min-h-[50vh]"
            rows={15}
          />
        </div>
      </div>

      <EditorActions 
        isNew={isNew} 
        onDelete={handleDelete} 
        onSave={handleSave} 
        isSaving={isSaving}
      />
    </div>
  );
}

function EditorHeader({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <button onClick={onBack} className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-yellow-500 transition-colors">
        <ChevronLeft size={20} />
        <span className="text-sm font-bold uppercase tracking-wider">Voltar</span>
      </button>
      <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em]">Modo Edição</div>
    </div>
  );
}

function TagSection({ tags, isNew, onAddTag }: { tags: string[], isNew: boolean, onAddTag: () => void }) {
  return (
    <div className="flex items-center gap-3">
      <TagIcon size={16} className="text-yellow-500" />
      <div className="flex flex-wrap gap-2">
        {tags.length > 0 ? (
          tags.map(tag => (
            <span key={tag} className="px-3 py-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-full text-[10px] font-bold text-[var(--text-secondary)]">
              {tag}
            </span>
          ))
        ) : (
          <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest">Sem Tags</span>
        )}
        {!isNew && (
          <button onClick={onAddTag} className="px-3 py-1 border border-dashed border-[var(--border-color)] rounded-full text-[10px] font-bold text-[var(--text-secondary)] hover:text-yellow-500">
            + TAG
          </button>
        )}
      </div>
    </div>
  );
}

function EditorActions({ isNew, onDelete, onSave, isSaving }: { isNew: boolean, onDelete: () => void, onSave: () => void, isSaving: boolean }) {
  return (
    <div className="fixed bottom-28 left-6 right-6 flex gap-3">
      {!isNew && (
        <button 
          onClick={onDelete}
          disabled={isSaving}
          className="p-5 bg-[var(--bg-card)] border border-[var(--border-color)] text-red-500 rounded-2xl hover:bg-red-500/10 transition-all active:scale-[0.95]"
        >
          <Trash2 size={24} />
        </button>
      )}
      <button
        onClick={onSave}
        disabled={isSaving}
        className="flex-1 py-5 bg-yellow-500 text-zinc-950 rounded-2xl font-bold uppercase tracking-[0.2em] shadow-xl shadow-yellow-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
      >
        {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
        {isSaving ? 'Salvando...' : 'Salvar Nota'}
      </button>
    </div>
  );
}