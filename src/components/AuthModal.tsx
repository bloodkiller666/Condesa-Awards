"use client";

import { useRef, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { gsap, useGSAP } from "@/lib/gsap";
import { DiscordIcon, TwitchIcon } from "@/components/ui/Icons";

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
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .from(".auth-card", { opacity: 0, y: 30, scale: 0.97, duration: 0.6 })
        .from(
          ".auth-item",
          { opacity: 0, y: 14, duration: 0.45, stagger: 0.09, clearProps: "transform,opacity" },
          "-=0.3"
        );
    },
    { scope: root }
  );

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
      ref={root}
      id="autenticacion"
      className="flex min-h-[80vh] w-full flex-col items-center justify-center px-4 py-16"
    >
      <div className="auth-card panel panel--accent w-full max-w-md overflow-hidden p-8 text-center sm:p-10">
        <p className="auth-item eyebrow mb-3">Acceso seguro</p>
        <h2 className="auth-item mb-4 font-display text-3xl font-medium tracking-wide text-cream">
          IDENTIFICACIÓN DE USUARIO
        </h2>

        <p className="auth-item mb-8 text-sm leading-relaxed text-mute">
          Inicia sesión para registrar tu voto de forma única y segura.
        </p>

        <div className="space-y-4">
          <button
            onClick={() => handleLogin("twitch")}
            disabled={pending}
            className="auth-item btn w-full py-4"
            style={
              {
                "--face": "#9146ff",
                "--edge": "#4a1fa8",
                "--fg": "#ffffff"
              } as React.CSSProperties
            }
          >
            <TwitchIcon size={18} />
            INICIAR CON TWITCH
          </button>

          <button
            onClick={() => handleLogin("discord")}
            disabled={pending}
            className="auth-item btn w-full py-4"
            style={
              {
                "--face": "#5865f2",
                "--edge": "#2b348f",
                "--fg": "#ffffff"
              } as React.CSSProperties
            }
          >
            <DiscordIcon size={18} />
            INICIAR CON DISCORD
          </button>
        </div>

        <div className="auth-item rule mb-4 mt-8" />
        <p className="auth-item label text-[10px]">Acceso exclusivo para la comunidad</p>
      </div>
    </section>
  );
}
