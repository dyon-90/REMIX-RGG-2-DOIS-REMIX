import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, 
  X, 
  Users, 
  BookOpen, 
  CheckSquare, 
  Copy, 
  Check, 
  ArrowRight, 
  Eye, 
  CornerDownLeft, 
  Sparkles,
  Calendar,
  Award,
  School as SchoolIcon,
  UserCheck,
  Mail,
  Key
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Student, ClassRoom, Activity } from '../../types';

export type SearchCategory = 'all' | 'students' | 'classes' | 'activities';

export interface SearchResultItem {
  type: 'student' | 'class' | 'activity';
  id: string;
  title: string;
  subtitle: string;
  codeOrId: string;
  badgeText: string;
  meta: Record<string, string | number | undefined>;
  raw: Student | ClassRoom | Activity;
}

interface AdminQuickSearchProps {
  onNavigateToEntity: (tab: 'students' | 'classes' | 'activities', entityId: string) => void;
  className?: string;
}

export const AdminQuickSearch: React.FC<AdminQuickSearchProps> = ({
  onNavigateToEntity,
  className = ''
}) => {
  const { data, isUserOnline, showToast } = useData();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<SearchCategory>('all');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<SearchResultItem | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  // Global shortcut to focus search: Ctrl+K or Cmd+K or '/'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in another input/textarea
      const target = e.target as HTMLElement | null;
      const isInput = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === '/' && !isInput) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        setPreviewItem(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Instant filtering of items
  const allResults = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    const results: SearchResultItem[] = [];

    // Filter Students
    (data.students || []).forEach(student => {
      const idMatch = student.entity_id.toLowerCase().includes(trimmed);
      const nameMatch = (student.student_name || '').toLowerCase().includes(trimmed);
      const emailMatch = (student.student_email || '').toLowerCase().includes(trimmed);
      const matriculaMatch = (student.student_matricula || '').toLowerCase().includes(trimmed);
      const classMatch = (student.student_class_name || '').toLowerCase().includes(trimmed);

      if (!trimmed || idMatch || nameMatch || emailMatch || matriculaMatch || classMatch) {
        const studentGrades = (data.grades || []).filter(g => g.grade_student_id === student.entity_id);
        const totalPoints = studentGrades.reduce((sum, g) => sum + (Number(g.grade_value) || 0), 0);
        const avg = studentGrades.length > 0 && !isNaN(totalPoints) 
          ? (totalPoints / studentGrades.length).toFixed(1) 
          : '—';

        results.push({
          type: 'student',
          id: student.entity_id,
          title: student.student_name,
          subtitle: `Turma: ${student.student_class_name || 'Sem turma'} • Login: ${student.student_email}`,
          codeOrId: student.entity_id,
          badgeText: 'Aluno',
          meta: {
            class: student.student_class_name,
            email: student.student_email,
            matricula: student.student_matricula,
            gradesCount: studentGrades.length,
            average: avg,
            online: isUserOnline(student.entity_id) ? 'Online' : 'Offline'
          },
          raw: student
        });
      }
    });

    // Filter Classes
    (data.classes || []).forEach(cls => {
      const idMatch = cls.entity_id.toLowerCase().includes(trimmed);
      const nameMatch = (cls.class_name || '').toLowerCase().includes(trimmed);
      const schoolMatch = (cls.class_school_name || '').toLowerCase().includes(trimmed);
      const teacherMatch = (cls.class_teacher || '').toLowerCase().includes(trimmed);

      if (!trimmed || idMatch || nameMatch || schoolMatch || teacherMatch) {
        const studentCount = (data.students || []).filter(s => s.student_class_id === cls.entity_id).length;
        const activitiesCount = (data.activities || []).filter(a => a.activity_class_id === cls.entity_id).length;

        results.push({
          type: 'class',
          id: cls.entity_id,
          title: cls.class_name,
          subtitle: `Escola: ${cls.class_school_name || '—'} • Professor(a): ${cls.class_teacher || '—'}`,
          codeOrId: cls.entity_id,
          badgeText: 'Turma',
          meta: {
            school: cls.class_school_name,
            teacher: cls.class_teacher,
            students: studentCount,
            activities: activitiesCount
          },
          raw: cls
        });
      }
    });

    // Filter Activities
    (data.activities || []).forEach(act => {
      const idMatch = act.entity_id.toLowerCase().includes(trimmed);
      const nameMatch = (act.activity_name || '').toLowerCase().includes(trimmed);
      const disciplineMatch = (act.activity_discipline || '').toLowerCase().includes(trimmed);
      const classMatch = (act.activity_class_name || '').toLowerCase().includes(trimmed);
      const descMatch = (act.activity_description || '').toLowerCase().includes(trimmed);

      if (!trimmed || idMatch || nameMatch || disciplineMatch || classMatch || descMatch) {
        const gradesCount = (data.grades || []).filter(g => g.grade_activity_id === act.entity_id).length;

        results.push({
          type: 'activity',
          id: act.entity_id,
          title: act.activity_name,
          subtitle: `Disciplina: ${act.activity_discipline} • Turma: ${act.activity_class_name}`,
          codeOrId: act.entity_id,
          badgeText: 'Atividade',
          meta: {
            discipline: act.activity_discipline,
            class: act.activity_class_name,
            dueDate: act.activity_due_date,
            gradesCount
          },
          raw: act
        });
      }
    });

    return results;
  }, [data, query, isUserOnline]);

  // Filtered by selected category
  const filteredResults = useMemo(() => {
    if (activeCategory === 'students') {
      return allResults.filter(r => r.type === 'student');
    }
    if (activeCategory === 'classes') {
      return allResults.filter(r => r.type === 'class');
    }
    if (activeCategory === 'activities') {
      return allResults.filter(r => r.type === 'activity');
    }
    return allResults;
  }, [allResults, activeCategory]);

  // Counts for each category
  const counts = useMemo(() => {
    return {
      all: allResults.length,
      students: allResults.filter(r => r.type === 'student').length,
      classes: allResults.filter(r => r.type === 'class').length,
      activities: allResults.filter(r => r.type === 'activity').length
    };
  }, [allResults]);

  // Keyboard navigation through search list
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < filteredResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : filteredResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = filteredResults[selectedIndex];
      if (current) {
        handleSelectItem(current);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelectItem = (item: SearchResultItem) => {
    setIsOpen(false);
    const tabTarget = item.type === 'student' ? 'students' : item.type === 'class' ? 'classes' : 'activities';
    onNavigateToEntity(tabTarget, item.id);
  };

  const handleCopyId = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id).then(() => {
      setCopiedId(id);
      showToast(`ID copiado: ${id}`, 'success');
      setTimeout(() => setCopiedId(null), 2000);
    }).catch(() => {
      showToast('Não foi possível copiar o ID', 'error');
    });
  };

  // Helper function to highlight match in text
  const highlightMatch = (text: string, search: string) => {
    if (!search.trim()) return text;
    const parts = text.split(new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === search.toLowerCase() ? (
            <span key={i} className="bg-purple-200/80 dark:bg-purple-900/80 text-purple-950 dark:text-purple-100 font-black rounded-xs px-0.5">
              {part}
            </span>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Search Bar Input Container */}
      <div 
        className={`relative flex items-center w-full rounded-2xl border transition-all duration-200 shadow-2xs ${
          isOpen
            ? 'bg-white dark:bg-[#151128] border-[#6f2ef7] ring-3 ring-purple-500/15'
            : 'bg-white dark:bg-[#151128] border-zinc-200 dark:border-purple-900/40 hover:border-purple-300 dark:hover:border-purple-700/60'
        }`}
      >
        <div className="pl-3.5 pr-2 py-2.5 text-purple-600 dark:text-purple-400 flex items-center justify-center">
          <Search className="w-4 h-4" />
        </div>

        <input
          ref={inputRef}
          type="text"
          id="admin-quick-search-input"
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setSelectedIndex(0);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Busca rápida: digite nome ou ID de aluno, turma ou atividade..."
          className="w-full py-2.5 pr-20 bg-transparent text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none"
          autoComplete="off"
          spellCheck={false}
        />

        {/* Right side controls: Clear button and keyboard shortcut indicator */}
        <div className="absolute right-2.5 flex items-center gap-1.5">
          {query ? (
            <button
              onClick={() => {
                setQuery('');
                setSelectedIndex(0);
                inputRef.current?.focus();
              }}
              className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-purple-900/40 transition cursor-pointer"
              title="Limpar busca"
              aria-label="Limpar busca"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-[#201942] border border-zinc-200 dark:border-purple-900/40 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 select-none">
              <span className="text-[9px]">Ctrl</span>
              <span>K</span>
            </div>
          )}
        </div>
      </div>

      {/* Floating Instant Search Dropdown Panel */}
      {isOpen && (
        <div 
          className="absolute z-50 left-0 right-0 mt-2 bg-white dark:bg-[#151128] rounded-2xl border border-zinc-200 dark:border-purple-900/60 shadow-xl overflow-hidden animate-fade-in backdrop-blur-md"
          style={{ maxHeight: '480px' }}
        >
          {/* Category Filter Tabs Bar */}
          <div className="p-2.5 border-b border-zinc-100 dark:border-purple-900/30 flex items-center justify-between gap-1.5 bg-zinc-50/80 dark:bg-[#181330]/80">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
              <button
                onClick={() => {
                  setActiveCategory('all');
                  setSelectedIndex(0);
                }}
                className={`px-3 py-1 rounded-xl text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeCategory === 'all'
                    ? 'bg-purple-600 text-white shadow-2xs'
                    : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-purple-900/40'
                }`}
              >
                <span>Todos</span>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-black/15 dark:bg-white/20">
                  {counts.all}
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveCategory('students');
                  setSelectedIndex(0);
                }}
                className={`px-3 py-1 rounded-xl text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeCategory === 'students'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-purple-900/40'
                }`}
              >
                <Users className="w-3 h-3" />
                <span>Alunos</span>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-black/15 dark:bg-white/20">
                  {counts.students}
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveCategory('classes');
                  setSelectedIndex(0);
                }}
                className={`px-3 py-1 rounded-xl text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeCategory === 'classes'
                    ? 'bg-sky-600 text-white shadow-2xs'
                    : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-purple-900/40'
                }`}
              >
                <BookOpen className="w-3 h-3" />
                <span>Turmas</span>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-black/15 dark:bg-white/20">
                  {counts.classes}
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveCategory('activities');
                  setSelectedIndex(0);
                }}
                className={`px-3 py-1 rounded-xl text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeCategory === 'activities'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-purple-900/40'
                }`}
              >
                <CheckSquare className="w-3 h-3" />
                <span>Atividades</span>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-black/15 dark:bg-white/20">
                  {counts.activities}
                </span>
              </button>
            </div>

            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium hidden md:inline">
              Navegue com ↑ ↓ e Enter
            </span>
          </div>

          {/* Results List */}
          <div 
            ref={resultsContainerRef} 
            className="overflow-y-auto max-h-[380px] divide-y divide-zinc-100 dark:divide-purple-950/40"
          >
            {filteredResults.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-10 h-10 mx-auto mb-2.5 rounded-full bg-zinc-100 dark:bg-[#201942] flex items-center justify-center text-zinc-400 dark:text-zinc-500">
                  <Search className="w-5 h-5" />
                </div>
                <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                  Nenhum registro encontrado
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
                  {query 
                    ? `Nenhum aluno, turma ou atividade corresponde a "${query}". Experimente buscar pelo nome, ID ou matrícula.`
                    : 'Nenhum dado cadastrado nesta categoria no momento.'
                  }
                </p>
              </div>
            ) : (
              filteredResults.map((item, index) => {
                const isSelected = index === selectedIndex;
                const isCopied = copiedId === item.id;

                return (
                  <div
                    key={`${item.type}-${item.id}`}
                    onClick={() => handleSelectItem(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`p-3.5 transition flex items-center justify-between gap-3 cursor-pointer group ${
                      isSelected
                        ? 'bg-purple-50/70 dark:bg-purple-950/40 text-purple-950 dark:text-purple-100'
                        : 'hover:bg-zinc-50 dark:hover:bg-[#1a1435]'
                    }`}
                  >
                    {/* Left: Icon & Basic Info */}
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      {/* Entity Type Icon Badge */}
                      <div className="mt-0.5 flex-shrink-0">
                        {item.type === 'student' && (
                          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                            <Users className="w-4 h-4" />
                          </div>
                        )}
                        {item.type === 'class' && (
                          <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                            <BookOpen className="w-4 h-4" />
                          </div>
                        )}
                        {item.type === 'activity' && (
                          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <CheckSquare className="w-4 h-4" />
                          </div>
                        )}
                      </div>

                      {/* Title, Subtitle, ID */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                            {highlightMatch(item.title, query)}
                          </span>

                          {/* Category Tag */}
                          <span 
                            className={`px-2 py-0.2 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                              item.type === 'student'
                                ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60'
                                : item.type === 'class'
                                ? 'bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60'
                                : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                            }`}
                          >
                            {item.badgeText}
                          </span>

                          {/* Online Indicator for Students */}
                          {item.type === 'student' && item.meta.online === 'Online' && (
                            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 flex items-center gap-1 border border-emerald-200 dark:border-emerald-800/60">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Online
                            </span>
                          )}
                        </div>

                        {/* Subtitle / Details */}
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                          {item.subtitle}
                        </p>

                        {/* Entity ID Bar with Quick Copy */}
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-400 dark:text-zinc-500 font-mono">
                          <span>
                            ID: <span className="text-zinc-600 dark:text-zinc-300 font-semibold">{highlightMatch(item.id, query)}</span>
                          </span>
                          <button
                            onClick={e => handleCopyId(e, item.id)}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-zinc-200/70 dark:hover:bg-purple-900/60 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition"
                            title="Copiar ID completo"
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span className="text-[10px] text-emerald-600 font-sans font-bold">Copiado!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span className="text-[10px] font-sans">Copiar</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Right: Quick actions */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {/* Preview Button */}
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setPreviewItem(item);
                        }}
                        className="p-1.5 rounded-xl text-zinc-400 hover:text-purple-600 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/60 transition"
                        title="Visualizar detalhes rápidos"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Direct Navigate Button */}
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleSelectItem(item);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-[#6f2ef7] text-white hover:bg-[#5b1ce0] shadow-2xs transition"
                        title="Abrir na aba correspondente"
                      >
                        <span className="hidden sm:inline">Acessar</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Bar with count and quick hint */}
          <div className="px-4 py-2 bg-zinc-50 dark:bg-[#181330] border-t border-zinc-100 dark:border-purple-900/30 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
            <span>
              Exibindo <strong>{filteredResults.length}</strong> de <strong>{allResults.length}</strong> itens
            </span>
            <span className="flex items-center gap-1 text-[10px]">
              <span>Pressione</span>
              <kbd className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-[#251d45] text-zinc-700 dark:text-zinc-300 font-mono font-bold">ESC</kbd>
              <span>para fechar</span>
            </span>
          </div>
        </div>
      )}

      {/* Instant Preview Modal for Selected Item */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div 
            className="bg-white dark:bg-[#151128] rounded-3xl border border-zinc-200 dark:border-purple-900/60 shadow-2xl w-full max-w-lg overflow-hidden transition-all"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 border-b border-zinc-100 dark:border-purple-900/40 flex items-start justify-between bg-zinc-50/70 dark:bg-[#181330]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-purple-100 dark:bg-purple-950/80 text-[#6f2ef7] dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
                  {previewItem.type === 'student' && <Users className="w-5 h-5" />}
                  {previewItem.type === 'class' && <BookOpen className="w-5 h-5" />}
                  {previewItem.type === 'activity' && <CheckSquare className="w-5 h-5" />}
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 dark:text-purple-400">
                    Ficha Rápida • {previewItem.badgeText}
                  </span>
                  <h3 className="font-display text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
                    {previewItem.title}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setPreviewItem(null)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-purple-900/40 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body Information */}
            <div className="p-6 space-y-4 text-xs">
              {/* Entity ID Box */}
              <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-[#1a1435] border border-zinc-200/80 dark:border-purple-900/40 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                    ID Único de Registro
                  </span>
                  <span className="font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    {previewItem.id}
                  </span>
                </div>
                <button
                  onClick={e => handleCopyId(e, previewItem.id)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-[#251d45] border border-zinc-200 dark:border-purple-800/40 text-zinc-700 dark:text-zinc-200 hover:text-purple-600 transition shadow-2xs"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar ID</span>
                </button>
              </div>

              {/* Specific Content by Entity Type */}
              {previewItem.type === 'student' && (
                <div className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#1a1435] border border-zinc-100 dark:border-purple-900/30">
                      <span className="text-[10px] font-semibold text-zinc-400 block mb-0.5">Turma Vinculada</span>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                        {previewItem.meta.class || 'Não informada'}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#1a1435] border border-zinc-100 dark:border-purple-900/30">
                      <span className="text-[10px] font-semibold text-zinc-400 block mb-0.5">Média Escolar</span>
                      <span className="font-bold text-purple-700 dark:text-purple-300 text-sm">
                        {previewItem.meta.average} pts
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#1a1435] border border-zinc-100 dark:border-purple-900/30 space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="text-zinc-500 dark:text-zinc-400">Login / E-mail:</span>
                      <strong className="text-zinc-900 dark:text-zinc-100">{previewItem.meta.email}</strong>
                    </div>
                    <div className="flex items-center gap-2">
                      <Key className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="text-zinc-500 dark:text-zinc-400">Matrícula / Senha:</span>
                      <strong className="text-zinc-900 dark:text-zinc-100">{previewItem.meta.matricula}</strong>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="text-zinc-500 dark:text-zinc-400">Notas Registradas:</span>
                      <strong className="text-zinc-900 dark:text-zinc-100">{previewItem.meta.gradesCount} atividade(s)</strong>
                    </div>
                  </div>
                </div>
              )}

              {previewItem.type === 'class' && (
                <div className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#1a1435] border border-zinc-100 dark:border-purple-900/30">
                      <span className="text-[10px] font-semibold text-zinc-400 block mb-0.5">Total de Alunos</span>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                        {previewItem.meta.students} matriculado(s)
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#1a1435] border border-zinc-100 dark:border-purple-900/30">
                      <span className="text-[10px] font-semibold text-zinc-400 block mb-0.5">Atividades Cadastradas</span>
                      <span className="font-bold text-sky-700 dark:text-sky-300 text-sm">
                        {previewItem.meta.activities} atividade(s)
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#1a1435] border border-zinc-100 dark:border-purple-900/30 space-y-2">
                    <div className="flex items-center gap-2">
                      <SchoolIcon className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="text-zinc-500 dark:text-zinc-400">Escola:</span>
                      <strong className="text-zinc-900 dark:text-zinc-100">{previewItem.meta.school}</strong>
                    </div>
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="text-zinc-500 dark:text-zinc-400">Professor(a) Responsável:</span>
                      <strong className="text-zinc-900 dark:text-zinc-100">{previewItem.meta.teacher}</strong>
                    </div>
                  </div>
                </div>
              )}

              {previewItem.type === 'activity' && (
                <div className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#1a1435] border border-zinc-100 dark:border-purple-900/30">
                      <span className="text-[10px] font-semibold text-zinc-400 block mb-0.5">Disciplina</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-300 text-sm">
                        {previewItem.meta.discipline}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#1a1435] border border-zinc-100 dark:border-purple-900/30">
                      <span className="text-[10px] font-semibold text-zinc-400 block mb-0.5">Entregas Avaliadas</span>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                        {previewItem.meta.gradesCount} nota(s)
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#1a1435] border border-zinc-100 dark:border-purple-900/30 space-y-2">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="text-zinc-500 dark:text-zinc-400">Turma:</span>
                      <strong className="text-zinc-900 dark:text-zinc-100">{previewItem.meta.class}</strong>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="text-zinc-500 dark:text-zinc-400">Data de Entrega:</span>
                      <strong className="text-zinc-900 dark:text-zinc-100">
                        {previewItem.meta.dueDate ? new Date(String(previewItem.meta.dueDate)).toLocaleDateString('pt-BR') : 'Sem prazo'}
                      </strong>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer with Action Button */}
            <div className="p-4 bg-zinc-50/80 dark:bg-[#181330] border-t border-zinc-100 dark:border-purple-900/30 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setPreviewItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-purple-900/40 transition"
              >
                Fechar
              </button>

              <button
                onClick={() => {
                  const target = previewItem;
                  setPreviewItem(null);
                  handleSelectItem(target);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#6f2ef7] text-white hover:bg-[#5b1ce0] shadow-md shadow-purple-600/25 transition"
              >
                <span>Ir para a Aba {previewItem.badgeText}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
