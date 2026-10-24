"use client";

import { gsap, useGSAP } from "@/lib/gsap";
import CountdownTimer from "@/components/CountdownTimer";
import { PixelTrophy } from "@/components/ui/Icons";
import { useRef } from "react";

export default function AlreadyVotedView() {
  const rootRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(".av-card", { opacity: 0, y: 36, scale: 0.97, duration: 0.7 })
        .from(
          ".av-badge",
          { scale: 0, rotate: -25, duration: 0.55, ease: "back.out(3)" },
          "-=0.3"
        )
        .from(".stagger-item", { opacity: 0, y: 18, duration: 0.5, stagger: 0.1 }, "-=0.3");

      // Destello suave que recorre el panel.
      gsap.fromTo(
        ".av-shine",
        { xPercent: -120 },
        { xPercent: 320, duration: 1.6, delay: 0.9, ease: "power2.inOut" }
      );
      gsap.to(".av-badge", {
        y: -5,
        duration: 1.8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });
    },
    { scope: rootRef }
  );

  return (
    <section
      ref={rootRef}
      id="already-voted"
      className="flex min-h-[60vh] items-center justify-center px-4 py-16"
    >
      <div className="av-card panel panel--accent relative w-full max-w-3xl overflow-hidden px-6 py-12 text-center sm:px-12">
        <div className="av-shine pointer-events-none absolute inset-y-0 left-0 w-1/4 skew-x-[-20deg] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <div className="av-badge mx-auto mb-6 flex h-16 w-16 items-center justify-center bg-gold text-ink shadow-gold-glow">
          <PixelTrophy size={32} className="text-ink" />
        </div>

        <div className="stagger-item">
          <p className="eyebrow mb-3">Votación completada</p>
          <h1 className="mb-6 font-display text-3xl font-medium tracking-wide text-cream sm:text-5xl">
            ¡VOTO REGISTRADO <span className="text-pink">EXITOSAMENTE!</span>
          </h1>
        </div>

        <div className="stagger-item">
          <p className="mx-auto mb-8 max-w-xl text-base leading-relaxed text-cream-2 sm:text-lg">
            Gracias por participar en los Condesa Awards 2026. Tu votación ha sido
            procesada correctamente.
          </p>
        </div>

        <div className="stagger-item mb-6">
          <div className="rule mb-6" />
          <p className="label">Los ganadores se revelarán en:</p>
        </div>

        <div className="stagger-item">
          <CountdownTimer />
        </div>
      </div>
    </section>
  );
}
