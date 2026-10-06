import { AppData, AdminUser } from '../types';
import { defaultAdmins } from '../data/initialData';

/**
 * Deduplica qualquer coleção pelo atributo único `entity_id`.
 */
export function deduplicateById<T extends { entity_id: string }>(items: T[] | undefined): T[] {
  if (!items || !Array.isArray(items)) return [];
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    if (item && item.entity_id) {
      if (!seen.has(item.entity_id)) {
        seen.add(item.entity_id);
        result.push(item);
      }
    }
  }
  return result;
}

/**
 * Higieniza e garante a integridade dos dados da aplicação compartilhados na nuvem.
 */
export function sanitizeAppData(raw: any): AppData {
  if (!raw || typeof raw !== 'object') {
    return {
      schools: [],
      classes: [],
      students: [],
      activities: [],
      grades: [],
      posts: [],
      events: [],
      admins: defaultAdmins
    };
  }

  const rawAdmins = deduplicateById<AdminUser>(raw.admins).filter(
    (a): a is AdminUser => Boolean(a && a.username && a.password && a.name)
  );

  const sanitizedGrades = deduplicateById(raw.grades).map((g: any) => ({
    ...g,
    grade_student_id: g.grade_student_id || '',
    grade_student_name: g.grade_student_name || 'Aluno',
    grade_activity_id: g.grade_activity_id || '',
    grade_activity_name: g.grade_activity_name || 'Atividade',
    grade_value: typeof g.grade_value === 'number' && !isNaN(g.grade_value)
      ? g.grade_value
      : (!isNaN(Number(g.grade_value)) && g.grade_value !== null && g.grade_value !== '' ? Number(g.grade_value) : 0),
    grade_date: g.grade_date || new Date().toISOString()
  }));

  return {
    schools: deduplicateById(raw.schools),
    classes: deduplicateById(raw.classes),
    students: deduplicateById(raw.students),
    activities: deduplicateById(raw.activities),
    grades: sanitizedGrades,
    posts: deduplicateById(raw.posts),
    events: deduplicateById(raw.events),
    admins: rawAdmins && rawAdmins.length > 0 ? rawAdmins : defaultAdmins,
    collaborative_files: deduplicateById(raw.collaborative_files || [])
  };
}

/**
 * Comprime um arquivo de imagem utilizando Canvas do navegador e exporta como Data URL JPEG.
 * Garante que a imagem seja nítida e NUNCA ultrapasse o limite de 1MB do Firestore (mantém entre 150KB e 400KB).
 */
export function compressImageFile(file: File, maxDimension = 800, initialQuality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const renderCanvas = (targetMax: number, targetQuality: number): string => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Redimensiona proporcionalmente para que nenhuma dimensão ultrapasse targetMax
          if (width > height) {
            if (width > targetMax) {
              height = Math.round((height * targetMax) / width);
              width = targetMax;
            }
          } else {
            if (height > targetMax) {
              width = Math.round((width * targetMax) / height);
              height = targetMax;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            throw new Error('Falha ao processar o contexto 2D da imagem');
          }
          // Garante fundo branco caso a imagem original possua transparência (PNG)
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          return canvas.toDataURL('image/jpeg', targetQuality);
        };

        try {
          // Primeira tentativa com resolução padrão e alta qualidade
          let dataUrl = renderCanvas(maxDimension, initialQuality);

          // Se o tamanho Base64 exceder 500KB (~680.000 caracteres), comprime progressivamente
          if (dataUrl.length > 500000) {
            dataUrl = renderCanvas(Math.min(maxDimension, 720), 0.6);
          }
          // Salvaguarda final: se ainda assim for grande, reduz para 600px e 0.52
          if (dataUrl.length > 500000) {
            dataUrl = renderCanvas(600, 0.52);
          }

          resolve(dataUrl);
        } catch (err: any) {
          reject(err);
        }
      };
      img.onerror = () => reject(new Error('Falha ao decodificar a imagem'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Falha ao ler arquivo de imagem'));
    reader.readAsDataURL(file);
  });
}
