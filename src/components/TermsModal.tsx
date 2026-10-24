"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

interface TermsModalProps {
  onAccept: () => void;
  onReject: () => void;
}

/**
 * Kill switch global de audio: pausa y rebobina la música de la intro para
 * que los clips de Twitch se reproduzcan con audio limpio.
 */
function stopIntroAudio() {
  const intro = (
    window as unknown as { __introAudio?: HTMLAudioElement }
  ).__introAudio;
  if (intro) {
    intro.pause();
    intro.currentTime = 0;
  }
}

const TERMS: { title: string; body: string }[] = [
  {
    title: "AUTENTICACIÓN",
    body: "Se utilizan tokens de sesión OAuth de Twitch y Discord para verificar tu identidad. Estos tokens se almacenan únicamente como cookies de sesión HTTP-only."
  },
  {
    title: "VERIFICACIÓN DE VOTO",
    body: "Cada voto se registra con tu ID de usuario único para prevenir duplicados. No se almacena información personal adicional."
  },
  {
    title: "GALLETAS (COOKIES)",
    body: "Se usan cookies técnicas estrictamente necesarias para mantener tu sesión de voto. No se utilizan cookies de tracking ni analytics de terceros."
  },
  {
    title: "REVOCACIÓN",
    body: "Puedes revocar el acceso desconectando la aplicación en la configuración de Twitch/Discord. Tu voto permanecerá anónimo en los resultados públicos."
  }
];

export default function TermsModal({ onAccept, onReject }: TermsModalProps) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from(".terms-card", {
        opacity: 0,
        y: 28,
        scale: 0.97,
        duration: 0.45,
        ease: "power3.out"
      });
      gsap.from(".terms-item", {
        opacity: 0,
        x: -14,
        duration: 0.4,
        stagger: 0.08,
        delay: 0.25,
        ease: "power2.out"
      });
    },
    { scope: root }
  );

  const handleAccept = () => {
    stopIntroAudio();
    onAccept();
  };

  const handleReject = () => {
    stopIntroAudio();
    onReject();
  };

  return (
    <div
      ref={root}
      className="modal-backdrop fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="terms-title"
    >
      <div className="terms-card panel panel--accent w-full max-w-xl p-6 sm:p-8">
        <p className="eyebrow mb-2">Antes de continuar</p>
        <h2
          id="terms-title"
          className="mb-5 font-display text-2xl font-medium tracking-wide text-cream sm:text-3xl"
        >
          AVISO LEGAL Y COOKIES
        </h2>

        <p className="label mb-4">
          Al acceder a este sistema de votación, aceptas los siguientes términos:
        </p>

        <ol className="mb-6 max-h-64 space-y-4 overflow-y-auto pr-3">
          {TERMS.map((t, i) => (
            <li key={t.title} className="terms-item flex gap-4">
              <span className="mt-0.5 font-mono text-xs font-semibold text-pink-400">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <p className="mb-1 font-display text-sm font-medium tracking-widest text-cream">
                  {t.title}
                </p>
                <p className="text-sm leading-relaxed text-mute">{t.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="rule mb-5" />

        <div className="flex flex-col-reverse items-stretch justify-end gap-3 sm:flex-row sm:items-center">
          <button onClick={handleReject} className="btn btn-ghost btn-sm">
            RECHAZAR
          </button>
          <button onClick={handleAccept} className="btn btn-primary">
            ACEPTAR Y CONTINUAR
          </button>
        </div>

        <p className="mt-5 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-dim">
          Condesa Awards 2026 · Sistema oficial de votación
        </p>
      </div>
    </div>
  );
}
