# Condesa Awards 2026

Sitio web de premiación estilo "Retro Moderno" (Synthwave/Arcade/Neon) construido con **Next.js (App Router) + TypeScript + Tailwind CSS + Supabase + GSAP**.

## Stack

- **Framework:** Next.js 15 (App Router), React 19, TypeScript
- **Gestor de paquetes:** pnpm
- **Estilos:** Tailwind CSS + Google Fonts (`Press Start 2P`, `Chakra Petch`, `VT323`, `Inter`)
- **Backend/DB:** Supabase (Auth, Postgres, RLS)
- **Animaciones:** GSAP (`@gsap/react`, ScrollTrigger)

## Setup

```bash
pnpm install
cp .env.local.example .env.local   # rellena con tus credenciales de Supabase
```

1. Crea un proyecto en [Supabase](https://supabase.com).
2. Ejecuta el contenido de `supabase/schema.sql` en el SQL Editor.
3. En **Authentication → Providers**, habilita **Twitch** y **Discord** y configura la redirect URL: `https://<project-ref>.supabase.co/auth/v1/callback`.
4. Configura los `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY`.
5. `pnpm dev`

## Estructura

```
src/
  app/                  # rutas del App Router
  components/           # UI (intro, votación, ganadores)
  lib/                  # supabase client/server, acciones, datos
  types/                # tipos compartidos
supabase/
  schema.sql            # esquema + RLS
```

## Variables de control

- `settings.voting_open` (boolean) controla si las votaciones están abiertas o se muestra la vista de ganadores.

## Emails / Env

Este proyecto **no** usa Square ni Nodemailer; esas dependencias no forman parte del stack.