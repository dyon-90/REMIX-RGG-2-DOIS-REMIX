import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell
} from 'recharts';
import { useData } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  Trophy, 
  TrendingUp, 
  BarChart2, 
  LineChart as LineChartIcon, 
  Users, 
  Award, 
  BookOpen, 
  Sparkles, 
  Filter, 
  CheckCircle2, 
  AlertTriangle,
  GraduationCap,
  Calendar,
  Layers,
  Info
} from 'lucide-react';

interface ClassPerformanceRankingChartProps {
  defaultClassId?: string;
  className?: string;
}

// Demo data for previewing before actual grades are entered
const DEMO_CLASSES = [
  { id: 'demo_class_9a', name: '9º Ano A - Matutino', school: 'EEMTI Professora Maria do Carmo' },
  { id: 'demo_class_9b', name: '9º Ano B - Vespertino', school: 'EEMTI Professora Maria do Carmo' }
];

const DEMO_STUDENTS = [
  { id: 's1', name: 'Ana Beatriz Souza', classId: 'demo_class_9a', grades: [9.5, 9.0, 10.0, 9.2, 9.8] },
  { id: 's2', name: 'Carlos Eduardo Lima', classId: 'demo_class_9a', grades: [8.5, 8.8, 9.0, 8.2, 8.7] },
  { id: 's3', name: 'Mariana Duarte', classId: 'demo_class_9a', grades: [8.0, 8.5, 7.5, 9.0, 8.4] },
  { id: 's4', name: 'Lucas Gabriel Costa', classId: 'demo_class_9a', grades: [7.2, 7.8, 8.0, 7.5, 7.6] },
  { id: 's5', name: 'Julia Fernandes', classId: 'demo_class_9a', grades: [6.8, 7.0, 7.2, 6.5, 7.0] },
  { id: 's6', name: 'Matheus Henrique', classId: 'demo_class_9a', grades: [5.5, 6.0, 6.2, 5.8, 6.0] },
  { id: 's7', name: 'Beatriz Almeida', classId: 'demo_class_9a', grades: [4.8, 5.2, 5.5, 5.0, 5.3] },
  
  { id: 's8', name: 'Felipe Augusto Rocha', classId: 'demo_class_9b', grades: [9.2, 9.5, 9.0, 9.4, 9.6] },
  { id: 's9', name: 'Camila Rodrigues', classId: 'demo_class_9b', grades: [8.7, 8.9, 8.5, 9.1, 8.8] },
  { id: 's10', name: 'Rafael Pinheiro', classId: 'demo_class_9b', grades: [7.8, 8.0, 7.5, 8.2, 7.9] },
  { id: 's11', name: 'Larissa Nogueira', classId: 'demo_class_9b', grades: [6.5, 6.8, 7.0, 6.2, 6.7] },
  { id: 's12', name: 'Gustavo Mendonça', classId: 'demo_class_9b', grades: [5.0, 5.5, 5.8, 5.2, 5.4] }
];

const DEMO_ACTIVITIES = [
  { id: 'act1', name: 'Diagnóstico 1', discipline: 'Matemática', date: '2026-02-10' },
  { id: 'act2', name: 'Interpretação Textual', discipline: 'Português', date: '2026-02-18' },
  { id: 'act3', name: 'Desafio SPAECE', discipline: 'Matemática', date: '2026-02-25' },
  { id: 'act4', name: 'Redação Narrativa', discipline: 'Português', date: '2026-03-03' },
  { id: 'act5', name: 'Simulado Bimestral', discipline: 'Matemática', date: '2026-03-10' }
];

export const ClassPerformanceRankingChart: React.FC<ClassPerformanceRankingChartProps> = ({
  defaultClassId,
  className = ''
}) => {
  const { data } = useData();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Determine if we have real registered classes
  const realClasses = data.classes || [];
  const hasRealData = (data.grades || []).length > 0 && realClasses.length > 0;

  // Selected filters
  const [useDemoData, setUseDemoData] = useState<boolean>(!hasRealData);
  const [selectedClassId, setSelectedClassId] = useState<string>(() => {
    if (defaultClassId) return defaultClassId;
    if (realClasses.length > 0) return realClasses[0].entity_id;
    return 'demo_class_9a';
  });
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const [metricType, setMetricType] = useState<'average' | 'total'>('average');
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('all');
  const [selectedStudentForFocus, setSelectedStudentForFocus] = useState<string | null>(null);

  // Available classes list
  const availableClasses = useMemo(() => {
    if (!useDemoData && realClasses.length > 0) {
      return realClasses.map(c => ({ id: c.entity_id, name: c.class_name, school: c.class_school_name }));
    }
    return DEMO_CLASSES;
  }, [useDemoData, realClasses]);

  // Make sure selectedClassId is valid
  const currentClassId = useMemo(() => {
    if (availableClasses.some(c => c.id === selectedClassId)) {
      return selectedClassId;
    }
    return availableClasses[0]?.id || '';
  }, [availableClasses, selectedClassId]);

  // Selected Class Info
  const currentClassInfo = useMemo(() => {
    return availableClasses.find(c => c.id === currentClassId);
  }, [availableClasses, currentClassId]);

  // Available Disciplines for current class
  const availableDisciplines = useMemo(() => {
    const disciplinesSet = new Set<string>();
    if (!useDemoData && hasRealData) {
      const classActivities = (data.activities || []).filter(a => a.activity_class_id === currentClassId);
      classActivities.forEach(a => {
        if (a.activity_discipline && a.activity_discipline.trim()) {
          disciplinesSet.add(a.activity_discipline.trim());
        }
      });
      // Also check grades
      (data.grades || []).forEach(g => {
        const student = (data.students || []).find(s => s.entity_id === g.grade_student_id);
        if (student && student.student_class_id === currentClassId) {
          const act = (data.activities || []).find(a => a.entity_id === g.grade_activity_id);
          if (act?.activity_discipline) {
            disciplinesSet.add(act.activity_discipline.trim());
          }
        }
      });
    } else {
      DEMO_ACTIVITIES.forEach(a => disciplinesSet.add(a.discipline));
    }
    return Array.from(disciplinesSet);
  }, [useDemoData, hasRealData, data, currentClassId]);

  // ---------------------------------------------------------------------------
  // 1. Data Calculation: Student Ranking (for Bar Chart and Leaderboard Table)
  // ---------------------------------------------------------------------------
  const studentRankingData = useMemo(() => {
    if (!useDemoData && hasRealData) {
      // Real data mode
      const classStudents = (data.students || []).filter(s => s.student_class_id === currentClassId);
      
      const studentsMap = new Map<string, {
        id: string;
        name: string;
        grades: number[];
        activitiesCount: number;
      }>();

      // Initialize all students in the class
      classStudents.forEach(s => {
        studentsMap.set(s.entity_id, {
          id: s.entity_id,
          name: s.student_name,
          grades: [],
          activitiesCount: 0
        });
      });

      // Populate grades
      (data.grades || []).forEach(g => {
        const entry = studentsMap.get(g.grade_student_id);
        if (!entry) return;

        // Check discipline filter
        if (selectedDiscipline !== 'all') {
          const act = (data.activities || []).find(a => a.entity_id === g.grade_activity_id);
          if (act?.activity_discipline?.trim() !== selectedDiscipline) {
            return;
          }
        }

        const numVal = typeof g.grade_value === 'number' && !isNaN(g.grade_value)
          ? g.grade_value
          : Number(g.grade_value) || 0;

        entry.grades.push(numVal);
        entry.activitiesCount += 1;
      });

      const list = Array.from(studentsMap.values()).map(s => {
        const total = s.grades.reduce((acc, curr) => acc + curr, 0);
        const avg = s.grades.length > 0 ? total / s.grades.length : 0;
        return {
          id: s.id,
          name: s.name,
          shortName: s.name.split(' ').slice(0, 2).join(' '),
          average: Number(avg.toFixed(2)),
          total: Number(total.toFixed(1)),
          activitiesCount: s.activitiesCount,
          status: avg >= 8.0 ? 'excelente' : avg >= 6.0 ? 'bom' : avg >= 4.0 ? 'regular' : 'atencao'
        };
      });

      // Sort according to metric
      return list.sort((a, b) => {
        if (metricType === 'average') {
          return b.average - a.average;
        }
        return b.total - a.total;
      });
    } else {
      // Demo data mode
      const students = DEMO_STUDENTS.filter(s => s.classId === currentClassId);
      const list = students.map(s => {
        // Filter grades if discipline is selected
        let filteredGrades = s.grades;
        if (selectedDiscipline !== 'all') {
          filteredGrades = s.grades.filter((_, idx) => {
            const act = DEMO_ACTIVITIES[idx];
            return act && act.discipline === selectedDiscipline;
          });
        }
        const total = filteredGrades.reduce((a, b) => a + b, 0);
        const avg = filteredGrades.length > 0 ? total / filteredGrades.length : 0;

        return {
          id: s.id,
          name: s.name,
          shortName: s.name.split(' ').slice(0, 2).join(' '),
          average: Number(avg.toFixed(2)),
          total: Number(total.toFixed(1)),
          activitiesCount: filteredGrades.length,
          status: avg >= 8.0 ? 'excelente' : avg >= 6.0 ? 'bom' : avg >= 4.0 ? 'regular' : 'atencao'
        };
      });

      return list.sort((a, b) => {
        if (metricType === 'average') {
          return b.average - a.average;
        }
        return b.total - a.total;
      });
    }
  }, [useDemoData, hasRealData, data, currentClassId, selectedDiscipline, metricType]);

  // Class Summary Metrics
  const classMetrics = useMemo(() => {
    if (studentRankingData.length === 0) {
      return {
        classAverage: 0,
        topStudent: null,
        totalEvaluated: 0,
        passRate: 0
      };
    }

    const evaluatedStudents = studentRankingData.filter(s => s.activitiesCount > 0);
    const totalAvg = evaluatedStudents.reduce((sum, s) => sum + s.average, 0);
    const classAvg = evaluatedStudents.length > 0 ? totalAvg / evaluatedStudents.length : 0;
    const passingCount = evaluatedStudents.filter(s => s.average >= 6.0).length;
    const passRate = evaluatedStudents.length > 0 ? (passingCount / evaluatedStudents.length) * 100 : 0;

    return {
      classAverage: Number(classAvg.toFixed(2)),
      topStudent: studentRankingData[0] || null,
      totalEvaluated: evaluatedStudents.length,
      passRate: Number(passRate.toFixed(1))
    };
  }, [studentRankingData]);

  // ---------------------------------------------------------------------------
  // 2. Data Calculation: Student Progress Over Time (for Line Chart)
  // ---------------------------------------------------------------------------
  const progressTimelineData = useMemo(() => {
    if (!useDemoData && hasRealData) {
      // Find class activities sorted by date
      let classActivities = (data.activities || [])
        .filter(a => a.activity_class_id === currentClassId)
        .sort((a, b) => new Date(a.activity_due_date || a.created_at).getTime() - new Date(b.activity_due_date || b.created_at).getTime());

      if (selectedDiscipline !== 'all') {
        classActivities = classActivities.filter(a => a.activity_discipline?.trim() === selectedDiscipline);
      }

      if (classActivities.length === 0) return [];

      // Top 5 students or focused student
      const topStudents = studentRankingData.slice(0, 5);

      return classActivities.map((act, index) => {
        const point: Record<string, any> = {
          activityId: act.entity_id,
          activityName: act.activity_name,
          shortName: `Ativ. ${index + 1}: ${act.activity_name.length > 15 ? act.activity_name.substring(0, 14) + '...' : act.activity_name}`,
          date: new Date(act.activity_due_date || act.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
        };

        let classSum = 0;
        let classCount = 0;

        // Populate grade for each top student
        topStudents.forEach(st => {
          const grade = (data.grades || []).find(g => g.grade_student_id === st.id && g.grade_activity_id === act.entity_id);
          if (grade) {
            const val = Number(grade.grade_value) || 0;
            point[st.name] = Number(val.toFixed(1));
            classSum += val;
            classCount += 1;
          } else {
            point[st.name] = null;
          }
        });

        // Class average for this activity
        point['Média da Turma'] = classCount > 0 ? Number((classSum / classCount).toFixed(2)) : null;

        return point;
      });
    } else {
      // Demo progression data
      let acts = DEMO_ACTIVITIES;
      if (selectedDiscipline !== 'all') {
        acts = acts.filter(a => a.discipline === selectedDiscipline);
      }

      const topStudents = studentRankingData.slice(0, 4);

      return acts.map((act, index) => {
        const point: Record<string, any> = {
          activityId: act.id,
          activityName: act.name,
          shortName: act.name,
          date: new Date(act.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
        };

        let classSum = 0;
        let classCount = 0;

        topStudents.forEach(st => {
          const original = DEMO_STUDENTS.find(ds => ds.id === st.id);
          const actIndex = DEMO_ACTIVITIES.findIndex(da => da.id === act.id);
          const val = original ? original.grades[actIndex] : 7.0;
          if (val !== undefined) {
            point[st.name] = val;
            classSum += val;
            classCount += 1;
          }
        });

        point['Média da Turma'] = classCount > 0 ? Number((classSum / classCount).toFixed(2)) : 7.0;

        return point;
      });
    }
  }, [useDemoData, hasRealData, data, currentClassId, selectedDiscipline, studentRankingData]);

  // Color generator for chart bars based on score
  const getBarColor = (score: number) => {
    if (metricType === 'average') {
      if (score >= 9.0) return '#4f46e5'; // Indigo escuro / Excelente
      if (score >= 8.0) return '#6f2ef7'; // Roxo da marca
      if (score >= 6.0) return '#059669'; // Verde / Aprovado
      if (score >= 5.0) return '#d97706'; // Âmbar / Regular
      return '#e11d48'; // Rosa-vermelho / Recuperação
    }
    // Total points
    return '#6f2ef7';
  };

  const lineColors = ['#6f2ef7', '#059669', '#2563eb', '#d97706', '#db2777'];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Container Principal */}
      <div className="bg-white dark:bg-[#141026] rounded-3xl p-5 sm:p-7 border border-zinc-200 dark:border-purple-900/40 shadow-sm transition-colors">
        {/* Header do Componente com Controles */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-zinc-100 dark:border-purple-900/30">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-[#6f2ef7] dark:text-purple-300 border border-purple-100 dark:border-purple-900/60">
                <Trophy className="w-5 h-5" />
              </span>
              <div>
                <h2 className="font-display text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 transition-colors">
                  <span>Ranking de Desempenho Escolar por Turma</span>
                  {useDemoData && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
                      Modo Demonstração
                    </span>
                  )}
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 transition-colors">
                  Visualização analítica do progresso dos estudantes com gráficos dinâmicos de barras e linhas
                </p>
              </div>
            </div>
          </div>

          {/* Seletor de Turma, Disciplina e Modos de Gráfico */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Seletor de Turma */}
            <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-[#1c1638] px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-purple-900/50">
              <BookOpen className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
              <select
                aria-label="Selecionar Turma"
                value={currentClassId}
                onChange={e => {
                  setSelectedClassId(e.target.value);
                  setSelectedStudentForFocus(null);
                }}
                className="bg-transparent text-xs font-bold text-zinc-800 dark:text-zinc-200 focus:outline-none cursor-pointer"
              >
                {availableClasses.map(c => (
                  <option key={c.id} value={c.id} className="dark:bg-[#1c1638] dark:text-zinc-200">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro de Disciplina */}
            <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-[#1c1638] px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-purple-900/50">
              <Filter className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
              <select
                aria-label="Filtrar por Disciplina"
                value={selectedDiscipline}
                onChange={e => setSelectedDiscipline(e.target.value)}
                className="bg-transparent text-xs font-semibold text-zinc-800 dark:text-zinc-200 focus:outline-none cursor-pointer"
              >
                <option value="all" className="dark:bg-[#1c1638] dark:text-zinc-200">Todas as Disciplinas</option>
                {availableDisciplines.map(d => (
                  <option key={d} value={d} className="dark:bg-[#1c1638] dark:text-zinc-200">
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Alternância de Tipo de Gráfico: Barras vs. Linhas */}
            <div className="flex items-center p-1 bg-zinc-100 dark:bg-[#1c1638] rounded-xl border border-zinc-200/80 dark:border-purple-900/40">
              <button
                onClick={() => setChartType('bar')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  chartType === 'bar'
                    ? 'bg-white dark:bg-[#2c2057] text-[#6f2ef7] dark:text-purple-200 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
                title="Gráfico de Barras: Ranking Geral da Turma"
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>Barras (Ranking)</span>
              </button>
              <button
                onClick={() => setChartType('line')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  chartType === 'line'
                    ? 'bg-white dark:bg-[#2c2057] text-[#6f2ef7] dark:text-purple-200 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
                title="Gráfico de Linhas: Progresso e Evolução ao Longo do Tempo"
              >
                <LineChartIcon className="w-3.5 h-3.5" />
                <span>Linhas (Evolução)</span>
              </button>
            </div>

            {/* Toggle de Métrica (Média vs. Total) para o gráfico de barras */}
            {chartType === 'bar' && (
              <div className="flex items-center p-1 bg-zinc-100 dark:bg-[#1c1638] rounded-xl border border-zinc-200/80 dark:border-purple-900/40">
                <button
                  onClick={() => setMetricType('average')}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                    metricType === 'average'
                      ? 'bg-white dark:bg-[#2c2057] text-purple-900 dark:text-purple-200 shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  Média (0-10)
                </button>
                <button
                  onClick={() => setMetricType('total')}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                    metricType === 'total'
                      ? 'bg-white dark:bg-[#2c2057] text-purple-900 dark:text-purple-200 shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  Pontos Totais
                </button>
              </div>
            )}

            {/* Botão de Alternância de Demonstração quando não há notas */}
            {!hasRealData && (
              <button
                onClick={() => setUseDemoData(prev => !prev)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                  useDemoData
                    ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-700/60'
                    : 'bg-zinc-50 dark:bg-[#1c1638] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-purple-900/50 hover:bg-zinc-100 dark:hover:bg-purple-950/60'
                }`}
              >
                {useDemoData ? '👁️ Ocultar Exemplo' : '📊 Ver Exemplo'}
              </button>
            )}
          </div>
        </div>

        {/* Métricas Principais da Turma (Cards) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 my-6">
          <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/50">
            <div className="flex items-center justify-between text-purple-900 dark:text-purple-200 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Média da Turma</span>
              <Award className="w-4 h-4 text-[#6f2ef7] dark:text-purple-300" />
            </div>
            <p className="font-display text-2xl sm:text-3xl font-black text-purple-950 dark:text-purple-100">
              {classMetrics.classAverage.toFixed(1)}
            </p>
            <p className="text-[10px] text-purple-700 dark:text-purple-300 mt-0.5">
              Meta curricular: ≥ 6.0
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40">
            <div className="flex items-center justify-between text-amber-900 dark:text-amber-200 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Top 1 da Turma</span>
              <Trophy className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="font-display text-lg sm:text-xl font-black text-amber-950 dark:text-amber-100 truncate" title={classMetrics.topStudent?.name || '—'}>
              {classMetrics.topStudent ? classMetrics.topStudent.name : '—'}
            </p>
            <p className="text-[10px] text-amber-700 dark:text-amber-300 mt-0.5 font-bold">
              {classMetrics.topStudent ? `${classMetrics.topStudent.average.toFixed(1)} pts de média` : 'Nenhum avaliado'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
            <div className="flex items-center justify-between text-emerald-900 dark:text-emerald-200 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Aproveitamento</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="font-display text-2xl sm:text-3xl font-black text-emerald-950 dark:text-emerald-100">
              {classMetrics.passRate.toFixed(0)}%
            </p>
            <p className="text-[10px] text-emerald-700 dark:text-emerald-300 mt-0.5">
              Alunos com nota ≥ 6.0
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
            <div className="flex items-center justify-between text-blue-900 dark:text-blue-200 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Avaliados</span>
              <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="font-display text-2xl sm:text-3xl font-black text-blue-950 dark:text-blue-100">
              {classMetrics.totalEvaluated}
            </p>
            <p className="text-[10px] text-blue-700 dark:text-blue-300 mt-0.5">
              Estudantes com notas
            </p>
          </div>
        </div>

        {/* Área do Gráfico Recharts */}
        <div className="bg-zinc-50/70 dark:bg-[#100c22] rounded-2xl p-4 sm:p-6 border border-zinc-200 dark:border-purple-900/40 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                {chartType === 'bar' ? (
                  <>
                    <BarChart2 className="w-4 h-4 text-[#6f2ef7] dark:text-purple-400" />
                    <span>Ranking dos Alunos • {metricType === 'average' ? 'Média Aritmética' : 'Pontuação Acumulada'}</span>
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4 text-[#6f2ef7] dark:text-purple-400" />
                    <span>Linha do Tempo de Desempenho • Evolução das Atividades</span>
                  </>
                )}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {chartType === 'bar' 
                  ? 'Comparação direta entre todos os alunos avaliados da turma' 
                  : 'Progresso temporal das avaliações e acompanhamento da curva da média da turma'}
              </p>
            </div>

            {/* Legendas de cores */}
            {chartType === 'bar' && metricType === 'average' && (
              <div className="flex flex-wrap items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#4f46e5]" />
                  <span className="text-zinc-600 dark:text-zinc-400">Excelente (≥9.0)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#6f2ef7]" />
                  <span className="text-zinc-600 dark:text-zinc-400">Muito Bom (≥8.0)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#059669]" />
                  <span className="text-zinc-600 dark:text-zinc-400">Aprovado (≥6.0)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#e11d48]" />
                  <span className="text-zinc-600 dark:text-zinc-400">Atenção (&lt;6.0)</span>
                </span>
              </div>
            )}
          </div>

          {/* Gráfico 1: Barras Recharts */}
          {chartType === 'bar' && (
            <div className="w-full h-80 sm:h-96">
              {studentRankingData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6">
                  <GraduationCap className="w-10 h-10 text-zinc-400 dark:text-zinc-600 mb-2" />
                  <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Nenhum aluno com notas registradas nesta turma.</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">Lance notas na aba "Notas" ou clique em "Ver Exemplo" para pré-visualizar o gráfico.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={studentRankingData}
                    margin={{ top: 20, right: 30, left: -10, bottom: 45 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#2b2347' : '#e4e4e7'} vertical={false} />
                    <XAxis
                      dataKey="shortName"
                      tick={{ fill: isDark ? '#a1a1aa' : '#52525b', fontSize: 11, fontWeight: 600 }}
                      interval={0}
                      angle={-30}
                      textAnchor="end"
                      height={50}
                    />
                    <YAxis
                      domain={metricType === 'average' ? [0, 10] : [0, 'auto']}
                      tick={{ fill: isDark ? '#71717a' : '#71717a', fontSize: 11 }}
                      tickCount={6}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload;
                          return (
                            <div className="bg-white dark:bg-[#181330] p-3 rounded-xl shadow-lg border border-zinc-200 dark:border-purple-900/60 text-xs z-50">
                              <p className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">{item.name}</p>
                              <div className="mt-1.5 space-y-1 text-zinc-600 dark:text-zinc-300">
                                <p className="flex justify-between gap-4">
                                  <span>Média das Notas:</span>
                                  <strong className="text-[#6f2ef7] dark:text-purple-300">{item.average.toFixed(2)} pts</strong>
                                </p>
                                <p className="flex justify-between gap-4">
                                  <span>Pontuação Total:</span>
                                  <strong className="dark:text-white">{item.total.toFixed(1)} pts</strong>
                                </p>
                                <p className="flex justify-between gap-4">
                                  <span>Atividades Avaliadas:</span>
                                  <strong className="dark:text-white">{item.activitiesCount}</strong>
                                </p>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    {metricType === 'average' && (
                      <ReferenceLine
                        y={6.0}
                        stroke="#059669"
                        strokeDasharray="4 4"
                        label={{
                          value: 'Meta (6.0)',
                          position: 'insideTopLeft',
                          fill: '#059669',
                          fontSize: 10,
                          fontWeight: 700
                        }}
                      />
                    )}
                    {metricType === 'average' && classMetrics.classAverage > 0 && (
                      <ReferenceLine
                        y={classMetrics.classAverage}
                        stroke="#6f2ef7"
                        strokeDasharray="3 3"
                        label={{
                          value: `Média Turma (${classMetrics.classAverage.toFixed(1)})`,
                          position: 'insideTopRight',
                          fill: '#6f2ef7',
                          fontSize: 10,
                          fontWeight: 700
                        }}
                      />
                    )}
                    <Bar
                      dataKey={metricType === 'average' ? 'average' : 'total'}
                      radius={[6, 6, 0, 0]}
                      maxBarSize={48}
                    >
                      {studentRankingData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={getBarColor(metricType === 'average' ? entry.average : entry.total)}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          )}

          {/* Gráfico 2: Linhas Recharts (Progresso e Evolução) */}
          {chartType === 'line' && (
            <div className="w-full h-80 sm:h-96">
              {progressTimelineData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6">
                  <Calendar className="w-10 h-10 text-zinc-400 dark:text-zinc-600 mb-2" />
                  <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Sem histórico cronológico de atividades para esta turma.</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">Cadastre atividades com datas e notas atribuídas para acompanhar a linha de evolução.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={progressTimelineData}
                    margin={{ top: 20, right: 30, left: -10, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#2b2347' : '#e4e4e7'} vertical={false} />
                    <XAxis
                      dataKey="shortName"
                      tick={{ fill: isDark ? '#a1a1aa' : '#52525b', fontSize: 11, fontWeight: 600 }}
                    />
                    <YAxis
                      domain={[0, 10]}
                      tick={{ fill: isDark ? '#71717a' : '#71717a', fontSize: 11 }}
                      tickCount={6}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white dark:bg-[#181330] p-3 rounded-xl shadow-lg border border-zinc-200 dark:border-purple-900/60 text-xs z-50 min-w-[200px]">
                              <p className="font-bold text-zinc-900 dark:text-zinc-100 border-b border-zinc-100 dark:border-purple-900/40 pb-1 mb-2">
                                {label}
                              </p>
                              <div className="space-y-1">
                                {payload.map((entry, idx) => (
                                  <div key={idx} className="flex items-center justify-between gap-3 text-xs">
                                    <span className="flex items-center gap-1.5">
                                      <span
                                        className="w-2.5 h-2.5 rounded-full"
                                        style={{ backgroundColor: entry.color }}
                                      />
                                      <span className="text-zinc-700 dark:text-zinc-300 truncate max-w-[130px]">
                                        {entry.name}
                                      </span>
                                    </span>
                                    <strong style={{ color: entry.color }}>
                                      {entry.value !== null && entry.value !== undefined ? Number(entry.value).toFixed(1) : '—'}
                                    </strong>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend wrapperStyle={{ paddingTop: 12, fontSize: 11 }} />
                    <ReferenceLine
                      y={6.0}
                      stroke="#059669"
                      strokeDasharray="4 4"
                      label={{ value: 'Meta (6.0)', position: 'insideTopLeft', fill: '#059669', fontSize: 10, fontWeight: 700 }}
                    />
                    {/* Linha da Média da Turma */}
                    <Line
                      type="monotone"
                      dataKey="Média da Turma"
                      stroke="#9333ea"
                      strokeWidth={3}
                      strokeDasharray="5 5"
                      dot={{ r: 4, fill: '#9333ea' }}
                    />
                    {/* Linhas dos Top Alunos */}
                    {studentRankingData.slice(0, 4).map((st, idx) => (
                      <Line
                        key={st.id}
                        type="monotone"
                        dataKey={st.name}
                        stroke={lineColors[idx % lineColors.length]}
                        strokeWidth={selectedStudentForFocus === st.id ? 4 : 2}
                        dot={{ r: selectedStudentForFocus === st.id ? 6 : 4 }}
                        activeDot={{ r: 7 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          )}
        </div>

        {/* Tabela Detalhada de Classificação da Turma */}
        <div className="mt-7">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2 transition-colors">
              <GraduationCap className="w-4 h-4 text-[#6f2ef7] dark:text-purple-400" />
              <span>Quadro de Desempenho e Classificação da Turma</span>
            </h4>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {studentRankingData.length} estudante(s) listado(s)
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-purple-900/40">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50/80 dark:bg-[#181330] text-zinc-700 dark:text-zinc-300 font-bold border-b border-zinc-200 dark:border-purple-900/40 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4 w-14 text-center">Rank</th>
                  <th className="py-3 px-4">Estudante</th>
                  <th className="py-3 px-4 text-center">Atividades</th>
                  <th className="py-3 px-4 text-center">Média (0-10)</th>
                  <th className="py-3 px-4 text-center">Total de Pontos</th>
                  <th className="py-3 px-4">Progresso Curricular</th>
                  <th className="py-3 px-4 text-right">Situação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-purple-950/40">
                {studentRankingData.map((student, idx) => {
                  const rankNumber = idx + 1;
                  const isTop1 = rankNumber === 1;
                  const isTop2 = rankNumber === 2;
                  const isTop3 = rankNumber === 3;

                  return (
                    <tr 
                      key={student.id} 
                      onClick={() => {
                        setSelectedStudentForFocus(prev => prev === student.id ? null : student.id);
                        if (chartType !== 'line') setChartType('line');
                      }}
                      className="hover:bg-purple-50/40 dark:hover:bg-purple-950/30 transition cursor-pointer group"
                      title="Clique para destacar o progresso deste aluno no gráfico de linhas"
                    >
                      {/* Posição no Ranking */}
                      <td className="py-3 px-4 text-center font-bold">
                        {isTop1 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-amber-400 text-amber-950 shadow-xs font-black">
                            🥇
                          </span>
                        ) : isTop2 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 shadow-xs font-black">
                            🥈
                          </span>
                        ) : isTop3 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-amber-700 text-amber-100 shadow-xs font-black">
                            🥉
                          </span>
                        ) : (
                          <span className="text-zinc-500 dark:text-zinc-400 font-semibold">
                            #{rankNumber}
                          </span>
                        )}
                      </td>

                      {/* Nome do Aluno */}
                      <td className="py-3 px-4 font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-[#6f2ef7] dark:group-hover:text-purple-300 transition">
                        {student.name}
                      </td>

                      {/* Quantidade de Atividades */}
                      <td className="py-3 px-4 text-center text-zinc-600 dark:text-zinc-400 font-medium">
                        {student.activitiesCount}
                      </td>

                      {/* Média */}
                      <td className="py-3 px-4 text-center font-black text-sm text-zinc-900 dark:text-zinc-100">
                        {student.average.toFixed(1)}
                      </td>

                      {/* Total */}
                      <td className="py-3 px-4 text-center font-bold text-purple-900 dark:text-purple-300">
                        {student.total.toFixed(1)} pts
                      </td>

                      {/* Barra de Progresso Visual */}
                      <td className="py-3 px-4 w-44">
                        <div className="w-full bg-zinc-200 dark:bg-[#251d45] rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              student.average >= 8.0
                                ? 'bg-gradient-to-r from-purple-500 to-indigo-600'
                                : student.average >= 6.0
                                ? 'bg-emerald-500'
                                : student.average >= 4.0
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(0, student.average * 10))}%` }}
                          />
                        </div>
                      </td>

                      {/* Status / Nível */}
                      <td className="py-3 px-4 text-right">
                        {student.average >= 8.0 ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-purple-100 dark:bg-purple-950/60 text-purple-900 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
                            Excelente
                          </span>
                        ) : student.average >= 6.0 ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                            Aprovado
                          </span>
                        ) : student.average >= 4.0 ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                            Regular
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-100 dark:bg-rose-950/60 text-rose-900 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60">
                            Recuperação
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
