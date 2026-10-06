import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import { Student } from '../../types';
import { useData } from '../../context/DataContext';
import { 
  BarChart3, 
  Award, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  Sparkles,
  BookOpen
} from 'lucide-react';

interface StudentDisciplineComparisonChartProps {
  student: Student;
}

interface DisciplineComparisonData {
  disciplina: string;
  disciplinaCurta: string;
  suaMedia: number;
  mediaTurma: number;
  diferenca: number;
  atividadesAluno: number;
  atividadesTurma: number;
  status: 'above' | 'equal' | 'below' | 'pending';
}

export const StudentDisciplineComparisonChart: React.FC<StudentDisciplineComparisonChartProps> = ({ student }) => {
  const { data } = useData();

  // All students belonging to the same class
  const classStudents = useMemo(() => {
    return data.students.filter(s => s.student_class_id === student.student_class_id);
  }, [data.students, student.student_class_id]);

  const classStudentIds = useMemo(() => {
    return new Set(classStudents.map(s => s.entity_id));
  }, [classStudents]);

  // All activities of this class
  const classActivities = useMemo(() => {
    return data.activities.filter(a => a.activity_class_id === student.student_class_id);
  }, [data.activities, student.student_class_id]);

  // Compute comparison per discipline
  const comparisonData = useMemo<DisciplineComparisonData[]>(() => {
    // Collect all distinct disciplines for this class
    const disciplinesSet = new Set<string>();

    classActivities.forEach(act => {
      if (act.activity_discipline && act.activity_discipline.trim()) {
        disciplinesSet.add(act.activity_discipline.trim());
      }
    });

    // Also check any grades belonging to class students whose activities might be stored
    data.grades.forEach(g => {
      if (classStudentIds.has(g.grade_student_id)) {
        const act = data.activities.find(a => a.entity_id === g.grade_activity_id);
        if (act?.activity_discipline && act.activity_discipline.trim()) {
          disciplinesSet.add(act.activity_discipline.trim());
        }
      }
    });

    // Fallback if none found: check student's own grades
    data.grades.forEach(g => {
      if (g.grade_student_id === student.entity_id) {
        const act = data.activities.find(a => a.entity_id === g.grade_activity_id);
        if (act?.activity_discipline && act.activity_discipline.trim()) {
          disciplinesSet.add(act.activity_discipline.trim());
        }
      }
    });

    const disciplinesList = Array.from(disciplinesSet);

    return disciplinesList.map(discipline => {
      // 1. Student's grades in this discipline
      const studentGradesInDisc = data.grades.filter(g => {
        if (g.grade_student_id !== student.entity_id) return false;
        const act = data.activities.find(a => a.entity_id === g.grade_activity_id);
        return act?.activity_discipline?.trim() === discipline;
      });

      const studentAvg = studentGradesInDisc.length > 0
        ? Number((studentGradesInDisc.reduce((sum, g) => sum + (Number(g.grade_value) || 0), 0) / studentGradesInDisc.length).toFixed(1))
        : 0;

      // 2. Class grades in this discipline
      const classGradesInDisc = (data.grades || []).filter(g => {
        if (!classStudentIds.has(g.grade_student_id)) return false;
        const act = (data.activities || []).find(a => a.entity_id === g.grade_activity_id);
        return act?.activity_discipline?.trim() === discipline;
      });

      const classAvg = classGradesInDisc.length > 0
        ? Number((classGradesInDisc.reduce((sum, g) => sum + (Number(g.grade_value) || 0), 0) / classGradesInDisc.length).toFixed(1))
        : 0;

      const diff = Number((studentAvg - classAvg).toFixed(1));

      let status: 'above' | 'equal' | 'below' | 'pending' = 'equal';
      if (studentGradesInDisc.length === 0) {
        status = 'pending';
      } else if (diff > 0) {
        status = 'above';
      } else if (diff < 0) {
        status = 'below';
      }

      // Short name for small screens
      const disciplinaCurta = discipline.length > 14 ? discipline.slice(0, 12) + '…' : discipline;

      return {
        disciplina: discipline,
        disciplinaCurta,
        suaMedia: studentAvg,
        mediaTurma: classAvg,
        diferenca: diff,
        atividadesAluno: studentGradesInDisc.length,
        atividadesTurma: classGradesInDisc.length,
        status
      };
    });
  }, [data.grades, data.activities, classActivities, classStudentIds, student.entity_id]);

  // General summary statistics
  const summary = useMemo(() => {
    const validData = comparisonData.filter(d => d.atividadesAluno > 0);
    if (validData.length === 0) {
      return {
        melhorDisciplina: null,
        disciplinasAcima: 0,
        mediaGeralAluno: 0,
        mediaGeralTurma: 0,
        diferencaGeral: 0
      };
    }

    const somaAluno = validData.reduce((acc, curr) => acc + curr.suaMedia, 0);
    const somaTurma = validData.reduce((acc, curr) => acc + curr.mediaTurma, 0);
    const mediaGeralAluno = Number((somaAluno / validData.length).toFixed(1));
    const mediaGeralTurma = Number((somaTurma / validData.length).toFixed(1));
    const diferencaGeral = Number((mediaGeralAluno - mediaGeralTurma).toFixed(1));

    const disciplinasAcima = validData.filter(d => d.diferenca > 0).length;

    // Best discipline (highest positive difference or highest grade)
    const sorted = [...validData].sort((a, b) => b.diferenca - a.diferenca || b.suaMedia - a.suaMedia);
    const melhorDisciplina = sorted[0] || null;

    return {
      melhorDisciplina,
      disciplinasAcima,
      totalDisciplinasAvaliadas: validData.length,
      mediaGeralAluno,
      mediaGeralTurma,
      diferencaGeral
    };
  }, [comparisonData]);

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-zinc-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-zinc-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#6f2ef7] flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-zinc-900 leading-tight">
                Comparativo por Disciplina: Você vs. Média da Turma
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Gráfico comparando a sua média individual em cada disciplina com a média dos colegas da turma ({student.student_class_name})
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Meta Institucional: 7.0
          </span>
        </div>
      </div>

      {/* KPI Cards Summary */}
      {comparisonData.length > 0 && summary.melhorDisciplina && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {/* Card 1: Sua Média Geral */}
          <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-100">
            <p className="text-[11px] font-semibold text-purple-900 uppercase tracking-wide">Sua Média Geral</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-[#6f2ef7]">{summary.mediaGeralAluno.toFixed(1)}</span>
              <span className="text-xs text-purple-700 font-medium">pts</span>
            </div>
            <p className="text-[10px] text-purple-700/90 mt-0.5">
              {summary.mediaGeralAluno >= 7.0 ? '✓ Acima da meta escolar' : 'Abaixo da meta institucional'}
            </p>
          </div>

          {/* Card 2: Média Geral da Turma */}
          <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/80">
            <p className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wide">Média da Turma</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-zinc-800">{summary.mediaGeralTurma.toFixed(1)}</span>
              <span className="text-xs text-zinc-500 font-medium">pts</span>
            </div>
            <p className="text-[10px] text-zinc-500 mt-0.5">Média ponderada da sala</p>
          </div>

          {/* Card 3: Saldo vs Turma */}
          <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/80">
            <p className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wide">Comparativo Geral</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className={`text-2xl font-black ${
                summary.diferencaGeral > 0 
                  ? 'text-emerald-600' 
                  : summary.diferencaGeral < 0 
                  ? 'text-amber-600' 
                  : 'text-zinc-700'
              }`}>
                {summary.diferencaGeral > 0 ? `+${summary.diferencaGeral.toFixed(1)}` : summary.diferencaGeral.toFixed(1)}
              </span>
              <span className="text-xs text-zinc-500 font-medium">pts</span>
            </div>
            <p className="text-[10px] text-zinc-500 mt-0.5">
              {summary.diferencaGeral > 0 
                ? '↗ Desempenho superior à turma' 
                : summary.diferencaGeral === 0 
                ? '→ Equivalente à turma' 
                : '↘ Abaixo da média da turma'}
            </p>
          </div>

          {/* Card 4: Disciplina Destaque */}
          <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
            <p className="text-[11px] font-semibold text-emerald-900 uppercase tracking-wide">Maior Destaque</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-base font-black text-emerald-950 truncate block max-w-full">
                {summary.melhorDisciplina.disciplina}
              </span>
            </div>
            <p className="text-[10px] text-emerald-700 font-medium mt-0.5">
              Nota {summary.melhorDisciplina.suaMedia.toFixed(1)} ({summary.melhorDisciplina.diferenca >= 0 ? `+${summary.melhorDisciplina.diferenca.toFixed(1)}` : summary.melhorDisciplina.diferenca.toFixed(1)} vs turma)
            </p>
          </div>
        </div>
      )}

      {/* Chart Canvas Area */}
      {comparisonData.length > 0 ? (
        <div className="w-full">
          <div className="w-full h-72 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={comparisonData}
                margin={{ top: 20, right: 20, left: -10, bottom: 20 }}
                barGap={8}
                barCategoryGap="25%"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                
                <XAxis 
                  dataKey="disciplina" 
                  tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                  dy={10}
                />
                
                <YAxis 
                  domain={[0, 10]} 
                  ticks={[0, 2, 4, 6, 7, 8, 10]}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />

                {/* Minimum standard pass reference line */}
                <ReferenceLine 
                  y={7.0} 
                  stroke="#10b981" 
                  strokeDasharray="4 4" 
                  strokeWidth={1.5}
                />

                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload as DisciplineComparisonData;
                      const isSuperior = item.diferenca > 0;
                      const isIgual = item.diferenca === 0;

                      return (
                        <div className="bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-xl border border-purple-100 text-xs text-zinc-800 min-w-[240px] animate-scale-in">
                          <div className="flex items-center justify-between gap-2 border-b border-zinc-100 pb-2 mb-2">
                            <span className="font-bold text-zinc-900 text-sm flex items-center gap-1.5">
                              <BookOpen className="w-3.5 h-3.5 text-[#6f2ef7]" />
                              {item.disciplina}
                            </span>
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                              item.status === 'pending'
                                ? 'bg-zinc-100 text-zinc-600'
                                : isSuperior 
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                                : isIgual
                                ? 'bg-zinc-100 text-zinc-700'
                                : 'bg-rose-50 text-rose-800 border border-rose-200'
                            }`}>
                              {item.status === 'pending'
                                ? 'Pendente'
                                : isSuperior 
                                ? `+${item.diferenca.toFixed(1)} pts` 
                                : `${item.diferenca.toFixed(1)} pts`}
                            </span>
                          </div>

                          <div className="space-y-2 mb-3">
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1.5 text-zinc-600">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#6f2ef7]" />
                                Sua Média:
                              </span>
                              <span className="font-black text-sm text-[#6f2ef7]">
                                {item.atividadesAluno > 0 ? `${item.suaMedia.toFixed(1)} pts` : 'Sem nota'}
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1.5 text-zinc-600">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#94a3b8]" />
                                Média da Turma:
                              </span>
                              <span className="font-bold text-sm text-zinc-700">
                                {item.mediaTurma.toFixed(1)} pts
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1 border-t border-zinc-100">
                              <span>Meta Mínima:</span>
                              <span className="font-semibold text-emerald-700">7.0 pts</span>
                            </div>
                          </div>

                          <div className="p-2 rounded-lg bg-zinc-50 border border-zinc-100 text-[11px] text-zinc-600">
                            {item.status === 'pending' ? (
                              <span>Você ainda não possui avaliações concluídas nesta matéria.</span>
                            ) : isSuperior ? (
                              <span className="text-emerald-800 font-semibold flex items-center gap-1">
                                <TrendingUp className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                                Parabéns! Sua média está {item.diferenca.toFixed(1)} pts acima da turma.
                              </span>
                            ) : isIgual ? (
                              <span className="text-zinc-700 flex items-center gap-1">
                                <Minus className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                                Sua média está exatamente empatada com a média da turma.
                              </span>
                            ) : (
                              <span className="text-amber-800 font-semibold flex items-center gap-1">
                                <TrendingDown className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                                Você está {Math.abs(item.diferenca).toFixed(1)} pts abaixo da média da turma.
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />

                <Legend 
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ paddingBottom: 12, fontSize: 12, fontWeight: 500 }}
                  formatter={(value) => {
                    return <span className="text-xs font-semibold text-zinc-700 ml-1 mr-3">{value}</span>;
                  }}
                />

                {/* Student's Average Bar */}
                <Bar 
                  dataKey="suaMedia" 
                  name="Sua Média" 
                  fill="#6f2ef7" 
                  radius={[6, 6, 0, 0]} 
                  maxBarSize={44}
                />

                {/* Class Average Bar */}
                <Bar 
                  dataKey="mediaTurma" 
                  name="Média da Turma" 
                  fill="#94a3b8" 
                  radius={[6, 6, 0, 0]} 
                  maxBarSize={44}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Breakdown cards per discipline */}
          <div className="mt-6 pt-5 border-t border-zinc-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#6f2ef7]" />
              <span>Detalhamento Comparativo por Disciplina</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {comparisonData.map(item => {
                const diff = item.diferenca;
                const isAbove = diff > 0;
                const isBelow = diff < 0;

                return (
                  <div
                    key={item.disciplina}
                    className="p-3.5 rounded-xl border border-zinc-200 hover:border-purple-200 bg-zinc-50/50 hover:bg-purple-50/20 transition flex flex-col justify-between gap-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h5 className="font-bold text-sm text-zinc-900">{item.disciplina}</h5>
                        <p className="text-[11px] text-zinc-500 mt-0.5">
                          {item.atividadesAluno} avaliações do aluno • {item.atividadesTurma} na turma
                        </p>
                      </div>

                      <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                        item.status === 'pending'
                          ? 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                          : isAbove
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : isBelow
                          ? 'bg-amber-50 text-amber-900 border border-amber-200'
                          : 'bg-zinc-100 text-zinc-700 border border-zinc-200'
                      }`}>
                        {item.status === 'pending' ? (
                          'Aguardando nota'
                        ) : isAbove ? (
                          <>
                            <TrendingUp className="w-3 h-3 text-emerald-600" />
                            <span>+{diff.toFixed(1)} pts</span>
                          </>
                        ) : isBelow ? (
                          <>
                            <TrendingDown className="w-3 h-3 text-amber-600" />
                            <span>{diff.toFixed(1)} pts</span>
                          </>
                        ) : (
                          <>
                            <Minus className="w-3 h-3 text-zinc-500" />
                            <span>Empatado</span>
                          </>
                        )}
                      </span>
                    </div>

                    {/* Progress meters */}
                    <div className="space-y-2">
                      {/* Student row */}
                      <div>
                        <div className="flex justify-between text-[11px] font-semibold text-zinc-600 mb-1">
                          <span className="flex items-center gap-1 text-[#6f2ef7]">
                            <span className="w-2 h-2 rounded-full bg-[#6f2ef7]" />
                            Você:
                          </span>
                          <span className="font-extrabold text-[#6f2ef7]">
                            {item.atividadesAluno > 0 ? `${item.suaMedia.toFixed(1)} / 10` : '—'}
                          </span>
                        </div>
                        <div className="w-full bg-zinc-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-[#6f2ef7] to-[#8d47fa] h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.max(0, item.suaMedia * 10))}%` }}
                          />
                        </div>
                      </div>

                      {/* Class row */}
                      <div>
                        <div className="flex justify-between text-[11px] font-semibold text-zinc-600 mb-1">
                          <span className="flex items-center gap-1 text-zinc-500">
                            <span className="w-2 h-2 rounded-full bg-slate-400" />
                            Média da Turma:
                          </span>
                          <span className="font-bold text-zinc-700">
                            {item.mediaTurma.toFixed(1)} / 10
                          </span>
                        </div>
                        <div className="w-full bg-zinc-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-slate-400 h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.max(0, item.mediaTurma * 10))}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 px-4">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto mb-3">
            <BarChart3 className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-sm text-zinc-800">Nenhuma disciplina avaliada no momento</h4>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1">
            Assim que as atividades forem cadastradas e corrigidas pelos professores, o comparativo das suas médias com a turma será exibido aqui.
          </p>
        </div>
      )}
    </div>
  );
};
