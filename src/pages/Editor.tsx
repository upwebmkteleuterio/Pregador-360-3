import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '@/src/store/useStore';
import { 
  ChevronLeft, 
  Save, 
  History, 
  Tag as TagIcon,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { databaseService } from '../services/databaseService';

export default function Editor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { items, updateItem, setModalState, addVersion, modals, auth } = useStore();
  
  const item = items.find(i => i.id === id);
  const [editedTitle, setEditedTitle] = useState(item?.title || '');
  const [editedContent, setEditedContent] = useState(item?.content || '');
  
  const [lastSavedTitle, setLastSavedTitle] = useState(item?.title || '');
  const [lastSavedContent, setLastSavedContent] = useState(item?.content || '');
  
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const editorRef = useRef<HTMLDivElement>(null);

  const isDirty = editedTitle !== lastSavedTitle || editedContent !== lastSavedContent;

  useEffect(() => {
    if (modals.restoredContent) {
      const { title, content } = modals.restoredContent;
      setEditedTitle(title);
      setEditedContent(content);
      if (editorRef.current) {
        editorRef.current.innerText = content;
      }
      setModalState('restoredContent' as any, null as any);
    }
  }, [modals.restoredContent]);

  useEffect(() => {
    if (item) {
      setEditedTitle(item.title);
      setEditedContent(item.content);
      setLastSavedTitle(item.title);
      setLastSavedContent(item.content);
      if (editorRef.current) {
        editorRef.current.innerText = item.content;
      }
    }
  }, [item?.id]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  if (!item) {
    return <div className="p-12 text-center text-[var(--text-secondary)]">Item não encontrado</div>;
  }

  const handleSave = async () => {
    if (!auth.user?.id || !id) return;
    
    setIsSaving(true);
    const finalContent = editorRef.current?.innerText || editedContent;
    
    try {
      // 1. Persistir no Supabase primeiro
      const { data: newVersion, error } = await databaseService.saveContentVersion(
        auth.user.id,
        id,
        editedTitle,
        finalContent,
        'Manual'
      );

      if (error) throw error;

      // 2. Atualizar estado local apenas após sucesso no banco
      if (newVersion) {
        addVersion(item.id, {
          title: editedTitle,
          content: finalContent,
        }, 'Manual');
      }
      
      updateItem(item.id, {
        title: editedTitle,
        content: finalContent,
      });

      setLastSavedTitle(editedTitle);
      setLastSavedContent(finalContent);
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Erro ao salvar:', err);
      alert('Erro ao salvar no servidor. Verifique sua conexão.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (isDirty) {
      setShowExitConfirm(true);
    } else {
      navigate(`/view/${id}`);
    }
  };

  const execCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
       setEditedContent(editorRef.current.innerText);
    }
  };

  return (
    <div className="space-y-6 pb-20 relative animate-in fade-in duration-500">
      {/* Toast Notifications */}
      <div className="fixed bottom-24 left-0 right-0 z-50 flex flex-col items-center gap-2 pointer-events-none px-4">
        <AnimatePresence>
          {showSaveSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="bg-green-500 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 pointer-events-auto"
            >
              <CheckCircle2 size={20} />
              <span className="font-bold text-sm">Alterações salvas com sucesso!</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Exit Confirmation Modal */}
      <AnimatePresence>
        {showExitConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
              onClick={() => setShowExitConfirm(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[var(--bg-card)] border border-[var(--border-color)] p-6 rounded-[2.5rem] max-w-sm w-full relative z-10 shadow-2xl"
            >
              <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mb-6 mx-auto">
                <AlertTriangle className="text-yellow-500" size={32} />
              </div>
              <h2 className="text-xl text-[var(--text-primary)] font-bold text-center mb-2">Descartar alterações?</h2>
              <p className="text-[var(--text-secondary)] text-center text-sm leading-relaxed mb-8">
                Você fez alterações que ainda não foram salvas. Deseja realmente sair?
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="py-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold text-sm uppercase tracking-wide hover:bg-[var(--border-color)] transition-all"
                >
                  Continuar
                </button>
                <button
                  onClick={() => navigate(`/view/${id}`)}
                  className="py-4 rounded-2xl bg-red-500 text-white font-bold text-sm uppercase tracking-wide hover:bg-red-600 transition-all"
                >
                  Sair
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <button 
          onClick={handleBack}
          className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-yellow-500 transition-colors"
        >
          <ChevronLeft size={20} />
          <span className="text-sm font-medium">Voltar</span>
        </button>
        <div className="flex gap-2">
          <button 
            onClick={() => setModalState('historyOpen', true, item.id)}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl text-[var(--text-secondary)] hover:text-yellow-500 transition-all active:scale-[0.98]"
          >
            <History size={18} />
            <span className="text-sm">Versões</span>
          </button>
          <button 
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl font-bold transition-all active:scale-[0.98] shadow-lg ${
              isDirty && !isSaving
                ? "bg-yellow-500 text-zinc-950 shadow-yellow-500/10" 
                : "bg-[var(--bg-card)] text-[var(--text-secondary)] cursor-not-allowed opacity-50 shadow-none border border-[var(--border-color)]"
            }`}
          >
            {isSaving ? <span className="animate-pulse">...</span> : <Save size={18} />}
            <span className="text-sm uppercase tracking-wide">{isSaving ? 'Salvando' : 'Salvar'}</span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <input 
          type="text"
          value={editedTitle}
          onChange={(e) => setEditedTitle(e.target.value)}
          className="w-full bg-transparent border-b border-[var(--border-color)] focus:border-yellow-500/50 py-2 text-2xl font-bold text-[var(--text-primary)] outline-none transition-all"
          placeholder="Título da Mensagem"
        />
        
        <div className="flex items-center gap-3">
          <TagIcon size={16} className="text-yellow-500" />
          <div className="flex flex-wrap gap-2">
            {item.tags.map(tag => (
              <span key={tag} className="px-3 py-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-full text-[10px] font-bold text-[var(--text-secondary)]">
                {tag}
              </span>
            ))}
            <button 
              onClick={() => setModalState('tagModalOpen', true, item.id)}
              className="px-3 py-1 border border-dashed border-[var(--border-color)] rounded-full text-[10px] font-bold text-[var(--text-secondary)] hover:text-yellow-500"
            >
              + TAG
            </button>
          </div>
        </div>
      </div>

      {/* Editor Surface */}
      <div className="min-h-[60vh] bg-[var(--bg-card)]/50 border border-[var(--border-color)] rounded-[2.5rem] p-6 space-y-6">
        <div className="flex items-center gap-1 pb-4 border-b border-[var(--border-color)] px-2 overflow-x-auto no-scrollbar sticky top-[72px] bg-[var(--bg-main)]/95 z-20 py-4 -mx-6 rounded-t-[2.5rem] shadow-xl">
          <div className="flex items-center gap-1 bg-[var(--bg-card)]/50 p-1 rounded-xl border border-[var(--border-color)]/50 shrink-0">
            <button 
              type="button"
              onMouseDown={(e) => { e.preventDefault(); execCommand('bold'); }} 
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-yellow-500 hover:border-yellow-500/50 transition-all active:scale-95"
            >
              <Bold size={16} />
            </button>
            <button 
              type="button"
              onMouseDown={(e) => { e.preventDefault(); execCommand('italic'); }} 
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-yellow-500 hover:border-yellow-500/50 transition-all active:scale-95"
            >
              <Italic size={16} />
            </button>
            <button 
              type="button"
              onMouseDown={(e) => { e.preventDefault(); execCommand('underline'); }} 
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-yellow-500 hover:border-yellow-500/50 transition-all active:scale-95"
            >
              <Underline size={16} />
            </button>
          </div>
          
          <div className="flex items-center gap-1 bg-[var(--bg-card)]/50 p-1 rounded-xl border border-[var(--border-color)]/50 shrink-0">
            <button 
              type="button"
              onMouseDown={(e) => { e.preventDefault(); execCommand('justifyLeft'); }} 
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-yellow-500 hover:border-yellow-500/50 transition-all active:scale-95"
            >
              <AlignLeft size={16} />
            </button>
            <button 
              type="button"
              onMouseDown={(e) => { e.preventDefault(); execCommand('justifyCenter'); }} 
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-yellow-500 hover:border-yellow-500/50 transition-all active:scale-95"
            >
              <AlignCenter size={16} />
            </button>
            <button 
              type="button"
              onMouseDown={(e) => { e.preventDefault(); execCommand('justifyRight'); }} 
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-yellow-500 hover:border-yellow-500/50 transition-all active:scale-95"
            >
              <AlignRight size={16} />
            </button>
            <button 
              type="button"
              onMouseDown={(e) => { e.preventDefault(); execCommand('justifyFull'); }} 
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-yellow-500 hover:border-yellow-500/50 transition-all active:scale-95"
            >
              <AlignJustify size={16} />
            </button>
          </div>
        </div>

        <div
          ref={editorRef}
          contentEditable
          onInput={(e) => setEditedContent(e.currentTarget.innerText)}
          className="w-full min-h-[50vh] bg-transparent text-[var(--text-primary)] text-sm leading-relaxed outline-none whitespace-pre-wrap"
          style={{ textAlign: 'inherit' }}
        />
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        [contenteditable]:empty:before {
          content: "Comece a digitar seu sermão...";
          color: color-mix(in srgb, var(--text-secondary) 40%, transparent);
        }
      `}</style>
    </div>
  );
}