"use client";

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useStore } from '@/src/store/useStore';
import { cn } from '@/src/lib/utils';
import { databaseService } from '@/src/services/databaseService';
import { ModalBase } from './ModalBase';

export function CreateEditTagModal() {
  const { modals, setModalState, tags, addTag, updateTag, auth } = useStore();
  const editingTag = tags.find(t => t.id === modals.currentTagId);
  
  const [name, setName] = useState('');
  const [color, setColor] = useState('#EF4444');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (editingTag) {
      setName(editingTag.name);
      setColor(editingTag.color);
    } else {
      setName('');
      setColor('#EF4444');
    }
  }, [editingTag, modals.createEditTagModalOpen]);

  const colors = [
    '#EF4444', '#3B82F6', '#10B981', '#F59E0B', 
    '#A855F7', '#EC4899', '#6366F1', '#06B6D4'
  ];

  const handleSave = async () => {
    if (!name.trim() || !auth.user?.id) return;
    setIsSaving(true);
    
    try {
      if (editingTag) {
        const { error } = await databaseService.updateTag(auth.user.id, editingTag.id, { name, color });
        if (!error) updateTag(editingTag.id, { name, color });
      } else {
        const { data, error } = await databaseService.createTag(auth.user.id, name, color);
        if (data && !error) {
          addTag(data.name, data.color);
        }
      }
      setModalState('createEditTagModalOpen', false);
    } catch (err) {
      alert('Erro ao salvar tag no banco.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModalBase
      title={editingTag ? 'Editar Tag' : 'Criar Tag'}
      isOpen={modals.createEditTagModalOpen}
      onClose={() => setModalState('createEditTagModalOpen', false)}
      type="center"
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest pl-1">Nome da Tag</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl p-4 text-[var(--text-primary)] outline-none focus:border-yellow-500/50 transition-all"
            placeholder="Ex: Graça, Fé..."
          />
        </div>

        <div className="space-y-4">
          <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest pl-1">Cor</label>
          <div className="grid grid-cols-4 gap-3">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={cn(
                  "h-10 w-full rounded-xl transition-all border-2",
                  color === c ? "border-white scale-110 shadow-lg" : "border-transparent"
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full mt-8 py-5 bg-yellow-500 text-zinc-950 rounded-2xl font-bold uppercase tracking-widest shadow-xl shadow-yellow-500/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
      >
        {isSaving && <Loader2 className="animate-spin" size={18} />}
        {isSaving ? 'Salvando' : 'Salvar'}
      </button>
    </ModalBase>
  );
}