"use client";

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface ModalBaseProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  type?: 'bottom' | 'center' | 'side';
  className?: string;
}

export function ModalBase({ 
  isOpen, 
  onClose, 
  title, 
  subtitle, 
  children, 
  type = 'bottom',
  className 
}: ModalBaseProps) {
  
  const variants = {
    bottom: {
      initial: { y: '100%' },
      animate: { y: 0 },
      exit: { y: '100%' },
      container: "fixed bottom-0 left-0 right-0 z-[70] p-6 bg-[var(--bg-card)] rounded-t-[32px] border-t border-[var(--border-color)]",
    },
    center: {
      initial: { scale: 0.9, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      exit: { scale: 0.9, opacity: 0 },
      container: "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] w-full max-w-sm p-6 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[32px] shadow-2xl",
    },
    side: {
      initial: { x: '100%' },
      animate: { x: 0 },
      exit: { x: '100%' },
      container: "fixed top-0 bottom-0 right-0 z-[70] w-full max-w-sm bg-[var(--bg-card)] border-l border-[var(--border-color)] shadow-2xl p-6 overflow-y-auto",
    }
  };

  const currentVariant = variants[type];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={currentVariant.initial}
            animate={currentVariant.animate}
            exit={currentVariant.exit}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={cn(currentVariant.container, className)}
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-yellow-500">{title}</h2>
                {subtitle && <p className="text-xs text-[var(--text-secondary)] mt-1">{subtitle}</p>}
              </div>
              <button 
                onClick={onClose}
                className="p-2 bg-[var(--border-color)]/50 rounded-full text-[var(--text-secondary)] hover:text-yellow-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}