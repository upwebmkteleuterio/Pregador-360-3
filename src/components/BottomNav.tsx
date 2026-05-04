import { NavLink } from 'react-router-dom';
import { Home, Library, BookOpen, MoreHorizontal, Sparkles } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useStore } from '@/src/store/useStore';

export function BottomNav() {
  const { setModalState } = useStore();

  const navItems = [
    { to: '/', icon: Sparkles, label: 'CRIAR' },
    { to: '/library', icon: Library, label: 'BIBLIOTECA' },
    { to: '/bible', icon: BookOpen, label: 'BÍBLIA' },
    { label: 'MAIS', icon: MoreHorizontal, onClick: () => setModalState('moreMenuOpen', true) },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-[var(--border-color)] bg-[var(--bg-main)]/80 px-4 pb-6 pt-3 backdrop-blur-md">
      {navItems.map((item) => (
        item.to ? (
          <NavLink
            key={item.label}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-1 transition-colors",
                isActive ? "text-yellow-500" : "text-[var(--text-secondary)]"
              )
            }
          >
            <item.icon size={22} />
            <span className="text-[10px] font-bold tracking-wider">
              {item.label}
            </span>
          </NavLink>
        ) : (
          <button
            key={item.label}
            onClick={item.onClick}
            className="flex flex-col items-center gap-1 transition-colors text-[var(--text-secondary)] hover:text-yellow-500"
          >
            <item.icon size={22} />
            <span className="text-[10px] font-bold tracking-wider">
              {item.label}
            </span>
          </button>
        )
      ))}
    </nav>
  );
}
