import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Upsert defensivo del perfil del usuario en public.profiles.
 *
 * El schema.sql crea un trigger (on_auth_user_created) que inserta el perfil
 * al registrarse, pero si el trigger falta/falló (p.ej. usuario recreado) el
 * login funciona y profiles queda vacío. Este upsert garantiza la fila.
 */
async function ensureProfile(userId: string) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user || user.id !== userId) return;

  const meta = user.user_metadata ?? {};
  const username =
    meta.user_name ?? meta.preferred_username ?? meta.full_name ??
    (user.email ? user.email.split("@")[0] : null);

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      username,
      display_name: meta.full_name ?? meta.user_name ?? meta.preferred_username ?? null,
      avatar_url: meta.avatar_url ?? meta.picture ?? null,
      provider: meta.iss ? String(meta.iss) : (user.app_metadata?.provider ?? null),
      provider_id: meta.sub ?? user.id,
      updated_at: new Date().toISOString()
    },
    { onConflict: "id" }
  );

  if (error) console.error("ensureProfile error:", error.message);
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data?.user) {
      // Garantiza la fila en public.profiles (independiente del trigger).
      await ensureProfile(data.user.id);

      // Redirect to main page with login_success flag for success banner
      const redirectUrl = new URL(next, origin);
      redirectUrl.searchParams.set("login_success", "true");
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
