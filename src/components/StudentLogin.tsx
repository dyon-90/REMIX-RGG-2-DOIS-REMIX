import React, { useState } from 'react';
import { LogIn, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { useData } from '../context/DataContext';
import { Student } from '../types';
import { StackedBooksLogo } from './BrandIcons';
import { api } from '../services/api';
import { sanitizeLoginInput } from '../utils/security';

interface StudentLoginProps {
  onSuccess: (student: Student) => void;
  onBack: () => void;
}

export const StudentLogin: React.FC<StudentLoginProps> = ({ onSuccess, onBack }) => {
  const { data, showToast } = useData();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanLogin = sanitizeLoginInput(login).toLowerCase();
    const cleanPassword = sanitizeLoginInput(password);

    if (!cleanLogin || !cleanPassword) {
      setError('Por favor, informe seu login (e-mail ou nome) e a senha (matrícula).');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Tenta autenticar na API / Supabase
      const res = await api.loginStudent(cleanLogin, cleanPassword);
      const student = res?.student || res?.data?.student;
      if (student) {
        showToast(`Bem-vindo, ${student.student_name}!`, 'success');
        onSuccess(student);
        return;
      }
      throw new Error('Estudante não localizado.');
    } catch {
      // 2. Fallback com alunos da base sincronizada em memória
      const found = (data.students || []).find(
        s => ((s.student_email || '').toLowerCase() === cleanLogin || (s.student_name || '').toLowerCase() === cleanLogin) &&
             String(s.student_matricula || '').trim() === cleanPassword
      );

      if (found) {
        showToast(`Bem-vindo, ${found.student_name}!`, 'success');
        onSuccess(found);
        return;
      }

      setError('Login ou senha inválidos. Utilize seu e-mail/nome e número de matrícula.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-auto py-6 sm:py-10 px-4 animate-fade-in">
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-purple-950/5 border border-purple-100">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6f2ef7] to-[#5914e6] flex items-center justify-center mx-auto mb-3 shadow-lg shadow-purple-600/30">
            <StackedBooksLogo size={36} />
          </div>
          <h2 className="font-display text-2xl font-bold text-zinc-900 tracking-tight">
            Portal do Aluno
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Entre com seu usuário/login e senha (matrícula) para acessar suas atividades
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="student-username" className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
              Login do Aluno
            </label>
            <input
              id="student-username"
              name="username"
              type="text"
              required
              autoComplete="username"
              value={login}
              onChange={e => setLogin(e.target.value)}
              placeholder="Digite seu login cadastrado"
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#6f2ef7] text-sm bg-white text-zinc-900 placeholder:text-zinc-400 transition"
            />
          </div>

          <div>
            <label htmlFor="student-password" className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
              Senha (Matrícula)
            </label>
            <input
              id="student-password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Ex: 123456"
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#6f2ef7] text-sm bg-white text-zinc-900 placeholder:text-zinc-400 transition"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium animate-fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#6f2ef7] to-[#5914e6] hover:from-[#6524f0] hover:to-[#500dd8] shadow-md shadow-purple-600/30 flex items-center justify-center gap-2 transition disabled:opacity-70 active:scale-98"
          >
            {isSubmitting ? (
              <>
                <CheckCircle className="w-4 h-4 animate-spin" />
                <span>Entrando...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Acessar Plataforma</span>
              </>
            )}
          </button>
        </form>

        <button
          type="button"
          onClick={onBack}
          className="w-full mt-6 py-2.5 rounded-xl text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 flex items-center justify-center gap-1.5 transition border border-transparent hover:border-zinc-200"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar para seleção de perfil</span>
        </button>
      </div>
    </div>
  );
};

