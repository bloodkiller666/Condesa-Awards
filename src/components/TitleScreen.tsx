"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { glitchBurst, magnetic, prefersReducedMotion } from "@/lib/fx";
import { ArrowIcon, PixelTrophy } from "@/components/ui/Icons";

interface TitleScreenProps {
  onEnter: () => void;
  /** La imagen ya llega estabilizada por la transición: sin entrada letra por letra. */
  settled?: boolean;
}

/** Divide un texto en palabras/letras animables (accesible vía aria-label). */
function SplitChars({ text }: { text: string }) {
  return (
    <>
      {text.split(" ").map((word, wi, arr) => (
        <span key={wi} aria-hidden className="inline-block whitespace-nowrap">
          {word.split("").map((ch, ci) => (
            <span key={ci} className="title-ch inline-block will-change-transform">
              {ch}
            </span>
          ))}
          {wi < arr.length - 1 && <span className="inline-block">&nbsp;</span>}
        </span>
      ))}
    </>
  );
}

const STARS = Array.from({ length: 26 }, (_, i) => ({
  left: (i * 37 + 11) % 100,
  top: (i * 53 + 7) % 58,
  size: i % 5 === 0 ? 3 : 2
}));

/**
 * Pantalla principal de título (State 5).
 * Secuencia GSAP: encendido CRT -> letras entran en cascada -> aberración
 * cromática (RGB split) con ráfagas de glitch periódicas -> subtítulo -> CTA.
 */
export default function TitleScreen({ onEnter, settled = false }: TitleScreenProps) {
  const root = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const cta = useRef<HTMLButtonElement>(null);

  useGSAP(
    () => {
      const reduced = prefersReducedMotion();

      // Suelo en perspectiva avanzando + parpadeo de estrellas.
      gsap.to(".title-floor", {
        backgroundPosition: "0px 176px",
        duration: 3.2,
        repeat: -1,
        ease: "none"
      });
      if (!reduced) {
        gsap.to(".title-star", {
          opacity: 0.15,
          duration: 1.2,
          stagger: { each: 0.18, repeat: -1, yoyo: true },
          ease: "sine.inOut"
        });
      }

      if (reduced) return;

      if (settled) {
        gsap.set(title.current, { "--rgb-split": "1.5px" });
      } else {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(".title-eyebrow", { opacity: 0, y: 14, duration: 0.5 })
        .from(
          ".title-ch",
          {
            opacity: 0,
            yPercent: 60,
            rotationX: -90,
            transformOrigin: "50% 100%",
            duration: 0.55,
            stagger: 0.035
          },
          "-=0.15"
        )
        .fromTo(
          title.current,
          { "--rgb-split": "14px" },
          { "--rgb-split": "1.5px", duration: 0.9, ease: "elastic.out(1, 0.5)" },
          "-=0.4"
        )
        .from(".title-divider", { scaleX: 0, opacity: 0, duration: 0.6 }, "-=0.6")
        .from(".title-trophy", { scale: 0, rotate: -20, duration: 0.5, ease: "back.out(3)" }, "-=0.4")
        .from(cta.current, { opacity: 0, y: 22, duration: 0.5 }, "-=0.2");
      }

      // Ráfagas de glitch espaciadas.
      const loop = gsap.delayedCall(3.6, function repeat() {
        if (title.current) glitchBurst(title.current);
        gsap.delayedCall(2.8 + Math.random() * 2.4, repeat);
      });

      // Botón magnético.
      const off = cta.current ? magnetic(cta.current, 0.22) : undefined;

      return () => {
        loop.kill();
        off?.();
      };
    },
    { scope: root }
  );

  return (
    <div ref={root} className="absolute inset-0">
      {/* Horizonte + suelo en perspectiva */}
      <div className="absolute inset-x-0 bottom-0 h-[58%] overflow-hidden [perspective:420px]">
        <div
          className="title-floor retro-grid absolute -inset-x-1/2 bottom-0 top-0 origin-top [transform:rotateX(64deg)] [mask-image:linear-gradient(to_bottom,transparent,black_55%)]"
          style={{ backgroundSize: "44px 44px" }}
        />
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-[42%] h-40 -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,rgba(255,79,163,0.28),transparent_70%)]" />

      {/* Estrellas */}
      {STARS.map((s, i) => (
        <span
          key={i}
          className="title-star absolute bg-cream"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            opacity: 0.7
          }}
        />
      ))}

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <p className="title-eyebrow eyebrow eyebrow--plain mb-[2.4cqh] text-mute">
          — EST. 2026 · PREMIACIÓN OFICIAL —
        </p>

        <h1
          ref={title}
          aria-label="CONDESA AWARDS 2026"
          className="rgb-split font-display font-medium leading-[0.95] text-cream [perspective:700px]"
        >
          <span className="block text-[clamp(1.5rem,min(12cqh,7cqw),4.5rem)] tracking-wide">
            <SplitChars text="CONDESA AWARDS" />
          </span>
          <span className="mt-1 block text-[clamp(2rem,min(18cqh,11cqw),6rem)] text-pink tracking-[0.12em] [text-shadow:0_0_30px_rgba(255,79,163,0.45)]">
            <SplitChars text="2026" />
          </span>
        </h1>

        <div className="my-[3cqh] flex w-full max-w-md items-center gap-4">
          <span className="title-divider h-px flex-1 origin-right bg-gradient-to-r from-transparent to-pink/70" />
          <PixelTrophy size={22} className="title-trophy text-gold" />
          <span className="title-divider h-px flex-1 origin-left bg-gradient-to-l from-transparent to-pink/70" />
        </div>

        <button
          ref={cta}
          onClick={onEnter}
          className="btn btn-primary"
          style={{
            padding: "clamp(0.6rem,3.2cqh,1.05rem) clamp(1.2rem,4cqw,2rem)",
            fontSize: "clamp(0.8rem,3.6cqh,1.1rem)"
          }}
        >
          PRESIONA AQUÍ PARA ENTRAR
          <ArrowIcon size={16} />
        </button>
      </div>
    </div>
  );
}
