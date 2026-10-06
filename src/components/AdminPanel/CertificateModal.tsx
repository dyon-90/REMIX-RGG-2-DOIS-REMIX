import React, { useRef, useState } from 'react';
import { StudentCertificateData, CertificateCriteria } from '../../types';
import { CertificateTemplate } from './CertificateTemplate';
import { downloadCertificatePDF, printCertificateElement, sanitizeFileName } from '../../utils/certificatePdf';
import { X, Download, Printer, Award, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { useData } from '../../context/DataContext';

interface CertificateModalProps {
  certificateData: StudentCertificateData;
  criteria: CertificateCriteria;
  onClose: () => void;
  onUpdateAttendance?: (studentId: string, newAttendance: number) => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  certificateData,
  criteria,
  onClose,
  onUpdateAttendance,
}) => {
  const certificateRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [customAttendance, setCustomAttendance] = useState<number>(certificateData.attendancePercent);
  const [isEditingAttendance, setIsEditingAttendance] = useState(false);
  const { showToast } = useData();

  // Compute updated student data if custom attendance was adjusted
  const currentData: StudentCertificateData = {
    ...certificateData,
    attendancePercent: customAttendance,
    status:
      certificateData.averageGrade >= criteria.minGrade && customAttendance >= criteria.minAttendance
        ? 'eligible'
        : certificateData.averageGrade < criteria.minGrade && customAttendance < criteria.minAttendance
        ? 'ineligible'
        : certificateData.averageGrade < criteria.minGrade
        ? 'pending_grade'
        : 'pending_attendance',
  };

  const handleDownloadPDF = async () => {
    if (!certificateRef.current) return;
    setIsDownloading(true);
    try {
      const fileName = `Certificado_${sanitizeFileName(currentData.student.student_name)}_${sanitizeFileName(
        currentData.student.student_class_name || 'Turma'
      )}.pdf`;
      await downloadCertificatePDF(certificateRef.current, fileName);
      showToast('Certificado baixado em PDF com sucesso!', 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Erro ao baixar PDF do certificado: ' + (err.message || 'Falha na renderização'), 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    if (!certificateRef.current) return;
    try {
      printCertificateElement(certificateRef.current);
    } catch (err: any) {
      console.error(err);
      showToast('Erro ao abrir diálogo de impressão: ' + err.message, 'error');
    }
  };

  const handleSaveAttendance = () => {
    if (onUpdateAttendance) {
      onUpdateAttendance(currentData.student.entity_id, customAttendance);
      showToast(`Frequência de ${currentData.student.student_name} ajustada para ${customAttendance}%`, 'success');
    }
    setIsEditingAttendance(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-6xl overflow-hidden flex flex-col my-auto max-h-[96vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Visualização do Certificado de Conclusão
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Aluno(a): <strong className="text-zinc-800 dark:text-zinc-200">{currentData.student.student_name}</strong> • Matrícula: {currentData.student.student_matricula}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-1.5 transition cursor-pointer"
              title="Imprimir Certificado"
            >
              <Printer className="w-4 h-4 text-zinc-500" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white flex items-center gap-2 transition shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {isDownloading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Gerando PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Baixar em PDF</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Status Ribbon & Quick Adjustment */}
        <div className="px-6 py-2.5 bg-zinc-100 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            {currentData.status === 'eligible' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Apto para Conclusão (Média e Frequência atendidas)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 font-bold">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                {currentData.status === 'pending_grade' && `Pendente: Média (${currentData.averageGrade.toFixed(1)}) abaixo do mínimo (${criteria.minGrade.toFixed(1)})`}
                {currentData.status === 'pending_attendance' && `Pendente: Frequência (${currentData.attendancePercent}%) abaixo do mínimo (${criteria.minAttendance}%)`}
                {currentData.status === 'ineligible' && `Pendente: Média e Frequência abaixo dos critérios mínimos`}
              </span>
            )}

            <span className="text-zinc-500 text-[11px]">
              • Turma: {currentData.student.student_class_name}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!isEditingAttendance ? (
              <button
                onClick={() => setIsEditingAttendance(true)}
                className="text-[11px] text-purple-700 dark:text-purple-300 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Frequência no Certificado: <strong>{customAttendance}%</strong> (Ajustar)</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-800 px-2 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700">
                <label className="text-[11px] text-zinc-600 dark:text-zinc-300 font-medium">Frequência %:</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={customAttendance}
                  onChange={(e) => setCustomAttendance(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="w-14 px-1.5 py-0.5 text-xs font-bold border border-zinc-300 rounded text-center"
                />
                <button
                  onClick={handleSaveAttendance}
                  className="px-2 py-0.5 text-[11px] font-bold bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  OK
                </button>
                <button
                  onClick={() => setIsEditingAttendance(false)}
                  className="px-1.5 py-0.5 text-[11px] text-zinc-500 hover:text-zinc-700"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal Content - Scrollable Certificate Frame */}
        <div className="p-4 sm:p-6 overflow-auto flex justify-center bg-zinc-200/70 dark:bg-zinc-950/80">
          <div className="transform scale-[0.68] sm:scale-[0.82] md:scale-[0.92] lg:scale-100 origin-top transition-transform shadow-2xl">
            <CertificateTemplate
              ref={certificateRef}
              data={currentData}
              criteria={criteria}
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-500">
          <p>
            O PDF é gerado em formato A4 Paisagem (297 × 210 mm) em alta resolução com tipografia e selo digital oficiais.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition"
            >
              Fechar Visualização
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
