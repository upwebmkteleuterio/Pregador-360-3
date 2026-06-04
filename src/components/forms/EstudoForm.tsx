"use client";

import React, { useState } from 'react';
import { Sparkles, BookOpen, Users, Loader2 } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { ShiningText } from '@/src/components/ui/shining-text';

interface EstudoFormProps {
  initialTopic?: string;
  onSubmit: (data: { topic: string; level: string; language: string }) => void;
  loading: boolean;
}

const LEVELS = ['Geral', 'Kids', 'Jovens', 'Adultos', 'Casais'];
const LANGUAGES = ['Português (Brasil)', 'Espanhol', 'Inglês'];

export function EstudoForm({ initialTopic = '', onSubmit, loading }: EstudoFormProps) {
  const [topic, setTopic] = useState(initialTopic);
  const [level, setLevel] = useState('Geral');
  const [language, setLanguage] = useState('Português (Brasil)');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    onSubmit({ topic, level, language });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <label className="text-[10px] font-bold tracking-widest text-[var(--text-secondary)] uppercase">
          Tema ou Texto Bíblico Base
        </label>
        <div className="relative group">
          <input
            type="text"
            required
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Ex: João 3:16 ou 'Importância da Comunhão'"
            className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl px-5 py-4 pl-12 focus:outline-none focus:border-yellow-500/50 transition-all group-hover:border-[var(--border-color)] text-[var(--text-primary)]"
          />
          <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-yellow-500 transition-colors" size={20} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-bold tracking-widest text-[var(--text-secondary)] uppercase pl-1">
            Nível do Grupo Pequeno (Público)
          </label>
          <div className="relative">
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4 pl-12 text-sm text-[var(--text-primary)] focus:border-yellow-500/50 outline-none transition-all appearance-none"
            >
              {LEVELS.map(lvl => (
                <option key={lvl} value={lvl} className="bg-[var(--bg-card)]">{lvl}</option>
              ))}
            </select>
            <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
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

      <div className="space-y-4">
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
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Gerando...
            </>
          ) : (
            <>
              <Sparkles size={20} />
              Gerar Estudo de Célula
            </>
          )}
        </button>

        {loading && (
          <div className="flex justify-center pt-2">
            <ShiningText text="Gerando o conteúdo, isso pode levar até 1 minuto." />
          </div>
        )}
      </div>
    </form>
  );
}