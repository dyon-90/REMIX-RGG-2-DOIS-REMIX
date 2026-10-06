/**
 * Servidor Express Full-Stack para Desenvolvimento e Execução no AI Studio
 * 
 * Este servidor espelha exatamente a mesma API REST em PHP 8.x + MySQL da Hostinger,
 * permitindo que a aplicação frontend execute chamadas puras via HTTP/JSON para /api/*
 * em conformidade rigorosa com a arquitetura REST solicitada pelo usuário.
 */

import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { defaultAdmins, defaultCollaborativeFiles } from './src/data/initialData';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

// CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Banco de Dados em Memória no Servidor (Totalmente desacoplado do cliente, sem localStorage)
interface ServerDatabase {
  escolas: any[];
  turmas: any[];
  alunos: any[];
  atividades: any[];
  resultados: any[];
  posts: any[];
  eventos: any[];
  administradores: any[];
  arquivos: any[];
  configuracoes: Record<string, any>;
  usuarios_online: any[];
  last_updated: string;
}

const db: ServerDatabase = {
  escolas: [],
  turmas: [],
  alunos: [],
  atividades: [],
  resultados: [],
  posts: [],
  eventos: [],
  administradores: [...defaultAdmins],
  arquivos: [...defaultCollaborativeFiles],
  configuracoes: {},
  usuarios_online: [],
  last_updated: new Date().toISOString()
};

function touchDb() {
  db.last_updated = new Date().toISOString();
}

// -----------------------------------------------------------------------------
// 1. /api/auth/
// -----------------------------------------------------------------------------
app.all(['/api/auth', '/api/auth/', '/api/auth/index.php'], (req: Request, res: Response) => {
  if (req.method === 'POST') {
    const input = req.body || {};
    const action = req.query.action || '';

    // Admin login
    if (action === 'admin' || input.user_type === 'admin' || (input.username && input.password)) {
      const username = String(input.username || '').trim().toLowerCase();
      const cleanUser = username.startsWith('@') ? username.substring(1) : username;
      const pass = String(input.password || '').trim();

      const admin = db.administradores.find(a => {
        const u = String(a.username || '').trim().toLowerCase();
        const uClean = u.startsWith('@') ? u.substring(1) : u;
        const e = String(a.email || '').trim().toLowerCase();
        return (u === username || uClean === cleanUser || e === username) && (a.password === pass);
      });

      if (!admin) {
        return res.status(401).json({ success: false, error: 'Administrador não localizado ou senha incorreta.' });
      }

      const { password, ...safeAdmin } = admin;
      return res.json({
        success: true,
        message: 'Acesso administrativo autorizado.',
        data: {
          token: 'token_' + Date.now(),
          role: 'admin',
          user: safeAdmin
        }
      });
    }

    // Student login
    if (action === 'student' || input.user_type === 'student' || (input.email && input.matricula)) {
      const email = String(input.email || input.username || '').trim().toLowerCase();
      const matricula = String(input.matricula || input.password || '').trim();

      const student = db.alunos.find(s => {
        const sEmail = String(s.student_email || '').trim().toLowerCase();
        const sName = String(s.student_name || '').trim().toLowerCase();
        const sMat = String(s.student_matricula || '').trim();
        return (sEmail === email || sName === email) && (sMat === matricula);
      });

      if (!student) {
        return res.status(401).json({ success: false, error: 'Aluno não encontrado ou matrícula inválida.' });
      }

      return res.json({
        success: true,
        message: 'Acesso de aluno autorizado.',
        data: {
          token: 'token_' + Date.now(),
          role: 'student',
          student
        }
      });
    }

    return res.status(400).json({ success: false, error: 'Parâmetros de autenticação inválidos.' });
  }

  if (req.method === 'GET') {
    const safeAdmins = db.administradores.map(({ password, ...rest }) => rest);
    return res.json({ success: true, data: safeAdmins });
  }

  res.status(405).json({ success: false, error: 'Método não permitido' });
});

// -----------------------------------------------------------------------------
// 2. /api/escolas/
// -----------------------------------------------------------------------------
app.all(['/api/escolas', '/api/escolas/', '/api/escolas/index.php'], (req: Request, res: Response) => {
  const id = (req.query.id as string) || (req.body && req.body.entity_id);

  if (req.method === 'GET') {
    if (id) {
      const item = db.escolas.find(s => s.entity_id === id);
      return item ? res.json({ success: true, data: item }) : res.status(404).json({ success: false, error: 'Não encontrado' });
    }
    return res.json({ success: true, data: db.escolas });
  }

  if (req.method === 'POST') {
    const item = {
      ...req.body,
      entity_id: req.body.entity_id || 'school_' + Date.now(),
      created_at: new Date().toISOString()
    };
    const idx = db.escolas.findIndex(s => s.entity_id === item.entity_id);
    if (idx >= 0) db.escolas[idx] = item;
    else db.escolas.push(item);
    touchDb();
    return res.status(201).json({ success: true, data: item });
  }

  if (req.method === 'PUT') {
    const targetId = id || req.body.entity_id;
    const idx = db.escolas.findIndex(s => s.entity_id === targetId);
    if (idx >= 0) {
      db.escolas[idx] = { ...db.escolas[idx], ...req.body };
      touchDb();
      return res.json({ success: true, data: db.escolas[idx] });
    }
    return res.status(404).json({ success: false, error: 'Escola não encontrada' });
  }

  if (req.method === 'DELETE') {
    const targetId = id || req.body.entity_id;
    db.escolas = db.escolas.filter(s => s.entity_id !== targetId);
    touchDb();
    return res.json({ success: true, data: { entity_id: targetId } });
  }

  res.status(405).json({ success: false, error: 'Método não permitido' });
});

// -----------------------------------------------------------------------------
// 3. /api/turmas/
// -----------------------------------------------------------------------------
app.all(['/api/turmas', '/api/turmas/', '/api/turmas/index.php'], (req: Request, res: Response) => {
  const id = (req.query.id as string) || (req.body && req.body.entity_id);

  if (req.method === 'GET') {
    if (id) {
      const item = db.turmas.find(t => t.entity_id === id);
      return item ? res.json({ success: true, data: item }) : res.status(404).json({ success: false, error: 'Não encontrado' });
    }
    return res.json({ success: true, data: db.turmas });
  }

  if (req.method === 'POST') {
    const item = {
      ...req.body,
      entity_id: req.body.entity_id || 'class_' + Date.now(),
      created_at: new Date().toISOString()
    };
    const idx = db.turmas.findIndex(t => t.entity_id === item.entity_id);
    if (idx >= 0) db.turmas[idx] = item;
    else db.turmas.push(item);
    touchDb();
    return res.status(201).json({ success: true, data: item });
  }

  if (req.method === 'PUT') {
    const targetId = id || req.body.entity_id;
    const idx = db.turmas.findIndex(t => t.entity_id === targetId);
    if (idx >= 0) {
      db.turmas[idx] = { ...db.turmas[idx], ...req.body };
      touchDb();
      return res.json({ success: true, data: db.turmas[idx] });
    }
    return res.status(404).json({ success: false, error: 'Turma não encontrada' });
  }

  if (req.method === 'DELETE') {
    const targetId = id || req.body.entity_id;
    db.turmas = db.turmas.filter(t => t.entity_id !== targetId);
    touchDb();
    return res.json({ success: true, data: { entity_id: targetId } });
  }

  res.status(405).json({ success: false, error: 'Método não permitido' });
});

// -----------------------------------------------------------------------------
// 4. /api/alunos/
// -----------------------------------------------------------------------------
app.all(['/api/alunos', '/api/alunos/', '/api/alunos/index.php'], (req: Request, res: Response) => {
  const id = (req.query.id as string) || (req.body && req.body.entity_id);

  if (req.method === 'GET') {
    if (id) {
      const item = db.alunos.find(a => a.entity_id === id);
      return item ? res.json({ success: true, data: item }) : res.status(404).json({ success: false, error: 'Não encontrado' });
    }
    return res.json({ success: true, data: db.alunos });
  }

  if (req.method === 'POST') {
    const item = {
      ...req.body,
      entity_id: req.body.entity_id || 'student_' + Date.now(),
      created_at: new Date().toISOString()
    };
    const idx = db.alunos.findIndex(a => a.entity_id === item.entity_id);
    if (idx >= 0) db.alunos[idx] = item;
    else db.alunos.push(item);
    touchDb();
    return res.status(201).json({ success: true, data: item });
  }

  if (req.method === 'PUT') {
    const targetId = id || req.body.entity_id;
    const idx = db.alunos.findIndex(a => a.entity_id === targetId);
    if (idx >= 0) {
      db.alunos[idx] = { ...db.alunos[idx], ...req.body };
      touchDb();
      return res.json({ success: true, data: db.alunos[idx] });
    }
    return res.status(404).json({ success: false, error: 'Aluno não encontrado' });
  }

  if (req.method === 'DELETE') {
    const targetId = id || req.body.entity_id;
    db.alunos = db.alunos.filter(a => a.entity_id !== targetId);
    touchDb();
    return res.json({ success: true, data: { entity_id: targetId } });
  }

  res.status(405).json({ success: false, error: 'Método não permitido' });
});

// -----------------------------------------------------------------------------
// 5. /api/atividades/
// -----------------------------------------------------------------------------
app.all(['/api/atividades', '/api/atividades/', '/api/atividades/index.php'], (req: Request, res: Response) => {
  const id = (req.query.id as string) || (req.body && req.body.entity_id);

  if (req.method === 'GET') {
    if (id) {
      const item = db.atividades.find(a => a.entity_id === id);
      return item ? res.json({ success: true, data: item }) : res.status(404).json({ success: false, error: 'Não encontrado' });
    }
    return res.json({ success: true, data: db.atividades });
  }

  if (req.method === 'POST') {
    const item = {
      ...req.body,
      entity_id: req.body.entity_id || 'act_' + Date.now(),
      created_at: new Date().toISOString()
    };
    const idx = db.atividades.findIndex(a => a.entity_id === item.entity_id);
    if (idx >= 0) db.atividades[idx] = item;
    else db.atividades.push(item);
    touchDb();
    return res.status(201).json({ success: true, data: item });
  }

  if (req.method === 'PUT') {
    const targetId = id || req.body.entity_id;
    const idx = db.atividades.findIndex(a => a.entity_id === targetId);
    if (idx >= 0) {
      db.atividades[idx] = { ...db.atividades[idx], ...req.body };
      touchDb();
      return res.json({ success: true, data: db.atividades[idx] });
    }
    return res.status(404).json({ success: false, error: 'Atividade não encontrada' });
  }

  if (req.method === 'DELETE') {
    const targetId = id || req.body.entity_id;
    db.atividades = db.atividades.filter(a => a.entity_id !== targetId);
    touchDb();
    return res.json({ success: true, data: { entity_id: targetId } });
  }

  res.status(405).json({ success: false, error: 'Método não permitido' });
});

// -----------------------------------------------------------------------------
// 6. /api/resultados/
// -----------------------------------------------------------------------------
app.all(['/api/resultados', '/api/resultados/', '/api/resultados/index.php'], (req: Request, res: Response) => {
  const id = (req.query.id as string) || (req.body && req.body.entity_id);

  if (req.method === 'GET') {
    if (id) {
      const item = db.resultados.find(r => r.entity_id === id);
      return item ? res.json({ success: true, data: item }) : res.status(404).json({ success: false, error: 'Não encontrado' });
    }
    return res.json({ success: true, data: db.resultados });
  }

  if (req.method === 'POST') {
    const item = {
      ...req.body,
      grade_value: Number(req.body.grade_value || 0),
      entity_id: req.body.entity_id || 'grade_' + Date.now(),
      created_at: new Date().toISOString()
    };
    const idx = db.resultados.findIndex(r => r.entity_id === item.entity_id);
    if (idx >= 0) db.resultados[idx] = item;
    else db.resultados.push(item);
    touchDb();
    return res.status(201).json({ success: true, data: item });
  }

  if (req.method === 'PUT') {
    const targetId = id || req.body.entity_id;
    const idx = db.resultados.findIndex(r => r.entity_id === targetId);
    if (idx >= 0) {
      db.resultados[idx] = { ...db.resultados[idx], ...req.body };
      touchDb();
      return res.json({ success: true, data: db.resultados[idx] });
    }
    return res.status(404).json({ success: false, error: 'Resultado não encontrado' });
  }

  if (req.method === 'DELETE') {
    const targetId = id || req.body.entity_id;
    db.resultados = db.resultados.filter(r => r.entity_id !== targetId);
    touchDb();
    return res.json({ success: true, data: { entity_id: targetId } });
  }

  res.status(405).json({ success: false, error: 'Método não permitido' });
});

// -----------------------------------------------------------------------------
// 7. /api/mural/
// -----------------------------------------------------------------------------
app.all(['/api/mural', '/api/mural/', '/api/mural/index.php'], (req: Request, res: Response) => {
  const id = (req.query.id as string) || (req.body && req.body.entity_id);

  if (req.method === 'GET') {
    return res.json({ success: true, data: db.posts });
  }

  if (req.method === 'POST') {
    const item = {
      ...req.body,
      entity_id: req.body.entity_id || 'post_' + Date.now(),
      created_at: new Date().toISOString()
    };
    db.posts.unshift(item);
    touchDb();
    return res.status(201).json({ success: true, data: item });
  }

  if (req.method === 'PUT') {
    const targetId = id || req.body.entity_id;
    const idx = db.posts.findIndex(p => p.entity_id === targetId);
    if (idx >= 0) {
      db.posts[idx] = { ...db.posts[idx], ...req.body };
      touchDb();
      return res.json({ success: true, data: db.posts[idx] });
    }
    return res.status(404).json({ success: false, error: 'Post não encontrado' });
  }

  if (req.method === 'DELETE') {
    const targetId = id || req.body.entity_id;
    db.posts = db.posts.filter(p => p.entity_id !== targetId);
    touchDb();
    return res.json({ success: true, data: { entity_id: targetId } });
  }

  res.status(405).json({ success: false, error: 'Método não permitido' });
});

// -----------------------------------------------------------------------------
// 8. /api/eventos/
// -----------------------------------------------------------------------------
app.all(['/api/eventos', '/api/eventos/', '/api/eventos/index.php'], (req: Request, res: Response) => {
  const id = (req.query.id as string) || (req.body && req.body.entity_id);

  if (req.method === 'GET') {
    return res.json({ success: true, data: db.eventos });
  }

  if (req.method === 'POST') {
    const item = {
      ...req.body,
      entity_id: req.body.entity_id || 'event_' + Date.now(),
      created_at: new Date().toISOString()
    };
    db.eventos.push(item);
    touchDb();
    return res.status(201).json({ success: true, data: item });
  }

  if (req.method === 'PUT') {
    const targetId = id || req.body.entity_id;
    const idx = db.eventos.findIndex(e => e.entity_id === targetId);
    if (idx >= 0) {
      db.eventos[idx] = { ...db.eventos[idx], ...req.body };
      touchDb();
      return res.json({ success: true, data: db.eventos[idx] });
    }
    return res.status(404).json({ success: false, error: 'Evento não encontrado' });
  }

  if (req.method === 'DELETE') {
    const targetId = id || req.body.entity_id;
    db.eventos = db.eventos.filter(e => e.entity_id !== targetId);
    touchDb();
    return res.json({ success: true, data: { entity_id: targetId } });
  }

  res.status(405).json({ success: false, error: 'Método não permitido' });
});

// -----------------------------------------------------------------------------
// 9. /api/arquivos/
// -----------------------------------------------------------------------------
app.all(['/api/arquivos', '/api/arquivos/', '/api/arquivos/index.php'], (req: Request, res: Response) => {
  const id = (req.query.id as string) || (req.body && req.body.entity_id);

  if (req.method === 'GET') {
    return res.json({ success: true, data: db.arquivos });
  }

  if (req.method === 'POST') {
    const item = {
      ...req.body,
      entity_id: req.body.entity_id || 'file_' + Date.now(),
      created_at: new Date().toISOString()
    };
    const idx = db.arquivos.findIndex(f => f.entity_id === item.entity_id);
    if (idx >= 0) db.arquivos[idx] = item;
    else db.arquivos.push(item);
    touchDb();
    return res.status(201).json({ success: true, data: item });
  }

  if (req.method === 'PUT') {
    const targetId = id || req.body.entity_id;
    const idx = db.arquivos.findIndex(f => f.entity_id === targetId);
    if (idx >= 0) {
      db.arquivos[idx] = { ...db.arquivos[idx], ...req.body };
      touchDb();
      return res.json({ success: true, data: db.arquivos[idx] });
    }
    return res.status(404).json({ success: false, error: 'Arquivo não encontrado' });
  }

  if (req.method === 'DELETE') {
    const targetId = id || req.body.entity_id;
    db.arquivos = db.arquivos.filter(f => f.entity_id !== targetId);
    touchDb();
    return res.json({ success: true, data: { entity_id: targetId } });
  }

  res.status(405).json({ success: false, error: 'Método não permitido' });
});

// -----------------------------------------------------------------------------
// 10. /api/configuracoes/
// -----------------------------------------------------------------------------
app.all(['/api/configuracoes', '/api/configuracoes/', '/api/configuracoes/index.php'], (req: Request, res: Response) => {
  const key = (req.query.chave as string) || (req.query.key as string);

  if (req.method === 'GET') {
    if (key) {
      return res.json({ success: true, data: db.configuracoes[key] ?? null });
    }
    return res.json({ success: true, data: db.configuracoes });
  }

  if (req.method === 'POST') {
    const targetKey = key || req.body.setting_key || req.body.key;
    const value = req.body.setting_value !== undefined ? req.body.setting_value : req.body.value;
    if (targetKey) {
      db.configuracoes[targetKey] = value;
      touchDb();
    }
    return res.json({ success: true, data: { setting_key: targetKey, setting_value: value } });
  }

  res.status(405).json({ success: false, error: 'Método não permitido' });
});

// -----------------------------------------------------------------------------
// 11. /api/sincronizacao/ (Central Snapshot & Delta Check)
// -----------------------------------------------------------------------------
app.all(['/api/sincronizacao', '/api/sincronizacao/', '/api/sincronizacao/index.php'], (req: Request, res: Response) => {
  if (req.method === 'GET') {
    // 1. Polling de verificação rápida
    if (req.query.check !== undefined) {
      const since = req.query.since as string;
      const hasChanged = !since || new Date(db.last_updated) > new Date(since);
      return res.json({
        success: true,
        data: {
          has_changed: hasChanged,
          server_time: new Date().toISOString(),
          latest_change: db.last_updated
        }
      });
    }

    // 2. Snapshot Completo
    return res.json({
      success: true,
      data: {
        schools: db.escolas,
        classes: db.turmas,
        students: db.alunos,
        activities: db.atividades,
        grades: db.resultados,
        posts: db.posts,
        events: db.eventos,
        admins: db.administradores.map(({ password, ...rest }) => rest),
        collaborative_files: db.arquivos,
        server_time: new Date().toISOString()
      },
      message: 'Base central do MySQL Hostinger sincronizada com sucesso.'
    });
  }

  if (req.method === 'POST') {
    const input = req.body || {};
    // Heartbeat de presença
    if (input.action === 'presence' || input.session_id) {
      const sid = input.session_id;
      const existingIdx = db.usuarios_online.findIndex(u => u.session_id === sid);
      const user = {
        ...input,
        last_seen: new Date().toISOString(),
        last_seen_millis: Date.now()
      };
      if (existingIdx >= 0) db.usuarios_online[existingIdx] = user;
      else db.usuarios_online.push(user);

      // Limpa usuários inativos (> 45s)
      const now = Date.now();
      db.usuarios_online = db.usuarios_online.filter(u => (now - u.last_seen_millis) < 45000);

      return res.json({ success: true, data: db.usuarios_online });
    }
  }

  res.status(405).json({ success: false, error: 'Método não permitido' });
});

// -----------------------------------------------------------------------------
// Inicialização do Vite Middleware no Express
// -----------------------------------------------------------------------------
async function start() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom'
    });
    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      if (req.originalUrl.startsWith('/api')) {
        return next();
      }
      try {
        const url = req.originalUrl;
        let template = fs.readFileSync(path.resolve('.', 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[API REST PHP + MySQL] Servidor rodando na porta ${PORT} com endpoints /api/* ativos.`);
  });
}

start().catch(err => {
  console.error('Falha ao iniciar servidor:', err);
});
