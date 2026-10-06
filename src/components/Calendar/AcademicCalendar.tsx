import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Filter, 
  Clock, 
  MapPin, 
  BookOpen, 
  AlertCircle, 
  CheckCircle2, 
  Download, 
  Trash2, 
  Edit2, 
  X, 
  ExternalLink,
  GraduationCap,
  Sparkles,
  CalendarDays,
  FileText,
  Users
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { AcademicEvent, AcademicEventType, Activity } from '../../types';

interface AcademicCalendarProps {
  role: 'admin' | 'student';
  studentClassId?: string;
  studentClassName?: string;
}

export interface UnifiedCalendarItem {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  endDate?: string;
  type: AcademicEventType;
  discipline?: string;
  className?: string;
  classId?: string;
  schoolId?: string;
  location?: string;
  description?: string;
  isActivityDeadline?: boolean;
  activityLink?: string;
  rawEvent?: AcademicEvent;
  rawActivity?: Activity;
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const AcademicCalendar: React.FC<AcademicCalendarProps> = ({
  role,
  studentClassId,
  studentClassName
}) => {
  const { data, addEvent, updateEvent, deleteEvent, showToast } = useData();

  // Navigation state: current displayed year and month
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    today.toISOString().split('T')[0]
  );
  const [viewMode, setViewMode] = useState<'month' | 'agenda'>('month');

  // Filters
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>(
    role === 'student' && studentClassId ? studentClassId : 'all'
  );

  // Modals & Drawers
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AcademicEvent | null>(null);
  const [selectedItemDetail, setSelectedItemDetail] = useState<UnifiedCalendarItem | null>(null);

  // Form State for creating/editing custom events
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState(today.toISOString().split('T')[0]);
  const [formEndDate, setFormEndDate] = useState('');
  const [formType, setFormType] = useState<AcademicEventType>('exam');
  const [formDiscipline, setFormDiscipline] = useState('');
  const [formClassId, setFormClassId] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formDescription, setFormDescription] = useState('');

  // 1. Unify all events: Custom events (exams, holidays, meetings) + Activity Deadlines
  const unifiedItems: UnifiedCalendarItem[] = useMemo(() => {
    const items: UnifiedCalendarItem[] = [];

    // Add custom academic events
    if (data.events && Array.isArray(data.events)) {
      data.events.forEach(ev => {
        // If student, filter out events targeted at other classes (keep general events)
        if (role === 'student' && studentClassId && ev.class_id && ev.class_id !== studentClassId) {
          return;
        }

        items.push({
          id: ev.entity_id,
          title: ev.title,
          date: ev.date,
          endDate: ev.end_date,
          type: ev.type,
          discipline: ev.discipline,
          className: ev.class_name,
          classId: ev.class_id,
          schoolId: ev.school_id,
          location: ev.location,
          description: ev.description,
          isActivityDeadline: false,
          rawEvent: ev
        });
      });
    }

    // Add activity deadlines automatically
    if (data.activities && Array.isArray(data.activities)) {
      data.activities.forEach(act => {
        // If student, only include activities for their class
        if (role === 'student' && studentClassId && act.activity_class_id !== studentClassId) {
          return;
        }

        items.push({
          id: `act_deadline_${act.entity_id}`,
          title: `Prazo: ${act.activity_name}`,
          date: act.activity_due_date,
          type: 'deadline',
          discipline: act.activity_discipline,
          className: act.activity_class_name,
          classId: act.activity_class_id,
          description: act.activity_description || 'Entrega obrigatória de atividade pedagógica.',
          activityLink: act.activity_link,
          isActivityDeadline: true,
          rawActivity: act
        });
      });
    }

    return items;
  }, [data.events, data.activities, role, studentClassId]);

  // 2. Filtered items based on user selection
  const filteredItems = useMemo(() => {
    return unifiedItems.filter(item => {
      // Type filter
      if (selectedTypeFilter !== 'all' && item.type !== selectedTypeFilter) {
        return false;
      }
      // Class filter (only active in admin view or if explicitly selected)
      if (role === 'admin' && selectedClassFilter !== 'all') {
        if (item.classId && item.classId !== selectedClassFilter) {
          return false;
        }
      }
      return true;
    });
  }, [unifiedItems, selectedTypeFilter, selectedClassFilter, role]);

  // 3. Calendar Grid Calculations
  const firstDayOfMonthIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun
  const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const totalDaysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  // Navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleGoToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setSelectedDateStr(today.toISOString().split('T')[0]);
  };

  // Helper formatting
  const formatDateKey = (year: number, month: number, day: number) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  // Items mapped by Date key (YYYY-MM-DD)
  const itemsByDate = useMemo(() => {
    const map = new Map<string, UnifiedCalendarItem[]>();
    filteredItems.forEach(item => {
      const list = map.get(item.date) || [];
      list.push(item);
      map.set(item.date, list);
    });
    return map;
  }, [filteredItems]);

  // Items for selected date
  const selectedDayItems = useMemo(() => {
    return filteredItems.filter(item => item.date === selectedDateStr);
  }, [filteredItems, selectedDateStr]);

  // Color styles per event type
  const getTypeBadge = (type: AcademicEventType) => {
    switch (type) {
      case 'exam':
        return {
          label: 'Prova / Avaliação',
          dotBg: 'bg-rose-500',
          badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
          cardBorder: 'border-l-rose-500',
          chipBg: 'bg-rose-500 text-white'
        };
      case 'holiday':
        return {
          label: 'Feriado / Recesso',
          dotBg: 'bg-emerald-500',
          badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          cardBorder: 'border-l-emerald-500',
          chipBg: 'bg-emerald-600 text-white'
        };
      case 'deadline':
        return {
          label: 'Prazo de Atividade',
          dotBg: 'bg-purple-600',
          badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
          cardBorder: 'border-l-[#6f2ef7]',
          chipBg: 'bg-[#6f2ef7] text-white'
        };
      case 'meeting':
        return {
          label: 'Reunião Pedagógica',
          dotBg: 'bg-amber-500',
          badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
          cardBorder: 'border-l-amber-500',
          chipBg: 'bg-amber-500 text-white'
        };
      case 'event':
      default:
        return {
          label: 'Evento Escolar',
          dotBg: 'bg-blue-500',
          badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
          cardBorder: 'border-l-blue-500',
          chipBg: 'bg-blue-600 text-white'
        };
    }
  };

  // Open Create Modal
  const openCreateModal = (defaultDate?: string) => {
    setEditingEvent(null);
    setFormTitle('');
    setFormDate(defaultDate || selectedDateStr || today.toISOString().split('T')[0]);
    setFormEndDate('');
    setFormType('exam');
    setFormDiscipline('');
    setFormClassId('');
    setFormLocation('');
    setFormDescription('');
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (ev: AcademicEvent) => {
    setEditingEvent(ev);
    setFormTitle(ev.title);
    setFormDate(ev.date);
    setFormEndDate(ev.end_date || '');
    setFormType(ev.type);
    setFormDiscipline(ev.discipline || '');
    setFormClassId(ev.class_id || '');
    setFormLocation(ev.location || '');
    setFormDescription(ev.description || '');
    setIsCreateModalOpen(true);
  };

  // Save Event
  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDate) {
      showToast('Preencha pelo menos o título e a data do evento.', 'error');
      return;
    }

    const selectedClass = data.classes.find(c => c.entity_id === formClassId);

    if (editingEvent) {
      updateEvent({
        ...editingEvent,
        title: formTitle.trim(),
        date: formDate,
        end_date: formEndDate || undefined,
        type: formType,
        discipline: formDiscipline.trim() || undefined,
        class_id: formClassId || undefined,
        class_name: selectedClass ? selectedClass.class_name : undefined,
        location: formLocation.trim() || undefined,
        description: formDescription.trim() || undefined
      });
    } else {
      addEvent({
        title: formTitle.trim(),
        date: formDate,
        end_date: formEndDate || undefined,
        type: formType,
        discipline: formDiscipline.trim() || undefined,
        class_id: formClassId || undefined,
        class_name: selectedClass ? selectedClass.class_name : undefined,
        location: formLocation.trim() || undefined,
        description: formDescription.trim() || undefined
      });
    }

    setIsCreateModalOpen(false);
  };

  // Delete Custom Event
  const handleDeleteEvent = (id: string) => {
    if (confirm('Deseja realmente remover este evento acadêmico do calendário?')) {
      deleteEvent(id);
      if (selectedItemDetail?.id === id) {
        setSelectedItemDetail(null);
      }
    }
  };

  // Export iCalendar / .ics file for Google / Apple Calendar
  const handleExportICS = () => {
    try {
      let icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Projeto 2+DOIS= Aprender//Calendario Academico//PT',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'X-WR-CALNAME:Calendario Academico - 2+DOIS= Aprender'
      ];

      filteredItems.forEach(item => {
        const dtStart = item.date.replace(/-/g, '');
        const dtEnd = (item.endDate || item.date).replace(/-/g, '');
        icsContent.push('BEGIN:VEVENT');
        icsContent.push(`UID:${item.id}@aprender.local`);
        icsContent.push(`DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`);
        icsContent.push(`DTSTART;VALUE=DATE:${dtStart}`);
        icsContent.push(`DTEND;VALUE=DATE:${dtEnd}`);
        icsContent.push(`SUMMARY:${item.title.replace(/\n/g, ' ')}`);
        if (item.description) {
          icsContent.push(`DESCRIPTION:${item.description.replace(/\n/g, '\\n')}`);
        }
        if (item.location) {
          icsContent.push(`LOCATION:${item.location}`);
        }
        icsContent.push('END:VEVENT');
      });

      icsContent.push('END:VCALENDAR');

      const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `calendario_academico_${currentYear}_${currentMonth + 1}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Calendário (.ics) exportado com sucesso! Você pode abri-lo no Google Agenda ou Apple Calendar.');
    } catch (err: any) {
      showToast('Erro ao exportar calendário: ' + err.message, 'error');
    }
  };

  // Upcoming items sorted chronologically
  const upcomingItems = useMemo(() => {
    const todayStr = today.toISOString().split('T')[0];
    return [...filteredItems]
      .filter(item => item.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredItems, today]);

  // Count summaries
  const countExams = unifiedItems.filter(i => i.type === 'exam').length;
  const countDeadlines = unifiedItems.filter(i => i.type === 'deadline').length;
  const countHolidays = unifiedItems.filter(i => i.type === 'holiday').length;

  return (
    <div className="space-y-6 animate-fade-in" id="academic-calendar-root">
      {/* Top Banner / Summary Header */}
      <div className="bg-gradient-to-r from-[#6924f5] via-[#7a32f7] to-[#8d47fa] rounded-3xl p-6 sm:p-7 text-white shadow-xl shadow-purple-600/20 border border-white/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold mb-2.5 border border-white/30 backdrop-blur-xs">
              <CalendarDays className="w-3.5 h-3.5 text-amber-300" />
              <span>Cronograma Centralizado</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-white">
              Calendário Acadêmico
            </h2>
            <p className="text-purple-100 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              {role === 'admin'
                ? 'Central de datas importantes: provas, feriados, recessos e prazos de atividades integrados para toda a escola.'
                : `Acompanhe suas provas, feriados escolares e prazos de entrega da turma ${studentClassName || ''}.`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            {role === 'admin' && (
              <button
                id="btn-new-calendar-event"
                onClick={() => openCreateModal()}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white text-[#6f2ef7] hover:bg-purple-50 shadow-md flex items-center gap-2 transition active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#6f2ef7]" />
                <span>Novo Evento / Prova</span>
              </button>
            )}

            <button
              id="btn-export-ics"
              onClick={handleExportICS}
              title="Exportar para Google Agenda / iCal"
              className="px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-white/20 hover:bg-white/30 text-white border border-white/30 flex items-center gap-1.5 transition backdrop-blur-xs cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Exportar (.ics)</span>
            </button>
          </div>
        </div>

        {/* Quick Highlights Counters */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4 mt-5 pt-4 border-t border-white/20">
          <div className="bg-white/15 backdrop-blur-md rounded-2xl p-3 border border-white/20 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div>
              <p className="text-[10px] sm:text-xs font-semibold text-purple-100 uppercase tracking-wider">Provas Agendadas</p>
              <p className="text-xl sm:text-2xl font-black text-white">{countExams}</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-rose-500/80 text-white flex items-center justify-center self-end sm:self-auto">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white/15 backdrop-blur-md rounded-2xl p-3 border border-white/20 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div>
              <p className="text-[10px] sm:text-xs font-semibold text-purple-100 uppercase tracking-wider">Prazos de Atividades</p>
              <p className="text-xl sm:text-2xl font-black text-white">{countDeadlines}</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-purple-900/70 text-white flex items-center justify-center self-end sm:self-auto">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white/15 backdrop-blur-md rounded-2xl p-3 border border-white/20 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div>
              <p className="text-[10px] sm:text-xs font-semibold text-purple-100 uppercase tracking-wider">Feriados & Recessos</p>
              <p className="text-xl sm:text-2xl font-black text-white">{countHolidays}</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/80 text-white flex items-center justify-center self-end sm:self-auto">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Month Navigation + View Switcher + Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-zinc-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Month Selector & Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-zinc-100 rounded-xl p-1">
            <button
              id="btn-calendar-prev-month"
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-white rounded-lg text-zinc-700 transition cursor-pointer"
              title="Mês Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              id="btn-calendar-next-month"
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-white rounded-lg text-zinc-700 transition cursor-pointer"
              title="Próximo Mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h3 className="font-display text-lg sm:text-xl font-bold text-zinc-900 capitalize min-w-[190px]">
            {MONTH_NAMES[currentMonth]} <span className="text-[#6f2ef7]">{currentYear}</span>
          </h3>

          <button
            id="btn-calendar-today"
            onClick={handleGoToToday}
            className="px-2.5 py-1 text-xs font-bold text-[#6f2ef7] bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition cursor-pointer"
          >
            Hoje
          </button>
        </div>

        {/* View Mode Toggle & Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Mode Buttons */}
          <div className="flex items-center bg-zinc-100 rounded-xl p-1 border border-zinc-200">
            <button
              id="btn-view-month"
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'month'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Grade Mensal
            </button>
            <button
              id="btn-view-agenda"
              onClick={() => setViewMode('agenda')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'agenda'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Lista & Prazos ({upcomingItems.length})
            </button>
          </div>

          {/* Event Type Filter */}
          <div className="flex items-center gap-1.5 bg-white border border-zinc-200 rounded-xl px-2.5 py-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-zinc-400" />
            <select
              id="select-filter-type"
              value={selectedTypeFilter}
              onChange={e => setSelectedTypeFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-zinc-800 focus:outline-none cursor-pointer"
            >
              <option value="all">Todos os Tipos</option>
              <option value="exam">📝 Provas e Avaliações</option>
              <option value="deadline">⏰ Prazos de Atividades</option>
              <option value="holiday">🏖️ Feriados e Recessos</option>
              <option value="meeting">👥 Reuniões Pedagógicas</option>
              <option value="event">🎉 Eventos Escolares</option>
            </select>
          </div>

          {/* Class Filter (Admin Only) */}
          {role === 'admin' && (
            <div className="flex items-center gap-1.5 bg-white border border-zinc-200 rounded-xl px-2.5 py-1 text-xs">
              <Users className="w-3.5 h-3.5 text-zinc-400" />
              <select
                id="select-filter-class"
                value={selectedClassFilter}
                onChange={e => setSelectedClassFilter(e.target.value)}
                className="bg-transparent text-xs font-semibold text-zinc-800 focus:outline-none cursor-pointer max-w-[160px] truncate"
              >
                <option value="all">Todas as Turmas</option>
                {data.classes.map(c => (
                  <option key={c.entity_id} value={c.entity_id}>
                    {c.class_name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Legend Chips Bar */}
      <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
        <span className="text-zinc-400 text-[11px] font-bold uppercase tracking-wider mr-1">Legenda:</span>
        <button
          onClick={() => setSelectedTypeFilter(selectedTypeFilter === 'exam' ? 'all' : 'exam')}
          className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border transition cursor-pointer ${
            selectedTypeFilter === 'exam' ? 'ring-2 ring-rose-500 font-bold' : ''
          } bg-rose-50 text-rose-700 border-rose-200`}
        >
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          <span>Provas</span>
        </button>

        <button
          onClick={() => setSelectedTypeFilter(selectedTypeFilter === 'deadline' ? 'all' : 'deadline')}
          className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border transition cursor-pointer ${
            selectedTypeFilter === 'deadline' ? 'ring-2 ring-purple-600 font-bold' : ''
          } bg-purple-50 text-purple-700 border-purple-200`}
        >
          <span className="w-2 h-2 rounded-full bg-[#6f2ef7]" />
          <span>Prazos de Atividades</span>
        </button>

        <button
          onClick={() => setSelectedTypeFilter(selectedTypeFilter === 'holiday' ? 'all' : 'holiday')}
          className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border transition cursor-pointer ${
            selectedTypeFilter === 'holiday' ? 'ring-2 ring-emerald-500 font-bold' : ''
          } bg-emerald-50 text-emerald-700 border-emerald-200`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Feriados & Recessos</span>
        </button>

        <button
          onClick={() => setSelectedTypeFilter(selectedTypeFilter === 'meeting' ? 'all' : 'meeting')}
          className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border transition cursor-pointer ${
            selectedTypeFilter === 'meeting' ? 'ring-2 ring-amber-500 font-bold' : ''
          } bg-amber-50 text-amber-700 border-amber-200`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span>Reuniões</span>
        </button>

        <button
          onClick={() => setSelectedTypeFilter(selectedTypeFilter === 'event' ? 'all' : 'event')}
          className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border transition cursor-pointer ${
            selectedTypeFilter === 'event' ? 'ring-2 ring-blue-500 font-bold' : ''
          } bg-blue-50 text-blue-700 border-blue-200`}
        >
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <span>Eventos Escolares</span>
        </button>

        {selectedTypeFilter !== 'all' && (
          <button
            onClick={() => setSelectedTypeFilter('all')}
            className="text-[11px] font-bold text-zinc-500 hover:text-zinc-800 underline ml-2 cursor-pointer"
          >
            Limpar filtro
          </button>
        )}
      </div>

      {/* Main View Area: Month Grid or Agenda List */}
      {viewMode === 'month' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Grid (Span 2 cols on desktop) */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-4 sm:p-6 shadow-xs border border-zinc-200">
            {/* Weekdays Header */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
              {WEEKDAYS.map((wd, index) => (
                <div
                  key={wd}
                  className={`text-center text-xs font-bold py-2 ${
                    index === 0 || index === 6 ? 'text-rose-500' : 'text-zinc-600'
                  }`}
                >
                  {wd}
                </div>
              ))}
            </div>

            {/* Calendar Days Grid */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {/* 1. Leading days from previous month */}
              {Array.from({ length: firstDayOfMonthIndex }).map((_, i) => {
                const dayNum = totalDaysInPrevMonth - firstDayOfMonthIndex + i + 1;
                return (
                  <div
                    key={`prev-${i}`}
                    className="min-h-[78px] sm:min-h-[96px] p-1.5 rounded-2xl bg-zinc-50/50 border border-transparent text-zinc-300 select-none"
                  >
                    <span className="text-xs font-semibold">{dayNum}</span>
                  </div>
                );
              })}

              {/* 2. Days of current month */}
              {Array.from({ length: totalDaysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dateKey = formatDateKey(currentYear, currentMonth, dayNum);
                const dayItems = itemsByDate.get(dateKey) || [];
                const isSelected = selectedDateStr === dateKey;
                const isToday =
                  today.getFullYear() === currentYear &&
                  today.getMonth() === currentMonth &&
                  today.getDate() === dayNum;

                return (
                  <div
                    key={`day-${dayNum}`}
                    id={`calendar-cell-${dateKey}`}
                    onClick={() => setSelectedDateStr(dateKey)}
                    className={`min-h-[78px] sm:min-h-[96px] p-1.5 sm:p-2 rounded-2xl border transition flex flex-col justify-between cursor-pointer group ${
                      isSelected
                        ? 'border-[#6f2ef7] bg-purple-50/40 shadow-xs ring-2 ring-purple-500/20'
                        : isToday
                        ? 'border-purple-300 bg-purple-50/20 hover:border-purple-400'
                        : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/80 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-extrabold flex items-center justify-center w-6 h-6 rounded-full transition ${
                          isToday
                            ? 'bg-[#6f2ef7] text-white shadow-xs'
                            : isSelected
                            ? 'bg-purple-100 text-purple-900 font-black'
                            : 'text-zinc-800 group-hover:text-[#6f2ef7]'
                        }`}
                      >
                        {dayNum}
                      </span>

                      {/* Dot indicators for mobile / compact */}
                      {dayItems.length > 0 && (
                        <div className="flex items-center gap-0.5">
                          {dayItems.slice(0, 3).map((item, idx) => (
                            <span
                              key={idx}
                              className={`w-1.5 h-1.5 rounded-full ${getTypeBadge(item.type).dotBg}`}
                              title={item.title}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Day Event Pills */}
                    <div className="mt-1 space-y-1 overflow-hidden">
                      {dayItems.slice(0, 2).map(item => {
                        const badge = getTypeBadge(item.type);
                        return (
                          <div
                            key={item.id}
                            onClick={e => {
                              e.stopPropagation();
                              setSelectedDateStr(dateKey);
                              setSelectedItemDetail(item);
                            }}
                            className={`text-[10px] sm:text-[11px] font-semibold px-1.5 py-0.5 rounded-md truncate border flex items-center gap-1 hover:opacity-90 ${badge.badgeClass}`}
                            title={`${item.title} (${badge.label})`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${badge.dotBg}`} />
                            <span className="truncate">{item.title}</span>
                          </div>
                        );
                      })}

                      {dayItems.length > 2 && (
                        <div className="text-[10px] font-bold text-zinc-500 pl-1">
                          +{dayItems.length - 2} mais
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* 3. Trailing days from next month to balance grid */}
              {Array.from({
                length: (7 - ((firstDayOfMonthIndex + totalDaysInMonth) % 7)) % 7
              }).map((_, i) => (
                <div
                  key={`next-${i}`}
                  className="min-h-[78px] sm:min-h-[96px] p-1.5 rounded-2xl bg-zinc-50/50 border border-transparent text-zinc-300 select-none"
                >
                  <span className="text-xs font-semibold">{i + 1}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Day Details Sidebar */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-zinc-200 flex flex-col h-full">
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-zinc-100">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                  Data Selecionada
                </p>
                <h4 className="font-display text-base font-bold text-zinc-900 mt-0.5">
                  {new Date(`${selectedDateStr}T12:00:00`).toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </h4>
              </div>

              {role === 'admin' && (
                <button
                  onClick={() => openCreateModal(selectedDateStr)}
                  className="p-1.5 rounded-xl bg-purple-50 text-[#6f2ef7] hover:bg-purple-100 transition cursor-pointer"
                  title="Adicionar evento nesta data"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* List of events on this day */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-0.5">
              {selectedDayItems.length === 0 ? (
                <div className="py-10 text-center text-zinc-400">
                  <CalendarIcon className="w-8 h-8 mx-auto mb-2 text-zinc-300" />
                  <p className="text-xs font-semibold text-zinc-500">Nenhum evento agendado para este dia.</p>
                  {role === 'admin' && (
                    <button
                      onClick={() => openCreateModal(selectedDateStr)}
                      className="mt-3 text-xs font-bold text-[#6f2ef7] hover:underline cursor-pointer"
                    >
                      + Agendar prova ou evento
                    </button>
                  )}
                </div>
              ) : (
                selectedDayItems.map(item => {
                  const badge = getTypeBadge(item.type);
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedItemDetail(item)}
                      className={`p-3.5 rounded-2xl border border-zinc-200 border-l-4 ${badge.cardBorder} hover:shadow-sm hover:border-zinc-300 transition bg-white cursor-pointer group`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span
                            className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border mb-1.5 ${badge.badgeClass}`}
                          >
                            {badge.label}
                          </span>
                          <h5 className="text-sm font-bold text-zinc-900 group-hover:text-[#6f2ef7] transition leading-snug">
                            {item.title}
                          </h5>
                        </div>
                      </div>

                      {item.description && (
                        <p className="text-xs text-zinc-600 mt-1.5 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-2 mt-2.5 text-[11px] text-zinc-500 font-medium">
                        {item.discipline && (
                          <span className="flex items-center gap-1 bg-zinc-100 px-2 py-0.5 rounded-md text-zinc-700">
                            <BookOpen className="w-3 h-3 text-zinc-500" />
                            {item.discipline}
                          </span>
                        )}
                        {item.className && (
                          <span className="flex items-center gap-1 bg-zinc-100 px-2 py-0.5 rounded-md text-zinc-700">
                            <Users className="w-3 h-3 text-zinc-500" />
                            {item.className}
                          </span>
                        )}
                        {item.location && (
                          <span className="flex items-center gap-1 bg-zinc-100 px-2 py-0.5 rounded-md text-zinc-700">
                            <MapPin className="w-3 h-3 text-zinc-500" />
                            {item.location}
                          </span>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="mt-3 pt-2 border-t border-zinc-100 flex items-center justify-between text-xs">
                        <span className="text-[#6f2ef7] font-bold text-[11px] flex items-center gap-1 group-hover:translate-x-0.5 transition">
                          Ver detalhes →
                        </span>

                        {role === 'admin' && !item.isActivityDeadline && item.rawEvent && (
                          <div
                            className="flex items-center gap-1"
                            onClick={e => e.stopPropagation()}
                          >
                            <button
                              onClick={() => openEditModal(item.rawEvent!)}
                              className="p-1 text-zinc-400 hover:text-zinc-700 transition cursor-pointer"
                              title="Editar"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteEvent(item.id)}
                              className="p-1 text-zinc-400 hover:text-rose-600 transition cursor-pointer"
                              title="Excluir"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Agenda / Timeline View */
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-zinc-200">
          <div className="pb-4 mb-4 border-b border-zinc-100 flex items-center justify-between">
            <div>
              <h4 className="font-display text-lg font-bold text-zinc-900">
                Próximos Compromissos & Prazos
              </h4>
              <p className="text-xs text-zinc-500">
                Lista ordenada das próximas provas, entregas de trabalhos e datas comemorativas
              </p>
            </div>
            <span className="text-xs font-bold text-purple-900 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
              {upcomingItems.length} eventos futuros
            </span>
          </div>

          {upcomingItems.length === 0 ? (
            <div className="py-14 text-center text-zinc-400">
              <CalendarIcon className="w-10 h-10 mx-auto mb-2 text-zinc-300" />
              <p className="text-sm font-semibold text-zinc-600">Nenhum evento futuro encontrado com os filtros atuais.</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {upcomingItems.map(item => {
                const badge = getTypeBadge(item.type);
                const itemDate = new Date(`${item.date}T12:00:00`);
                const diffTime = itemDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                let countdownText = '';
                if (diffDays === 0) countdownText = 'Hoje!';
                else if (diffDays === 1) countdownText = 'Amanhã';
                else if (diffDays > 1) countdownText = `Em ${diffDays} dias`;

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItemDetail(item)}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-50/70 px-3 rounded-2xl transition cursor-pointer group"
                  >
                    <div className="flex items-start gap-3.5">
                      {/* Date badge */}
                      <div className="w-13 h-13 rounded-2xl bg-zinc-100 text-zinc-800 flex flex-col items-center justify-center flex-shrink-0 border border-zinc-200 group-hover:border-[#6f2ef7] group-hover:bg-purple-50 transition">
                        <span className="text-[10px] font-bold uppercase text-zinc-500">
                          {itemDate.toLocaleDateString('pt-BR', { month: 'short' })}
                        </span>
                        <span className="text-lg font-black text-zinc-900 leading-none">
                          {itemDate.getDate()}
                        </span>
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.badgeClass}`}
                          >
                            {badge.label}
                          </span>
                          {countdownText && (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                              {countdownText}
                            </span>
                          )}
                          {item.discipline && (
                            <span className="text-[11px] font-semibold text-zinc-500">
                              • {item.discipline}
                            </span>
                          )}
                          {item.className && (
                            <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded">
                              {item.className}
                            </span>
                          )}
                        </div>

                        <h5 className="text-sm sm:text-base font-bold text-zinc-900 group-hover:text-[#6f2ef7] transition">
                          {item.title}
                        </h5>

                        {item.description && (
                          <p className="text-xs text-zinc-600 mt-1 line-clamp-1">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:self-center pl-16 sm:pl-0">
                      {item.location && (
                        <span className="text-xs text-zinc-500 flex items-center gap-1 mr-2">
                          <MapPin className="w-3.5 h-3.5" />
                          {item.location}
                        </span>
                      )}

                      <span className="text-xs font-bold text-[#6f2ef7] group-hover:underline">
                        Visualizar →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal: Create or Edit Academic Event */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-zinc-200 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-700 p-1 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-5">
              <h3 className="font-display text-xl font-bold text-zinc-900">
                {editingEvent ? 'Editar Evento Acadêmico' : 'Novo Evento no Calendário'}
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Cadastre datas de provas, feriados, recessos ou reuniões com a comunidade
              </p>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-4">
              {/* Event Title */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Título do Evento / Prova *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  placeholder="Ex: Prova Bimestral de Matemática"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#6f2ef7] text-sm text-zinc-900"
                />
              </div>

              {/* Type and Discipline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Tipo de Evento *
                  </label>
                  <select
                    value={formType}
                    onChange={e => setFormType(e.target.value as AcademicEventType)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#6f2ef7] text-sm text-zinc-900 bg-white"
                  >
                    <option value="exam">📝 Prova / Avaliação</option>
                    <option value="holiday">🏖️ Feriado / Recesso</option>
                    <option value="meeting">👥 Reunião de Pais / Pedagógica</option>
                    <option value="event">🎉 Evento Escolar / Feira</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Disciplina (Opcional)
                  </label>
                  <input
                    type="text"
                    value={formDiscipline}
                    onChange={e => setFormDiscipline(e.target.value)}
                    placeholder="Ex: Matemática, Português..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#6f2ef7] text-sm text-zinc-900"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Data do Evento *
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#6f2ef7] text-sm text-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Data de Término (Opcional)
                  </label>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={e => setFormEndDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#6f2ef7] text-sm text-zinc-900"
                  />
                </div>
              </div>

              {/* Target Class and Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Turma Alvo
                  </label>
                  <select
                    value={formClassId}
                    onChange={e => setFormClassId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#6f2ef7] text-sm text-zinc-900 bg-white"
                  >
                    <option value="">Todas as Turmas (Geral)</option>
                    {data.classes.map(cls => (
                      <option key={cls.entity_id} value={cls.entity_id}>
                        {cls.class_name} ({cls.class_school_name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Local / Sala (Opcional)
                  </label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={e => setFormLocation(e.target.value)}
                    placeholder="Ex: Sala 04, Auditório..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#6f2ef7] text-sm text-zinc-900"
                  />
                </div>
              </div>

              {/* Description / Instructions */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Instruções ou Descrição
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  placeholder="Detalhes do conteúdo programático, materiais permitidos ou orientações para os alunos..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-[#6f2ef7] text-sm text-zinc-900 placeholder:text-zinc-400 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-600 hover:bg-zinc-100 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#6f2ef7] to-[#5914e6] hover:from-[#6524f0] hover:to-[#500dd8] shadow-md shadow-purple-600/30 transition"
                >
                  {editingEvent ? 'Salvar Alterações' : 'Agendar no Calendário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Event Details Drawer/Modal */}
      {selectedItemDetail && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 relative">
            <button
              onClick={() => setSelectedItemDetail(null)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-700 p-1 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Badge & Title */}
            <div className="mb-4">
              <span
                className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full border mb-2 ${
                  getTypeBadge(selectedItemDetail.type).badgeClass
                }`}
              >
                {getTypeBadge(selectedItemDetail.type).label}
              </span>
              <h3 className="font-display text-xl font-bold text-zinc-900 leading-tight">
                {selectedItemDetail.title}
              </h3>
            </div>

            {/* Metadata list */}
            <div className="space-y-2.5 text-xs text-zinc-700 bg-zinc-50 rounded-2xl p-4 border border-zinc-200 mb-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-[#6f2ef7]" />
                <span>
                  <strong>Data:</strong>{' '}
                  {new Date(`${selectedItemDetail.date}T12:00:00`).toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                  {selectedItemDetail.endDate &&
                    ` até ${new Date(`${selectedItemDetail.endDate}T12:00:00`).toLocaleDateString('pt-BR')}`}
                </span>
              </div>

              {selectedItemDetail.discipline && (
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#6f2ef7]" />
                  <span>
                    <strong>Disciplina:</strong> {selectedItemDetail.discipline}
                  </span>
                </div>
              )}

              {selectedItemDetail.className && (
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#6f2ef7]" />
                  <span>
                    <strong>Turma:</strong> {selectedItemDetail.className}
                  </span>
                </div>
              )}

              {selectedItemDetail.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#6f2ef7]" />
                  <span>
                    <strong>Local:</strong> {selectedItemDetail.location}
                  </span>
                </div>
              )}
            </div>

            {/* Description */}
            {selectedItemDetail.description && (
              <div className="mb-5">
                <h5 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">
                  Instruções e Observações
                </h5>
                <p className="text-xs text-zinc-700 leading-relaxed whitespace-pre-line bg-purple-50/40 p-3 rounded-xl border border-purple-100">
                  {selectedItemDetail.description}
                </p>
              </div>
            )}

            {/* External link for activity if available */}
            {selectedItemDetail.activityLink && (
              <a
                href={selectedItemDetail.activityLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full mb-3 py-2.5 px-4 rounded-xl text-xs font-bold text-[#6f2ef7] bg-purple-50 hover:bg-purple-100 border border-purple-200 flex items-center justify-center gap-2 transition"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Abrir Material Complementar</span>
              </a>
            )}

            {/* Footer actions */}
            <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
              {role === 'admin' && !selectedItemDetail.isActivityDeadline && selectedItemDetail.rawEvent ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const ev = selectedItemDetail.rawEvent!;
                      setSelectedItemDetail(null);
                      openEditModal(ev);
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 transition flex items-center gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Editar
                  </button>
                  <button
                    onClick={() => {
                      handleDeleteEvent(selectedItemDetail.id);
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Excluir
                  </button>
                </div>
              ) : (
                <span className="text-[11px] text-zinc-400">
                  {selectedItemDetail.isActivityDeadline ? 'Prazo sincronizado da atividade' : 'Evento acadêmico'}
                </span>
              )}

              <button
                onClick={() => setSelectedItemDetail(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
