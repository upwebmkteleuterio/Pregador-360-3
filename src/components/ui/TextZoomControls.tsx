"use client";

import React, { useState, useEffect } from 'react';
import { Minus, Plus } from 'lucide-react';

interface TextZoomControlsProps {
  onZoomChange: (zoom: number) => void;
}

export function TextZoomControls({ onZoomChange }: TextZoomControlsProps) {
  const [zoom, setZoom] = useState(() => {
    const saved = localStorage.getItem('pregador_360_zoom');
    return saved ? parseInt(saved, 10) : 100;
  });

  useEffect(() => {
    localStorage.setItem('pregador_360_zoom', zoom.toString());
    onZoomChange(zoom);
  }, [zoom, onZoomChange]);

  const handleZoomOut = () => {
    setZoom(prev => Math.max(70, prev - 10));
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(180, prev + 10));
  };

  const handleReset = () => {
    setZoom(100);
  };

  return (
    <div className="fixed bottom-[130px] left-1/2 -translate-x-1/2 z-[45] flex items-center gap-3 bg-[var(--bg-card)]/95 backdrop-blur-md px-4 py-2 rounded-full border border-[var(--border-color)] shadow-xl shadow-black/20 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <button
        onClick={handleZoomOut}
        disabled={zoom <= 70}
        className="p-1.5 rounded-full bg-[var(--bg-main)] hover:bg-yellow-500 hover:text-zinc-950 text-[var(--text-secondary)] disabled:opacity-30 disabled:hover:bg-[var(--bg-main)] disabled:hover:text-[var(--text-secondary)] transition-all"
        title="Diminuir texto"
      >
        <Minus size={14} />
      </button>
      
      <button
        onClick={handleReset}
        className="text-[10px] font-bold font-mono tracking-tight text-[var(--text-secondary)] hover:text-yellow-500 px-1"
        title="Restaurar padrão (100%)"
      >
        {zoom}%
      </button>

      <button
        onClick={handleZoomIn}
        disabled={zoom >= 180}
        className="p-1.5 rounded-full bg-[var(--bg-main)] hover:bg-yellow-500 hover:text-zinc-950 text-[var(--text-secondary)] disabled:opacity-30 disabled:hover:bg-[var(--bg-main)] disabled:hover:text-[var(--text-secondary)] transition-all"
        title="Aumentar texto"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}