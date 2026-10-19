# Concurso Plus

Site de revisão espaçada para concursos públicos. Você cadastra o que estudou e o site agenda as revisões de 1, 3, 7 e 15 dias.

O plano completo do projeto está em `plano.md` (na pasta do projeto). O visual segue a **versão 3 do protótipo no Figma**.

## O que tem aqui

| Endereço | Página |
|---|---|
| `/` | Página pública de apresentação (aparece no Google) |
| `/login`, `/cadastro`, `/esqueci-senha` | Entrar, criar conta e recuperar a senha (e-mail e senha ou Google) |
| `/app` | Página única com Hoje, Conteúdos e Calendário (só com login) |
| `/app/configuracoes` | Tempo de estudo, disciplinas, tema e conta |

Tecnologia: Next.js 16 (App Router) com TypeScript, Supabase (login e banco de dados) e date-fns. Publicação na Vercel.

## Como colocar no ar (uma vez só)

### 1. Supabase (login e banco de dados)

1. Crie uma conta grátis em [supabase.com](https://supabase.com) e clique em **New project**. Escolha a região **South America (São Paulo)**.
2. No projeto, abra **SQL Editor > New query**, cole todo o conteúdo de `supabase/migrations/0001_inicial.sql` e clique em **Run**. Isso cria as tabelas, a regra de que cada pessoa só vê os próprios dados e a lista inicial de disciplinas.
3. Em **Project Settings > Data API**, copie a **Project URL**. Em **Project Settings > API Keys**, copie a **Publishable key**.
4. Em **Authentication > URL Configuration**:
   - **Site URL:** o endereço do site na Vercel (ex.: `https://concurso-plus.vercel.app`).
   - **Redirect URLs:** adicione `https://SEU-SITE.vercel.app/auth/callback` e `http://localhost:3000/auth/callback`.

### 2. Login com Google

1. No [Google Cloud Console](https://console.cloud.google.com), crie um projeto, vá em **APIs e serviços > Credenciais > Criar credenciais > ID do cliente OAuth** (tipo "Aplicativo da Web").
2. Em **URIs de redirecionamento autorizados**, cole o endereço que o Supabase mostra em **Authentication > Sign In / Providers > Google** (termina em `/auth/v1/callback`).
3. Copie o **ID do cliente** e a **Chave secreta** para essa mesma tela do Supabase e ative o Google.

### 3. Vercel (publicação)

1. Suba esta pasta para um repositório no GitHub.
2. Em [vercel.com](https://vercel.com), clique em **Add New > Project** e escolha o repositório.
3. Em **Environment Variables**, adicione as três variáveis do arquivo `.env.example` com os seus valores.
4. Clique em **Deploy**. A cada mudança enviada ao GitHub, a Vercel publica sozinha.

## Para rodar no computador

```bash
npm install
cp .env.example .env.local   # e preencha com os dados do Supabase
npm run dev                  # abre em http://localhost:3000
npm test                     # testes das regras de revisão e do limite diário
```

## Onde fica cada regra

- `src/lib/revisoes.ts`: datas das revisões, atrasadas, limite diário, status dos conteúdos. Testes em `src/lib/revisoes.test.ts`.
- `src/lib/datas.ts`: datas sempre no horário de Brasília.
- `src/app/app/acoes.ts`: tudo o que salva no banco (cadastrar, marcar revisão, "ainda difícil?", configurações).
- `supabase/migrations/0001_inicial.sql`: tabelas e regras de acesso.
