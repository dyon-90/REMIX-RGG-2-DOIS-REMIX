import { AppData, AdminUser, CollaborativeFile } from '../types';

export const defaultAdmins: AdminUser[] = [
  {
    entity_id: 'admin_1',
    username: 'dyon.gomes',
    password: '@gomes2026',
    name: 'Dyon Gomes',
    email: 'dyonnes90@gmail.com',
    role: 'Administrador Geral',
    created_at: '2026-01-01T00:00:00.000Z'
  }
];

/**
 * Estado inicial estritamente em branco.
 * Nenhum dado fictício/inventado é inserido automaticamente.
 * Apenas registros cadastrados pelos usuários ou importados via upload .json estarão presentes.
 */
export const defaultCollaborativeFiles: CollaborativeFile[] = [
  {
    entity_id: 'doc_planejamento_2026',
    title: 'Planejamento Pedagógico Integrado - 9º Ano',
    category: 'planejamento',
    content: `PLANEJAMENTO PEDAGÓGICO INTEGRADO • 9º ANO
Professores e Coordenadores Responsáveis: Dyon Gomes, Levi Oliveira, Clarice Monteiro.

1. OBJETIVOS DE APRENDIZAGEM
- Desenvolver habilidades prioritárias de resolução de problemas e interpretação textual alinhadas à matriz SPAECE.
- Fomentar o raciocínio lógico-matemático através de metodologias ativas e tecnologia digital.
- Garantir o acompanhamento formativo contínuo dos estudantes com foco em equidade.

2. CRONOGRAMA DE ATIVIDADES E METAS
- Semana 1: Diagnóstico inicial e nivelamento das turmas.
- Semana 2: Aplicação de desafios matemáticos contextuais e oficinas de leitura.
- Semana 3: Avaliação intermediária e círculos de reforço pedagógico.
- Semana 4: Simulado diagnóstico e devolutiva individualizada aos estudantes.

3. RECURSOS E MATERIAIS ADOTADOS
- Cadernos de atividades pedagógicas integradas.
- Plataforma digital 2+DOIS= Aprender com submissão online de tarefas.
- Mural escolar interativo para avisos e projetos interdisciplinares.`,
    author_id: 'admin_1',
    author_name: 'Dyon Gomes',
    last_modified_by: 'admin_1',
    last_modified_by_name: 'Dyon Gomes',
    last_modified_at: '2026-03-01T10:00:00.000Z',
    version: 1,
    created_at: '2026-03-01T10:00:00.000Z',
    tags: ['9º Ano', 'Planejamento', 'SPAECE', 'Matemática', 'Português']
  },
  {
    entity_id: 'doc_ata_reuniao_2026',
    title: 'Ata de Alinhamento Curricular e Metas Educacionais',
    category: 'ata',
    content: `ATA DA REUNIÃO PEDAGÓGICA GERAL
Data: Março de 2026
Participantes: Equipe Gestora, Coordenação e Professores Regentes.

PAUTA:
1. Análise dos índices de frequência e engajamento escolar.
2. Definição das datas para avaliações bimestrais e atividades no portal do aluno.
3. Estratégias conjuntas para alunos em processo de recuperação contínua.

DELIBERAÇÕES APROVADAS:
- Toda atividade avaliativa disponibilizada no sistema contará com feedback imediato aos alunos.
- Implementação de monitorias entre pares durante os intervalos pedagógicos.
- Atualização semanal do calendário acadêmico na plataforma para acesso de toda a comunidade escolar.`,
    author_id: 'admin_levi',
    author_name: 'Levi Oliveira',
    last_modified_by: 'admin_levi',
    last_modified_by_name: 'Levi Oliveira',
    last_modified_at: '2026-03-05T14:30:00.000Z',
    version: 1,
    created_at: '2026-03-05T14:30:00.000Z',
    tags: ['Ata', 'Gestão', 'Metas']
  }
];

export const initialDefaultData: AppData = {
  admins: defaultAdmins,
  schools: [],
  classes: [],
  students: [],
  activities: [],
  grades: [],
  posts: [],
  events: [],
  collaborative_files: defaultCollaborativeFiles
};

/**
 * Lista de identificadores de dados fictícios gerados anteriormente para purga definitiva do banco de dados na nuvem.
 */
export const INVENTED_MOCK_ENTITY_IDS = new Set<string>([
  'school_1',
  'school_2',
  'class_1',
  'class_2',
  'class_3',
  'student_1',
  'student_2',
  'student_3',
  'student_4',
  'student_5',
  'act_1',
  'act_2',
  'act_3',
  'act_4',
  'act_5',
  'act_6',
  'grade_1',
  'grade_2',
  'grade_3',
  'grade_4',
  'grade_5',
  'grade_6',
  'grade_7',
  'grade_8',
  'post_1',
  'post_2',
  'post_3',
  'event_1',
  'event_2',
  'event_3',
  'event_4',
  'event_5',
  'event_6',
  'event_7'
]);

export function isInventedMockId(id?: string): boolean {
  if (!id) return false;
  return INVENTED_MOCK_ENTITY_IDS.has(id);
}
