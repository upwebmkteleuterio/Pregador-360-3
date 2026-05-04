"use client";

import React, { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { useStore } from '@/src/store/useStore';
import { databaseService } from '@/src/services/databaseService';
import { ModalBase } from './ModalBase';

export function DeleteConfirmModal() {
  const { modals, setModalState, deleteItem, deleteNote, items, notes, auth } = useStore();
  const item = items.find(i => i.id === modals.currentItemId);
  const note = notes.find(n => n.id === modals.currentItemId);
  const target = item || note;
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!auth.user?.id || !target) return;
    setIsDeleting(true);

    try {
      if (item) {
        await databaseService.deleteContent(auth.user.id, item.id);
        deleteItem(item.id);
      } else if (note) {
        await databaseService.deleteNote(auth.user.id, note.id);
        deleteNote(note.id);
      }
      setModalState('deleteConfirmOpen', false);
    } catch (err) {
      alert('Erro ao excluir do servidor.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ModalBase
      title={`Excluir ${item ? (item.type === 'Ilustração' ? 'ilustração' : 'sermão') : 'nota'}?`}
      isOpen={modals.deleteConfirmOpen}
      onClose={() => setModalState('deleteConfirmOpen', false)}
      type="center"
    >
      <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6 mx-auto">
        {isDeleting ? <Loader2 className="animate-spin text-red-500" size={32} /> : <Trash2 className="text-red-500" size={32} />}
      </div>
      
      <p className="text-[var(--text-secondary)] text-center text-sm leading-relaxed mb-8">
        Você está prestes a excluir <span className="text-[var(--text-primary)] font-bold">"{target?.title}"</span>. Esta ação não pode ser desfeita.
      </p>
      
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setModalState('deleteConfirmOpen', false)}
          disabled={isDeleting}
          className="py-4 rounded-2xl bg-[var(--border-color)] text-[var(--text-primary)] font-bold text-sm uppercase tracking-wide hover:bg-yellow-500 hover:text-zinc-950 transition-all"
        >
          Cancelar
        </button>
        <button
          onClick={handleConfirmDelete}
          disabled={isDeleting}
          className="py-4 rounded-2xl bg-red-500 text-white font-bold text-sm uppercase tracking-wide hover:bg-red-600 transition-all flex items-center justify-center"
        >
          {isDeleting ? 'Excluindo...' : 'Excluir'}
        </button>
      </div>
    </ModalBase>
  );
}