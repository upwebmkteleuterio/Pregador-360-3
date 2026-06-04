"use client";

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CopyButtonProps {
  content: string;
  className?: string;
  onCopy?: () => void;
}

export function CopyButton({ content, className, onCopy }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      if (onCopy) onCopy();
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Falha ao copiar conteúdo: ', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={className}
      title="Copiar para área de transferência"
    >
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.div
            key="check"
            initial={{ scale: 0.3, rotate: -45, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0.3, rotate: 45, opacity: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 15 }}
          >
            <Check className="text-green-500" size={20} />
          </motion.div>
        ) : (
          <motion.div
            key="copy"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 15 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Copy size={20} />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}