import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '@/src/store/useStore';
import { X, Play, Pause, Minus, Plus, Type } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';

export default function PreachingMode() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { items, preachingMode, setPreachingModeState } = useStore();
  const item = items.find((i) => i.id === id);

  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [lastInteraction, setLastInteraction] = useState(0);
  const isInteractingRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>(null);
  const lastTimeRef = useRef<number>(0);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>(null);
  const wakeLockRef = useRef<any>(null);

  // Screen Wake Lock to prevent sleep
  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err) {
        console.log('Wake Lock error:', err);
      }
    };

    if (isPlaying) {
      requestWakeLock();
    } else {
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    }

    return () => {
      if (wakeLockRef.current) wakeLockRef.current.release();
    };
  }, [isPlaying]);

  // Auto-hide controls logic
  useEffect(() => {
    if (isPlaying && showControls) {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 2500); // Hide after 2.5 seconds of playing
    } else if (!isPlaying) {
      // Ensure controls stay visible when paused
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      setShowControls(true);
    }
    
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying, showControls, lastInteraction]);

  const accumulatedScrollRef = useRef<number>(0);

  // Auto-scroll logic with delta time for ultra-smoothness
  const animate = (time: number) => {
    if (isPlaying && scrollRef.current) {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = time;
        accumulatedScrollRef.current = scrollRef.current.scrollTop;
      }
      
      const deltaTime = time - lastTimeRef.current;
      lastTimeRef.current = time;

      // Only update scrollTop if user is NOT currently interacting
      if (!isInteractingRef.current) {
        const pixelsPerMs = preachingMode.scrollSpeed * 0.02; 
        accumulatedScrollRef.current += pixelsPerMs * deltaTime;
        scrollRef.current.scrollTop = accumulatedScrollRef.current;
      } else {
        // Sync our reference to where the user manually scrolled
        accumulatedScrollRef.current = scrollRef.current.scrollTop;
      }
    } else {
      lastTimeRef.current = 0;
      if (scrollRef.current) {
        accumulatedScrollRef.current = scrollRef.current.scrollTop;
      }
    }
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (isPlaying && scrollRef.current) {
      accumulatedScrollRef.current = scrollRef.current.scrollTop;
    }
  }, [isPlaying]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, preachingMode.scrollSpeed]);

  if (!item) return null;

  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsPlaying(!isPlaying);
    // When playing, we allow auto-hide. When pausing, we force show.
    setShowControls(true);
  };

  const handleInteraction = () => {
    setShowControls(true);
    setLastInteraction(Date.now());
  };

  const formatContent = (content: string) => {
    // Clean content from literal \n and escaped quotes
    const cleanContent = content
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'");
    
    return cleanContent.split('\n').map((line, idx) => {
      const trimmedLine = line.trim();
      
      if (!trimmedLine) return <div key={idx} className="h-4" />;

      // Separators
      if (trimmedLine === '---' || trimmedLine.startsWith('---')) {
        return <div key={idx} className="h-[2px] w-full bg-[var(--border-color)]/30 my-16 rounded-full" />;
      }

      // Main Title (# )
      if (trimmedLine.startsWith('# ')) {
         const title = trimmedLine.replace('# ', '').replace(/^\[|\]$/g, '');
         return <h2 key={idx} className="text-4xl text-yellow-500 font-bold uppercase tracking-tight py-8 mb-4">{title}</h2>;
      }

      // Section Header (## )
      if (trimmedLine.startsWith('## ')) {
        const title = trimmedLine.replace('## ', '');
        return (
          <div key={idx} className="mt-24 mb-12">
            <h3 className="text-sm font-bold text-yellow-500/30 uppercase tracking-[0.4em] mb-4">
              {title}
            </h3>
            <div className="bg-yellow-500/5 border-l-[12px] border-yellow-500/50 p-12 rounded-r-3xl">
               <span className="text-4xl text-yellow-500 font-bold block">
                 {title}
               </span>
            </div>
          </div>
        );
      }

      // Point Header (### )
      if (trimmedLine.startsWith('### ')) {
        return (
          <h4 key={idx} className="text-2xl font-sans text-[var(--text-primary)] font-bold mt-16 mb-8 flex items-center gap-6 border-b-2 border-[var(--border-color)]/30 pb-4">
            <span className="flex items-center justify-center min-w-[3rem] h-[3rem] rounded-xl bg-yellow-500/20 text-yellow-500 text-xl font-black">
              {trimmedLine.match(/\d+/) ? trimmedLine.match(/\d+/)![0] : '•'}
            </span>
            {trimmedLine.replace(/###\s+(\d+\.\s+)?/, '')}
          </h4>
        );
      }

      // Bullet points
      if (trimmedLine.startsWith('•')) {
        return (
          <div key={idx} className="flex gap-4 py-2 pl-4">
            <span className="text-yellow-500/50">•</span>
            <p className="text-[var(--text-primary)] font-medium opacity-90">
              {trimmedLine.substring(1).trim()}
            </p>
          </div>
        );
      }

      // Labels (Rótulos)
      if (trimmedLine.includes(':')) {
         const parts = trimmedLine.split(':');
         const firstPart = parts[0].trim();
         if (firstPart.length > 2 && firstPart === firstPart.toUpperCase()) {
            return (
              <div key={idx} className="py-4">
                <span className="text-yellow-500 font-bold uppercase tracking-widest mr-4">{firstPart}:</span>
                <span className="text-[var(--text-primary)] opacity-80 leading-relaxed">{parts.slice(1).join(':').trim()}</span>
              </div>
            );
         }
      }

      return <p key={idx} className="text-[var(--text-secondary)] leading-relaxed py-2 min-h-[2rem]">{line}</p>;
    });
  };

  return (
    <div 
      className="fixed inset-0 bg-[var(--bg-main)] z-[100] flex flex-col select-none text-[var(--text-primary)]"
      style={{ cursor: showControls ? 'auto' : 'none' }}
      onClick={handleInteraction}
    >
      {/* Header */}
      <AnimatePresence>
        {showControls && (
          <motion.div 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 left-0 right-0 flex items-center justify-between p-6 bg-gradient-to-b from-[var(--bg-main)] via-[var(--bg-main)]/80 to-transparent z-[110]"
          >
            <div>
              <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-[0.2em]">
                {new Date(item.createdAt).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
              <h1 className="text-xl font-bold text-[var(--text-primary)]">{item.title}</h1>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/view/${id}`);
              }}
              className="p-4 bg-[var(--bg-card)]/50 rounded-2xl text-[var(--text-secondary)] hover:text-yellow-500 transition-colors"
            >
              <X size={24} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="flex-1 relative overflow-hidden">
        {/* Focus Mask Layers */}
        <div className="absolute inset-0 pointer-events-none z-20 flex flex-col">
          <div className="h-[35%] w-full bg-gradient-to-b from-[var(--bg-main)] via-[var(--bg-main)]/80 to-transparent" />
          <div className="flex-1" />
          <div className="h-[35%] w-full bg-gradient-to-t from-[var(--bg-main)] via-[var(--bg-main)]/80 to-transparent" />
        </div>

        {/* Reading Guide Line */}
        <div className="absolute top-1/2 left-0 right-0 z-30 pointer-events-none -translate-y-1/2 px-4">
          <div className="max-w-5xl mx-auto flex items-center gap-4">
            <div className="h-px flex-1 bg-yellow-500/20 shadow-[0_0_10px_rgba(234,179,8,0.2)]" />
            <div className="h-1.5 w-1.5 rounded-full bg-yellow-500/40 animate-pulse" />
            <div className="h-px flex-1 bg-yellow-500/20 shadow-[0_0_10px_rgba(234,179,8,0.2)]" />
          </div>
        </div>

        <div 
          ref={scrollRef}
          onTouchStart={() => { isInteractingRef.current = true; handleInteraction(); }}
          onTouchEnd={() => { isInteractingRef.current = false; }}
          onMouseDown={() => { isInteractingRef.current = true; handleInteraction(); }}
          onMouseUp={() => { isInteractingRef.current = false; }}
          onWheel={() => { 
            isInteractingRef.current = true; 
            handleInteraction(); 
            // Reset interacting after a short delay since wheel doesn't have "end"
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
            setTimeout(() => { isInteractingRef.current = false; }, 1000);
          }}
          className="h-full overflow-y-auto px-8 md:px-32 py-[45vh] relative z-10"
          style={{ fontSize: `${preachingMode.fontSize}px` }}
        >
        <div className="max-w-4xl mx-auto space-y-1 flex flex-col text-[var(--text-primary)] leading-[1.8]">
           {formatContent(item.content)}
           <div className="h-screen" /> {/* Bottom padding to allow full scroll of content */}
        </div>
      </div>
    </div>

      {/* Controls Container */}
      <AnimatePresence>
        {showControls && (
          <motion.div 
            initial={{ y: 200, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 200, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 p-4 md:p-8 bg-gradient-to-t from-[var(--bg-main)] via-[var(--bg-main)]/95 to-transparent z-[110]"
          >
            <div className="max-w-xl mx-auto flex flex-col items-center gap-6 bg-[var(--bg-card)]/90 backdrop-blur-2xl p-6 rounded-[2.5rem] border border-[var(--border-color)]/50 shadow-2xl">
              <div className="flex items-center justify-between w-full gap-4">
                <div className="flex items-center bg-[var(--bg-main)]/40 rounded-2xl p-1 border border-[var(--border-color)]">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreachingModeState({ fontSize: Math.max(16, preachingMode.fontSize - 4) });
                    }}
                    className="p-3 text-[var(--text-secondary)] hover:text-yellow-500"
                  >
                    <Minus size={16} />
                  </button>
                  <div className="px-3 text-xs font-bold font-mono text-[var(--text-secondary)] flex items-center gap-2">
                    <Type size={14} />
                    {preachingMode.fontSize}px
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreachingModeState({ fontSize: Math.min(120, preachingMode.fontSize + 4) });
                    }}
                    className="p-3 text-[var(--text-secondary)] hover:text-yellow-500"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <button 
                  onClick={togglePlay}
                  className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-xl active:scale-95",
                    isPlaying 
                      ? "bg-[var(--bg-main)] text-yellow-500 border border-yellow-500/30" 
                      : "bg-yellow-500 text-zinc-950"
                  )}
                >
                  {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
                </button>
              </div>

              <div className="w-full space-y-3 px-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em]">Velocidade do Scroll</span>
                  <span className="text-[10px] font-mono text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-md">{preachingMode.scrollSpeed}x</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="10" 
                  step="0.1"
                  value={preachingMode.scrollSpeed}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => setPreachingModeState({ scrollSpeed: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-[var(--border-color)] rounded-lg appearance-none cursor-pointer accent-yellow-500"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        ::-webkit-scrollbar {
          width: 0;
          background: transparent;
        }
      `}</style>
    </div>
  );
}
