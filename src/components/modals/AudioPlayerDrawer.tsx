"use client";

import React, { useState, useEffect } from 'react';
import { Headphones, Pause, Play } from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '@/src/store/useStore';
import { cn } from '@/src/lib/utils';
import { ModalBase } from './ModalBase';

export function AudioPlayerDrawer() {
  const { modals, setModalState, items } = useStore();
  const item = items.find((i) => i.id === modals.currentItemId);
  const [voiceGender, setVoiceGender] = useState<'female' | 'male'>('female');
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalLength, setTotalLength] = useState(0);
  
  const synth = window.speechSynthesis;

  const getCleanText = () => {
    if (!item) return '';
    const lines = item.content.split('\n');
    const dividerIndex = lines.findIndex(l => l.includes('---'));
    let contentLines = dividerIndex !== -1 ? lines.slice(dividerIndex + 1) : lines;
    return contentLines.map(line => line.trim().replace(/[#*_-]/g, '')).filter(l => l.length > 0).join('. ');
  };

  const stopAudio = () => {
    synth.cancel();
    setIsPlaying(false);
    setProgress(0);
  };

  useEffect(() => {
    if (!modals.audioPlayerOpen) stopAudio();
    return () => synth.cancel();
  }, [modals.audioPlayerOpen]);

  const togglePlay = () => {
    if (isPlaying && !synth.paused) {
      synth.pause();
      setIsPlaying(false);
    } else if (synth.paused) {
      synth.resume();
      setIsPlaying(true);
    } else {
      const text = getCleanText();
      if (!text) return;
      setTotalLength(text.length);
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = synth.getVoices();
      const preferredVoice = voices.find(v => v.lang.startsWith('pt') && (voiceGender === 'female' ? (v.name.includes('Maria') || v.name.includes('Google')) : true));
      if (preferredVoice) utterance.voice = preferredVoice;
      utterance.onboundary = (e: any) => setProgress(e.charIndex);
      utterance.onend = () => { setIsPlaying(false); setProgress(0); };
      synth.speak(utterance);
      setIsPlaying(true);
    }
  };

  return (
    <ModalBase
      title="Ouvir Conteúdo"
      subtitle={item?.title}
      isOpen={modals.audioPlayerOpen}
      onClose={() => setModalState('audioPlayerOpen', false)}
      type="bottom"
    >
      <div className="space-y-8 py-4">
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => { stopAudio(); setVoiceGender('male'); }} 
            className={cn(
              "flex flex-col items-center gap-4 p-6 rounded-[2rem] border transition-all font-bold text-xs uppercase tracking-widest", 
              voiceGender === 'male' ? "border-yellow-500 bg-yellow-500/10 text-yellow-500" : "border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-secondary)]"
            )}
          >
            Voz Masculina
          </button>
          <button 
            onClick={() => { stopAudio(); setVoiceGender('female'); }} 
            className={cn(
              "flex flex-col items-center gap-4 p-6 rounded-[2rem] border transition-all font-bold text-xs uppercase tracking-widest", 
              voiceGender === 'female' ? "border-yellow-500 bg-yellow-500/10 text-yellow-500" : "border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-secondary)]"
            )}
          >
            Voz Feminina
          </button>
        </div>
        
        <div className="w-full h-1 bg-[var(--bg-main)] rounded-full overflow-hidden">
          <motion.div animate={{ width: `${(progress / (totalLength || 1)) * 100}%` }} className="h-full bg-yellow-500" />
        </div>
        
        <div className="flex items-center justify-center gap-8">
          <button onClick={togglePlay} className="w-20 h-20 flex items-center justify-center rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 shadow-lg shadow-yellow-500/5 active:scale-95 transition-all">
            {isPlaying ? <Pause size={36} fill="currentColor" /> : <Play size={36} className="ml-1" fill="currentColor" />}
          </button>
        </div>
      </div>
    </ModalBase>
  );
}