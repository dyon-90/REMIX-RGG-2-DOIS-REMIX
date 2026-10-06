import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { Student, CertificateCriteria, StudentCertificateData } from '../../types';
import { CertificateModal } from './CertificateModal';
import { CertificateTemplate } from './CertificateTemplate';
import { downloadCertificatePDF, sanitizeFileName } from '../../utils/certificatePdf';
import { api } from '../../services/api';
import {
  GraduationCap,
  Award,
  Search,
  Filter,
  Download,
  Settings,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  ChevronDown,
  ChevronUp,
  Percent,
  Layers,
  Sparkles,
  School as SchoolIcon,
  RefreshCw,
  BookOpen
} from 'lucide-react';

const DEFAULT_CRITERIA: CertificateCriteria = {
  minGrade: 6.0,
  minAttendance: 75,
  workloadHours: 120,
  courseTitle: 'Programa Pedagógico 2+DOIS= Aprender!',
  coordinatorName: 'Coordenação Pedagógica Geral',
  directorName: 'Direção Escolar',
  issueDate: new Date().toISOString().split('T')[0],
  institutionName: 'SISTEMA INTEGRADO DE EDUCAÇÃO BÁSICA',
  mentionSchoolInCertificate: true,
};

export const CertificatesTab: React.FC = () => {
  const { data, showToast } = useData();

  // Load custom criteria from Cloud Firestore (real-time sync across all devices)
  const [criteria, setCriteria] = useState<CertificateCriteria>(DEFAULT_CRITERIA);

  // Attendance overrides map (studentId -> percentage) synced in Cloud Firestore
  const [attendanceOverrides, setAttendanceOverrides] = useState<Record<string, number>>({});

  // Sincronização de critérios e frequências via API REST PHP (MySQL Hostinger)
  useEffect(() => {
    let isMounted = true;
    api.getSetting<Partial<CertificateCriteria>>('certificate_criteria').then(remote => {
      if (isMounted && remote) {
        setCriteria(prev => ({ ...prev, ...remote }));
      }
    }).catch(() => {});

    api.getSetting<Record<string, number>>('attendance_overrides').then(remote => {
      if (isMounted && remote && typeof remote === 'object') {
        setAttendanceOverrides(remote);
      }
    }).catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  // UI state
  const [isCriteriaOpen, setIsCriteriaOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'eligible' | 'pending'>('all');
  const [activePreviewStudent, setActivePreviewStudent] = useState<StudentCertificateData | null>(null);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; studentName: string } | null>(null);

  // Hidden container for off-screen rendering during batch or quick downloads
  const hiddenRenderRef = useRef<HTMLDivElement>(null);
  const [offscreenTarget, setOffscreenTarget] = useState<{ data: StudentCertificateData; fileName: string } | null>(null);

  // Save criteria changes via API REST PHP & MySQL
  const handleUpdateCriteria = async (newCriteria: Partial<CertificateCriteria>) => {
    const updated = { ...criteria, ...newCriteria };
    setCriteria(updated);
    try {
      await api.saveSetting('certificate_criteria', updated);
    } catch (e: any) {
      console.warn('[CertificatesTab] Falha ao salvar critérios na API:', e.message);
    }
    showToast('Critérios de certificação salvos no MySQL!', 'info');
  };

  // Update attendance override for a student via API REST PHP & MySQL
  const handleUpdateAttendance = async (studentId: string, newAttendance: number) => {
    const clamped = Math.max(0, Math.min(100, newAttendance));
    const updated = { ...attendanceOverrides, [studentId]: clamped };
    setAttendanceOverrides(updated);
    try {
      await api.saveSetting('attendance_overrides', updated);
    } catch (e: any) {
      console.warn('[CertificatesTab] Falha ao salvar frequência na API:', e.message);
    }
  };

  // Compute student certificate statistics based on existing activities and grades
  const certificateStudentsData: StudentCertificateData[] = useMemo(() => {
    return (data.students || []).map((student) => {
      const classRoom = data.classes?.find((c) => c.entity_id === student.student_class_id);
      const school = classRoom
        ? data.schools?.find((s) => s.entity_id === classRoom.class_school_id)
        : undefined;

      // Class activities
      const classActivities = (data.activities || []).filter(
        (a) => a.activity_class_id === student.student_class_id
      );
      const totalActivitiesCount = classActivities.length;

      // Student grades
      const studentGrades = (data.grades || []).filter(
        (g) => g.grade_student_id === student.entity_id
      );

      // Activities with grades or submissions
      const gradedItems = studentGrades.filter(
        (g) => typeof g.grade_value === 'number' && g.grade_value >= 0
      );
      const submittedItems = studentGrades.filter(
        (g) => g.status === 'submitted' || g.status === 'graded' || g.grade_value > 0
      );

      // Average grade
      const averageGrade =
        gradedItems.length > 0
          ? gradedItems.reduce((acc, g) => acc + g.grade_value, 0) / gradedItems.length
          : 0;

      // Attendance percentage:
      // If override exists in local storage, use it. Otherwise, compute from activity submissions.
      let attendancePercent: number;
      let isAttendanceCustom = false;

      if (typeof attendanceOverrides[student.entity_id] === 'number') {
        attendancePercent = attendanceOverrides[student.entity_id];
        isAttendanceCustom = true;
      } else if (totalActivitiesCount > 0) {
        attendancePercent = Math.round((submittedItems.length / totalActivitiesCount) * 100);
      } else {
        // When there are no specific activities registered for the class, default attendance is 100%
        attendancePercent = 100;
      }

      // Determine eligibility
      const isGradeOk = averageGrade >= criteria.minGrade;
      const isAttendanceOk = attendancePercent >= criteria.minAttendance;

      let status: 'eligible' | 'pending_grade' | 'pending_attendance' | 'ineligible';
      if (isGradeOk && isAttendanceOk) {
        status = 'eligible';
      } else if (!isGradeOk && !isAttendanceOk) {
        status = 'ineligible';
      } else if (!isGradeOk) {
        status = 'pending_grade';
      } else {
        status = 'pending_attendance';
      }

      // Generate deterministic unique certificate verification code
      const certHash = Math.abs(
        (student.entity_id + student.student_matricula + student.created_at)
          .split('')
          .reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0)
      )
        .toString(36)
        .toUpperCase()
        .padStart(6, '0');

      const certificateCode = `P2D-${new Date(criteria.issueDate).getFullYear()}-${certHash}`;

      return {
        student,
        classRoom,
        school,
        averageGrade,
        gradedCount: gradedItems.length,
        totalActivitiesCount,
        submittedCount: submittedItems.length,
        attendancePercent,
        isAttendanceCustom,
        status,
        certificateCode,
      };
    });
  }, [data.students, data.classes, data.schools, data.activities, data.grades, attendanceOverrides, criteria]);

  // Filtered student list
  const filteredStudents = useMemo(() => {
    return certificateStudentsData.filter((item) => {
      // Search query (name or matricula)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.student.student_name.toLowerCase().includes(q);
        const matchesMatricula = (item.student.student_matricula || '').toLowerCase().includes(q);
        if (!matchesName && !matchesMatricula) return false;
      }

      // Class filter
      if (selectedClassId !== 'all' && item.student.student_class_id !== selectedClassId) {
        return false;
      }

      // School filter
      if (selectedSchoolId !== 'all') {
        const classRoom = item.classRoom;
        if (!classRoom || classRoom.class_school_id !== selectedSchoolId) {
          return false;
        }
      }

      // Status filter
      if (statusFilter === 'eligible' && item.status !== 'eligible') {
        return false;
      }
      if (statusFilter === 'pending' && item.status === 'eligible') {
        return false;
      }

      return true;
    });
  }, [certificateStudentsData, searchQuery, selectedClassId, selectedSchoolId, statusFilter]);

  // Overall Statistics
  const totalStudents = certificateStudentsData.length;
  const eligibleStudents = certificateStudentsData.filter((s) => s.status === 'eligible').length;
  const pendingStudents = totalStudents - eligibleStudents;
  const completionRate = totalStudents > 0 ? Math.round((eligibleStudents / totalStudents) * 100) : 0;

  // Single Quick Download Handler
  const handleQuickDownload = async (item: StudentCertificateData) => {
    setOffscreenTarget({
      data: item,
      fileName: `Certificado_${sanitizeFileName(item.student.student_name)}_${sanitizeFileName(
        item.student.student_class_name || 'Turma'
      )}.pdf`,
    });

    // Wait for DOM update, then capture
    setTimeout(async () => {
      if (hiddenRenderRef.current) {
        try {
          showToast(`Gerando PDF de ${item.student.student_name}...`, 'info');
          await downloadCertificatePDF(
            hiddenRenderRef.current,
            `Certificado_${sanitizeFileName(item.student.student_name)}.pdf`
          );
          showToast(`Certificado de ${item.student.student_name} baixado com sucesso!`, 'success');
        } catch (err: any) {
          console.error(err);
          showToast('Erro ao baixar certificado: ' + err.message, 'error');
        } finally {
          setOffscreenTarget(null);
        }
      }
    }, 300);
  };

  // Batch download of all currently filtered eligible students
  const handleBatchDownloadEligible = async () => {
    const eligibleList = filteredStudents.filter((s) => s.status === 'eligible');
    if (eligibleList.length === 0) {
      showToast('Nenhum aluno apto encontrado com os filtros atuais.', 'error');
      return;
    }

    if (!confirm(`Deseja gerar e baixar os certificados de ${eligibleList.length} aluno(s) apto(s)?`)) {
      return;
    }

    setIsBatchGenerating(true);
    let successCount = 0;

    for (let i = 0; i < eligibleList.length; i++) {
      const studentData = eligibleList[i];
      setBatchProgress({
        current: i + 1,
        total: eligibleList.length,
        studentName: studentData.student.student_name,
      });

      setOffscreenTarget({
        data: studentData,
        fileName: `Certificado_${sanitizeFileName(studentData.student.student_name)}.pdf`,
      });

      // Brief delay to allow DOM to render and prevent browser throttling
      await new Promise((r) => setTimeout(r, 450));

      if (hiddenRenderRef.current) {
        try {
          await downloadCertificatePDF(
            hiddenRenderRef.current,
            `Certificado_${sanitizeFileName(studentData.student.student_name)}_${sanitizeFileName(
              studentData.student.student_class_name || 'Turma'
            )}.pdf`
          );
          successCount++;
        } catch (err) {
          console.error(`Erro ao gerar certificado para ${studentData.student.student_name}:`, err);
        }
      }

      // Small throttle between files
      await new Promise((r) => setTimeout(r, 200));
    }

    setIsBatchGenerating(false);
    setBatchProgress(null);
    setOffscreenTarget(null);
    showToast(`Concluído! ${successCount} de ${eligibleList.length} certificados baixados com sucesso.`, 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-md border border-purple-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-purple-500/20 border border-purple-400/30 text-purple-300">
                <GraduationCap className="w-6 h-6" />
              </span>
              <div>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  Emissão de Certificados de Conclusão
                </h3>
                <p className="text-xs text-purple-200/90 leading-relaxed">
                  Avaliação automatizada por notas e frequência com exportação de certificados oficiais em PDF de alta resolução.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsCriteriaOpen(!isCriteriaOpen)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center gap-2 transition cursor-pointer backdrop-blur-xs"
            >
              <Settings className="w-4 h-4 text-purple-300" />
              <span>Configurar Critérios</span>
              {isCriteriaOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={handleBatchDownloadEligible}
              disabled={isBatchGenerating || eligibleStudents === 0}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white flex items-center gap-2 transition shadow-sm disabled:opacity-50 cursor-pointer"
              title="Baixar certificados de todos os alunos que atingiram a média e a frequência"
            >
              {isBatchGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Gerando em lote ({batchProgress?.current}/{batchProgress?.total})...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Baixar Aptos em Lote ({eligibleStudents})</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Expandable Criteria Configuration Drawer */}
        {isCriteriaOpen && (
          <div className="mt-5 pt-5 border-t border-white/15 grid sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in text-xs">
            <div className="bg-black/30 backdrop-blur-xs p-3.5 rounded-xl border border-white/10 space-y-2">
              <label className="font-bold text-purple-200 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-300" />
                Média Mínima de Aprovação:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="10"
                  value={criteria.minGrade}
                  onChange={(e) => handleUpdateCriteria({ minGrade: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white font-bold text-sm focus:outline-hidden focus:border-purple-400"
                />
                <span className="text-[11px] text-white/60 whitespace-nowrap">pontos</span>
              </div>
              <p className="text-[10px] text-white/60">Nota média requerida para aptidão</p>
            </div>

            <div className="bg-black/30 backdrop-blur-xs p-3.5 rounded-xl border border-white/10 space-y-2">
              <label className="font-bold text-purple-200 flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-indigo-300" />
                Frequência Mínima Requerida:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={criteria.minAttendance}
                  onChange={(e) => handleUpdateCriteria({ minAttendance: parseInt(e.target.value) || 0 })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white font-bold text-sm focus:outline-hidden focus:border-purple-400"
                />
                <span className="text-[11px] text-white/60 whitespace-nowrap">%</span>
              </div>
              <p className="text-[10px] text-white/60">Presença mínima nas atividades letivas</p>
            </div>

            <div className="bg-black/30 backdrop-blur-xs p-3.5 rounded-xl border border-white/10 space-y-2">
              <label className="font-bold text-purple-200 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-300" />
                Carga Horária (Horas):
              </label>
              <input
                type="number"
                min="1"
                value={criteria.workloadHours}
                onChange={(e) => handleUpdateCriteria({ workloadHours: parseInt(e.target.value) || 1 })}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white font-bold text-sm focus:outline-hidden focus:border-purple-400"
              />
              <p className="text-[10px] text-white/60">Carga horária impressa no documento</p>
            </div>

            <div className="bg-black/30 backdrop-blur-xs p-3.5 rounded-xl border border-white/10 space-y-2">
              <label className="font-bold text-purple-200 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-blue-300" />
                Data de Expedição:
              </label>
              <input
                type="date"
                value={criteria.issueDate}
                onChange={(e) => handleUpdateCriteria({ issueDate: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white font-bold text-xs focus:outline-hidden focus:border-purple-400"
              />
              <p className="text-[10px] text-white/60">Data oficial de emissão do certificado</p>
            </div>

            {/* Second row of settings */}
            <div className="bg-black/30 backdrop-blur-xs p-3.5 rounded-xl border border-white/10 space-y-1 sm:col-span-2">
              <label className="font-bold text-purple-200">Título do Curso ou Programa:</label>
              <input
                type="text"
                value={criteria.courseTitle}
                onChange={(e) => handleUpdateCriteria({ courseTitle: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-hidden focus:border-purple-400"
              />
            </div>

            <div className="bg-black/30 backdrop-blur-xs p-3.5 rounded-xl border border-white/10 space-y-1">
              <label className="font-bold text-purple-200">Coordenador(a) (Assinatura):</label>
              <input
                type="text"
                value={criteria.coordinatorName}
                onChange={(e) => handleUpdateCriteria({ coordinatorName: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-hidden focus:border-purple-400"
              />
            </div>

            <div className="bg-black/30 backdrop-blur-xs p-3.5 rounded-xl border border-white/10 space-y-1">
              <label className="font-bold text-purple-200">Diretor(a) / Professor(a):</label>
              <input
                type="text"
                value={criteria.directorName}
                onChange={(e) => handleUpdateCriteria({ directorName: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-hidden focus:border-purple-400"
              />
            </div>
          </div>
        )}
      </div>

      {/* Real-time Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Total de Alunos</p>
            <span className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-2">{totalStudents}</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">matriculados em todas as turmas</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-emerald-200/80 dark:border-emerald-900/40 shadow-2xs bg-gradient-to-b from-white to-emerald-50/20 dark:from-zinc-900 dark:to-emerald-950/20">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-400">Aptos para Conclusão</p>
            <span className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-2">{eligibleStudents}</p>
          <p className="text-[11px] text-emerald-600/90 mt-0.5">Média ≥ {criteria.minGrade} e Presença ≥ {criteria.minAttendance}%</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-amber-200/80 dark:border-amber-900/40 shadow-2xs bg-gradient-to-b from-white to-amber-50/20 dark:from-zinc-900 dark:to-amber-950/20">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-400">Pendentes</p>
            <span className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
              <AlertCircle className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-amber-700 dark:text-amber-400 mt-2">{pendingStudents}</p>
          <p className="text-[11px] text-amber-600/90 mt-0.5">Necessitam recuperar nota ou faltas</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-purple-200/80 dark:border-purple-900/40 shadow-2xs bg-gradient-to-b from-white to-purple-50/20 dark:from-zinc-900 dark:to-purple-950/20">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-purple-800 dark:text-purple-400">Taxa de Conclusão</p>
            <span className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-purple-700 dark:text-purple-400 mt-2">{completionRate}%</p>
          <p className="text-[11px] text-purple-600/90 mt-0.5">do alunado pronto para formatura</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome do aluno ou matrícula..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden focus:border-purple-500 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Class selector */}
          <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
            <Filter className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="px-2.5 py-2 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-medium focus:outline-hidden cursor-pointer"
            >
              <option value="all">Todas as Turmas ({(data.classes || []).length})</option>
              {(data.classes || []).map((c) => (
                <option key={c.entity_id} value={c.entity_id}>
                  {c.class_name}
                </option>
              ))}
            </select>
          </div>

          {/* School selector */}
          {(data.schools || []).length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
              <SchoolIcon className="w-3.5 h-3.5 text-zinc-400" />
              <select
                value={selectedSchoolId}
                onChange={(e) => setSelectedSchoolId(e.target.value)}
                className="px-2.5 py-2 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-medium focus:outline-hidden cursor-pointer"
              >
                <option value="all">Todas as Escolas</option>
                {(data.schools || []).map((s) => (
                  <option key={s.entity_id} value={s.entity_id}>
                    {s.school_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Status buttons */}
          <div className="flex items-center rounded-xl bg-zinc-100 dark:bg-zinc-800 p-1 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-2xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              Todos ({totalStudents})
            </button>
            <button
              onClick={() => setStatusFilter('eligible')}
              className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1 ${
                statusFilter === 'eligible'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>Aptos ({eligibleStudents})</span>
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1 ${
                statusFilter === 'pending'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
              }`}
            >
              <AlertCircle className="w-3 h-3" />
              <span>Pendentes ({pendingStudents})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table of Students & Certificate Status */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/80 border-b border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 uppercase tracking-wider font-bold text-[11px]">
                <th className="py-3.5 px-4">Aluno / Matrícula</th>
                <th className="py-3.5 px-4">Turma & Escola</th>
                <th className="py-3.5 px-4 text-center">Média das Notas</th>
                <th className="py-3.5 px-4 text-center">Frequência Escolar</th>
                <th className="py-3.5 px-4 text-center">Status de Conclusão</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500">
                    <GraduationCap className="w-10 h-10 mx-auto mb-2 text-zinc-300 dark:text-zinc-700" />
                    <p className="font-semibold text-zinc-700 dark:text-zinc-300">Nenhum aluno encontrado</p>
                    <p className="text-xs text-zinc-400 mt-0.5">Tente ajustar os termos da busca ou os filtros de turma e status.</p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((item) => {
                  const isEligible = item.status === 'eligible';

                  return (
                    <tr
                      key={item.student.entity_id}
                      className="hover:bg-purple-50/30 dark:hover:bg-purple-950/20 transition duration-150"
                    >
                      {/* Student Info */}
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                          {item.student.student_name}
                        </p>
                        <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                          Matrícula: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{item.student.student_matricula}</span>
                        </p>
                      </td>

                      {/* Class & School */}
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-zinc-800 dark:text-zinc-200">
                          {item.student.student_class_name || 'Sem Turma'}
                        </p>
                        <p className="text-[11px] text-zinc-500 truncate max-w-xs">
                          {item.school?.school_name || item.classRoom?.class_school_name || 'Rede de Ensino'}
                        </p>
                      </td>

                      {/* Grade Average */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-black ${
                              item.averageGrade >= criteria.minGrade
                                ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60'
                                : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300/60'
                            }`}
                          >
                            {item.averageGrade > 0 ? item.averageGrade.toFixed(1) : '10.0'}
                          </span>
                          <span className="text-[10px] text-zinc-400 mt-1">
                            {item.gradedCount} atividade(s) avaliada(s)
                          </span>
                        </div>
                      </td>

                      {/* Attendance */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-black ${
                                item.attendancePercent >= criteria.minAttendance
                                  ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border border-indigo-300/60'
                                  : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300/60'
                              }`}
                            >
                              {item.attendancePercent}%
                            </span>
                            {item.isAttendanceCustom && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300" title="Frequência ajustada manualmente">
                                Editado
                              </span>
                            )}
                          </div>

                          {/* Quick inline attendance slider/button */}
                          <div className="mt-1 flex items-center gap-1 text-[10px] text-zinc-400">
                            <span>Mín: {criteria.minAttendance}%</span>
                            <span>•</span>
                            <button
                              onClick={() => {
                                const promptVal = prompt(
                                  `Definir porcentagem de frequência para ${item.student.student_name}:`,
                                  item.attendancePercent.toString()
                                );
                                if (promptVal !== null) {
                                  const num = parseInt(promptVal);
                                  if (!isNaN(num)) {
                                    handleUpdateAttendance(item.student.entity_id, num);
                                    showToast(`Frequência de ${item.student.student_name} atualizada para ${num}%`, 'success');
                                  }
                                }
                              }}
                              className="text-purple-600 dark:text-purple-400 hover:underline font-semibold cursor-pointer"
                              title="Clique para ajustar manualmente a frequência"
                            >
                              Alterar
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        {isEligible ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Apto para Certificado</span>
                          </span>
                        ) : item.status === 'pending_grade' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span>Média Baixa (&lt; {criteria.minGrade})</span>
                          </span>
                        ) : item.status === 'pending_attendance' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                            <span>Faltas (&lt; {criteria.minAttendance}%)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400 border border-zinc-300">
                            <AlertCircle className="w-3.5 h-3.5 text-zinc-500" />
                            <span>Não Apto</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setActivePreviewStudent(item)}
                            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800 flex items-center gap-1.5 transition cursor-pointer"
                            title="Visualizar e configurar certificado"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Visualizar</span>
                          </button>

                          <button
                            onClick={() => handleQuickDownload(item)}
                            className="px-3 py-1.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                            title="Baixar Certificado em PDF diretamente"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Baixar PDF</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for full interactive preview */}
      {activePreviewStudent && (
        <CertificateModal
          certificateData={activePreviewStudent}
          criteria={criteria}
          onClose={() => setActivePreviewStudent(null)}
          onUpdateAttendance={handleUpdateAttendance}
        />
      )}

      {/* Off-screen rendering element for PDF capture */}
      {offscreenTarget && (
        <div style={{ position: 'fixed', left: '-9999px', top: '-9999px', zIndex: -100 }}>
          <div style={{ width: '1060px', height: '750px' }}>
            <CertificateTemplate
              ref={hiddenRenderRef}
              data={offscreenTarget.data}
              criteria={criteria}
            />
          </div>
        </div>
      )}
    </div>
  );
};
