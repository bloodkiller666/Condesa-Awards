-- ============================================================================
-- CONDESA AWARDS 2026 — Supabase schema
-- Ejecuta este archivo desde el SQL Editor (o `supabase db push`).
-- ============================================================================

-- Extensión para UUID genéricos
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. PROFILES
-- Se crea automáticamente vía trigger cuando se registra un usuario.
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  username    text,
  display_name text,
  avatar_url  text,
  provider    text,                 -- 'twitch' | 'discord'
  provider_id text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Los usuarios pueden ver todos los perfiles (para nombres en ganadores).
create policy "Profiles are public"
  on public.profiles for select
  using (true);

-- Cada usuario gestiona su propio perfil.
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- 2. CATEGORIES (11 categorías)
-- ----------------------------------------------------------------------------
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  description text,
  sort_order  int  not null default 0,
  icon        text,
  created_at  timestamptz not null default now()
);

alter table public.categories enable row level security;

create policy "Categories are public"
  on public.categories for select
  using (true);

-- ----------------------------------------------------------------------------
-- 3. NOMINEES (nominados por categoría)
-- ----------------------------------------------------------------------------
create table if not exists public.nominees (
  id           uuid primary key default gen_random_uuid(),
  category_id  uuid not null references public.categories (id) on delete cascade,
  name         text not null,
  description  text,
  image_url    text,
  clip_url     text,                 -- URL del clip de Twitch (para el reproductor embebido)
  clip_platform text default 'twitch',
  sort_order   int not null default 0,
  created_at   timestamptz not null default now()
);

alter table public.nominees enable row level security;

create policy "Nominees are public"
  on public.nominees for select
  using (true);

-- ----------------------------------------------------------------------------
-- 4. VOTES (un voto por usuario por categoría)
-- ----------------------------------------------------------------------------
create table if not exists public.votes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  nominee_id  uuid not null references public.nominees (id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  -- Garantía de integridad a nivel de base de datos:
  -- un usuario solo puede tener UN registro por categoría.
  constraint votes_user_category_unique unique (user_id, category_id)
);

alter table public.votes enable row level security;

-- Anti-duplicación: el upload del voto se valida SIEMPRE del servidor, pero
-- la RLS añade una segunda capa de defensa.
create policy "Votes are publicly readable (for counting)"
  on public.votes for select
  using (true);

create policy "Users can insert their own vote"
  on public.votes for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.nominees n
      where n.id = nominee_id and n.category_id = category_id
    )
  );

-- Permitir "cambiar" el voto mediante upsert con la constraint unique.
create policy "Users can update their own vote"
  on public.votes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own vote"
  on public.votes for delete
  using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 5. SETTINGS (control global: voting_open)
-- ----------------------------------------------------------------------------
create table if not exists public.settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.settings enable row level security;

create policy "Settings are public"
  on public.settings for select
  using (true);

-- Solo un service role (server) puede modificarlo.
-- (Sin policy de insert/update => solo service_role con bypass RLS.)

insert into public.settings (key, value)
values ('voting_open', 'true'::jsonb)
on conflict (key) do nothing;

-- ----------------------------------------------------------------------------
-- 6. Trigger: crear profile automáticamente al registrarse
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name, avatar_url, provider, provider_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'user_name',
             new.raw_user_meta_data ->> 'preferred_username',
             new.raw_user_meta_data ->> 'full_name',
             new.raw_user_meta_data ->> 'custom_claims',
             split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'full_name',
             new.raw_user_meta_data ->> 'user_name',
             new.raw_user_meta_data ->> 'preferred_username'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture'),
    coalesce(new.raw_user_meta_data ->> 'iss', new.raw_app_meta_data ->> 'provider'),
    coalesce(new.raw_user_meta_data ->> 'sub', new.id::text)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 7. Índices útiles
-- ----------------------------------------------------------------------------
create index if not exists votes_user_idx on public.votes (user_id);
create index if not exists votes_category_idx on public.votes (category_id);
create index if not exists nominees_category_idx on public.nominees (category_id);

-- ----------------------------------------------------------------------------
-- 8. Función auxiliar: resultados por categoría (porcentajes)
-- ----------------------------------------------------------------------------
create or replace function public.category_results(cat_id uuid)
returns table (nominee_id uuid, name text, vote_count bigint, percentage numeric)
language sql
stable
as $$
  with totals as (
    select count(*)::numeric as total
    from public.votes v
    where v.category_id = cat_id
  )
  select
    n.id,
    n.name,
    count(v.id) as vote_count,
    case
      when (select total from totals) = 0 then 0
      else round((count(v.id)::numeric / (select total from totals)) * 100, 1)
    end as percentage
  from public.nominees n
  left join public.votes v on v.nominee_id = n.id and v.category_id = cat_id
  where n.category_id = cat_id
  group by n.id, n.name, n.sort_order
  order by n.sort_order, vote_count desc;
$$;