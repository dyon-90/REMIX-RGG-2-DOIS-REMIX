import React, { forwardRef } from 'react';
import { StudentCertificateData, CertificateCriteria } from '../../types';
import { Award, ShieldCheck, CheckCircle2, Sparkles } from 'lucide-react';

interface CertificateTemplateProps {
  data: StudentCertificateData;
  criteria: CertificateCriteria;
}

export const CertificateTemplate = forwardRef<HTMLDivElement, CertificateTemplateProps>(
  ({ data, criteria }, ref) => {
    // Format issue date nicely in Portuguese
    const formatDate = (dateStr: string) => {
      try {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
          const year = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const day = parseInt(parts[2], 10);
          const date = new Date(year, month, day);
          return date.toLocaleDateString('pt-BR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          });
        }
        return new Date().toLocaleDateString('pt-BR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
      } catch {
        return new Date().toLocaleDateString('pt-BR');
      }
    };

    const formattedIssueDate = formatDate(criteria.issueDate);
    const teacherOrDirector = criteria.directorName || data.classRoom?.class_teacher || 'Direção Pedagógica';
    const schoolName = data.school?.school_name || (data.classRoom?.class_school_name ? `Escola ${data.classRoom.class_school_name}` : 'Rede de Ensino Municipal');

    return (
      <div
        ref={ref}
        id="certificate-print-area"
        className="w-[1060px] h-[750px] bg-[#fffdf9] text-zinc-900 select-none relative overflow-hidden font-sans border-[10px] border-[#9c782d] p-3 shadow-2xl flex flex-col justify-between"
        style={{
          boxSizing: 'border-box',
          backgroundImage: `
            radial-gradient(circle at 50% 50%, rgba(212, 175, 55, 0.05) 0%, rgba(255, 255, 255, 0) 70%),
            linear-gradient(to right, rgba(156, 120, 45, 0.02) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(156, 120, 45, 0.02) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 20px 20px, 20px 20px',
        }}
      >
        {/* Inner Ornamental Double Border */}
        <div className="w-full h-full border-2 border-[#b89742]/70 p-7 relative flex flex-col justify-between bg-white/70">
          {/* Corner Flourish Ornaments (SVG) */}
          <div className="absolute top-2 left-2 w-10 h-10 border-t-4 border-l-4 border-[#9c782d]" />
          <div className="absolute top-2 right-2 w-10 h-10 border-t-4 border-r-4 border-[#9c782d]" />
          <div className="absolute bottom-2 left-2 w-10 h-10 border-b-4 border-l-4 border-[#9c782d]" />
          <div className="absolute bottom-2 right-2 w-10 h-10 border-b-4 border-r-4 border-[#9c782d]" />

          {/* Decorative Corner Lines */}
          <div className="absolute top-4 left-4 w-4 h-4 border-t border-l border-[#d4af37]" />
          <div className="absolute top-4 right-4 w-4 h-4 border-t border-r border-[#d4af37]" />
          <div className="absolute bottom-4 left-4 w-4 h-4 border-b border-l border-[#d4af37]" />
          <div className="absolute bottom-4 right-4 w-4 h-4 border-b border-r border-[#d4af37]" />

          {/* Background Watermark Insignia */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.035] pointer-events-none">
            <Award className="w-[420px] h-[420px] text-[#9c782d]" />
          </div>

          {/* Header Section */}
          <div className="text-center relative z-10 pt-1">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="h-[2px] w-20 bg-gradient-to-r from-transparent to-[#b89742]" />
              <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#f6edd5] border border-[#d4af37]/60 text-[#7a5914] text-[11px] font-bold tracking-widest uppercase">
                <ShieldCheck className="w-3.5 h-3.5 text-[#9c782d]" />
                <span>{criteria.institutionName || 'SISTEMA INTEGRADO DE ENSINO'}</span>
              </div>
              <div className="h-[2px] w-20 bg-gradient-to-l from-transparent to-[#b89742]" />
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl font-black tracking-widest text-[#441a78] uppercase drop-shadow-xs">
              Certificado de Conclusão
            </h1>

            <p className="text-xs font-semibold text-[#8c6b24] tracking-wider uppercase mt-0.5">
              Reconhecimento de Desempenho Pedagógico e Assiduidade Escolar
            </p>

            <div className="w-48 h-[2px] mx-auto bg-gradient-to-r from-transparent via-[#b89742] to-transparent my-2" />
          </div>

          {/* Certificate Body */}
          <div className="text-center relative z-10 px-8 my-auto space-y-3">
            <p className="text-sm text-zinc-600 font-serif italic">
              Certificamos com honra que o(a) estudante
            </p>

            {/* Student Name */}
            <div className="py-1">
              <h2 className="text-3xl font-extrabold text-[#221345] uppercase tracking-wide font-serif inline-block px-8 py-1 border-b-2 border-[#b89742]/50 bg-gradient-to-r from-transparent via-amber-50/50 to-transparent">
                {data.student.student_name}
              </h2>
            </div>

            {/* Narrative text */}
            <p className="text-[13px] text-zinc-700 leading-relaxed max-w-3xl mx-auto font-sans">
              portador(a) da Matrícula Escolar nº <strong className="font-bold text-zinc-900">{data.student.student_matricula}</strong>,
              concluiu com êxito todas as atividades curriculares e avaliações pedagógicas da turma{' '}
              <strong className="font-bold text-zinc-900">{data.student.student_class_name}</strong>
              {criteria.mentionSchoolInCertificate && schoolName ? (
                <> na instituição <strong className="font-bold text-zinc-900">{schoolName}</strong></>
              ) : null}
              , atingindo com distinção os critérios de aproveitamento e assiduidade do programa educacional{' '}
              <strong className="font-bold text-[#441a78]">{criteria.courseTitle}</strong>, com carga horária total de{' '}
              <strong className="font-bold text-zinc-900">{criteria.workloadHours} horas</strong> letivas.
            </p>

            {/* Metrics Ribbon */}
            <div className="grid grid-cols-4 gap-3 max-w-2xl mx-auto pt-2">
              <div className="bg-[#fcfaf4] border border-[#e8d8af] rounded-lg p-2 text-center shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-[#8c6b24] tracking-wider block">Média Final</span>
                <div className="flex items-center justify-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-base font-black text-zinc-900">
                    {data.averageGrade > 0 ? data.averageGrade.toFixed(1) : '10.0'}
                  </span>
                  <span className="text-[10px] text-zinc-500">/ 10</span>
                </div>
              </div>

              <div className="bg-[#fcfaf4] border border-[#e8d8af] rounded-lg p-2 text-center shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-[#8c6b24] tracking-wider block">Frequência</span>
                <div className="flex items-center justify-center gap-1 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="text-base font-black text-zinc-900">
                    {data.attendancePercent}%
                  </span>
                  <span className="text-[10px] text-zinc-500">Presença</span>
                </div>
              </div>

              <div className="bg-[#fcfaf4] border border-[#e8d8af] rounded-lg p-2 text-center shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-[#8c6b24] tracking-wider block">Carga Horária</span>
                <span className="text-base font-black text-zinc-900 block mt-0.5">
                  {criteria.workloadHours}h
                </span>
              </div>

              <div className="bg-[#fcfaf4] border border-[#e8d8af] rounded-lg p-2 text-center shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-[#8c6b24] tracking-wider block">Expedição</span>
                <span className="text-xs font-bold text-zinc-800 block mt-1 truncate">
                  {formattedIssueDate}
                </span>
              </div>
            </div>
          </div>

          {/* Signatures & Seal Section */}
          <div className="relative z-10 pt-2 pb-1">
            <div className="grid grid-cols-3 items-end max-w-4xl mx-auto gap-4">
              {/* Signature Left: Coordinator */}
              <div className="text-center">
                <div className="w-48 mx-auto border-b border-zinc-800 pb-1 mb-1">
                  <p className="font-serif italic text-xs text-indigo-900 font-semibold tracking-wider">
                    {criteria.coordinatorName}
                  </p>
                </div>
                <p className="text-[11px] font-bold text-zinc-900 uppercase">
                  {criteria.coordinatorName}
                </p>
                <p className="text-[10px] text-zinc-600">Coordenação Pedagógica Geral</p>
              </div>

              {/* Official Gold Center Emblem / Seal */}
              <div className="flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#9c782d] via-[#e5c777] to-[#b89742] p-1 shadow-md flex items-center justify-center border-2 border-white">
                  <div className="w-full h-full rounded-full border border-dashed border-[#5f4410] flex flex-col items-center justify-center text-center p-1 bg-gradient-to-b from-[#f7ecc8] to-[#dfc067]">
                    <Award className="w-5 h-5 text-[#543b07]" />
                    <span className="text-[7px] font-black tracking-widest text-[#441a78] uppercase mt-0.5">
                      OFICIAL
                    </span>
                  </div>
                </div>
                <span className="text-[9px] font-bold text-[#8c6b24] tracking-wider uppercase mt-1">
                  Selo de Autenticidade
                </span>
              </div>

              {/* Signature Right: Director / Teacher */}
              <div className="text-center">
                <div className="w-48 mx-auto border-b border-zinc-800 pb-1 mb-1">
                  <p className="font-serif italic text-xs text-indigo-900 font-semibold tracking-wider">
                    {teacherOrDirector}
                  </p>
                </div>
                <p className="text-[11px] font-bold text-zinc-900 uppercase truncate">
                  {teacherOrDirector}
                </p>
                <p className="text-[10px] text-zinc-600">Diretoria / Docência Responsável</p>
              </div>
            </div>

            {/* Bottom Verification Code & Registration Bar */}
            <div className="mt-4 pt-2 border-t border-[#e8d8af] flex flex-row items-center justify-between text-[9px] text-zinc-500 font-mono">
              <div>
                <span>CÓDIGO DE AUTENTICAÇÃO: </span>
                <strong className="text-zinc-800 font-bold tracking-wider">{data.certificateCode}</strong>
              </div>
              <div className="text-center text-[8px] text-zinc-400">
                PROJETO 2+DOIS= APRENDER! • REGISTRADO ELETRONICAMENTE EM LIVRO DE CERTIFICAÇÕES
              </div>
              <div>
                <span>DATA: </span>
                <strong className="text-zinc-800">{new Date().toLocaleDateString('pt-BR')}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

CertificateTemplate.displayName = 'CertificateTemplate';
