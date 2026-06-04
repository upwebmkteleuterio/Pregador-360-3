"use client";

import React, { useState } from 'react';
import { Sparkles, Crown, Award } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface LiderancaFormProps {
  initialTopic?: string;
  onSubmit: (data: { topic: string; focus: string; language: string }) => void;
  loading: boolean;
}

const FOCUS_OPTIONS = ['Geral', 'Oração e Intimidade', 'Vida Pessoal do Líder', 'Gestão Eclesiástica', 'Resolução de Conflitos'];
const LANGUAGES = ['Português (Brasil)', 'Espanhol', 'Inglês'];

export function LiderancaForm({ initialTopic = '', onSubmit, loading }: LiderancaFormProps) {
  const [topic, setTopic] = useState(initialTopic);
  const [focus, setFocus] = useState('Geral');
  const [language, setLanguage] = useState('Português (Brasil)');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    onSubmit({ topic, focus, language });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <label className="text-[10px] font-bold tracking-widest text-[var(--text-secondary)] uppercase">
          Tema do Treinamento ou Dificuldade de Liderança
        </label>
        <div className="relative group">
          <input
            type="text"
            required
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Ex: 'Liderança Servil' ou 'Como Delegar Tarefas'"
            className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl px-5 py-4 pl-12 focus:outline-none focus:border-yellow-500/50 transition-all group-hover:border-[var(--border-color)] text-[var(--text-primary)]"
          />
          <Crown className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-yellow-500 transition-colors" size={20} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-bold tracking-widest text-[var(--text-secondary)] uppercase pl-1">
            Foco do Treinamento
          </label>
          <div className="relative">
            <select
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4 pl-12 text-sm text-[var(--text-primary)] focus:border-yellow-500/50 outline-none transition-all appearance-none"
            >
              {FOCUS_OPTIONS.map(opt => (
                <option key={opt} value={opt} className="bg-[var(--bg-card)]">{opt}</option>
              ))}
            </select>
            <Award className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-secondary)] text-[8px]">▼</div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold tracking-widest text-[var(--text-secondary)] uppercase pl-1">
            Idioma de Saída
          </label>
          <div className="relative">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4 pl-12 text-sm text-[var(--text-primary)] focus:border-yellow-500/50 outline-none transition-all appearance-none"
            >
              {LANGUAGES.map(lang => (
                <option key={lang} value={lang} className="bg-[var(--bg-card)]">{lang}</option>
              ))}
            </select>
            <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-secondary)] text-[8px]">▼</div>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !topic.trim()}
        className={cn(
          "w-full flex items-center justify-center gap-2 py-5 rounded-2xl font-bold uppercase tracking-widest transition-all relative overflow-hidden",
          topic.trim() && !loading
            ? "bg-yellow-500 text-zinc-950 shadow-xl shadow-yellow-500/20 active:scale-[0.98]"
            : "bg-[var(--bg-card)] text-[var(--text-secondary)] cursor-not-allowed"
        )}
      >
        <Sparkles size={20} />
        Gerar Estudo de Liderança
      </button>
    </form>
  );
}