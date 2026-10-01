import { Menu, Moon, Sun, LogOut, User } from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Topbar({ title, onMenuClick }) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 h-16 flex items-center justify-between px-4 sm:px-6 bg-white/80 dark:bg-ink-900/80 backdrop-blur border-b border-ink-100 dark:border-ink-800">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden text-ink-500">
          <Menu size={22} />
        </button>
        <h1 className="text-lg font-semibold text-ink-900 dark:text-white">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="h-9 w-9 rounded-xl flex items-center justify-center text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
          title="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 pl-2 pr-3 h-9 rounded-xl hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
          >
            <div className="h-7 w-7 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center">
              {user?.name?.[0]?.toUpperCase() || <User size={14} />}
            </div>
            <span className="text-sm font-medium text-ink-700 dark:text-ink-200 hidden sm:block">
              {user?.name || 'Account'}
            </span>
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-ink-900 border border-ink-100 dark:border-ink-800 rounded-xl shadow-soft dark:shadow-soft-dark z-20 py-1.5 animate-fadeIn">
                <div className="px-3.5 py-2 border-b border-ink-100 dark:border-ink-800">
                  <p className="text-sm font-medium text-ink-900 dark:text-white truncate">{user?.name}</p>
                  <p className="text-xs text-ink-400 truncate">{user?.email}</p>
                </div>
                <button
                  onClick={() => { logout(); navigate('/login'); }}
                  className="w-full flex items-center gap-2 px-3.5 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                >
                  <LogOut size={15} /> Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
