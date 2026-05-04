import React, { useEffect } from 'react';
import { BottomNav } from './BottomNav';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/src/store/useStore';
import { LogOut } from 'lucide-react';
import { ThemeToggleButton2 } from './ui/theme-toggle-buttons';
import { supabase } from '@/src/integrations/supabase/client';
import logoImg from '@/src/assets/logo.png';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { auth, setModalState, theme, toggleTheme } = useStore();

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] selection:bg-yellow-500/30 transition-colors duration-300">
      <header className="fixed top-0 left-0 right-0 z-40 bg-[var(--bg-main)]/80 backdrop-blur-md border-b border-[var(--border-color)]">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-6 py-4">
          <button
            onClick={() => setModalState('aiCreditsOpen', true)}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            {auth.isAuthenticated ? (
              <div className="h-9 w-9 rounded-full bg-yellow-500 flex items-center justify-center text-zinc-950 font-bold text-sm shadow-lg shadow-yellow-500/20">
                {auth.user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            ) : (
              <div className="h-9 w-9 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-secondary)]">
                <UserIcon />
              </div>
            )}
            <img src={logoImg} alt="Pregador 360" className="h-6 w-auto" />
          </button>

          <div className="flex items-center gap-2">
            <ThemeToggleButton2
              className="size-10 p-2"
              isDark={theme === 'dark'}
              onToggle={toggleTheme}
            />

            <button
              onClick={async () => {
                await supabase.auth.signOut();
              }}
              className="text-[var(--text-secondary)] p-2 hover:text-red-500 transition-colors"
              title="Sair"
            >
              <LogOut size={22} />
            </button>
          </div>
        </div>
      </header>

      <main className="pb-32 pt-20 px-6">
        <div className="max-w-4xl mx-auto w-full">
          {children}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  );
}