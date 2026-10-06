import React from 'react';
import { StackedBooksLogo, GraduationCapLarge, AdminGearIcon } from './BrandIcons';

interface RoleSelectionProps {
  onSelectRole: (role: 'admin' | 'student') => void;
}

export const RoleSelection: React.FC<RoleSelectionProps> = ({ onSelectRole }) => {
  return (
    <div className="max-w-4xl mx-auto my-auto py-8 sm:py-16 px-4 animate-fade-in flex flex-col items-center justify-center">
      {/* Top Orange Squircle with Graduation Cap */}
      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-[#ff9b57] via-[#ff8244] to-[#ff5938] shadow-xl shadow-orange-500/25 flex items-center justify-center mx-auto mb-6 transform hover:scale-105 transition duration-300">
        <GraduationCapLarge size={54} className="drop-shadow-sm" />
      </div>

      {/* Hero Welcome Text */}
      <div className="text-center mb-10 sm:mb-12">
        <h1 className="font-display text-4xl sm:text-5xl font-black text-[#132e25] dark:text-white tracking-tight mb-2 transition-colors">
          Bem-vindo!
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-base sm:text-lg font-medium transition-colors">
          Escolha seu tipo de acesso
        </p>
      </div>

      {/* Role Selection Glowing Purple Cards */}
      <div className="grid sm:grid-cols-2 gap-6 sm:gap-8 w-full max-w-2xl">
        {/* Administrator Card */}
        <div
          onClick={() => onSelectRole('admin')}
          className="group relative bg-gradient-to-br from-[#6f2ef7] via-[#6624f0] to-[#5914e6] rounded-[26px] p-8 sm:p-10 text-center flex flex-col items-center justify-center cursor-pointer shadow-[0_20px_50px_rgba(105,36,245,0.42)] hover:shadow-[0_25px_65px_rgba(105,36,245,0.6)] hover:-translate-y-2 active:scale-98 transition-all duration-300 border border-white/20 overflow-hidden"
        >
          {/* Subtle Ambient Light highlight */}
          <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/15 to-transparent pointer-events-none rounded-t-[26px]" />
          
          <div className="relative z-10 flex flex-col items-center">
            {/* Gear Icon */}
            <div className="mb-4 transform group-hover:rotate-45 transition duration-500">
              <AdminGearIcon size={64} className="drop-shadow-md" />
            </div>

            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
              Administrador
            </h2>
            
            <p className="text-purple-100/90 text-sm sm:text-base font-medium">
              Controle total do sistema
            </p>
          </div>
        </div>

        {/* Student Card */}
        <div
          onClick={() => onSelectRole('student')}
          className="group relative bg-gradient-to-br from-[#6f2ef7] via-[#6624f0] to-[#5914e6] rounded-[26px] p-8 sm:p-10 text-center flex flex-col items-center justify-center cursor-pointer shadow-[0_20px_50px_rgba(105,36,245,0.42)] hover:shadow-[0_25px_65px_rgba(105,36,245,0.6)] hover:-translate-y-2 active:scale-98 transition-all duration-300 border border-white/20 overflow-hidden"
        >
          {/* Subtle Ambient Light highlight */}
          <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/15 to-transparent pointer-events-none rounded-t-[26px]" />
          
          <div className="relative z-10 flex flex-col items-center">
            {/* Stacked Books Icon */}
            <div className="mb-4 transform group-hover:scale-110 group-hover:-rotate-3 transition duration-300">
              <StackedBooksLogo size={60} className="drop-shadow-md" />
            </div>

            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
              Aluno
            </h2>
            
            <p className="text-purple-100/90 text-sm sm:text-base font-medium">
              Minhas atividades e notas
            </p>
          </div>
        </div>
      </div>

      {/* Cloud Synchronization Status Badge */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 px-5 py-2.5 rounded-2xl sm:rounded-full bg-white/90 dark:bg-[#151226]/90 backdrop-blur-md border border-purple-200/70 dark:border-purple-800/50 text-xs font-semibold text-zinc-700 dark:text-zinc-200 shadow-sm text-center">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
          <span className="font-bold text-purple-700 dark:text-purple-300">API REST PHP 8.x • MySQL Hostinger Conectado</span>
        </div>
        <span className="hidden sm:inline text-zinc-400 dark:text-zinc-500">•</span>
        <span className="text-[11.5px] text-zinc-500 dark:text-zinc-400">
          Garantindo a mesma base de dados central para computador, notebook, celular e tablet.
        </span>
      </div>
    </div>
  );
};

