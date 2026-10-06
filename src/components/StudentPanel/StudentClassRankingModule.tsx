import React, { useState, useMemo, useRef } from 'react';
import { 
  Trophy, 
  Award, 
  Medal, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Users, 
  Target, 
  Sparkles, 
  BookOpen, 
  Filter, 
  ArrowUpRight, 
  ArrowDownRight, 
  Crown,
  Search,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Student, Grade, Activity } from '../../types';
import { useData } from '../../context/DataContext';

interface StudentClassRankingModuleProps {
  student: Student;
  onNavigateToActivities?: () => void;
}

export interface StudentRankingItem {
  id: string;
  name: string;
  matricula: string;
  totalScore: number;
  evaluatedCount: number;
  average: number;
  isCurrentUser: boolean;
  rank: number;
  highestGrade: number;
  lowestGrade: number;
  differenceFromClassAvg: number;
}

export const StudentClassRankingModule: React.FC<StudentClassRankingModuleProps> = ({ 
  student,
  onNavigateToActivities 
}) => {
  const { data } = useData();
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [viewFilter, setViewFilter] = useState<'all' | 'top5' | 'nearMe'>('all');
  const myRowRef = useRef<HTMLDivElement | null>(null);

  // 1. Identify all class students and class activities
  const classStudents = useMemo(() => {
    return (data.students || []).filter(s => s.student_class_id === student.student_class_id);
  }, [data.students, student.student_class_id]);

  const classActivities = useMemo(() => {
    return (data.activities || []).filter(a => a.activity_class_id === student.student_class_id);
  }, [data.activities, student.student_class_id]);

  // 2. Extract available disciplines for filtering
  const availableDisciplines = useMemo(() => {
    const set = new Set<string>();
    classActivities.forEach(a => {
      if (a.activity_discipline && a.activity_discipline.trim()) {
        set.add(a.activity_discipline.trim());
      }
    });
    return Array.from(set).sort();
  }, [classActivities]);

  // 3. Filter activities by selected discipline
  const filteredActivities = useMemo(() => {
    if (selectedDiscipline === 'all') return classActivities;
    return classActivities.filter(a => 
      a.activity_discipline && a.activity_discipline.toLowerCase() === selectedDiscipline.toLowerCase()
    );
  }, [classActivities, selectedDiscipline]);

  const filteredActivityIds = useMemo(() => {
    return new Set(filteredActivities.map(a => a.entity_id));
  }, [filteredActivities]);

  // 4. Calculate student metrics based strictly on Grade Average (Média das Notas)
  const rankingList = useMemo<StudentRankingItem[]>(() => {
    const items: Omit<StudentRankingItem, 'rank' | 'differenceFromClassAvg'>[] = [];

    classStudents.forEach(st => {
      // Find all valid grades for this student within filtered activities
      const stGrades = (data.grades || []).filter(g => {
        if (g.grade_student_id !== st.entity_id) return false;
        if (!filteredActivityIds.has(g.grade_activity_id)) return false;
        const val = Number(g.grade_value);
        return !isNaN(val) && val >= 0;
      });

      const evaluatedCount = stGrades.length;
      let totalScore = 0;
      let highest = 0;
      let lowest = 10;

      if (evaluatedCount > 0) {
        stGrades.forEach(g => {
          const val = Number(g.grade_value) || 0;
          totalScore += val;
          if (val > highest) highest = val;
          if (val < lowest) lowest = val;
        });
      } else {
        lowest = 0;
      }

      const average = evaluatedCount > 0 ? totalScore / evaluatedCount : 0;

      items.push({
        id: st.entity_id,
        name: st.student_name,
        matricula: st.student_matricula,
        totalScore,
        evaluatedCount,
        average,
        isCurrentUser: st.entity_id === student.entity_id,
        highestGrade: evaluatedCount > 0 ? highest : 0,
        lowestGrade: evaluatedCount > 0 ? lowest : 0
      });
    });

    // Sort priority:
    // 1. Has evaluated grades first
    // 2. Higher Average (Média) descending
    // 3. Tie-breaker: More evaluated activities descending
    // 4. Tie-breaker: Higher total score descending
    // 5. Alphabetical by student name
    items.sort((a, b) => {
      if (a.evaluatedCount > 0 && b.evaluatedCount === 0) return -1;
      if (a.evaluatedCount === 0 && b.evaluatedCount > 0) return 1;
      if (Math.abs(b.average - a.average) > 0.001) {
        return b.average - a.average;
      }
      if (b.evaluatedCount !== a.evaluatedCount) {
        return b.evaluatedCount - a.evaluatedCount;
      }
      if (Math.abs(b.totalScore - a.totalScore) > 0.001) {
        return b.totalScore - a.totalScore;
      }
      return a.name.localeCompare(b.name);
    });

    // Calculate overall class average for evaluated students
    const evaluatedStudents = items.filter(s => s.evaluatedCount > 0);
    const classAvg = evaluatedStudents.length > 0
      ? evaluatedStudents.reduce((sum, s) => sum + s.average, 0) / evaluatedStudents.length
      : 0;

    // Assign final rank numbers and calculate difference from class average
    return items.map((item, index) => ({
      ...item,
      rank: index + 1,
      differenceFromClassAvg: item.evaluatedCount > 0 ? item.average - classAvg : 0
    }));
  }, [classStudents, data.grades, filteredActivityIds, student.entity_id]);

  // 5. Compute class summary metrics
  const evaluatedRanking = useMemo(() => {
    return rankingList.filter(s => s.evaluatedCount > 0);
  }, [rankingList]);

  const classOverallAverage = useMemo(() => {
    if (evaluatedRanking.length === 0) return 0;
    const sum = evaluatedRanking.reduce((acc, s) => acc + s.average, 0);
    return sum / evaluatedRanking.length;
  }, [evaluatedRanking]);

  const classHighestAverage = useMemo(() => {
    if (evaluatedRanking.length === 0) return 0;
    return Math.max(...evaluatedRanking.map(s => s.average));
  }, [evaluatedRanking]);

  const classLowestAverage = useMemo(() => {
    if (evaluatedRanking.length === 0) return 0;
    return Math.min(...evaluatedRanking.map(s => s.average));
  }, [evaluatedRanking]);

  // 6. Current logged in student ranking details
  const myRankingItem = useMemo(() => {
    return rankingList.find(s => s.isCurrentUser);
  }, [rankingList]);

  const myRank = myRankingItem ? myRankingItem.rank : null;
  const myAverage = myRankingItem ? myRankingItem.average : 0;
  const myHasGrades = (myRankingItem?.evaluatedCount || 0) > 0;
  const myDiffFromClass = myRankingItem ? myRankingItem.differenceFromClassAvg : 0;

  // Next student directly above the current user (if not in 1st place)
  const studentAboveMe = useMemo(() => {
    if (!myRank || myRank <= 1) return null;
    return rankingList[myRank - 2] || null;
  }, [myRank, rankingList]);

  const pointsToCatchNext = useMemo(() => {
    if (!studentAboveMe || !myRankingItem) return null;
    const diff = studentAboveMe.average - myRankingItem.average;
    return diff > 0 ? diff : 0.1;
  }, [studentAboveMe, myRankingItem]);

  // Percentile calculation
  const percentileText = useMemo(() => {
    if (!myHasGrades || !myRank || evaluatedRanking.length === 0) return null;
    const total = evaluatedRanking.length;
    const betterThanCount = total - myRank;
    const pct = Math.round((betterThanCount / total) * 100);

    if (myRank === 1) return '🥇 1º Lugar Absoluto da Turma!';
    if (myRank <= 3) return `🏆 Pódio da Turma (Top ${Math.round((myRank / total) * 100)}%)`;
    if (pct >= 50) return `⭐ Desempenho superior a ${pct}% dos colegas`;
    return `📈 Em constante evolução acadêmica`;
  }, [myHasGrades, myRank, evaluatedRanking]);

  // Top 3 Podium
  const podium = useMemo(() => {
    const first = evaluatedRanking[0] || null;
    const second = evaluatedRanking[1] || null;
    const third = evaluatedRanking[2] || null;
    return { first, second, third };
  }, [evaluatedRanking]);

  // Filtered rows for the list view
  const displayedRankingList = useMemo(() => {
    let list = rankingList;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(s => 
        s.name.toLowerCase().includes(term) || 
        s.matricula.toLowerCase().includes(term)
      );
    }

    if (viewFilter === 'top5') {
      list = list.slice(0, 5);
    } else if (viewFilter === 'nearMe' && myRank) {
      const startIndex = Math.max(0, myRank - 3);
      const endIndex = Math.min(list.length, myRank + 2);
      list = list.slice(startIndex, endIndex);
    }

    return list;
  }, [rankingList, searchTerm, viewFilter, myRank]);

  // Function to smoothly scroll to student's own row
  const handleScrollToMyPosition = () => {
    setViewFilter('all');
    setSearchTerm('');
    setTimeout(() => {
      if (myRowRef.current) {
        myRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  return (
    <div id="student-class-ranking-module" className="space-y-6 animate-fade-in">
      {/* Module Header & Disciplines Filter */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-7 shadow-xs border border-zinc-200 dark:border-zinc-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-zinc-100 dark:border-zinc-800">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-200/70 dark:border-indigo-800">
              <Trophy className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Desempenho Acadêmico Comparativo</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>Ranking de Desempenho por Média</span>
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
              Classificação oficial dos alunos da turma <strong className="text-zinc-800 dark:text-zinc-200">{student.student_class_name}</strong> calculada a partir da média ponderada de todas as notas avaliadas.
            </p>
          </div>

          {/* Quick Jump Button to User Position */}
          {myHasGrades && (
            <button
              onClick={handleScrollToMyPosition}
              className="self-start lg:self-auto flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition active:scale-98"
            >
              <Target className="w-4 h-4" />
              <span>Ver Minha Posição (#{myRank})</span>
            </button>
          )}
        </div>

        {/* Discipline Filters */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            Filtrar:
          </span>

          <button
            onClick={() => setSelectedDiscipline('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              selectedDiscipline === 'all'
                ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xs'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            Geral (Todas as Disciplinas)
          </button>

          {availableDisciplines.map(disc => (
            <button
              key={disc}
              onClick={() => setSelectedDiscipline(disc)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedDiscipline.toLowerCase() === disc.toLowerCase()
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              {disc}
            </button>
          ))}
        </div>
      </div>

      {/* HERO SECTION: HIGHLIGHT OF CURRENT STUDENT'S POSITION & COMPARISON */}
      <div className="bg-gradient-to-br from-indigo-900 via-[#312e81] to-[#1e1b4b] rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-950/20 border border-indigo-700/40 relative overflow-hidden">
        {/* Background glow circle */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-72 h-72 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Main Standing Display (col 12 to 7) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-extrabold uppercase tracking-wider backdrop-blur-xs border border-white/20">
                Sua Situação na Turma
              </span>
              {percentileText && (
                <span className="px-3 py-1 rounded-full bg-amber-400/25 text-amber-200 text-xs font-bold border border-amber-300/30 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  {percentileText}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-baseline gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center font-black shadow-lg border ${
                  myRank === 1
                    ? 'bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950 border-amber-200 shadow-amber-500/30'
                    : myRank === 2
                    ? 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-900 border-slate-100 shadow-slate-400/20'
                    : myRank === 3
                    ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-amber-50 border-amber-400 shadow-amber-700/20'
                    : 'bg-white/15 text-white border-white/25 backdrop-blur-md'
                }`}>
                  {myRank === 1 ? (
                    <Crown className="w-9 h-9 sm:w-11 sm:h-11 drop-shadow-xs" />
                  ) : myRank === 2 || myRank === 3 ? (
                    <Medal className="w-9 h-9 sm:w-11 sm:h-11 drop-shadow-xs" />
                  ) : (
                    <span className="text-2xl sm:text-3xl font-black">{myRank ? `#${myRank}` : '—'}</span>
                  )}
                </div>

                <div>
                  <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {myRank ? (
                      <>
                        {myRank}º Lugar <span className="text-indigo-200 text-lg sm:text-xl font-medium">na Turma</span>
                      </>
                    ) : (
                      'Sem notas avaliadas'
                    )}
                  </h3>
                  <p className="text-xs sm:text-sm text-indigo-200">
                    {student.student_name} • Matrícula {student.student_matricula}
                  </p>
                </div>
              </div>
            </div>

            {/* Motivational insight banner */}
            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-xs text-indigo-100 flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-amber-300 flex-shrink-0 mt-0.5" />
              <div>
                {myRank === 1 ? (
                  <p>
                    <strong>Sensacional!</strong> Você é o aluno com a maior média da turma nesta seleção. Mantenha a dedicação para consolidar sua liderança acadêmica.
                  </p>
                ) : studentAboveMe && pointsToCatchNext !== null ? (
                  <p>
                    Você está a apenas <strong>{pointsToCatchNext.toFixed(1)} pontos de média</strong> de ultrapassar o {myRank! - 1}º colocado ({studentAboveMe.name.split(' ')[0]}). Cada atividade entregue com nota alta faz a diferença!
                  </p>
                ) : myHasGrades ? (
                  <p>
                    Continue realizando as atividades e acompanhando as correções dos professores para elevar cada vez mais sua nota média.
                  </p>
                ) : (
                  <p>
                    Você ainda não possui notas lançadas nesta matéria. Realize as atividades pendentes para ingressar no ranking da turma!
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Quick Metrics Breakdown (col 12 to 5) */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-3 sm:gap-4">
            {/* Student Average */}
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
              <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-200">Sua Média</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl sm:text-4xl font-black text-white">{myHasGrades ? myAverage.toFixed(1) : '—'}</span>
                <span className="text-xs text-indigo-300">/ 10.0</span>
              </div>
              <p className="text-[11px] text-indigo-200 mt-1">
                {myRankingItem?.evaluatedCount || 0} avaliações computadas
              </p>
            </div>

            {/* Difference to Class Average */}
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
              <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-200">Vs. Média da Turma</p>
              <div className="flex items-center gap-1.5 mt-1">
                {myDiffFromClass > 0 ? (
                  <>
                    <TrendingUp className="w-6 h-6 text-emerald-300 flex-shrink-0" />
                    <span className="text-2xl sm:text-3xl font-black text-emerald-300">
                      +{myDiffFromClass.toFixed(1)}
                    </span>
                  </>
                ) : myDiffFromClass < 0 ? (
                  <>
                    <TrendingDown className="w-6 h-6 text-rose-300 flex-shrink-0" />
                    <span className="text-2xl sm:text-3xl font-black text-rose-300">
                      {myDiffFromClass.toFixed(1)}
                    </span>
                  </>
                ) : (
                  <>
                    <Minus className="w-6 h-6 text-indigo-200 flex-shrink-0" />
                    <span className="text-2xl sm:text-3xl font-black text-white">0.0</span>
                  </>
                )}
              </div>
              <p className="text-[11px] text-indigo-200 mt-1">
                {myDiffFromClass > 0 ? 'Acima da média geral' : myDiffFromClass < 0 ? 'Abaixo da média geral' : 'Igual à média geral'}
              </p>
            </div>

            {/* Class General Average */}
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
              <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-200">Média da Turma</p>
              <p className="text-2xl sm:text-3xl font-black text-white mt-1">
                {evaluatedRanking.length > 0 ? classOverallAverage.toFixed(1) : '—'}
              </p>
              <p className="text-[11px] text-indigo-200 mt-1">
                {evaluatedRanking.length} alunos com notas
              </p>
            </div>

            {/* Highest Average */}
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
              <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-200">Maior Média</p>
              <p className="text-2xl sm:text-3xl font-black text-amber-300 mt-1">
                {evaluatedRanking.length > 0 ? classHighestAverage.toFixed(1) : '—'}
              </p>
              <p className="text-[11px] text-indigo-200 mt-1">
                Topo da turma
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* TOP 3 PODIUM (PÓDIO DOS CAMPEÕES) */}
      {evaluatedRanking.length >= 3 && (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-7 shadow-xs border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <h3 className="font-black text-base text-zinc-900 dark:text-white">
                Pódio dos Três Primeiros Colocados
              </h3>
            </div>
            <span className="text-xs font-semibold text-zinc-400">
              Baseado na Média Geral
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end max-w-4xl mx-auto pt-4 pb-2">
            {/* 2nd Place (Silver) */}
            {podium.second && (
              <div className={`order-2 md:order-1 rounded-2xl p-5 border text-center transition flex flex-col items-center justify-between ${
                podium.second.isCurrentUser
                  ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-400 ring-2 ring-indigo-500/20 shadow-md'
                  : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700'
              }`}>
                <div className="space-y-2">
                  <div className="w-12 h-12 mx-auto rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 flex items-center justify-center font-black text-lg shadow-inner">
                    🥈 2º
                  </div>
                  <h4 className="font-extrabold text-sm text-zinc-900 dark:text-white line-clamp-1">
                    {podium.second.name}
                  </h4>
                  {podium.second.isCurrentUser && (
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold">
                      Você!
                    </span>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-200/70 dark:border-zinc-700/70 w-full space-y-1">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Média das Notas</p>
                  <p className="text-2xl font-black text-zinc-900 dark:text-white">
                    {podium.second.average.toFixed(1)}
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    {podium.second.evaluatedCount} atividade(s)
                  </p>
                </div>
              </div>
            )}

            {/* 1st Place (Gold) - Elevated */}
            {podium.first && (
              <div className={`order-1 md:order-2 rounded-2xl p-6 border text-center transition flex flex-col items-center justify-between relative shadow-lg ${
                podium.first.isCurrentUser
                  ? 'bg-gradient-to-b from-amber-50 to-white dark:from-amber-950/40 dark:to-zinc-900 border-amber-300 dark:border-amber-700 ring-4 ring-amber-400/25'
                  : 'bg-gradient-to-b from-amber-50/60 to-white dark:from-amber-950/20 dark:to-zinc-900 border-amber-200 dark:border-amber-800'
              }`}>
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-amber-500 text-white font-extrabold text-[10px] uppercase tracking-wider shadow-sm flex items-center gap-1">
                  <Crown className="w-3 h-3" /> Campeão
                </div>

                <div className="space-y-2 mt-1">
                  <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950 flex items-center justify-center font-black text-2xl shadow-md">
                    🥇 1º
                  </div>
                  <h4 className="font-black text-base text-zinc-900 dark:text-white line-clamp-1">
                    {podium.first.name}
                  </h4>
                  {podium.first.isCurrentUser && (
                    <span className="inline-block px-3 py-1 rounded-full bg-indigo-600 text-white text-[11px] font-black shadow-xs">
                      É Você! 🎉
                    </span>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-amber-200 dark:border-amber-900/50 w-full space-y-1">
                  <p className="text-xs text-amber-700 dark:text-amber-300 font-semibold">Maior Média da Turma</p>
                  <p className="text-3xl font-black text-amber-600 dark:text-amber-400">
                    {podium.first.average.toFixed(1)}
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    {podium.first.evaluatedCount} atividade(s) avaliada(s)
                  </p>
                </div>
              </div>
            )}

            {/* 3rd Place (Bronze) */}
            {podium.third && (
              <div className={`order-3 rounded-2xl p-5 border text-center transition flex flex-col items-center justify-between ${
                podium.third.isCurrentUser
                  ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-400 ring-2 ring-indigo-500/20 shadow-md'
                  : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700'
              }`}>
                <div className="space-y-2">
                  <div className="w-12 h-12 mx-auto rounded-full bg-amber-800/20 text-amber-800 dark:text-amber-300 flex items-center justify-center font-black text-lg shadow-inner">
                    🥉 3º
                  </div>
                  <h4 className="font-extrabold text-sm text-zinc-900 dark:text-white line-clamp-1">
                    {podium.third.name}
                  </h4>
                  {podium.third.isCurrentUser && (
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold">
                      Você!
                    </span>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-200/70 dark:border-zinc-700/70 w-full space-y-1">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Média das Notas</p>
                  <p className="text-2xl font-black text-zinc-900 dark:text-white">
                    {podium.third.average.toFixed(1)}
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    {podium.third.evaluatedCount} atividade(s)
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FULL CLASS RANKING TABLE & CONTROLS */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-7 shadow-xs border border-zinc-200 dark:border-zinc-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h3 className="font-black text-base text-zinc-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Quadro Geral de Classificação da Turma</span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {rankingList.length} aluno(s) matriculado(s) • {evaluatedRanking.length} com notas avaliadas
            </p>
          </div>

          {/* Search and Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar colega..."
                className="pl-8 pr-3 py-1.5 rounded-xl text-xs bg-zinc-100 dark:bg-zinc-800 border-none text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:ring-2 focus:ring-indigo-500 outline-none w-36 sm:w-44"
              />
            </div>

            <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-xl p-1 text-xs">
              <button
                onClick={() => setViewFilter('all')}
                className={`px-3 py-1 rounded-lg font-bold transition ${
                  viewFilter === 'all'
                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setViewFilter('top5')}
                className={`px-3 py-1 rounded-lg font-bold transition ${
                  viewFilter === 'top5'
                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                Top 5
              </button>
              {myRank && (
                <button
                  onClick={() => setViewFilter('nearMe')}
                  className={`px-3 py-1 rounded-lg font-bold transition ${
                    viewFilter === 'nearMe'
                      ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  Perto de Mim
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Ranking List Table */}
        <div className="space-y-2.5">
          {displayedRankingList.length > 0 ? (
            displayedRankingList.map((item) => {
              const hasGrades = item.evaluatedCount > 0;
              const isMe = item.isCurrentUser;
              const percentScore = Math.min(100, Math.max(0, (item.average / 10) * 100));

              // Semantic color for progress bar and badges
              const getGradeColor = (avg: number) => {
                if (avg >= 9.0) return 'bg-emerald-500 text-emerald-800 bg-emerald-50 border-emerald-200';
                if (avg >= 7.0) return 'bg-indigo-500 text-indigo-800 bg-indigo-50 border-indigo-200';
                if (avg >= 5.0) return 'bg-amber-500 text-amber-900 bg-amber-50 border-amber-200';
                return 'bg-rose-500 text-rose-800 bg-rose-50 border-rose-200';
              };

              return (
                <div
                  key={item.id}
                  ref={isMe ? myRowRef : undefined}
                  className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isMe
                      ? 'bg-indigo-50/90 dark:bg-indigo-950/50 border-indigo-400 dark:border-indigo-600 ring-2 ring-indigo-500/30 shadow-md font-medium'
                      : 'bg-zinc-50/60 dark:bg-zinc-800/40 border-zinc-200/80 dark:border-zinc-800 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/70'
                  }`}
                >
                  {/* Left: Position & Student Name */}
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-black text-xs sm:text-sm flex-shrink-0 shadow-xs ${
                      item.rank === 1
                        ? 'bg-amber-400 text-amber-950 font-black ring-2 ring-amber-300'
                        : item.rank === 2
                        ? 'bg-slate-300 text-slate-900 font-black'
                        : item.rank === 3
                        ? 'bg-amber-700 text-white font-black'
                        : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700'
                    }`}>
                      #{item.rank}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-bold text-sm truncate ${
                          isMe 
                            ? 'text-indigo-950 dark:text-indigo-200 font-extrabold' 
                            : 'text-zinc-900 dark:text-white'
                        }`}>
                          {item.name}
                        </span>

                        {isMe && (
                          <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-black tracking-wide shadow-xs">
                            VOCÊ
                          </span>
                        )}

                        {item.rank === 1 && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-900/50 dark:text-amber-200 text-[10px] font-bold">
                            👑 1º Lugar
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Matrícula: {item.matricula} • {item.evaluatedCount} nota(s) registrada(s)
                      </p>
                    </div>
                  </div>

                  {/* Middle & Right: Average Bar & Value */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-200/60 dark:border-zinc-800">
                    {/* Visual Progress Bar (Hidden on ultra-small mobile, shown on sm+) */}
                    <div className="hidden md:flex flex-col gap-1 w-32 lg:w-44">
                      <div className="flex justify-between text-[10px] font-semibold text-zinc-400">
                        <span>Desempenho</span>
                        <span>{hasGrades ? `${percentScore.toFixed(0)}%` : '0%'}</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            item.average >= 9.0
                              ? 'bg-emerald-500'
                              : item.average >= 7.0
                              ? 'bg-indigo-600'
                              : item.average >= 5.0
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${percentScore}%` }}
                        />
                      </div>
                    </div>

                    {/* Comparison badge vs Class Avg */}
                    <div className="flex flex-col items-end">
                      <div className="flex items-baseline gap-1">
                        <span className={`font-black text-xl sm:text-2xl ${
                          isMe
                            ? 'text-indigo-700 dark:text-indigo-400'
                            : 'text-zinc-900 dark:text-white'
                        }`}>
                          {hasGrades ? item.average.toFixed(1) : '—'}
                        </span>
                        <span className="text-[11px] font-semibold text-zinc-400">média</span>
                      </div>

                      {hasGrades ? (
                        <div className="flex items-center gap-1 text-[11px] font-semibold">
                          {item.differenceFromClassAvg > 0 ? (
                            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                              <ArrowUpRight className="w-3 h-3" />
                              +{item.differenceFromClassAvg.toFixed(1)} vs turma
                            </span>
                          ) : item.differenceFromClassAvg < 0 ? (
                            <span className="text-rose-600 dark:text-rose-400 flex items-center gap-0.5">
                              <ArrowDownRight className="w-3 h-3" />
                              {item.differenceFromClassAvg.toFixed(1)} vs turma
                            </span>
                          ) : (
                            <span className="text-zinc-400">
                              = média da turma
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-zinc-400 italic">Pendente</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
              <Users className="w-8 h-8 mx-auto text-zinc-400 mb-2 opacity-60" />
              <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                Nenhum aluno encontrado para este filtro.
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                Tente limpar a pesquisa ou selecionar "Todas as Disciplinas".
              </p>
            </div>
          )}
        </div>

        {/* Footer info and methodology note */}
        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
            <span>
              <strong>Critério Oficial:</strong> Ranking ordenado estritamente pela média aritmética das avaliações concluídas do aluno.
            </span>
          </div>

          {onNavigateToActivities && (
            <button
              onClick={onNavigateToActivities}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 self-start sm:self-auto"
            >
              <span>Ver Minhas Atividades Avaliadas</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
