import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Users, 
  Clock, 
  Calendar, 
  FileSpreadsheet, 
  BookOpen, 
  CheckCircle, 
  Sparkles,
  Zap,
  Tag,
  Trash2,
  Edit3
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { CollaborativeFile } from '../../types';
import { CollaborativeEditor } from './CollaborativeEditor';

interface CollaborativeWorkspaceProps {
  currentUserName: string;
  currentUserId?: string;
}

export const CollaborativeWorkspace: React.FC<CollaborativeWorkspaceProps> = ({
  currentUserName,
  currentUserId = 'admin_current'
}) => {
  const { data, createCollaborativeFile, deleteCollaborativeFile, showToast } = useData();
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCreating, setIsCreating] = useState(false);

  const files = data.collaborative_files || [];

  const activeFile = files.find(f => f.entity_id === activeFileId);

  // Filtragem de arquivos
  const filteredFiles = files.filter(f => {
    const matchesSearch = 
      (f.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.content || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.author_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || f.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleCreateNew = async () => {
    setIsCreating(true);
    const newDoc = await createCollaborativeFile({
      title: 'Novo Planejamento Colaborativo',
      category: 'planejamento',
      content: `OBJETIVOS PEDAGÓGICOS E ALINHAMENTO CURRICULAR\nResponsáveis: ${currentUserName}\n\n1. DIAGNÓSTICO E COMPETÊNCIAS\n- Descreva aqui os objetivos e competências a serem desenvolvidas.\n\n2. METODOLOGIA E ATIVIDADES\n- Adicione detalhes das atividades práticas e instrumentos avaliativos.`,
      authorId: currentUserId,
      authorName: currentUserName,
      tags: ['Planejamento', 'Colaborativo']
    });

    setIsCreating(false);
    if (newDoc) {
      setActiveFileId(newDoc.entity_id);
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'planejamento':
        return { label: 'Planejamento', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'ata':
        return { label: 'Ata de Reunião', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'roteiro':
        return { label: 'Roteiro', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'projeto':
        return { label: 'Projeto', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
      default:
        return { label: 'Documento', bg: 'bg-zinc-50 text-zinc-700 border-zinc-200' };
    }
  };

  if (activeFile) {
    return (
      <CollaborativeEditor
        file={activeFile}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        onBack={() => setActiveFileId(null)}
        onDelete={id => {
          deleteCollaborativeFile(id);
          setActiveFileId(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-[#6f2ef7] via-[#5914e6] to-[#400cb8] rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-purple-950/15 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold text-white mb-3 border border-white/20">
              <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
              <span>Edição Concorrente • Salvamento a Cada Caractere • 3-Way Merge</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
              Caderno de Arquivos e Planejamento Compartilhado
            </h2>
            <p className="text-purple-100 text-xs sm:text-sm mt-2 leading-relaxed">
              Múltiplos usuários podem redigir e atualizar os mesmos documentos simultaneamente. Cada caractere digitado é salvo instantaneamente na nuvem sem precisar clicar em nenhum botão, e nosso algoritmo mescla o trabalho da equipe de forma não destrutiva.
            </p>
          </div>

          <button
            onClick={handleCreateNew}
            disabled={isCreating}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-[#6f2ef7] font-bold text-xs hover:bg-purple-50 shadow-lg shadow-purple-950/20 active:scale-95 transition disabled:opacity-70 whitespace-nowrap self-start md:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#6f2ef7]" />
            <span>{isCreating ? 'Criando Documento...' : 'Novo Documento'}</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-zinc-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar por título, autor ou conteúdo..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#6f2ef7] transition"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'planejamento', label: 'Planejamentos' },
            { id: 'ata', label: 'Atas' },
            { id: 'roteiro', label: 'Roteiros' },
            { id: 'projeto', label: 'Projetos' }
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-purple-100 text-purple-900 border border-purple-200'
                  : 'text-zinc-600 hover:bg-zinc-100 border border-transparent'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Arquivos Colaborativos */}
      {filteredFiles.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-zinc-200 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-purple-50 text-[#6f2ef7] flex items-center justify-center mx-auto mb-4 border border-purple-100">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="font-display text-lg font-bold text-zinc-900">
            Nenhum documento encontrado
          </h3>
          <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1 mb-5">
            Crie um novo documento colaborativo para iniciar a edição simultânea em tempo real com toda a equipe docente.
          </p>
          <button
            onClick={handleCreateNew}
            className="px-4 py-2.5 rounded-xl bg-[#6f2ef7] text-white text-xs font-bold hover:bg-[#5e22db] transition inline-flex items-center gap-2 cursor-pointer shadow-sm shadow-purple-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Primeiro Documento</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFiles.map(file => {
            const badge = getCategoryBadge(file.category);
            const dateStr = file.last_modified_at 
              ? new Date(file.last_modified_at).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' })
              : 'Hoje';

            return (
              <div
                key={file.entity_id}
                onClick={() => setActiveFileId(file.entity_id)}
                className="bg-white rounded-2xl p-5 border border-zinc-200 hover:border-purple-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between group cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badge.bg}`}>
                      {badge.label}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      v{file.version || 1}
                    </span>
                  </div>

                  <h3 className="font-display text-base font-bold text-zinc-900 group-hover:text-[#6f2ef7] transition line-clamp-1">
                    {file.title}
                  </h3>

                  <p className="text-xs text-zinc-500 mt-2 line-clamp-3 leading-relaxed">
                    {file.content || 'Documento em branco pronto para edição simultânea.'}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[9px] font-black">
                      {(file.last_modified_by_name || file.author_name || 'U').substring(0, 1)}
                    </div>
                    <span className="truncate max-w-[120px]">
                      {file.last_modified_by_name || file.author_name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                    <Clock className="w-3 h-3" />
                    <span>{dateStr}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
