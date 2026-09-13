"use client";

import { gsap, useGSAP } from "@/lib/gsap";
import CountdownTimer from "@/components/CountdownTimer";
import { useRef } from "react";

export default function AlreadyVotedView() {
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!rootRef.current) return;

      const ctx = gsap.context(() => {
        gsap.fromTo(
          rootRef.current!,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }
        );

        gsap.fromTo(
          rootRef.current!.querySelectorAll(".stagger-item"),
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            ease: "power3.out",
            stagger: 0.1,
            delay: 0.2
          }
        );
      }, rootRef);

      return () => ctx.revert();
    },
    { scope: rootRef }
  );

  return (
    <section
      ref={rootRef}
      id="already-voted"
      className="min-h-[60vh] flex items-center justify-center px-4 py-16"
    >
      <div className="w-full max-w-3xl text-center">
        {/* Header */}
        <div className="stagger-item">
          <h1 className="font-pixel text-2xl sm:text-3xl md:text-4xl text-pink-400 neon-text animate-pulse-glow mb-8 tracking-wider">
            [ ¡VOTO REGISTRADO EXITOSAMENTE! ]
          </h1>
        </div>

        {/* Body Message */}
        <div className="stagger-item">
          <p className="font-retro text-lg sm:text-xl text-white mb-6 leading-relaxed">
            Gracias por participar en los Condesa Awards 2026. Tu votación ha sido
            procesada correctamente.
          </p>
        </div>

        {/* Subtitle */}
        <div className="stagger-item">
          <p className="font-retro text-base sm:text-lg text-neutral-400 mb-8">
            Los ganadores se revelarán en:
          </p>
        </div>

        {/* Countdown Timer */}
        <div className="stagger-item mb-12">
          <CountdownTimer />
        </div>

        {/* Decorative divider */}
        <div className="stagger-item flex items-center justify-center gap-4">
          <div className="h-px w-24 bg-gradient-to-r from-transparent via-pink-500 to-transparent" />
          <span className="font-pixel text-[9px] text-neutral-600">CONDESA AWARDS 2026</span>
          <div className="h-px w-24 bg-gradient-to-r from-pink-500 via-pink-500 to-transparent" />
        </div>

        {/* CRT scanlines overlay */}
        <div className="pointer-events-none absolute inset-0 crt-scanlines opacity-10" />
      </div>
    </section>
  );
}