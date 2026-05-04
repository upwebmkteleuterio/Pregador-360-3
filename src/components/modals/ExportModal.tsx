"use client";

import React from 'react';
import { FileText, Download, Printer } from 'lucide-react';
import { useStore } from '@/src/store/useStore';
import { ModalBase } from './ModalBase';

export function ExportModal() {
  const { modals, setModalState } = useStore();

  const options = [
    {
      id: 'pdf',
      title: 'Documento PDF',
      desc: 'Salve o documento como PDF',
      icon: <FileText className="text-red-400" />,
    },
    {
      id: 'docx',
      title: 'DOCX (Word)',
      desc: 'Arquivo editável Microsoft Word',
      icon: <FileText className="text-blue-400" />,
    },
    {
      id: 'print',
      title: 'Impressão Direta',
      desc: 'Otimizado para leitura no púlpito',
      icon: <Printer className="text-yellow-400" />,
    },
  ];

  const handleOptionClick = (id: string) => {
    window.dispatchEvent(new CustomEvent('app-export', { detail: { type: id } }));
    setModalState('exportOpen', false);
  };

  return (
    <ModalBase
      title="Exportar Conteúdo"
      isOpen={modals.exportOpen}
      onClose={() => setModalState('exportOpen', false)}
      type="bottom"
    >
      <div className="space-y-4">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => handleOptionClick(opt.id)}
            className="w-full flex items-center gap-4 p-4 bg-[var(--border-color)]/30 border border-[var(--border-color)] rounded-2xl hover:border-yellow-500/50 transition-all text-left group active:scale-[0.98]"
          >
            <div className="p-4 bg-[var(--bg-main)] rounded-xl group-hover:scale-110 transition-transform">
              {opt.icon}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-[var(--text-primary)]">{opt.title}</div>
              <div className="text-xs text-[var(--text-secondary)]">{opt.desc}</div>
            </div>
            <Download className="text-[var(--text-secondary)] group-hover:text-yellow-500 transition-colors" size={20} />
          </button>
        ))}
      </div>

      <button
        onClick={() => setModalState('exportOpen', false)}
        className="w-full mt-8 py-4 bg-[var(--border-color)] text-[var(--text-secondary)] rounded-2xl font-medium hover:bg-yellow-500 hover:text-zinc-950 transition-colors"
      >
        Cancelar
      </button>
    </ModalBase>
  );
}