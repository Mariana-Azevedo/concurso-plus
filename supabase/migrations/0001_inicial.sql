-- Concurso Plus: tabelas, regras de acesso e dados iniciais.
-- Rode este arquivo uma vez no Supabase (SQL Editor > New query > colar > Run).

-- Configurações de cada pessoa
create table if not exists public.perfis (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text,
  horas_estudo_dia numeric(4, 1) not null default 4 check (horas_estudo_dia > 0 and horas_estudo_dia <= 24),
  minutos_por_revisao integer not null default 30 check (minutos_por_revisao between 5 and 240),
  tema text not null default 'automatico' check (tema in ('claro', 'escuro', 'automatico')),
  criado_em timestamptz not null default now()
);

create table if not exists public.disciplinas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome text not null check (length(trim(nome)) between 1 and 80),
  criado_em timestamptz not null default now(),
  unique (usuario_id, nome)
);

create table if not exists public.conteudos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  disciplina_id uuid not null references public.disciplinas (id) on delete restrict,
  assunto text not null check (length(trim(assunto)) between 1 and 200),
  data_estudo date not null,
  anotacoes text,
  status text not null default 'em_revisao' check (status in ('em_revisao', 'concluido')),
  criado_em timestamptz not null default now()
);

create table if not exists public.revisoes (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  conteudo_id uuid not null references public.conteudos (id) on delete cascade,
  numero integer not null check (numero >= 1),
  data_prevista date not null,
  feita_em date,
  achou_dificil boolean,
  unique (conteudo_id, numero)
);

create index if not exists conteudos_usuario_idx on public.conteudos (usuario_id);
create index if not exists revisoes_usuario_data_idx on public.revisoes (usuario_id, data_prevista);
create index if not exists revisoes_conteudo_idx on public.revisoes (conteudo_id);

-- Cada pessoa só vê e altera os próprios dados
alter table public.perfis enable row level security;
alter table public.disciplinas enable row level security;
alter table public.conteudos enable row level security;
alter table public.revisoes enable row level security;

drop policy if exists "perfil próprio" on public.perfis;
create policy "perfil próprio" on public.perfis
  for all to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "disciplinas próprias" on public.disciplinas;
create policy "disciplinas próprias" on public.disciplinas
  for all to authenticated
  using ((select auth.uid()) = usuario_id)
  with check ((select auth.uid()) = usuario_id);

drop policy if exists "conteúdos próprios" on public.conteudos;
create policy "conteúdos próprios" on public.conteudos
  for all to authenticated
  using ((select auth.uid()) = usuario_id)
  with check (
    (select auth.uid()) = usuario_id
    and exists (select 1 from public.disciplinas d where d.id = disciplina_id and d.usuario_id = (select auth.uid()))
  );

drop policy if exists "revisões próprias" on public.revisoes;
create policy "revisões próprias" on public.revisoes
  for all to authenticated
  using ((select auth.uid()) = usuario_id)
  with check (
    (select auth.uid()) = usuario_id
    and exists (select 1 from public.conteudos c where c.id = conteudo_id and c.usuario_id = (select auth.uid()))
  );

-- Ao criar a conta: perfil com os padrões e a lista inicial de disciplinas
create or replace function public.criar_dados_iniciais()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfis (id, nome)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;

  insert into public.disciplinas (usuario_id, nome)
  select new.id, nome
  from unnest(array[
    'Língua Portuguesa', 'Raciocínio Lógico', 'Matemática', 'Informática',
    'Direito Constitucional', 'Direito Administrativo', 'Direito Penal',
    'Direito Processual Penal', 'Direito Civil', 'Direito Processual Civil',
    'Administração Pública', 'Legislação Específica', 'Atualidades'
  ]) as nome
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists ao_criar_usuario on auth.users;
create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute function public.criar_dados_iniciais();
