"use client";

import React, { useState } from 'react';
import { Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { useStore } from '@/src/store/useStore';
import { ModalBase } from './ModalBase';

export function DeleteTagConfirmModal() {
  const { modals, setModalState, deleteTag, tags } = useStore();
  const tag = tags.find(t => t.id === modals.currentTagId);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!tag) return;
    setIsDeleting(true);

    try {
      await deleteTag(tag.id);
      setModalState('deleteTagConfirmOpen', false);
    } catch (err) {
      alert('Erro ao excluir tag do servidor.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ModalBase
      title="Remover Tag?"
      isOpen={modals.deleteTagConfirmOpen}
      onClose={() => setModalState('deleteTagConfirmOpen', false)}
      type="center"
    >
      <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6 mx-auto">
        {isDeleting ? <Loader2 className="animate-spin text-red-500" size={32} /> : <AlertTriangle className="text-red-500" size={32} />}
      </div>
      
      <p className="text-[var(--text-secondary)] text-center text-sm leading-relaxed mb-8">
        Deseja remover a tag <span className="text-[var(--text-primary)] font-bold">"{tag?.name}"</span>? 
        <br/><br/>
        Ela pode estar interligada com sermões, ilustrações ou notas. Ao remover, esta tag não aparecerá mais ligada aos seus arquivos salvos.
      </p>
      
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setModalState('deleteTagConfirmOpen', false)}
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
          {isDeleting ? 'Removendo...' : 'Confirmar'}
        </button>
      </div>
    </ModalBase>
  );
}