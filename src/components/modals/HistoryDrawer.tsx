"use client";

import React from 'react';
import { Sparkles, FileText, ChevronRight } from 'lucide-react';
import { useStore } from '@/src/store/useStore';
import { cn } from '@/src/lib/utils';
import { ModalBase } from './ModalBase';

export function HistoryDrawer() {
  const { modals, setModalState, items } = useStore();
  const item = items.find((i) => i.id === modals.currentItemId);

  return (
    <ModalBase
      title="Histórico"
      isOpen={modals.historyOpen}
      onClose={() => setModalState('historyOpen', false)}
      type="side"
    >
      <div className="space-y-4">
        {item?.versions.map((version) => (
          <div 
            key={version.id}
            className="relative p-4 rounded-2xl bg-[var(--border-color)]/30 border border-[var(--border-color)] hover:border-yellow-500/50 transition-all cursor-pointer group active:scale-[0.98]"
            onClick={() => {
              setModalState('restoredContent' as any, { title: version.title, content: version.content } as any);
              setModalState('historyOpen', false);
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={cn(
                "p-2 rounded-xl",
                version.label === 'IA' ? "bg-yellow-500/20 text-yellow-500" : "bg-blue-500/20 text-blue-400"
              )}>
                {version.label === 'IA' ? <Sparkles size={16} /> : <FileText size={16} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest leading-none mb-1">
                  {version.label === 'IA' ? 'Gerado por IA' : 'Edição Manual'}
                </div>
                <div className="text-xs text-[var(--text-secondary)]">
                  {new Date(version.createdAt).toLocaleDateString()} às {new Date(version.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
            
            <div className="text-sm font-semibold text-[var(--text-primary)] truncate">
              {version.title}
            </div>
            
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronRight size={16} className="text-yellow-500" />
            </div>
          </div>
        ))}

        {(!item?.versions || item.versions.length === 0) && (
          <div className="text-center py-12 text-[var(--text-secondary)] italic">
            Nenhuma versão anterior
          </div>
        )}
      </div>
    </ModalBase>
  );
}