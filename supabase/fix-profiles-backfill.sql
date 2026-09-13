-- ============================================================================
-- CONDESA AWARDS 2026 — Reparación de profiles (usuarios que no aparecen)
-- Ejecutar en Supabase SQL Editor. Es idempotente: se puede correr N veces.
-- ============================================================================

-- 1) DIAGNÓSTICO: ¿el trigger existe?
select tgname, tgenabled
from pg_trigger
where tgrelid = 'auth.users'::regclass
  and tgname = 'on_auth_user_created';

-- 2) DIAGNÓSTICO: ¿cuántos usuarios auth no tienen perfil?
select count(*) as usuarios_sin_perfil
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

-- 3) (Re)crear la función del trigger, igual que en schema.sql
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

-- 4) (Re)crear el trigger (drop + create para reemplazarlo si está roto)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 5) BACKFILL: crear perfiles para TODOS los usuarios auth existentes
insert into public.profiles (id, username, display_name, avatar_url, provider, provider_id)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'user_name',
           u.raw_user_meta_data ->> 'preferred_username',
           u.raw_user_meta_data ->> 'full_name',
           split_part(u.email, '@', 1)),
  coalesce(u.raw_user_meta_data ->> 'full_name',
           u.raw_user_meta_data ->> 'user_name',
           u.raw_user_meta_data ->> 'preferred_username'),
  coalesce(u.raw_user_meta_data ->> 'avatar_url', u.raw_user_meta_data ->> 'picture'),
  coalesce(u.raw_user_meta_data ->> 'iss', u.raw_app_meta_data ->> 'provider'),
  coalesce(u.raw_user_meta_data ->> 'sub', u.id::text)
from auth.users u
on conflict (id) do nothing;

-- 6) Verificación final: deben coincidir con el total de usuarios de Auth
select
  (select count(*) from auth.users)  as usuarios_en_auth,
  (select count(*) from public.profiles) as perfiles_creados;
