"use client";

import React, { useState } from 'react';
import { Check, Loader2, Plus } from 'lucide-react';
import { useStore } from '@/src/store/useStore';
import { cn } from '@/src/lib/utils';
import { ModalBase } from './ModalBase';
import { databaseService } from '@/src/services/databaseService';

export function TagModal() {
  const { modals, setModalState, tags, toggleTag, items, notes, addTag, auth } = useStore();
  const [isCreating, setIsCreating] = useState(false);
  
  const item = items.find((i) => i.id === modals.currentItemId);
  const note = notes.find((n) => n.id === modals.currentItemId);
  const currentObject = item || note;

  const handleCreateQuickTag = async () => {
    const name = prompt('Nome da nova tag:');
    if (!name || !auth.user?.id) return;

    setIsCreating(true);
    try {
      const { data, error } = await databaseService.createTag(auth.user.id, name, '#71717a');
      if (data && !error) {
        addTag(data);
        // Opcional: Já vincular a tag recém criada ao item atual
        if (currentObject) {
          await toggleTag(currentObject.id, data.id);
        }
      }
    } catch (err) {
      console.error("Erro ao criar tag rápida:", err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <ModalBase
      title="Atribuir Tags"
      isOpen={modals.tagModalOpen}
      onClose={() => setModalState('tagModalOpen', false)}
      type="bottom"
    >
      <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 no-scrollbar">
        {tags.map((tag) => {
          const isSelected = currentObject?.tags.includes(tag.name);
          return (
            <button
              key={tag.id}
              onClick={() => currentObject && toggleTag(currentObject.id, tag.id)}
              className={cn(
                "w-full flex items-center justify-between p-4 bg-[var(--border-color)]/30 border rounded-2xl transition-all active:scale-[0.98]",
                isSelected ? "border-yellow-500 bg-yellow-500/5" : "border-[var(--border-color)]"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: tag.color }} />
                <span className={cn("font-medium", isSelected ? "text-yellow-500" : "text-[var(--text-primary)]")}>
                  {tag.name}
                </span>
              </div>
              <div className={cn(
                "h-6 w-6 rounded-lg border flex items-center justify-center transition-colors",
                isSelected ? "bg-yellow-500 border-yellow-500" : "border-[var(--border-color)]"
              )}>
                {isSelected && <Check size={14} className="text-zinc-950 font-bold" />}
              </div>
            </button>
          );
        })}
        
        <button 
          onClick={handleCreateQuickTag}
          disabled={isCreating}
          className="w-full flex items-center gap-3 p-4 text-[var(--text-secondary)] hover:text-yellow-500 transition-colors disabled:opacity-50"
        >
          <div className="h-6 w-6 flex items-center justify-center border border-dashed border-[var(--border-color)] rounded-lg">
            {isCreating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={16} />}
          </div>
          <span className="text-sm font-medium">
            {isCreating ? 'Criando...' : 'Criar nova tag'}
          </span>
        </button>
      </div>

      <button
        onClick={() => setModalState('tagModalOpen', false)}
        className="w-full mt-8 py-5 bg-yellow-500 text-zinc-950 rounded-2xl font-bold uppercase tracking-widest shadow-xl shadow-yellow-500/10"
      >
        Confirmar
      </button>
    </ModalBase>
  );
}