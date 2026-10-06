import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  CheckCircle2,
  AlertCircle,
  Copy,
  RefreshCw,
  Server,
  ShieldCheck,
  Check,
  Zap,
  HardDrive,
  FileCode2,
  Layers,
  Smartphone,
  Monitor,
  Laptop,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { api } from '../../services/api';
import { runCompleteDatabaseAudit, FullAuditReport } from '../../services/databaseAuditService';
import { DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY } from '../../lib/supabase';
import { testSupabaseConnection, batchImportToSupabase, seedSupabaseDatabaseIfEmpty } from '../../services/supabaseDb';
import { initialDefaultData } from '../../data/initialData';

interface DatabaseStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const DatabaseStatusModal: React.FC<DatabaseStatusModalProps> = ({
  isOpen,
  onClose,
  showToast
}) => {
  const [activeTab, setActiveTab] = useState<'supabase' | 'sql' | 'architecture' | 'audit'>('supabase');
  const [auditing, setAuditing] = useState(false);
  const [auditReport, setAuditReport] = useState<FullAuditReport | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [sqlContent, setSqlContent] = useState<string>('');
  const [testingConn, setTestingConn] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; tablesCreated?: boolean } | null>(null);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Carrega o SQL completo de supabase_schema.sql
      fetch('/supabase_schema.sql')
        .then(res => res.text())
        .then(txt => setSqlContent(txt))
        .catch(() => {
          fetch('/database_schema.sql')
            .then(res => res.text())
            .then(txt => setSqlContent(txt))
            .catch(() => {
              setSqlContent('-- Arquivo schema.sql disponível na pasta supabase/schema.sql');
            });
        });

      // Teste de conexão automático ao abrir
      testSupabaseConnection().then(res => {
        setTestResult(res);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTestingConn(true);
    try {
      const res = await testSupabaseConnection();
      setTestResult(res);
      if (res.success && showToast) {
        showToast(res.message, 'success');
      } else if (!res.success && showToast) {
        showToast(res.message, 'error');
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: 'Erro ao testar: ' + (err?.message || 'Falha de rede')
      });
    } finally {
      setTestingConn(false);
    }
  };

  const handleSeedSupabase = async () => {
    setSeeding(true);
    try {
      await seedSupabaseDatabaseIfEmpty();
      const count = await batchImportToSupabase(initialDefaultData);
      if (showToast) {
        showToast(`✓ Dados sincronizados no Supabase com sucesso! (${count} itens importados)`, 'success');
      }
      handleTestConnection();
    } catch (err: any) {
      if (showToast) {
        showToast('Aviso: Certifique-se de que o script SQL foi executado no Supabase SQL Editor. ' + err.message, 'error');
      }
    } finally {
      setSeeding(false);
    }
  };

  const handleRunAudit = async () => {
    setAuditing(true);
    try {
      const rep = await runCompleteDatabaseAudit();
      setAuditReport(rep);
      if (rep.overallStatus === 'success' && showToast) {
        showToast('Auditoria concluída com sucesso! Supabase 100% operacional.', 'success');
      }
    } catch (err: any) {
      if (showToast) {
        showToast('Erro ao executar auditoria: ' + err.message, 'error');
      }
    } finally {
      setAuditing(false);
    }
  };

  const handleCopySql = () => {
    if (sqlContent) {
      navigator.clipboard.writeText(sqlContent);
      setCopiedSql(true);
      if (showToast) {
        showToast('Script SQL copiado com sucesso para a área de transferência!', 'success');
      }
      setTimeout(() => setCopiedSql(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-[#15122b] w-full max-w-4xl rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Cabeçalho do Modal */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-emerald-900 via-teal-900 to-[#1b5e40] text-white flex items-center justify-between border-b border-emerald-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xs">
              <Database className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Integração Supabase • PostgreSQL Relacional
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/30 text-emerald-100 border border-emerald-300/40 uppercase tracking-wider">
                  Ativo
                </span>
              </h2>
              <p className="text-xs text-emerald-100/80">
                Banco de Dados Centralizado com WebSockets Realtime e RLS (Row Level Security)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Abas de Navegação */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#1a1636] overflow-x-auto">
          <button
            onClick={() => setActiveTab('supabase')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition flex items-center gap-2 cursor-pointer border-b-2 whitespace-nowrap ${
              activeTab === 'supabase'
                ? 'bg-white dark:bg-[#15122b] text-emerald-600 dark:text-emerald-400 border-emerald-600 dark:border-emerald-400 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 border-transparent'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Conexão Supabase</span>
          </button>

          <button
            onClick={() => setActiveTab('sql')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition flex items-center gap-2 cursor-pointer border-b-2 whitespace-nowrap ${
              activeTab === 'sql'
                ? 'bg-white dark:bg-[#15122b] text-emerald-600 dark:text-emerald-400 border-emerald-600 dark:border-emerald-400 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 border-transparent'
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5" />
            <span>Schema SQL (12 Tabelas)</span>
          </button>

          <button
            onClick={() => setActiveTab('architecture')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition flex items-center gap-2 cursor-pointer border-b-2 whitespace-nowrap ${
              activeTab === 'architecture'
                ? 'bg-white dark:bg-[#15122b] text-emerald-600 dark:text-emerald-400 border-emerald-600 dark:border-emerald-400 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 border-transparent'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Arquitetura & Realtime</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition flex items-center gap-2 cursor-pointer border-b-2 whitespace-nowrap ${
              activeTab === 'audit'
                ? 'bg-white dark:bg-[#15122b] text-emerald-600 dark:text-emerald-400 border-emerald-600 dark:border-emerald-400 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 border-transparent'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Auditoria em Tempo Real</span>
          </button>
        </div>

        {/* Conteúdo das Abas */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-zinc-900 dark:text-zinc-100">
          
          {/* ABA 1: Conexão Supabase */}
          {activeTab === 'supabase' && (
            <div className="space-y-5">
              {/* Status Banner */}
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-sm text-emerald-950 dark:text-emerald-200">
                      Supabase Integrado e Configurado com Sucesso
                    </p>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      PostgreSQL Ativo
                    </span>
                  </div>
                  <p className="text-emerald-900/80 dark:text-emerald-300 leading-relaxed">
                    Esta aplicação está conectada ao projeto Supabase oficial fornecido. Computadores, notebooks, celulares e tablets utilizam este mesmo banco central em nuvem.
                  </p>
                </div>
              </div>

              {/* Credenciais em Uso */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Credenciais Oficiais Configuradas
                </h3>

                <div className="grid grid-cols-1 gap-3 text-xs">
                  {/* SUPABASE_URL */}
                  <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-[#1a1636]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">SUPABASE_URL</span>
                      <p className="font-mono font-bold text-emerald-700 dark:text-emerald-300 select-all">
                        {DEFAULT_SUPABASE_URL}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(DEFAULT_SUPABASE_URL);
                        setCopiedUrl(true);
                        setTimeout(() => setCopiedUrl(false), 2000);
                      }}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                    >
                      {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedUrl ? 'Copiado' : 'Copiar'}</span>
                    </button>
                  </div>

                  {/* SUPABASE_ANON_KEY */}
                  <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-[#1a1636]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">SUPABASE_ANON_KEY (Chave Pública Anon / Publishable)</span>
                      <p className="font-mono font-bold text-emerald-700 dark:text-emerald-300 select-all break-all">
                        {DEFAULT_SUPABASE_ANON_KEY}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(DEFAULT_SUPABASE_ANON_KEY);
                        setCopiedKey(true);
                        setTimeout(() => setCopiedKey(false), 2000);
                      }}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                    >
                      {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey ? 'Copiado' : 'Copiar'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Diagnóstico em tempo real */}
              {testResult && (
                <div className={`p-4 rounded-xl border text-xs ${
                  testResult.success
                    ? (testResult.tablesCreated
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
                        : 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200')
                    : 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-200'
                }`}>
                  <div className="flex items-start gap-2.5">
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1 space-y-1">
                      <p className="font-bold text-sm">
                        {testResult.success ? 'Conexão Supabase Validada com Sucesso' : 'Falha na Validação'}
                      </p>
                      <p className="leading-relaxed text-[11px]">{testResult.message}</p>
                      {testResult.tablesCreated === false && (
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => setActiveTab('sql')}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                          >
                            <FileCode2 className="w-3.5 h-3.5" />
                            <span>Ver Script SQL para Criar Tabelas</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Botões de Ação */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testingConn}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-sm shadow-emerald-600/30"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingConn ? 'animate-spin' : ''}`} />
                  <span>{testingConn ? 'Testando Conexão...' : 'Testar Conexão Supabase'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSeedSupabase}
                  disabled={seeding}
                  className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-sm shadow-purple-600/30"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${seeding ? 'animate-spin' : ''}`} />
                  <span>{seeding ? 'Sincronizando...' : 'Popular Dados / Administrador no Supabase'}</span>
                </button>

                <a
                  href="https://supabase.com/dashboard/project/cvxxyqjefqkpculdjfqp/sql"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <span>Abrir Supabase Dashboard</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {/* ABA 2: Schema SQL Completo (PostgreSQL 12 Tabelas) */}
          {activeTab === 'sql' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/50 space-y-2 text-xs">
                <p className="font-bold text-sm text-purple-950 dark:text-purple-200 flex items-center gap-2">
                  <FileCode2 className="w-4 h-4 text-purple-600" />
                  Como criar as 12 tabelas no seu Supabase:
                </p>
                <ol className="list-decimal list-inside space-y-1.5 text-purple-900/90 dark:text-purple-300 leading-relaxed">
                  <li>
                    Clique no botão <strong>Copiar Script SQL</strong> abaixo.
                  </li>
                  <li>
                    Acesse o <a href="https://supabase.com/dashboard/project/cvxxyqjefqkpculdjfqp/sql" target="_blank" rel="noopener noreferrer" className="underline font-bold text-purple-700 dark:text-purple-300">Supabase SQL Editor</a> do seu projeto.
                  </li>
                  <li>
                    Cole o script e clique no botão verde <strong>Run</strong> (ou aperte <kbd className="px-1 py-0.5 bg-white dark:bg-zinc-800 rounded border">Ctrl + Enter</kbd>).
                  </li>
                  <li>
                    Pronto! Todas as 12 tabelas, chaves primárias, triggers e políticas RLS de segurança estarão ativas.
                  </li>
                </ol>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-sm">Script Completo PostgreSQL (supabase/schema.sql)</h3>
                  <p className="text-xs text-zinc-500">
                    Cria: schools, classes, students, activities, grades, posts, events, admins, collaborative_files, system_logs, restore_points, online_users.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCopySql}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer shrink-0 shadow-sm shadow-emerald-600/30"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? '✓ Script Copiado!' : 'Copiar Script SQL'}</span>
                </button>
              </div>

              <div className="relative">
                <pre className="p-4 rounded-xl bg-zinc-950 text-emerald-400 font-mono text-xs overflow-x-auto max-h-[380px] border border-zinc-800 leading-relaxed select-all">
                  {sqlContent || '-- Carregando script SQL do Supabase...'}
                </pre>
              </div>
            </div>
          )}

          {/* ABA 3: Arquitetura & Realtime */}
          {activeTab === 'architecture' && (
            <div className="space-y-5 text-xs">
              <div className="p-4 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-3">
                <h4 className="font-bold text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Arquitetura Supabase Realtime (WebSockets)
                </h4>
                <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  O Supabase emite eventos via canal WebSockets para todas as tabelas registradas na publicação <code className="font-mono text-emerald-600 font-bold">supabase_realtime</code>. Quando um professor ou aluno grava um registro em qualquer dispositivo, todos os computadores, celulares e tablets conectados recebem a atualização instantaneamente no mesmo segundo.
                </p>
              </div>

              {/* Grid das 12 Tabelas */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Estrutura das 12 Tabelas Oficiais no Supabase
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
                  {[
                    { name: 'schools', label: 'Escolas', desc: 'Instituições com nome, cidade e contato.' },
                    { name: 'classes', label: 'Turmas', desc: 'Anos letivos e turmas vinculadas às escolas.' },
                    { name: 'students', label: 'Alunos', desc: 'Matrículas, dados e vínculo de turma.' },
                    { name: 'activities', label: 'Atividades', desc: 'Tarefas, prazos e links didáticos.' },
                    { name: 'grades', label: 'Notas e Entregas', desc: 'Submissões dos alunos e avaliações.' },
                    { name: 'posts', label: 'Mural de Avisos', desc: 'Comunicações escolares e avisos fixados.' },
                    { name: 'events', label: 'Calendário Acadêmico', desc: 'Eventos letivos, provas e reuniões.' },
                    { name: 'admins', label: 'Administradores', desc: 'Usuários gestores com senhas seguras.' },
                    { name: 'collaborative_files', label: 'Arquivos Colaborativos', desc: 'Edição em tempo real de documentos.' },
                    { name: 'system_logs', label: 'Logs e Auditoria', desc: 'Trilha cronológica de ações do sistema.' },
                    { name: 'restore_points', label: 'Pontos de Restauração', desc: 'Snapshots completos do banco de dados.' },
                    { name: 'online_users', label: 'Presença em Tempo Real', desc: 'Usuários ativos por sessão e dispositivo.' }
                  ].map(t => (
                    <div key={t.name} className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-[#1a1636]/50 space-y-1">
                      <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{t.name}</span>
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100 text-[11px]">{t.label}</p>
                      <p className="text-zinc-500 text-[10px]">{t.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ABA 4: Auditoria em Tempo Real */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm">Bateria de Testes em Tempo Real</h3>
                  <p className="text-xs text-zinc-500">
                    Executa validação real de conectividade, tabelas e integridade do Supabase.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleRunAudit}
                  disabled={auditing}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 transition active:scale-95 cursor-pointer shadow-sm shadow-emerald-600/30"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${auditing ? 'animate-spin' : ''}`} />
                  <span>{auditing ? 'Executando Auditoria...' : 'Iniciar Auditoria Completa'}</span>
                </button>
              </div>

              {auditReport ? (
                <div className="space-y-3">
                  <div className={`p-4 rounded-xl border text-xs ${
                    auditReport.overallStatus === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
                      : 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200'
                  }`}>
                    <div className="flex items-center gap-2 font-bold text-sm">
                      {auditReport.overallStatus === 'success' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-amber-600" />
                      )}
                      <span>{auditReport.summary}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {auditReport.steps.map(step => (
                      <div
                        key={step.step}
                        className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#1a1636] flex items-start justify-between gap-3 text-xs"
                      >
                        <div className="space-y-0.5">
                          <p className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                            <span>{step.name}</span>
                            {step.latencyMs !== undefined && (
                              <span className="font-mono text-[10px] text-zinc-400">
                                ({step.latencyMs}ms)
                              </span>
                            )}
                          </p>
                          <p className="text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed">
                            {step.details}
                          </p>
                        </div>

                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                          step.status === 'passed'
                            ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300'
                            : step.status === 'warning'
                            ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border border-amber-300'
                            : 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-300'
                        }`}>
                          {step.status === 'passed' ? 'Aprovado' : step.status === 'warning' ? 'Aviso' : 'Falha'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 space-y-2">
                  <Database className="w-8 h-8 text-zinc-400 mx-auto" />
                  <p className="text-xs text-zinc-500">
                    Nenhuma auditoria executada nesta sessão. Clique no botão acima para iniciar os testes automáticos.
                  </p>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Rodapé do Modal */}
        <div className="px-6 py-3.5 bg-zinc-50 dark:bg-[#1a1636] border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs">
          <span className="text-zinc-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            cvxxyqjefqkpculdjfqp.supabase.co
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold transition cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};

