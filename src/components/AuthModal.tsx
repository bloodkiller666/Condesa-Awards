"use client";

import { useTransition } from "react";
import { createClient } from "@/lib/supabase/client";

type Provider = "twitch" | "discord";

interface AuthModalProps {
  onLoginSuccess?: () => void;
}

/**
 * Vista dedicada de autenticación (pantalla completa centrada).
 * Reemplaza el modal flotante anterior.
 * Se renderiza como sección principal cuando el usuario necesita autenticarse.
 */
export default function AuthModal({ onLoginSuccess }: AuthModalProps) {
  const [pending, startTransition] = useTransition();

  const handleLogin = (provider: Provider) => {
    startTransition(async () => {
      const supabase = createClient();
      await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/`
        }
      });
    });
  };

  return (
    <section
      id="autenticacion"
      className="min-h-[80vh] w-full flex flex-col items-center justify-center px-4 py-16"
    >
      <div className="w-full max-w-md">
        <div className="bg-neutral-900 border-2 border-pink-500/50 shadow-pink-glow p-8 rounded-sm text-center relative overflow-hidden">
          {/* Header */}
          <h2 className="font-pixel text-lg sm:text-xl text-pink-400 neon-text mb-6 tracking-wider">
            [ IDENTIFICACIÓN DE USUARIO ]
          </h2>

          {/* Body message */}
          <p className="font-sans text-neutral-400 text-base mb-10 leading-relaxed">
            Inicia sesión para registrar tu voto de forma única y segura.
          </p>

          {/* Action Buttons */}
          <div className="space-y-4">
            <button
              onClick={() => handleLogin("twitch")}
              disabled={pending}
              className="w-full font-pixel text-sm px-6 py-4 bg-black text-pink-400 border-2 border-pink-500 rounded-sm hover:bg-pink-500 hover:text-black shadow-pink-glow transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-neutral-900"
            >
              [ INICIAR CON TWITCH ]
            </button>

            <button
              onClick={() => handleLogin("discord")}
              disabled={pending}
              className="w-full font-pixel text-sm px-6 py-4 bg-black text-white border-2 border-white/40 rounded-sm hover:bg-white hover:text-black transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-neutral-900"
            >
              [ INICIAR CON DISCORD ]
            </button>
          </div>

          {/* Footer note */}
          <p className="mt-10 font-retro text-neutral-500 text-xs">
            Acceso exclusivo para la comunidad
          </p>

          {/* CRT scanlines overlay */}
          <div className="pointer-events-none absolute inset-0 crt-scanlines opacity-15" />
        </div>
      </div>
    </section>
  );
}