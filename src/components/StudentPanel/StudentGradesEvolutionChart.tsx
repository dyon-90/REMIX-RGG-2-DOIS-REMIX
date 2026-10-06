import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ReferenceLine,
  Legend
} from 'recharts';
import { Grade, Activity, Student } from '../../types';
import { TrendingUp, Award, Target, Calendar, CheckCircle2, AlertCircle, Filter } from 'lucide-react';

interface StudentGradesEvolutionChartProps {
  student: Student;
  grades: Grade[];
  activities: Activity[];
}

export const StudentGradesEvolutionChart: React.FC<StudentGradesEvolutionChartProps> = ({
  student,
  grades,
  activities
}) => {
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('all');

  // Find all distinct disciplines for this student's graded activities
  const availableDisciplines = useMemo(() => {
    const set = new Set<string>();
    grades.forEach(g => {
      const act = activities.find(a => a.entity_id === g.grade_activity_id);
      if (act?.activity_discipline) {
        set.add(act.activity_discipline);
      }
    });
    return Array.from(set);
  }, [grades, activities]);

  // Filter and sort chronologically
  const sortedAndFilteredGrades = useMemo(() => {
    return grades
      .filter(g => {
        if (selectedDiscipline === 'all') return true;
        const act = activities.find(a => a.entity_id === g.grade_activity_id);
        return act?.activity_discipline === selectedDiscipline;
      })
      .sort((a, b) => new Date(a.grade_date).getTime() - new Date(b.grade_date).getTime());
  }, [grades, activities, selectedDiscipline]);

  // Format data for Recharts
  const chartData = useMemo(() => {
    return sortedAndFilteredGrades.map((grade, index) => {
      const act = activities.find(a => a.entity_id === grade.grade_activity_id);
      const dateObj = new Date(grade.grade_date);
      const formattedDate = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      
      // Short clean label for x-axis
      const rawName = grade.grade_activity_name || 'Atividade';
      const shortName = rawName.length > 16 
        ? rawName.substring(0, 14) + '…' 
        : rawName;

      return {
        id: grade.entity_id,
        order: `Ativ. ${index + 1}`,
        shortName: `${shortName}`,
        fullName: rawName,
        discipline: act?.activity_discipline || 'Geral',
        date: formattedDate,
        fullDate: dateObj.toLocaleDateString('pt-BR'),
        nota: Number((Number(grade.grade_value) || 0).toFixed(1)),
        feedback: grade.grade_feedback,
        meta: 7.0
      };
    });
  }, [sortedAndFilteredGrades, activities]);

  // Calculate summary metrics
  const stats = useMemo(() => {
    if (chartData.length === 0) {
      return { average: 0, max: 0, min: 0, trendDiff: 0, total: 0 };
    }
    const sum = chartData.reduce((acc, curr) => acc + curr.nota, 0);
    const avg = sum / chartData.length;
    const max = Math.max(...chartData.map(d => d.nota));
    const min = Math.min(...chartData.map(d => d.nota));
    const first = chartData[0].nota;
    const last = chartData[chartData.length - 1].nota;
    const trendDiff = last - first;

    return {
      average: Number(avg.toFixed(1)),
      max: Number(max.toFixed(1)),
      min: Number(min.toFixed(1)),
      trendDiff: Number(trendDiff.toFixed(1)),
      total: chartData.length
    };
  }, [chartData]);

  // Custom Tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const isAboveTarget = item.nota >= 7.0;

      return (
        <div className="bg-zinc-900 text-white p-3 rounded-xl shadow-xl border border-zinc-800 text-xs max-w-xs z-50">
          <div className="flex items-center justify-between gap-2 mb-1 border-b border-zinc-800 pb-1.5">
            <span className="font-semibold text-indigo-300">{item.discipline}</span>
            <span className="text-zinc-400 text-[11px]">{item.fullDate}</span>
          </div>
          <p className="font-bold text-sm text-white mb-2 leading-snug">{item.fullName}</p>
          <div className="flex items-center justify-between bg-zinc-800/80 px-2.5 py-1.5 rounded-lg mb-1.5">
            <span className="text-zinc-300">Nota Obtida:</span>
            <span className={`text-base font-extrabold ${isAboveTarget ? 'text-emerald-400' : 'text-amber-400'}`}>
              {item.nota.toFixed(1)} <span className="text-xs font-normal text-zinc-400">/ 10.0</span>
            </span>
          </div>
          {item.feedback && (
            <p className="text-[11px] text-zinc-300 italic mt-1 bg-zinc-950/60 p-1.5 rounded-md border border-zinc-800/60">
              💬 "{item.feedback}"
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-zinc-200">
      {/* Header with Title and Discipline Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h3 className="font-bold text-base text-zinc-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <span>Evolução das Notas no Bimestre</span>
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Acompanhe o seu progresso acadêmico ao longo das atividades entregues
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedDiscipline('all')}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
              selectedDiscipline === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            Todas as Disciplinas
          </button>
          {availableDisciplines.map(disc => (
            <button
              key={disc}
              onClick={() => setSelectedDiscipline(disc)}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
                selectedDiscipline === disc
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              {disc}
            </button>
          ))}
        </div>
      </div>

      {/* Mini Stats Bar */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100">
            <p className="text-[11px] font-semibold text-indigo-800 uppercase tracking-wide">Média no Período</p>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-black text-indigo-950">{stats.average.toFixed(1)}</span>
              <span className="text-xs text-indigo-600 font-medium">pts</span>
            </div>
            <p className="text-[10px] text-indigo-600/80 mt-0.5">
              {stats.average >= 7.0 ? '✓ Acima da média' : 'Atenção para recuperação'}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
            <p className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wide">Maior Nota</p>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-black text-emerald-950">{stats.max.toFixed(1)}</span>
              <span className="text-xs text-emerald-600 font-medium">pts</span>
            </div>
            <p className="text-[10px] text-emerald-700 mt-0.5">Melhor pontuação</p>
          </div>

          <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/80">
            <p className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wide">Avaliações</p>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-black text-zinc-900">{stats.total}</span>
              <span className="text-xs text-zinc-500 font-medium">atividades</span>
            </div>
            <p className="text-[10px] text-zinc-500 mt-0.5">Registradas e corrigidas</p>
          </div>

          <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/80">
            <p className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wide">Trajetória</p>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className={`text-2xl font-black ${stats.trendDiff >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {stats.trendDiff > 0 ? `+${stats.trendDiff.toFixed(1)}` : (stats.trendDiff || 0).toFixed(1)}
              </span>
              <span className="text-xs text-zinc-500 font-medium">pts</span>
            </div>
            <p className="text-[10px] text-zinc-500 mt-0.5">
              {stats.trendDiff > 0 ? '↗ Evolução positiva' : stats.trendDiff === 0 ? '→ Desempenho estável' : '↘ Oscilação observada'}
            </p>
          </div>
        </div>
      )}

      {/* Chart Canvas Area */}
      {chartData.length > 0 ? (
        <div className="w-full h-72 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 15, right: 20, left: -15, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              
              <XAxis 
                dataKey="shortName" 
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
                dy={8}
              />
              
              <YAxis 
                domain={[0, 10]} 
                ticks={[0, 2, 4, 6, 7, 8, 10]}
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
              />

              <ReferenceLine 
                y={7.0} 
                stroke="#10b981" 
                strokeDasharray="4 4" 
                strokeWidth={1.5}
                label={{ 
                  value: 'Média Escolar (7.0)', 
                  position: 'insideTopRight', 
                  fill: '#059669', 
                  fontSize: 10, 
                  fontWeight: 600,
                  offset: 8
                }} 
              />

              <Tooltip content={<CustomTooltip />} />
              
              <Legend 
                verticalAlign="top" 
                height={32}
                formatter={(value) => <span className="text-xs text-zinc-700 font-medium">{value}</span>}
              />

              <Line
                type="monotone"
                dataKey="nota"
                name="Sua Nota"
                stroke="#6366f1"
                strokeWidth={3}
                dot={{ r: 5, fill: '#6366f1', stroke: '#ffffff', strokeWidth: 2 }}
                activeDot={{ r: 7, fill: '#4f46e5', stroke: '#ffffff', strokeWidth: 2 }}
                animationDuration={800}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="py-12 px-4 rounded-xl bg-zinc-50 border border-dashed border-zinc-200 text-center">
          <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-2.5">
            <TrendingUp className="w-5 h-5" />
          </div>
          <p className="text-sm font-semibold text-zinc-800">
            Nenhuma avaliação encontrada {selectedDiscipline !== 'all' ? `para ${selectedDiscipline}` : ''}
          </p>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            Assim que seus professores corrigirem e lançarem as notas das atividades deste bimestre, o gráfico traçará sua linha de evolução automaticamente.
          </p>
        </div>
      )}

      {/* Legend & Guide footer */}
      {chartData.length > 0 && (
        <div className="mt-4 pt-3 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-3 text-[11px] text-zinc-500">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-indigo-600 rounded-full inline-block"></span>
              <span>Nota da Atividade</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-emerald-500 border-b border-dashed border-emerald-500 inline-block"></span>
              <span>Média de Aprovação (7.0)</span>
            </div>
          </div>
          <span className="text-zinc-400">Passe o cursor sobre os pontos para ver detalhes da atividade</span>
        </div>
      )}
    </div>
  );
};
