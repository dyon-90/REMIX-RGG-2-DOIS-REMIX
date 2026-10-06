# GUIA COMPLETO DE CONFIGURAÇÃO: SUPABASE + POSTGRESQL & DEPLOY NA HOSTINGER

**Projeto:** 2+DOIS= Aprender!  
**Banco de Dados Oficial:** Supabase (PostgreSQL Relacional)  
**Ambiente de Produção:** Hostinger (`public_html`) ou Vercel / Cloud Run  

---

## 1. Como Criar o Projeto no Supabase

1. Acesse o site oficial do [Supabase](https://supabase.com) e faça login ou crie uma conta gratuita.
2. No dashboard, clique no botão **New Project**.
3. Preencha as configurações do projeto:
   - **Name:** `projeto-2maisdois-aprender` (ou o nome de sua preferência).
   - **Database Password:** Defina uma senha forte para o banco de dados PostgreSQL e guarde-a em local seguro.
   - **Region:** Selecione a região mais próxima ao seu público (por exemplo, `South America (São Paulo) - sa-east-1` ou `East US`).
   - **Pricing Plan:** Selecione o plano **Free**.
4. Clique em **Create new project** e aguarde cerca de 1 a 2 minutos até que o provisionamento do banco seja concluído.

---

## 2. Como Encontrar a `SUPABASE_URL` e a Chave Pública `anon`

1. Com o projeto aberto no dashboard do Supabase, clique no ícone de engrenagem **Project Settings** (na barra lateral esquerda inferior).
2. Selecione a aba **API** (ou **Configuration → API**).
3. Na seção **Project API keys** e **Project URL**, copie os dois valores:
   - **Project URL:** Exemplo: `https://xyzcompany.supabase.co`
   - **anon / public:** Chave JWT pública (começa com `eyJhbGci...`).
4. **IMPORTANTE DE SEGURANÇA:**
   - Utilize **SEMPRE** a chave `anon` (`public`).
   - **NUNCA** utilize ou exponha a chave `service_role` no frontend da aplicação. A chave `service_role` ignora todas as regras de segurança (RLS) e deve permanecer restrita a ambientes backend fechados.

---

## 3. Como Configurar as Variáveis de Ambiente

Crie ou edite o arquivo `.env` na raiz do seu projeto local (o arquivo `.env.example` já serve como modelo):

```env
# URL do seu projeto no Supabase
VITE_SUPABASE_URL="https://seu-id-do-projeto.supabase.co"

# Chave pública anon do Supabase (segura para frontend)
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

> **Dica:** A aplicação também possui uma interface visual de configuração dentro do painel administrativo (clique no botão **Supabase** no cabeçalho ou na aba de configurações).

---

## 4. Como Executar o Script `schema.sql` no PostgreSQL

O arquivo `supabase/schema.sql` contém todo o schema do banco de dados: tabelas, chaves primárias, chaves estrangeiras, triggers de atualização, índices e políticas de segurança RLS.

1. No dashboard do seu projeto no Supabase, clique em **SQL Editor** no menu lateral esquerdo.
2. Clique no botão **New query**.
3. Abra o arquivo `supabase/schema.sql` deste projeto, copie todo o seu conteúdo e cole no editor do Supabase.
4. Clique no botão verde **Run** (ou pressione `Ctrl + Enter` / `Cmd + Enter`).
5. A mensagem `Success. No rows returned` será exibida.
6. Pronto! As 12 tabelas foram criadas:
   - `schools` (Escolas)
   - `classes` (Turmas)
   - `students` (Alunos)
   - `activities` (Atividades)
   - `grades` (Notas e Entregas)
   - `posts` (Mural de Avisos)
   - `events` (Calendário Acadêmico)
   - `admins` (Administradores)
   - `collaborative_files` (Arquivos Colaborativos)
   - `system_logs` (Auditoria e Logs)
   - `restore_points` (Pontos de Restauração)
   - `online_users` (Presença de Usuários em Tempo Real)

---

## 5. Como Configurar o Row Level Security (RLS) e o Supabase Realtime

### Row Level Security (RLS)
O script `supabase/schema.sql` já habilita o RLS automaticamente em todas as 12 tabelas e aplica as políticas públicas adequadas para a chave `anon`:
- Leitura e gravação de escolas, turmas, alunos, notas, atividades, mural e eventos.
- Autenticação e acesso aos administradores.

Para conferir, vá em **Authentication → Policies** no painel do Supabase.

### Supabase Realtime (Sincronização Instantânea)
Para garantir que alterações feitas em um computador apareçam no mesmo segundo em um celular ou notebook sem precisar recarregar a página:
1. Vá em **Database → Publications** no menu lateral do Supabase.
2. Clique na publicação `supabase_realtime`.
3. Certifique-se de que as tabelas (`schools`, `classes`, `students`, `activities`, `grades`, `posts`, `events`, `collaborative_files`, `online_users`) estão marcadas.
*(O script `schema.sql` já executa essa habilitação automaticamente via comando SQL).*

---

## 6. Como Testar o Banco e Migrar Dados Existentes

1. Na aplicação web, clique no botão **Supabase** no cabeçalho ou acesse a aba **Backup & Configurações** no Painel do Administrador.
2. Clique em **Testar Conexão**. O sistema fará uma consulta de teste no PostgreSQL e confirmará com a mensagem verde: `✓ Conexão com o Supabase PostgreSQL estabelecida com sucesso!`.
3. Se você possuía dados cadastrados na versão anterior, acesse a aba **Migração 1-Clique** e clique em **Iniciar Migração para PostgreSQL**. Todos os registros serão transferidos para o Supabase sem duplicação (via UPSERT).

---

## 7. Como Fazer o Build para Produção

No terminal do projeto, execute:

```bash
# Instala as dependências (caso ainda não tenha feito)
npm install

# Gera os arquivos estáticos de produção
npm run build
```

O comando criará uma pasta chamada `dist/` na raiz do projeto. Essa pasta contém todos os arquivos HTML, JavaScript, CSS e imagens prontos para qualquer servidor web.

---

## 8. Como Publicar na Hostinger (`public_html`)

A aplicação é uma SPA (Single Page Application) estática moderna, compatível com **qualquer plano de hospedagem compartilhada da Hostinger** (Single, Premium, Business, Cloud Startup, etc.), sem necessidade de VPS ou servidores Node.js.

### Passo a passo para a Hostinger:
1. Faça login no seu painel da Hostinger (**hPanel**).
2. Vá em **Websites** e clique em **Gerenciar** no seu domínio.
3. No menu lateral, procure por **Gerenciador de Arquivos** (File Manager) e abra a pasta do seu site.
4. Navegue até a pasta **`public_html`**.
5. No seu computador, abra a pasta **`dist/`** gerada pelo comando `npm run build`.
6. Selecione todos os arquivos e pastas que estão **dentro** de `dist/`:
   - `index.html`
   - pasta `assets/`
   - demais arquivos estáticos
7. Arraste e solte todos eles dentro da pasta **`public_html`** da Hostinger (ou compacte em um arquivo `.zip`, envie e descompacte dentro de `public_html`).
8. **Configuração de Roteamento SPA (.htaccess):**
   Para garantir que o recarregamento de páginas funcione perfeitamente na Hostinger, crie um arquivo chamado `.htaccess` dentro de `public_html` com o seguinte conteúdo:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

---

## 9. Como Verificar a Sincronização em Dois Dispositivos (Teste Multi-Dispositivo)

Para validar que o problema de divergência entre dispositivos foi completamente solucionado:

1. **Dispositivo 1 (Computador / Notebook):**
   - Abra a aplicação no navegador do computador.
   - Faça login como Administrador (`dyon.gomes` / `@gomes2026`).
   - Vá na aba **Atividades** e clique em **Nova Atividade**.
   - Cadastre uma atividade teste: `"Desafio Matemático SPAECE 2026"`.
   - Clique em salvar.

2. **Dispositivo 2 (Celular ou Tablet):**
   - Abra a aplicação no navegador do celular (mesma URL).
   - Faça login como Aluno ou Administrador.
   - Observe a lista de atividades: a atividade `"Desafio Matemático SPAECE 2026"` estará **imediatamente disponível**, pois ambos os dispositivos consultam o mesmo banco PostgreSQL central no Supabase.

3. **Edição concorrente:**
   - Altere a data de entrega no celular.
   - Veja a alteração refletida no computador.
   - Ambos os dispositivos compartilham a mesma base oficial e centralizada.

---

## 10. Resumo da Arquitetura

```
┌────────────────────────────────────────────────────────┐
│                   SUPABASE POSTGRESQL                  │
│       (Única Fonte da Verdade — Banco Central)         │
└───────────────────────────▲────────────────────────────┘
                            │
               REST API & Realtime WebSockets
                            │
      ┌─────────────────────┼─────────────────────┐
      │                     │                     │
┌─────▼──────┐       ┌──────▼─────┐        ┌──────▼─────┐
│ Computador │       │  Notebook  │        │   Mobile   │
│     PC     │       │            │        │  & Tablet  │
└────────────┘       └────────────┘        └────────────┘
```

Nenhum dado principal fica preso ao `localStorage` do navegador. O aplicativo é 100% resiliente e multi-dispositivo.
