"use client";

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Tag, StickyNote, CreditCard, LayoutGrid, ChevronRight } from 'lucide-react';
import { useStore } from '@/src/store/useStore';
import { ModalBase } from './ModalBase';

export function MoreMenu() {
  const { modals, setModalState } = useStore();
  const navigate = useNavigate();

  const menuItems = [
    { label: 'Tags', icon: Tag, path: '/tags', desc: 'Gerencie categorias' },
    { label: 'Notas', icon: StickyNote, path: '/notes', desc: 'Anotações rápidas' },
    { label: 'Minha Assinatura', icon: CreditCard, path: '/subscription', desc: 'Gerencie seu plano' },
    { label: 'Ver Planos', icon: LayoutGrid, path: '/plans', desc: 'Conheça o Premium' },
  ];

  return (
    <ModalBase
      title="Mais Opções"
      isOpen={modals.moreMenuOpen}
      onClose={() => setModalState('moreMenuOpen', false)}
      type="bottom"
      className="pb-12"
    >
      <div className="space-y-3">
        {menuItems.map((item) => (
          <button
            key={item.label}
            onClick={() => {
              navigate(item.path);
              setModalState('moreMenuOpen', false);
            }}
            className="w-full flex items-center justify-between p-5 bg-[var(--border-color)]/30 border border-[var(--border-color)] rounded-2xl hover:border-yellow-500/50 transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[var(--bg-main)] rounded-xl text-yellow-500">
                <item.icon size={20} />
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold text-[var(--text-primary)]">{item.label}</div>
                <div className="text-xs text-[var(--text-secondary)]">{item.desc}</div>
              </div>
            </div>
            <ChevronRight className="text-[var(--text-secondary)]" size={20} />
          </button>
        ))}
      </div>
    </ModalBase>
  );
}