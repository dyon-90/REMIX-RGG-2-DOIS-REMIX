import React, { useState } from 'react';
import { LogIn, ArrowLeft, AlertCircle, CheckCircle, ShieldCheck, Sparkles } from 'lucide-react';
import { useData } from '../context/DataContext';
import { defaultAdmins } from '../data/initialData';
import { AdminGearIcon } from './BrandIcons';
import { api } from '../services/api';
import { AdminUser } from '../types';

interface AdminLoginProps {
  onSuccess: (username: string) => void;
  onBack: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess, onBack }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data, showToast } = useData();

  const currentAdminList = data.admins && data.admins.length > 0 ? data.admins : defaultAdmins;

  const matchAdmin = (list: AdminUser[], userQuery: string, passQuery: string) => {
    const rawUser = userQuery.trim().toLowerCase();
    const userWithoutAt = rawUser.startsWith('@') ? rawUser.substring(1) : rawUser;
    const cleanPass = passQuery.trim();

    return list.find(admin => {
      const u = (admin.username || '').trim().toLowerCase();
      const uNoAt = u.startsWith('@') ? u.substring(1) : u;
      const em = (admin.email || '').trim().toLowerCase();
      const nm = (admin.name || '').trim().toLowerCase();
      const p = (admin.password || '').trim();

      const userMatches =
        u === rawUser ||
        uNoAt === userWithoutAt ||
        u === userWithoutAt ||
        em === rawUser ||
        nm === rawUser;

      const passMatches = p === cleanPass;

      return userMatches && passMatches;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // 1. Autenticação via API REST / Supabase PostgreSQL
      const res = await api.loginAdmin(username, password);
      const user = res?.user || res?.data?.user;
      if (user) {
        showToast(`Bem-vindo, ${user.name || user.username}!`, 'success');
        onSuccess(user.username);
        return;
      }
      throw new Error('Credenciais não localizadas.');
    } catch {
      // 2. Validação local com lista autenticada sincronizada
      const valid = matchAdmin(currentAdminList, username, password);
      if (valid) {
        showToast(`Bem-vindo, ${valid.name || valid.username}!`, 'success');
        onSuccess(valid.username);
        return;
      }
      setError('Usuário ou senha incorretos. Verifique suas credenciais de administrador.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSupabase = api.getActiveEngine() === 'supabase_postgresql';

  return (
    <div className="max-w-md mx-auto my-auto py-6 sm:py-10 px-4 animate-fade-in">
      <div className="bg-white dark:bg-[#151226] rounded-3xl p-6 sm:p-8 shadow-xl shadow-purple-950/5 border border-purple-100 dark:border-purple-900/40 transition-colors">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6f2ef7] to-[#5914e6] flex items-center justify-center mx-auto mb-3 shadow-lg shadow-purple-600/30">
            <AdminGearIcon size={38} />
          </div>
          <h2 className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Acesso Administrativo
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Autentique-se com seu login de administrador ({isSupabase ? 'Supabase PostgreSQL' : 'MySQL Central'})
          </p>
        </div>

        <div className="mb-5 p-3 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-800/40 text-xs text-purple-900 dark:text-purple-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{isSupabase ? 'Supabase PostgreSQL • Online' : 'API REST PHP 8.x • Hostinger MySQL'}</span>
          </div>
          <span className="text-[10px] font-mono bg-purple-200/60 dark:bg-purple-900/60 px-2 py-0.5 rounded-full font-bold">
            {isSupabase ? 'Supabase Auth' : '/api/auth/'}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="admin-username" className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
              Usuário ou E-mail
            </label>
            <input
              id="admin-username"
              name="username"
              type="text"
              required
              autoComplete="username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Digite seu usuário ou e-mail"
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#6f2ef7] text-sm bg-white dark:bg-[#1a1730] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 transition"
            />
          </div>

          <div>
            <label htmlFor="admin-password" className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
              Senha
            </label>
            <input
              id="admin-password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Digite sua senha cadastrada"
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#6f2ef7] text-sm bg-white dark:bg-[#1a1730] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 transition"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-medium animate-fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#6f2ef7] to-[#5914e6] hover:from-[#6524f0] hover:to-[#500dd8] shadow-md shadow-purple-600/30 flex items-center justify-center gap-2 transition disabled:opacity-70 active:scale-98 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <CheckCircle className="w-4 h-4 animate-spin" />
                <span>Validando acesso...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Acessar Painel</span>
              </>
            )}
          </button>
        </form>

        <button
          type="button"
          onClick={onBack}
          className="w-full mt-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center gap-1.5 transition border border-transparent hover:border-zinc-200 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar para seleção de perfil</span>
        </button>
      </div>
    </div>
  );
};

