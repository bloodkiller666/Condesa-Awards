"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/fx";
import { CloseIcon, PixelTrophy } from "@/components/ui/Icons";
import type { CategoryResult, ClipModalMode, Nominee } from "@/types";

interface ClipModalProps {
  mode: ClipModalMode;
  nominee: Nominee | null;
  categoryName?: string;
  /** Resultados (para el modo "winner"). */
  results?: CategoryResult[];
  onClose: () => void;
}

/**
 * Twitch exige que `parent` coincida con el dominio donde vive el embed; si no,
 * el iframe muestra "contenido bloqueado". Lo reescribimos con el host actual
 * para que funcione igual en localhost, Vercel o un dominio propio.
 */
function resolveEmbedSrc(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname.endsWith("twitch.tv")) {
      u.searchParams.delete("parent");
      u.searchParams.append("parent", window.location.hostname);
      return u.toString();
    }
  } catch {
    /* URL no parseable: se usa tal cual */
  }
  return url;
}

/**
 * Modal unificado de clip con dos modos:
 * 1. "preview": previsualiza el clip de un nominado durante la votación.
 * 2. "winner": clip del ganador en formato "premiere": reproductor a la
 *    izquierda y tablero de resultados a la derecha, con acentos dorados.
 *
 * Se renderiza en un portal sobre <body> para escapar de cualquier stacking
 * context (header sticky, wrappers con z-index) y quedar siempre centrado.
 */
export default function ClipModal({
  mode,
  nominee,
  categoryName,
  results = [],
  onClose
}: ClipModalProps) {
  const [closing, setClosing] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<() => void>(() => {});

  const isWinner = mode === "winner";

  const close = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      onClose();
    }, 180);
  };
  closeRef.current = close;

  // Escape + bloqueo del scroll del fondo mientras el modal está abierto.
  useEffect(() => {
    if (!nominee) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [nominee]);

  useGSAP(
    () => {
      if (!nominee || !rootRef.current || !contentRef.current) return;
      const reduced = prefersReducedMotion();

      gsap.fromTo(
        rootRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.25, ease: "power1.out" }
      );
      gsap.fromTo(
        contentRef.current,
        { scale: 0.9, opacity: 0, y: 30, filter: "blur(8px)" },
        {
          scale: 1,
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.55,
          ease: "expo.out",
          clearProps: "filter"
        }
      );

      if (!isWinner || reduced) return;

      // Premiere: el nombre del ganador entra letra por letra.
      const nameEl = contentRef.current.querySelector<HTMLElement>("[data-clip-name]");
      if (nameEl) {
        const split = SplitText.create(nameEl, { type: "chars" });
        gsap.from(split.chars, {
          opacity: 0,
          y: 18,
          scale: 1.6,
          duration: 0.5,
          stagger: 0.025,
          delay: 0.25,
          ease: "back.out(2)"
        });
      }

      // Destello dorado que cruza el borde superior.
      gsap.fromTo(
        "[data-clip-shine]",
        { xPercent: -120 },
        { xPercent: 420, duration: 1.4, delay: 0.5, ease: "power2.inOut" }
      );
      gsap.from("[data-clip-side] > *", {
        opacity: 0,
        x: 24,
        duration: 0.5,
        stagger: 0.08,
        delay: 0.35,
        ease: "power3.out"
      });

      // Barras de porcentaje + contadores.
      contentRef.current.querySelectorAll<HTMLElement>(".clip-result-bar").forEach((bar) => {
        const pct = Number(bar.dataset.pct ?? 0);
        gsap.fromTo(
          bar,
          { width: 0 },
          { width: `${pct}%`, duration: 1.1, ease: "power3.out", delay: 0.6 }
        );
      });
      contentRef.current.querySelectorAll<HTMLElement>(".clip-result-pct").forEach((c) => {
        const val = Number(c.dataset.val ?? 0);
        const proxy = { n: 0 };
        gsap.to(proxy, {
          n: val,
          duration: 1.1,
          delay: 0.6,
          ease: "power3.out",
          onUpdate: () => {
            c.textContent = String(Math.round(proxy.n));
          }
        });
      });
    },
    { scope: rootRef, dependencies: [nominee?.id, mode], revertOnUpdate: true }
  );

  if (!nominee || typeof document === "undefined") return null;

  const sortedResults = [...results].sort(
    (a, b) => b.vote_count - a.vote_count
  );

  // El reproductor nunca excede el alto de la ventana: su ancho se limita en
  // función del alto disponible (16:9).
  const playerWidth = isWinner
    ? "min(100%, calc((100dvh - 11rem) * 16 / 9))"
    : "min(100%, calc((100dvh - 12rem) * 16 / 9))";

  return createPortal(
    <div
      ref={rootRef}
      data-clip-modal
      className={`modal-backdrop fixed inset-0 z-[90] flex items-center justify-center p-3 transition-opacity duration-150 sm:p-6 ${
        closing ? "opacity-0" : ""
      }`}
      onClick={close}
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={contentRef}
        onClick={(e) => e.stopPropagation()}
        className={`panel relative flex max-h-full w-full flex-col overflow-hidden ${
          isWinner ? "panel--gold max-w-[96rem]" : "panel--accent max-w-6xl"
        }`}
      >
        {/* Filo dorado superior con destello */}
        {isWinner && (
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[2px] overflow-hidden">
            <div className="h-full w-full bg-gradient-to-r from-transparent via-gold to-transparent opacity-70" />
            <div
              data-clip-shine
              className="absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-transparent via-white to-transparent"
            />
          </div>
        )}

        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-4 px-4 pb-3 pt-4 sm:px-6 sm:pt-5">
          <div className="min-w-0">
            {isWinner ? (
              <>
                <p className="eyebrow mb-1.5 text-gold">
                  <PixelTrophy size={14} />
                  Ganador{categoryName ? ` · ${categoryName}` : " de la categoría"}
                </p>
                <h3
                  data-clip-name
                  className="phosphor-gold truncate font-display text-2xl font-medium tracking-wide text-gold sm:text-4xl"
                >
                  {nominee.name.toUpperCase()}
                </h3>
              </>
            ) : (
              <>
                {categoryName && <p className="eyebrow mb-1.5">{categoryName}</p>}
                <h3 className="truncate font-display text-2xl font-medium tracking-wide text-cream sm:text-3xl">
                  {nominee.name}
                </h3>
              </>
            )}
          </div>
          <button
            onClick={close}
            className="btn btn-ghost btn-sm shrink-0 !px-2.5"
            aria-label="Cerrar"
          >
            <CloseIcon size={14} />
          </button>
        </div>

        {/* Cuerpo: reproductor (+ tablero en modo ganador) */}
        <div
          className={`min-h-0 flex-1 overflow-y-auto px-4 pb-4 sm:px-6 sm:pb-6 ${
            isWinner ? "lg:flex lg:items-start lg:gap-6 lg:overflow-visible" : ""
          }`}
        >
          <div className="min-w-0 flex-1">
            <div
              className="mx-auto aspect-video overflow-hidden border border-line bg-black shadow-[0_20px_60px_-20px_rgba(0,0,0,0.9)]"
              style={{ width: playerWidth }}
            >
              {nominee.clip_url ? (
                <iframe
                  src={resolveEmbedSrc(nominee.clip_url)}
                  title={nominee.name}
                  className="h-full w-full"
                  allow="autoplay; fullscreen"
                  allowFullScreen
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-mono text-sm uppercase tracking-[0.2em] text-dim">
                  SIN CLIP DISPONIBLE
                </div>
              )}
            </div>
          </div>

          {/* Tablero de resultados (solo modo ganador) */}
          {isWinner && results.length > 0 && (
            <aside
              data-clip-side
              className="mt-5 w-full shrink-0 space-y-4 lg:mt-0 lg:w-80"
            >
              <p className="label">Distribución de votos</p>
              {sortedResults.map((r, i) => {
                const isTop = r.nominee_id === nominee.id;
                return (
                  <div
                    key={r.nominee_id}
                    className={`p-3 ${
                      isTop
                        ? "bg-gold/10 shadow-[inset_0_0_0_1px_rgba(255,200,87,0.5)]"
                        : "bg-ink-3 shadow-[inset_0_0_0_1px_var(--line)]"
                    }`}
                  >
                    <div className="mb-2 flex items-baseline justify-between gap-3">
                      <span
                        className={`truncate text-sm ${
                          isTop ? "font-medium text-gold" : "text-cream-2"
                        }`}
                      >
                        <span className="mr-2 font-crt text-lg text-dim">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        {r.name}
                      </span>
                      <span
                        className={`font-crt text-2xl leading-none ${
                          isTop ? "text-gold" : "text-mute"
                        }`}
                      >
                        <span className="clip-result-pct" data-val={r.percentage}>
                          0
                        </span>
                        %
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden bg-ink-5">
                      <div
                        className={`clip-result-bar h-full ${
                          isTop ? "bg-gold shadow-gold-glow" : "bg-dim"
                        }`}
                        data-pct={r.percentage}
                      />
                    </div>
                    <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-dim">
                      {r.vote_count} {r.vote_count === 1 ? "voto" : "votos"}
                    </p>
                  </div>
                );
              })}
            </aside>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
