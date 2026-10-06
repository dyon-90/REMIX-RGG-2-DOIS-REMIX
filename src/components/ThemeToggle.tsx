import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', showLabel = false }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      id="theme-toggle-btn"
      onClick={toggleTheme}
      className={`relative inline-flex items-center justify-center gap-2 p-2 rounded-full transition-all duration-300 cursor-pointer active:scale-95 focus:outline-none focus:ring-2 focus:ring-purple-400/50 ${
        isDark 
          ? 'bg-purple-950/60 text-amber-300 border border-purple-800/60 hover:bg-purple-900/80 shadow-xs' 
          : 'bg-white/20 text-white border border-white/25 hover:bg-white/30 backdrop-blur-md shadow-xs'
      } ${className}`}
      title={isDark ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
      aria-label={isDark ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
    >
      <span className="sr-only">
        {isDark ? 'Ativar Modo Claro' : 'Ativar Modo Escuro'}
      </span>

      {isDark ? (
        <Sun className="w-4 h-4 transition-transform duration-300 rotate-0 hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 transition-transform duration-300 -rotate-12 hover:rotate-0" />
      )}

      {showLabel && (
        <span className="text-xs font-bold pr-1">
          {isDark ? 'Modo Claro' : 'Modo Escuro'}
        </span>
      )}
    </button>
  );
};
