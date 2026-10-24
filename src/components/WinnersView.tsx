"use client";

import { useCallback, useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion, scrambleText } from "@/lib/fx";
import ClipModal from "@/components/ClipModal";
import { PixelTrophy, PlayIcon } from "@/components/ui/Icons";
import type { CategoryResult, CategoryWithResult, Nominee } from "@/types";

interface WinnersViewProps {
  categories: CategoryWithResult[];
}

const pad = (n: number) => String(n).padStart(2, "0");

/* ------------------------------------------------------------------ */
/* Efectos                                                             */
/* ------------------------------------------------------------------ */

/** Confeti pixelado (cuadrados rosa / oro / cian que caen y giran). */
function burstConfetti(container: HTMLElement) {
  if (prefersReducedMotion()) return;
  const colors = ["#ff4fa3", "#ffc857", "#62e6ff", "#f4ece1", "#ff9acd"];
  for (let i = 0; i < 46; i++) {
    const piece = document.createElement("div");
    const size = 4 + Math.round(Math.random() * 3) * 2;
    piece.style.cssText = `position:absolute;top:-12px;left:${Math.random() * 100}%;width:${size}px;height:${size * (Math.random() > 0.6 ? 2 : 1)}px;background:${colors[i % colors.length]};z-index:30;pointer-events:none;`;
    container.appendChild(piece);
    gsap.to(piece, {
      y: container.offsetHeight + 30,
      x: `+=${(Math.random() - 0.5) * 160}`,
      rotation: Math.random() * 720 - 360,
      opacity: 0,
      duration: 1.6 + Math.random() * 1.4,
      ease: "power1.in",
      delay: Math.random() * 0.4,
      onComplete: () => piece.remove()
    });
  }
}

/* ------------------------------------------------------------------ */
/* Filas de resultados                                                 */
/* ------------------------------------------------------------------ */

/** Tabla de posiciones animada (barras + contadores) al expandir la tarjeta. */
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

      gsap.from(".res-row", {
        opacity: 0,
        x: -18,
        duration: 0.45,
        stagger: 0.07,
        ease: "power3.out",
        clearProps: "opacity,transform"
      });

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
    <div ref={rootRef} className="space-y-2.5">
      <p className="label pb-1">
        {totalVotes === 1 ? "1 voto emitido" : `${totalVotes} votos emitidos`}
      </p>

      {rows.map((r, i) => {
        const isWinner = !!winner && r.nominee_id === winner.nominee_id;
        const pct = Number(r.percentage) || 0;
        return (
          <div
            key={r.nominee_id}
            className={`res-row relative px-4 py-3 ${
              isWinner
                ? "bg-gold/10 shadow-[inset_0_0_0_1px_rgba(255,200,87,0.55)]"
                : "bg-ink-3 shadow-[inset_0_0_0_1px_var(--line)]"
            }`}
          >
            <div className="mb-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={`font-crt text-2xl ${
                    isWinner ? "text-gold" : "text-dim"
                  }`}
                >
                  {pad(i + 1)}
                </span>
                <span
                  className={`truncate text-[15px] ${
                    isWinner ? "font-semibold text-cream" : "text-cream-2"
                  }`}
                >
                  {r.name}
                </span>
                {isWinner && <PixelTrophy size={16} className="shrink-0 text-gold" />}
              </div>
              <div className="flex items-center gap-4">
                <button onClick={() => onOpenClip(r)} className="link-pixel">
                  <PlayIcon size={10} />
                  Ver clip
                </button>
                <span className="font-mono text-xs text-mute">{r.vote_count} V</span>
                <span
                  className={`winners-pct w-14 text-right font-crt text-2xl ${
                    isWinner ? "text-gold" : "text-cream-2"
                  }`}
                  data-val={pct}
                >
                  0%
                </span>
              </div>
            </div>

            <div className="h-2 overflow-hidden bg-ink-5">
              <div
                className={`winners-bar h-full ${
                  isWinner
                    ? "bg-gradient-to-r from-gold-dark via-gold to-[#ffe9a8] shadow-gold-glow"
                    : "bg-pink/55"
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
          delay: Math.min(index * 0.08, 0.6),
          clearProps: "transform"
        }
      );
    },
    { scope: cardRef, dependencies: [] }
  );

  // Spotlight del ganador: al expandirse, trofeo + nombre con scramble + rayos.
  useGSAP(
    () => {
      if (!isExpanded || !cardRef.current) return;
      const nameEl = cardRef.current.querySelector<HTMLElement>(
        "[data-winner-name]"
      );
      if (nameEl && winner) {
        const tl = gsap.timeline({ delay: 0.3 });
        tl.fromTo(
          "[data-winner-trophy]",
          { scale: 0, rotate: -25, y: 20 },
          { scale: 1, rotate: 0, y: 0, duration: 0.6, ease: "back.out(2.6)" }
        ).fromTo(
          nameEl,
          { scale: 0.7, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.45, ease: "back.out(2)" },
          "-=0.3"
        );
        scrambleText(nameEl, winner.name, 0.8);
        gsap.to("[data-winner-rays]", {
          rotate: 360,
          duration: 28,
          repeat: -1,
          ease: "none"
        });
        gsap.to("[data-winner-trophy]", {
          y: -4,
          duration: 1.6,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: 1
        });
      }
    },
    { scope: cardRef, dependencies: [isExpanded] }
  );

  return (
    <div
      ref={cardRef}
      data-cat-id={cat.id}
      className={`panel relative overflow-hidden p-5 sm:p-7 ${
        isExpanded && winner ? "panel--gold" : ""
      }`}
    >
      {/* Halo de escáner mientras se desencripta */}
      {isGlitching && (
        <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
          <div className="absolute left-0 right-0 h-10 bg-pink/25 blur-sm [animation:scan-down_0.6s_linear_infinite]" />
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <span className="font-crt text-5xl leading-none text-white/[0.14] sm:text-6xl">
            {pad(index + 1)}
          </span>
          {cat.icon && (
            <div className="px-frame flex h-11 w-11 shrink-0 items-center justify-center text-xl">
              {cat.icon}
            </div>
          )}
          <h3 className="font-display text-2xl font-medium tracking-wide text-cream sm:text-3xl">
            {cat.name}
          </h3>
        </div>

        {!isExpanded ? (
          winner ? (
            <button
              onClick={() => onReveal(cat)}
              disabled={isGlitching}
              className="btn btn-primary relative overflow-hidden"
            >
              <span className="relative z-10">
                {isGlitching ? "DESENCRIPTANDO" : "REVELAR GANADOR"}
              </span>
              <span className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent [animation:sweep-shine_2.6s_ease-in-out_infinite]" />
            </button>
          ) : (
            <span className="label border border-line px-3 py-2">Sin votos</span>
          )
        ) : (
          <button onClick={() => onCollapse(cat.id)} className="btn btn-ghost btn-sm">
            OCULTAR
          </button>
        )}
      </div>

      {!isExpanded ? (
        <p className="mt-4 flex items-center gap-3 font-mono text-xs uppercase tracking-[0.14em] text-dim">
          <span className="inline-block h-2 w-16 bg-[repeating-linear-gradient(90deg,var(--ink-5,#271f38)_0_6px,transparent_6px_9px)]" />
          {totalVotes > 0
            ? `${totalVotes} voto(s) registrados — resultado encriptado`
            : "Sin votos registrados aún"}
        </p>
      ) : (
        <>
          {/* Spot del ganador */}
          {winner && (
            <div className="relative my-8 overflow-hidden px-4 py-10 text-center" data-winner-spot>
              <div
                data-winner-rays
                className="pointer-events-none absolute left-1/2 top-1/2 h-[140%] w-[140%] -translate-x-1/2 -translate-y-1/2 opacity-60 [background:repeating-conic-gradient(from_0deg,rgba(255,200,87,0.16)_0deg_8deg,transparent_8deg_24deg)] [mask-image:radial-gradient(circle,black_0%,transparent_62%)]"
              />
              <div className="relative">
                <div data-winner-trophy className="mx-auto mb-4 inline-block text-gold drop-shadow-[0_0_18px_rgba(255,200,87,0.7)]">
                  <PixelTrophy size={56} />
                </div>
                <p className="eyebrow eyebrow--plain mb-3 text-gold">
                  — Ganador de la categoría —
                </p>
                <p
                  data-winner-name
                  className="phosphor-gold break-words font-display text-4xl font-medium leading-tight tracking-wide text-gold sm:text-6xl"
                >
                  {winner.name}
                </p>
                <p className="mt-4 font-mono text-xs uppercase tracking-[0.18em] text-mute">
                  {winner.vote_count} voto(s) · {Number(winner.percentage).toFixed(1)}% de la comunidad
                </p>
              </div>
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
          className="pointer-events-none absolute inset-0 z-10 crt-static opacity-0"
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Vista principal                                                     */
/* ------------------------------------------------------------------ */

/**
 * Vista de ganadores / gala.
 *
 * - Título con aberración cromática + subtítulo decodificado.
 * - Cada categoría es una tarjeta "sellada".
 * - Al pulsar REVELAR GANADOR: glitch GSAP (jitter + estática CRT + línea de
 *   escáner) y la tarjeta se expande EN SITIO.
 * - El ganador aparece con trofeo dorado, rayos giratorios, scramble del
 *   nombre y confeti pixelado.
 * - Tabla de posiciones con barras y contadores animados.
 * - Cada nominado conserva su botón "VER CLIP" (ClipModal).
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

  // Header: entrada, aberración cromática viva y subtítulo decodificado.
  useGSAP(
    () => {
      if (!rootRef.current) return;

      gsap.from(".gala-head > *", {
        opacity: 0,
        y: 24,
        duration: 0.6,
        stagger: 0.1,
        ease: "power3.out"
      });

      gsap.to(".gala-title", {
        "--rgb-split": "3px",
        duration: 1.6,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut"
      });

      // Subtítulo con efecto decoder.
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

      // Fogonazo de estática CRT.
      if (staticLayer) {
        tl.fromTo(
          staticLayer,
          { opacity: 0 },
          { opacity: 0.85, duration: 0.09, yoyo: true, repeat: 6 },
          0
        ).to(staticLayer, { opacity: 0, duration: 0.08 });
      }

      // Flash global breve.
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
      className="relative mx-auto w-full max-w-5xl px-4 py-14"
    >
      {/* Header de gala */}
      <div className="gala-head mb-10 text-center">
        <p className="eyebrow eyebrow--plain mb-4 justify-center text-pink-400">
          <span className="inline-block h-2 w-2 animate-pulse-glow bg-[#ff4f6a] shadow-[0_0_10px_#ff4f6a]" />
          Transmisión en vivo
        </p>
        <h2 className="gala-title rgb-split mb-4 font-display text-6xl font-medium tracking-[0.06em] text-cream sm:text-8xl">
          GANADORES
        </h2>
        <p
          data-gala-subtitle
          data-text="Resultados oficiales de la comunidad"
          className="font-mono text-sm uppercase tracking-[0.18em] text-mute"
        >
          {" "}
        </p>
        <div className="rule mx-auto mt-8 max-w-xl" />
      </div>

      <div className="space-y-5">
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

      <p className="mt-12 text-center font-mono text-[11px] uppercase tracking-[0.3em] text-dim">
        — Fin de la transmisión · Condesa Awards 2026 —
      </p>

      <ClipModal
        mode={clip?.mode ?? "preview"}
        nominee={clip?.nominee ?? null}
        categoryName={clip?.categoryName}
        results={clip?.results ?? []}
        onClose={() => setClip(null)}
      />
    </section>
  );
}
