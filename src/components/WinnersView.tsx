"use client";

import { useCallback, useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import ClipModal from "@/components/ClipModal";
import type { CategoryResult, CategoryWithResult, Nominee } from "@/types";

interface WinnersViewProps {
  categories: CategoryWithResult[];
}

/* ------------------------------------------------------------------ */
/* Utilidades retro                                                    */
/* ------------------------------------------------------------------ */

const GLYPHS = "▚▞▛▜▙▟█▓▒░01▓█@#$%&*+=<>/\\|";
const randGlyph = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)];

/** Escribe texto carácter por carácter con "estática" (efecto decoder). */
function scrambleText(el: HTMLElement, finalText: string, duration = 0.8) {
  const proxy = { p: 0 };
  return gsap.to(proxy, {
    p: 1,
    duration,
    ease: "power2.inOut",
    onUpdate: () => {
      const reveal = Math.floor(proxy.p * finalText.length);
      let out = finalText.slice(0, reveal);
      for (let i = reveal; i < finalText.length; i++) {
        out += finalText[i] === " " ? " " : randGlyph();
      }
      el.textContent = out;
    },
    onComplete: () => {
      el.textContent = finalText;
    }
  });
}

/** Confeti pixelado rosa (30 divs que caen y giran). */
function burstConfetti(container: HTMLElement) {
  const colors = ["#ec4899", "#f472b6", "#fbcfe8", "#ffffff"];
  for (let i = 0; i < 30; i++) {
    const piece = document.createElement("div");
    const size = 4 + Math.random() * 6;
    piece.style.cssText = `position:absolute;top:-12px;left:${Math.random() * 100}%;width:${size}px;height:${size * (Math.random() > 0.5 ? 1 : 2)}px;background:${colors[i % colors.length]};z-index:30;pointer-events:none;`;
    container.appendChild(piece);
    gsap.to(piece, {
      y: container.offsetHeight + 30,
      x: `+=${(Math.random() - 0.5) * 140}`,
      rotation: Math.random() * 720 - 360,
      opacity: 0,
      duration: 1.6 + Math.random() * 1.4,
      ease: "power1.in",
      delay: Math.random() * 0.35,
      onComplete: () => piece.remove()
    });
  }
}

/* ------------------------------------------------------------------ */
/* Filas de resultados                                                 */
/* ------------------------------------------------------------------ */

/** Fila animada de resultados (barras + contadores) cuando la tarjeta se expande. */
function ResultRows({
  cat,
  winner,
  onOpenClip
}: {
  cat: CategoryWithResult;
  winner: CategoryResult | null;
  onOpenClip: (r: CategoryResult) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      // Barras: de 0% a su porcentaje, con stagger.
      const bars = root.querySelectorAll<HTMLElement>(".winners-bar");
      gsap.fromTo(
        bars,
        { width: "0%" },
        {
          width: (_i: number, el: HTMLElement) => `${el.dataset.pct ?? 0}%`,
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.08,
          delay: 0.15
        }
      );

      // Contadores: 0 → porcentaje final.
      const counters = root.querySelectorAll<HTMLElement>(".winners-pct");
      counters.forEach((c) => {
        const target = Number(c.dataset.val ?? 0);
        const proxy = { n: 0 };
        gsap.to(proxy, {
          n: target,
          duration: 0.9,
          ease: "power3.out",
          delay: 0.15,
          onUpdate: () => {
            c.textContent = `${Math.round(proxy.n)}%`;
          }
        });
      });
    },
    { scope: rootRef }
  );

  const rows = [...cat.results].sort((a, b) => b.vote_count - a.vote_count);
  const totalVotes = rows.reduce((s, r) => s + r.vote_count, 0);

  return (
    <div ref={rootRef} className="space-y-3">
      <p className="font-retro text-[11px] text-neutral-500">
        {totalVotes === 1 ? "1 VOTO EMITIDO" : `${totalVotes} VOTOS EMITIDOS`}
      </p>

      {rows.map((r, i) => {
        const isWinner = !!winner && r.nominee_id === winner.nominee_id;
        const pct = Number(r.percentage) || 0;
        return (
          <div
            key={r.nominee_id}
            className={`relative rounded-sm p-3 transition-colors ${
              isWinner
                ? "border-2 border-pink-500 bg-pink-500/10 shadow-pink-glow"
                : "border border-white/10 bg-black/40"
            }`}
          >
            {isWinner && (
              <span className="absolute -top-2.5 right-3 font-pixel text-[8px] text-pink-400 neon-text bg-black px-2 py-0.5 border border-pink-500/70 animate-pulse-glow">
                🏆 GANADOR
              </span>
            )}

            <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
              <span
                className={`font-retro text-sm ${
                  isWinner ? "text-white" : "text-neutral-300"
                }`}
              >
                {String(i + 1).padStart(2, "0")} · {r.name}
              </span>
              <div className="flex items-center gap-3 font-retro text-xs">
                <button
                  onClick={() => onOpenClip(r)}
                  className="font-retro text-[11px] text-pink-400 hover:text-white transition-colors"
                >
                  [ VER CLIP ]
                </button>
                <span className="text-neutral-500">{r.vote_count} V</span>
                <span
                  className={`winners-pct font-pixel text-[9px] ${
                    isWinner ? "text-pink-400 neon-text" : "text-neutral-400"
                  }`}
                  data-val={pct}
                >
                  0%
                </span>
              </div>
            </div>

            <div className="h-2.5 bg-neutral-800 border border-white/10 overflow-hidden">
              <div
                className={`winners-bar h-full ${
                  isWinner
                    ? "bg-gradient-to-r from-pink-600 via-pink-400 to-pink-300 shadow-pink-glow"
                    : "bg-pink-500/45"
                }`}
                data-pct={pct}
                style={{ width: "0%" }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tarjeta de categoría                                                */
/* ------------------------------------------------------------------ */

function CategoryCard({
  cat,
  index,
  expanded,
  glitching,
  onReveal,
  onCollapse,
  onOpenClip
}: {
  cat: CategoryWithResult;
  index: number;
  expanded: boolean;
  glitching: boolean;
  onReveal: (cat: CategoryWithResult) => void;
  onCollapse: (id: string) => void;
  onOpenClip: (
    cat: CategoryWithResult,
    r: CategoryResult,
    winner: CategoryResult | null
  ) => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [spotlightDone, setSpotlightDone] = useState(false);

  const sorted = [...cat.results].sort((a, b) => b.vote_count - a.vote_count);
  const winner = sorted[0] && sorted[0].vote_count > 0 ? sorted[0] : null;
  const isExpanded = expanded;
  const isGlitching = glitching;
  const totalVotes = sorted.reduce((s, r) => s + r.vote_count, 0);

  // Entrada de la tarjeta (stagger manejado por delay según índice).
  useGSAP(
    () => {
      if (!cardRef.current) return;
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 40, scale: 0.97 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.55,
          ease: "power3.out",
          delay: Math.min(index * 0.08, 0.6)
        }
      );
    },
    { scope: cardRef, dependencies: [] }
  );

  // Spotlight del ganador: al expandirse, el nombre hace scramble + glow.
  useGSAP(
    () => {
      if (!isExpanded || !cardRef.current) return;
      const nameEl = cardRef.current.querySelector<HTMLElement>(
        "[data-winner-name]"
      );
      if (nameEl && winner) {
        const tl = gsap.timeline({ delay: 0.55 });
        tl.fromTo(
          nameEl,
          { scale: 0.6, opacity: 0 },
          { scale: 1.08, opacity: 1, duration: 0.35, ease: "back.out(2.2)" }
        ).to(nameEl, { scale: 1, duration: 0.25, ease: "power2.out" });
        scrambleText(nameEl, winner.name, 0.7);
        tl.add(() => setSpotlightDone(true));
      } else {
        setSpotlightDone(true);
      }
    },
    { scope: cardRef, dependencies: [isExpanded] }
  );

  return (
    <div
      ref={cardRef}
      data-cat-id={cat.id}
      className={`relative border rounded-sm p-5 overflow-hidden transition-colors ${
        isExpanded && winner
          ? "border-pink-500/60 bg-pink-950/20 shadow-pink-glow"
          : "border-white/20 bg-neutral-900/70"
      }`}
    >
      {/* Halo de escáner mientras se desencripta */}
      {isGlitching && (
        <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
          <div className="absolute left-0 right-0 h-10 bg-pink-500/20 blur-sm animate-[scanline_0.6s_linear_infinite]" />
        </div>
      )}

      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <h3 className="font-retro text-xl sm:text-2xl text-white">
          <span className="font-pixel text-[10px] text-pink-500/70 mr-2">
            {String(index + 1).padStart(2, "0")}
          </span>
          {cat.icon && <span className="mr-2">{cat.icon}</span>}
          {cat.name}
        </h3>

        {!isExpanded ? (
          winner ? (
            <button
              onClick={() => onReveal(cat)}
              disabled={isGlitching}
              className="group relative font-pixel text-[9px] px-5 py-2.5 bg-black text-pink-400 border-2 border-pink-500 rounded-sm shadow-pink-glow hover:bg-pink-500 hover:text-black transition-colors disabled:opacity-60 overflow-hidden"
            >
              <span className="relative z-10">
                {isGlitching ? "▚▚ DESENCRIPTANDO" : "[ REVELAR GANADOR ]"}
              </span>
              {/* Brillo que barre el botón */}
              <span className="absolute inset-y-0 -left-full w-full bg-gradient-to-r from-transparent via-pink-400/40 to-transparent group-hover:animate-[sweep_0.8s_ease-out]" />
            </button>
          ) : (
            <span className="font-pixel text-[8px] text-neutral-600 border border-white/10 px-3 py-2">
              SIN VOTOS
            </span>
          )
        ) : (
          <button
            onClick={() => onCollapse(cat.id)}
            className="font-pixel text-[9px] px-4 py-2 bg-black text-neutral-300 border border-white/30 rounded-sm hover:border-white hover:text-white transition-colors"
          >
            [ OCULTAR ]
          </button>
        )}
      </div>

      {!isExpanded ? (
        <p className="font-sans text-sm text-neutral-500">
          {totalVotes > 0
            ? `${totalVotes} voto(s) registrados — resultado encriptado.`
            : "Sin votos registrados aún."}
        </p>
      ) : (
        <>
          {/* Spot del ganador (épico) */}
          {winner && (
            <div className="relative mb-6 mt-2 text-center" data-winner-spot>
              <div
                className={`inline-block transition-opacity duration-300 ${
                  spotlightDone ? "opacity-100" : "opacity-90"
                }`}
              >
                <p className="font-pixel text-[9px] text-pink-400/80 mb-2 tracking-[0.3em]">
                  ── GANADOR DE LA CATEGORÍA ──
                </p>
                <p
                  data-winner-name
                  className="font-pixel text-xl sm:text-3xl text-pink-400 neon-text animate-pulse-glow leading-relaxed break-words"
                >
                  {winner.name}
                </p>
                <p className="font-retro text-sm text-neutral-400 mt-2">
                  {winner.vote_count} voto(s) · {Number(winner.percentage).toFixed(1)}% de la comunidad
                </p>
              </div>
              <div className="h-px w-2/3 mx-auto mt-5 bg-gradient-to-r from-transparent via-pink-500/70 to-transparent" />
            </div>
          )}

          <ResultRows
            cat={cat}
            winner={winner}
            onOpenClip={(r) => onOpenClip(cat, r, winner)}
          />
        </>
      )}

      {/* Capa de estática CRT durante el glitch */}
      {isGlitching && (
        <div
          data-reveal-static
          className="pointer-events-none absolute inset-0 crt-static opacity-0 z-10"
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Vista principal                                                     */
/* ------------------------------------------------------------------ */

/**
 * Vista de ganadores / gala (edición épica).
 *
 * - Título con flicker de neón + subtítulo con máquina de escribir.
 * - Cada categoría es una tarjeta colapsada con hover neón.
 * - Al pulsar "[ REVELAR GANADOR ]": glitch GSAP (jitter + estática CRT +
 *   línea de escáner) y la tarjeta se expande EN SITIO.
 * - El nombre del ganador aparece con spotlight (scale back.out) + efecto
 *   decoder/scramble + confeti pixelado rosa.
 * - Barras de porcentaje y contadores animados por fila.
 * - Cada nominado conserva su botón "[ VER CLIP ]" (ClipModal intacto).
 */
export default function WinnersView({ categories }: WinnersViewProps) {
  const rootRef = useRef<HTMLElement>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [glitching, setGlitching] = useState<string | null>(null);
  const [clip, setClip] = useState<{
    mode: "preview" | "winner";
    nominee: Nominee;
    categoryName: string;
    results: CategoryResult[];
  } | null>(null);

  const openClipFor = useCallback(
    (
      cat: CategoryWithResult,
      r: CategoryResult,
      winner: CategoryResult | null
    ) => {
      const isWinner = !!winner && r.nominee_id === winner.nominee_id;
      setClip({
        mode: isWinner ? "winner" : "preview",
        nominee: {
          id: r.nominee_id,
          category_id: cat.id,
          name: r.name,
          description: null,
          image_url: null,
          clip_url: r.clip_url ?? null,
          clip_platform: r.clip_platform ?? null,
          sort_order: 0
        },
        categoryName: cat.name,
        results: isWinner
          ? [...cat.results].sort((a, b) => b.vote_count - a.vote_count)
          : []
      });
    },
    []
  );

  const handleReveal = useCallback((cat: CategoryWithResult) => {
    if (expanded[cat.id]) return;
    setGlitching((prev) => (prev ? prev : cat.id));
  }, [expanded]);

  const handleCollapse = useCallback((id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: false }));
  }, []);

  // Header: flicker de neón del título.
  useGSAP(
    () => {
      if (!rootRef.current) return;
      gsap.to(".gala-title", {
        textShadow:
          "0 0 8px #f472b6, 0 0 22px #ec4899, 0 0 50px rgba(236,72,153,0.6), 0 0 90px rgba(236,72,153,0.35)",
        duration: 1.4,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut"
      });

      // Subtítulo con máquina de escribir.
      const subtitle = rootRef.current.querySelector<HTMLElement>(
        "[data-gala-subtitle]"
      );
      if (subtitle) {
        const text = subtitle.dataset.text ?? "";
        scrambleText(subtitle, text, 1.2);
      }
    },
    { scope: rootRef, dependencies: [] }
  );

  // Efecto glitch al revelar: jitter + estática + escáner, luego expande.
  useGSAP(
    () => {
      if (!glitching) return;
      const card = document.querySelector<HTMLElement>(
        `[data-cat-id="${glitching}"]`
      );
      if (!card) {
        setGlitching(null);
        return;
      }
      const staticLayer = card.querySelector<HTMLElement>(
        "[data-reveal-static]"
      );

      const tl = gsap.timeline({
        onComplete: () => {
          setExpanded((prev) => ({ ...prev, [glitching]: true }));
          setGlitching(null);
          // Confeti épico justo al terminar el glitch.
          burstConfetti(card);
        }
      });

      // Jitter / glitch de la tarjeta.
      tl.to(card, {
        x: -6,
        duration: 0.05,
        repeat: 7,
        yoyo: true,
        ease: "steps(1)"
      });

      // Fogonazo de estática CRT (más intenso que antes).
      if (staticLayer) {
        tl.fromTo(
          staticLayer,
          { opacity: 0 },
          { opacity: 0.9, duration: 0.09, yoyo: true, repeat: 6 },
          0
        ).to(staticLayer, { opacity: 0, duration: 0.08 });
      }

      // Flash rosa global breve.
      tl.fromTo(
        card,
        { filter: "brightness(2.2) saturate(2)" },
        { filter: "brightness(1) saturate(1)", duration: 0.35 },
        ">-0.1"
      );

      return () => {
        tl.kill();
      };
    },
    { dependencies: [glitching] }
  );

  return (
    <section
      ref={rootRef}
      id="ganadores"
      className="relative py-14 px-4 max-w-5xl mx-auto w-full"
    >
      {/* Header de gala */}
      <div className="text-center mb-4">
        <p className="font-pixel text-[9px] text-pink-500/80 tracking-[0.35em] mb-3">
          ── TRANSMISIÓN EN VIVO ──
        </p>
        <h2 className="gala-title font-pixel text-3xl sm:text-4xl md:text-5xl text-white mb-3">
          GANADORES
        </h2>
        <p
          data-gala-subtitle
          data-text="Resultados oficiales de la comunidad"
          className="font-retro text-neutral-400 text-lg"
        >
          {"\u00A0"}
        </p>
      </div>

      <div className="h-px w-full max-w-xl mx-auto mb-10 bg-gradient-to-r from-transparent via-pink-500/60 to-transparent" />

      <div className="space-y-6">
        {categories.map((cat, i) => (
          <CategoryCard
            key={cat.id}
            cat={cat}
            index={i}
            expanded={!!expanded[cat.id]}
            glitching={glitching === cat.id}
            onReveal={handleReveal}
            onCollapse={handleCollapse}
            onOpenClip={openClipFor}
          />
        ))}
      </div>

      <p className="mt-10 text-center font-pixel text-[8px] text-neutral-600 tracking-widest">
        [ FIN DE LA TRANSMISIÓN · CONDESA AWARDS 2026 ]
      </p>

      <ClipModal
        mode={clip?.mode ?? "preview"}
        nominee={clip?.nominee ?? null}
        categoryName={clip?.categoryName}
        results={clip?.results ?? []}
        onClose={() => setClip(null)}
      />

      {/* Keyframes locales (sweep del botón + línea de escáner) */}
      <style jsx global>{`
        @keyframes sweep {
          from {
            left: -100%;
          }
          to {
            left: 100%;
          }
        }
        @keyframes scanline {
          0% {
            top: -10%;
          }
          100% {
            top: 110%;
          }
        }
      `}</style>
    </section>
  );
}
