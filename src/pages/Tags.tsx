import React from 'react';
import { useStore } from '@/src/store/useStore';
import { Plus, Edit2, Trash2, Tag, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Tags() {
  const navigate = useNavigate();
  const { tags, setModalState } = useStore();

  const handleEdit = (id: string) => {
    setModalState('createEditTagModalOpen', true, id);
  };

  const handleCreate = () => {
    setModalState('createEditTagModalOpen', true, null);
  };

  const handleDelete = (tagId: string) => {
    setModalState('deleteTagConfirmOpen', true, tagId);
  };

  return (
    <div className="space-y-8 pb-32">
       <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="p-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl text-[var(--text-secondary)] hover:text-yellow-500 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-yellow-500">
          Gerenciar Tags
        </h1>
        <button 
          onClick={handleCreate}
          className="p-3 bg-yellow-500 text-zinc-950 rounded-2xl shadow-lg shadow-yellow-500/20 active:scale-[0.98]"
        >
          <Plus size={24} />
        </button>
      </div>

      <div className="grid gap-4">
        {tags.map((tag) => (
          <div 
            key={tag.id}
            className="flex items-center justify-between p-5 bg-[var(--bg-card)]/50 border border-[var(--border-color)] rounded-3xl"
          >
            <div className="flex items-center gap-4">
              <div 
                className="h-10 w-10 rounded-2xl flex items-center justify-center shadow-lg"
                style={{ backgroundColor: tag.color + '20', color: tag.color, border: `1px solid ${tag.color}40` }}
              >
                <Tag size={20} />
              </div>
              <div>
                <div className="font-bold text-[var(--text-primary)] tracking-wide">{tag.name}</div>
                <div className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest">Ativa</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => handleEdit(tag.id)}
                className="p-3 bg-[var(--border-color)]/30 text-[var(--text-secondary)] rounded-xl hover:text-yellow-500 transition-colors"
              >
                <Edit2 size={18} />
              </button>
              <button 
                onClick={() => handleDelete(tag.id)}
                className="p-3 bg-[var(--border-color)]/30 text-[var(--text-secondary)] rounded-xl hover:text-red-500 transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}

        {tags.length === 0 && (
          <div className="text-center py-20 text-[var(--text-secondary)] italic">
            Nenhuma tag criada ainda
          </div>
        )}
      </div>
    </div>
  );
}