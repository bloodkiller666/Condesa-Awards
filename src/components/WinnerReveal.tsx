"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import confetti from "canvas-confetti";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/fx";
import { PixelTrophy, PlayIcon } from "@/components/ui/Icons";
import type { CategoryResult } from "@/types";

interface WinnerRevealProps {
  categoryName: string;
  categoryIcon?: string | null;
  index: number;
  results: CategoryResult[];
  winner: CategoryResult;
  onWatchClip: () => void;
  onClose: () => void;
}

/* ------------------------------------------------------------------ */
/* Audio sintetizado (sin assets): ticks de redoble + fanfarria        */
/* ------------------------------------------------------------------ */

type AudioCtor = typeof AudioContext;

function createSfx() {
  let ctx: AudioContext | null = null;
  const get = () => {
    if (ctx) return ctx;
    try {
      const Ctor: AudioCtor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: AudioCtor }).webkitAudioContext;
      ctx = new Ctor();
    } catch {
      ctx = null;
    }
    return ctx;
  };

  const beep = (freq: number, dur: number, vol: number, type: OscillatorType, at = 0) => {
    const c = get();
    if (!c) return;
    const t = c.currentTime + at;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(c.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  };

  return {
    /** Tick del redoble: el tono sube con el progreso (0–1). */
    tick(p: number) {
      beep(300 + p * 700, 0.05, 0.05, "square");
    },
    /** Acorde mayor ascendente + golpe grave. */
    fanfare() {
      beep(70, 0.5, 0.18, "sine");
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
        beep(f, 0.55, 0.05, "square", i * 0.09);
        beep(f / 2, 0.55, 0.04, "triangle", i * 0.09);
      });
    },
    close() {
      ctx?.close().catch(() => {});
      ctx = null;
    }
  };
}

/* ------------------------------------------------------------------ */
/* Confeti                                                             */
/* ------------------------------------------------------------------ */

const CONFETTI_COLORS = ["#ffc857", "#ff4fa3", "#62e6ff", "#f4ece1", "#ffe9a8"];

function fireConfetti(stopRef: { current: boolean }) {
  const base = {
    colors: CONFETTI_COLORS,
    zIndex: 88,
    shapes: ["square"] as confetti.Shape[],
    disableForReducedMotion: true
  };

  // Estallido central.
  confetti({ ...base, particleCount: 160, spread: 100, startVelocity: 58, origin: { y: 0.55 }, scalar: 1.2 });
  confetti({ ...base, particleCount: 60, spread: 360, startVelocity: 28, ticks: 220, origin: { y: 0.45 }, scalar: 0.9 });

  // Cañones laterales sostenidos.
  const end = Date.now() + 2600;
  const frame = () => {
    if (stopRef.current) return;
    confetti({ ...base, particleCount: 4, angle: 60, spread: 62, startVelocity: 62, origin: { x: 0, y: 0.75 } });
    confetti({ ...base, particleCount: 4, angle: 120, spread: 62, startVelocity: 62, origin: { x: 1, y: 0.75 } });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
}

/* ------------------------------------------------------------------ */
/* Componente                                                          */
/* ------------------------------------------------------------------ */

/**
 * Secuencia cinematográfica de revelado de ganador (pantalla completa):
 *
 *  1. Letterbox + título de la categoría (SplitText).
 *  2. "Y el ganador es..." con redoble: una ruleta de nominados que frena
 *     con una curva personalizada (CustomEase) y suena un tick por paso.
 *  3. Clímax: flash, sacudida de cámara, ondas de choque, rayos de luz,
 *     trofeo que cae con rebote, nombre letra por letra con aberración
 *     cromática, contadores y confeti (canvas-confetti).
 *  4. Acciones: ver el clip del ganador o continuar.
 */
export default function WinnerReveal({
  categoryName,
  categoryIcon,
  index,
  results,
  winner,
  onWatchClip,
  onClose
}: WinnerRevealProps) {
  const root = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const stopConfetti = useRef(false);
  const sfxRef = useRef<ReturnType<typeof createSfx> | null>(null);
  const [done, setDone] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const pct = Number(winner.percentage) || 0;

  // Bloqueo de scroll + limpieza.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    stopConfetti.current = false;
    return () => {
      document.body.style.overflow = prev;
      stopConfetti.current = true;
      confetti.reset();
      sfxRef.current?.close();
    };
  }, []);

  useGSAP(
    () => {
      const reduced = prefersReducedMotion();
      const sfx = createSfx();
      sfxRef.current = sfx;

      // Secuencia de nombres de la ruleta: mezcla de nominados que termina
      // siempre en el ganador.
      const others = results.filter((r) => r.nominee_id !== winner.nominee_id).map((r) => r.name);
      const pool = others.length ? others : ["…"];
      const STEPS = 30;
      const seq: string[] = [];
      for (let i = 0; i < STEPS; i++) seq.push(pool[i % pool.length]);
      seq.push(winner.name);

      const slot = root.current!.querySelector<HTMLElement>(".wr-slot-text")!;
      const winnerEl = root.current!.querySelector<HTMLElement>(".wr-winner")!;
      const catEl = root.current!.querySelector<HTMLElement>(".wr-cat")!;

      const catSplit = SplitText.create(catEl, { type: "chars" });
      const winSplit = SplitText.create(winnerEl, { type: "chars" });

      // Estado inicial.
      gsap.set(
        [".wr-eyebrow", ".wr-teaser", ".wr-slot", ".wr-trophy", ".wr-label", ".wr-stats", ".wr-actions", ".wr-rays", ".wr-ring", ".wr-flash"],
        { opacity: 0 }
      );
      gsap.set(winSplit.chars, { opacity: 0 });
      gsap.set(".wr-bar", { scaleY: 0 });
      slot.textContent = seq[0];

      const lastIdx = { v: -1 };
      const spin = { p: 0 };
      const counter = { n: 0 };

      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        onComplete: () => setDone(true)
      });
      tlRef.current = tl;

      // 1 · Apertura -------------------------------------------------
      tl.to(".wr-bar", { scaleY: 1, duration: 0.7, ease: "power4.out", stagger: 0 })
        .to(".wr-bg", { opacity: 1, duration: 0.8 }, 0)
        .to(".wr-eyebrow", { opacity: 1, y: 0, duration: 0.5 }, 0.35)
        .from(catSplit.chars, { opacity: 0, yPercent: 110, rotationX: -80, duration: 0.6, stagger: 0.03, ease: "back.out(1.6)" }, 0.45)
        .to(".wr-teaser", { opacity: 1, duration: 0.3 }, 1.5)
        .to(".wr-teaser", { duration: 0.9, scrambleText: { text: "Y EL GANADOR ES...", chars: "▚▞█▓01#%", speed: 0.6 } }, 1.5)
        .to(".wr-stage", { scale: 1.06, duration: 5.4, ease: "power1.in" }, 1.5);

      // 2 · Redoble --------------------------------------------------
      const spinStart = 2.1;
      tl.fromTo(".wr-slot", { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.4 }, spinStart)
        .to(
          spin,
          {
            p: 1,
            duration: reduced ? 0.4 : 4.4,
            ease: "drumroll",
            onUpdate: () => {
              const i = Math.min(seq.length - 1, Math.floor(spin.p * (seq.length - 1)));
              if (i === lastIdx.v) return;
              lastIdx.v = i;
              slot.textContent = seq[i];
              sfx.tick(spin.p);
              gsap.fromTo(slot, { y: -16, opacity: 0.35 }, { y: 0, opacity: 1, duration: 0.09, overwrite: true });
              gsap.set(slot, { "--rgb-split": `${(1 - spin.p) * 10}px` });
            }
          },
          spinStart + 0.3
        )
        // Suspenso: breve silencio y oscurecimiento antes del golpe.
        .to(".wr-slot", { scale: 1.12, duration: 0.5, ease: "power2.in" }, ">-0.2")
        .to(".wr-bg", { opacity: 0.4, duration: 0.35 }, "<");

      // 3 · Clímax ---------------------------------------------------
      tl.addLabel("boom", ">+0.15")
        .call(() => {
          sfx.fanfare();
          if (!reduced) fireConfetti(stopConfetti);
        }, [], "boom")
        .set(".wr-slot", { opacity: 0 }, "boom")
        .set(".wr-teaser", { opacity: 0 }, "boom")
        // Flash blanco
        .fromTo(".wr-flash", { opacity: 1 }, { opacity: 0, duration: 0.9, ease: "power2.out", immediateRender: false }, "boom")
        // Sacudida de cámara
        .fromTo(
          ".wr-stage",
          { x: 0, y: 0, scale: 1.14 },
          {
            immediateRender: false,
            keyframes: [
              { x: -16, y: 8, duration: 0.05 },
              { x: 14, y: -10, duration: 0.05 },
              { x: -10, y: -6, duration: 0.05 },
              { x: 8, y: 6, duration: 0.05 },
              { x: -4, y: 2, duration: 0.05 },
              { x: 0, y: 0, scale: 1, duration: 0.6, ease: "elastic.out(1, 0.5)" }
            ]
          },
          "boom"
        )
        // Luz: halo + rayos giratorios
        .to(".wr-bg", { opacity: 1, duration: 0.6 }, "boom")
        .fromTo(".wr-rays", { opacity: 0, scale: 0.3 }, { opacity: 0.85, scale: 1, duration: 1.4, ease: "expo.out" }, "boom")
        // Ondas de choque
        .fromTo(
          ".wr-ring",
          { opacity: 0.9, scale: 0.1 },
          { opacity: 0, scale: 3.4, duration: 1.3, stagger: 0.18, ease: "power2.out", immediateRender: false },
          "boom"
        )
        // Trofeo cae con rebote
        .fromTo(
          ".wr-trophy",
          { opacity: 0, y: -220, scale: 2.6, rotate: -18 },
          { opacity: 1, y: 0, scale: 1, rotate: 0, duration: 0.9, ease: "bounce.out" },
          "boom+=0.05"
        )
        // Etiqueta
        .fromTo(".wr-label", { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5 }, "boom+=0.35")
        // Nombre: letra por letra con aberración cromática
        .fromTo(
          winSplit.chars,
          { opacity: 0, scale: 2.6, y: -60, rotationX: 90 },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            rotationX: 0,
            duration: 0.7,
            stagger: 0.04,
            ease: "back.out(2.4)"
          },
          "boom+=0.3"
        )
        .fromTo(
          winnerEl,
          { "--rgb-split": "26px" },
          { "--rgb-split": "2px", duration: 1.4, ease: "elastic.out(1, 0.4)" },
          "boom+=0.3"
        )
        // Estadísticas + contador
        .fromTo(".wr-stats", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5 }, "boom+=0.9")
        .to(
          counter,
          {
            n: pct,
            duration: 1.2,
            ease: "power3.out",
            onUpdate: () => {
              const el = root.current?.querySelector<HTMLElement>(".wr-pct");
              if (el) el.textContent = counter.n.toFixed(1);
            }
          },
          "boom+=0.9"
        )
        // Acciones
        .fromTo(".wr-actions", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.5 }, "boom+=1.5");

      // Bucles ambientales tras el clímax.
      tl.call(
        () => {
          gsap.to(".wr-rays", { rotate: "+=360", duration: 40, repeat: -1, ease: "none" });
          gsap.to(".wr-trophy-float", { y: -8, duration: 1.8, repeat: -1, yoyo: true, ease: "sine.inOut" });
          gsap.to(winnerEl, {
            textShadow:
              "0 0 4px rgba(255,200,87,0.9), 0 0 36px rgba(255,200,87,0.7), 0 0 90px rgba(255,200,87,0.4)",
            duration: 1.6,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
          });
        },
        [],
        "boom+=1.2"
      );

      // Reduced motion: salta directo al estado final.
      if (reduced) tl.progress(1);

      return () => {
        tl.kill();
        catSplit.revert();
        winSplit.revert();
      };
    },
    { scope: root }
  );

  const skip = () => {
    const tl = tlRef.current;
    if (tl && !done) tl.progress(1);
  };

  const finish = (after: () => void) => {
    if (leaving) return;
    setLeaving(true);
    gsap.to(root.current, {
      opacity: 0,
      duration: 0.35,
      ease: "power2.in",
      onComplete: after
    });
  };

  // Escape: salta la animación o, si ya terminó, continúa.
  const escRef = useRef<() => void>(() => {});
  escRef.current = () => (done ? finish(onClose) : skip());
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === " ") {
        // Si el modal de clip está abierto encima, él maneja la tecla.
        if (document.querySelector("[data-clip-modal]")) return;
        e.preventDefault();
        escRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={root}
      className="fixed inset-0 z-[85] overflow-hidden bg-ink"
      role="dialog"
      aria-modal="true"
      aria-label={`Revelando ganador de ${categoryName}`}
      onClick={() => !done && skip()}
    >
      {/* Luz ambiental */}
      <div
        className="wr-bg pointer-events-none absolute inset-0 opacity-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 48%, rgba(255,200,87,0.22), transparent 70%), radial-gradient(ellipse 90% 60% at 50% 110%, rgba(255,79,163,0.2), transparent 70%)"
        }}
      />
      {/* Rayos */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="wr-rays h-[190vmax] w-[190vmax] shrink-0 [background:repeating-conic-gradient(from_0deg,rgba(255,200,87,0.2)_0deg_6deg,transparent_6deg_20deg)] [mask-image:radial-gradient(circle,black_0%,transparent_34%)]" />
      </div>
      {/* Ondas de choque */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span className="wr-ring absolute h-56 w-56 rounded-full border-2 border-gold" />
        <span className="wr-ring absolute h-56 w-56 rounded-full border-2 border-pink" />
      </div>

      {/* Letterbox */}
      <div className="wr-bar pointer-events-none absolute inset-x-0 top-0 h-[9vh] origin-top bg-black" />
      <div className="wr-bar pointer-events-none absolute inset-x-0 bottom-0 h-[9vh] origin-bottom bg-black" />

      {/* Escenario */}
      <div className="wr-stage absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        <p className="wr-eyebrow eyebrow mb-3 translate-y-3 text-pink-400">
          Categoría {String(index + 1).padStart(2, "0")}
        </p>
        <h2 className="wr-cat mb-8 max-w-4xl font-display text-3xl font-medium tracking-wide text-cream [perspective:600px] sm:text-5xl">
          {categoryIcon ? <span className="mr-3">{categoryIcon}</span> : null}
          {categoryName}
        </h2>

        <p className="wr-teaser mb-6 h-6 font-mono text-sm uppercase tracking-[0.3em] text-mute">
          Y EL GANADOR ES...
        </p>

        {/* Ruleta + nombre final comparten celda */}
        <div className="relative grid min-h-[8rem] w-full max-w-6xl place-items-center">
          <div className="wr-slot col-start-1 row-start-1">
            <p className="wr-slot-text rgb-split font-display text-4xl font-medium tracking-wide text-cream sm:text-6xl lg:text-7xl" />
          </div>

          <div className="col-start-1 row-start-1 flex flex-col items-center">
            <div className="wr-trophy mb-5 text-gold drop-shadow-[0_0_28px_rgba(255,200,87,0.8)]">
              <div className="wr-trophy-float">
                <PixelTrophy size={96} />
              </div>
            </div>
            <p className="wr-label eyebrow eyebrow--plain mb-4 text-gold">
              — Ganador de la categoría —
            </p>
            <h3 className="wr-winner rgb-split phosphor-gold max-w-full break-words font-display text-5xl font-medium leading-tight tracking-wide text-gold [perspective:700px] sm:text-7xl lg:text-8xl">
              {winner.name}
            </h3>
            <p className="wr-stats mt-6 font-mono text-xs uppercase tracking-[0.2em] text-mute">
              {winner.vote_count} {winner.vote_count === 1 ? "voto" : "votos"} ·{" "}
              <span className="wr-pct font-crt text-2xl tracking-normal text-cream">0.0</span>
              <span className="font-crt text-2xl tracking-normal text-cream">%</span> de la comunidad
            </p>
          </div>
        </div>

        <div className="wr-actions mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onWatchClip();
            }}
            disabled={!done}
            className="btn btn-gold btn-lg"
          >
            <PlayIcon size={14} />
            VER CLIP DEL GANADOR
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              finish(onClose);
            }}
            disabled={!done}
            className="btn btn-ghost"
          >
            CONTINUAR
          </button>
        </div>
      </div>

      {/* Flash */}
      <div className="wr-flash pointer-events-none absolute inset-0 bg-white" />

      {/* Saltar */}
      {!done && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            skip();
          }}
          className="link-pixel absolute bottom-[calc(9vh+1rem)] right-6 z-10 text-mute"
        >
          Saltar
        </button>
      )}
    </div>,
    document.body
  );
}
