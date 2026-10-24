"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
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
 * Modal unificado de clip con dos modos:
 * 1. "preview": previsualiza el clip de un nominado durante la votación.
 * 2. "winner": revelado del ganador con clip embebido, trofeo dorado y
 *    desglose animado de porcentajes.
 */
export default function ClipModal({
  mode,
  nominee,
  categoryName,
  results = [],
  onClose
}: ClipModalProps) {
  const [closing, setClosing] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const isWinner = mode === "winner";

  // Reset animation when modal opens
  useEffect(() => {
    if (nominee && !closing) {
      setAnimationKey(prev => prev + 1);
    }
  }, [nominee, closing]);

  const close = () => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      onClose();
    }, 150);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useGSAP(
    () => {
      if (!rootRef.current) return;

      // Entrada: rebote del contenido.
      gsap.fromTo(
        contentRef.current,
        { scale: 0.92, opacity: 0, y: 24 },
        { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: "back.out(1.7)" }
      );

      // En modo ganador: animar barras de porcentaje.
      if (isWinner && results.length > 0) {
        const bars = contentRef.current?.querySelectorAll<HTMLElement>(
          ".clip-result-bar"
        );
        bars?.forEach((bar) => {
          const pct = Number(bar.dataset.pct ?? 0);
          gsap.fromTo(
            bar,
            { width: 0 },
            { width: `${pct}%`, duration: 1, ease: "power3.out", delay: 0.4 }
          );
        });

        const counters =
          contentRef.current?.querySelectorAll<HTMLElement>(".clip-result-pct");
        counters?.forEach((c) => {
          const val = Number(c.dataset.val ?? 0);
          gsap.fromTo(
            c,
            { innerText: 0 },
            {
              innerText: val,
              duration: 1,
              ease: "power3.out",
              snap: { innerText: 1 },
              delay: 0.4
            }
          );
        });
      }
    },
    { scope: rootRef, dependencies: [nominee?.id, mode, animationKey] }
  );

  if (!nominee) return null;

  const sortedResults = [...results].sort(
    (a, b) => b.vote_count - a.vote_count
  );

  return (
    <div
      ref={rootRef}
      className={`modal-backdrop fixed inset-0 z-40 p-4 transition-opacity duration-150 ${
        closing ? "opacity-0" : "opacity-100"
      }`}
      onClick={close}
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          ref={contentRef}
          onClick={(e) => e.stopPropagation()}
          className={`panel relative max-h-[94vh] w-[92vw] max-w-5xl overflow-y-auto p-4 sm:p-5 ${
            isWinner ? "panel--gold" : "panel--accent"
          }`}
        >
          {/* Header */}
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="min-w-0">
              {isWinner ? (
                <>
                  <p className="eyebrow mb-1 text-gold">
                    <PixelTrophy size={14} /> Ganador de la categoría
                  </p>
                  <h3 className="phosphor-gold truncate font-display text-2xl font-medium tracking-wide text-gold sm:text-3xl">
                    {nominee.name.toUpperCase()}
                  </h3>
                </>
              ) : (
                <>
                  {categoryName && <p className="eyebrow mb-1">{categoryName}</p>}
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

          {/* Reproductor */}
          <div className="aspect-video w-full overflow-hidden border border-line bg-black">
            {nominee.clip_url ? (
              <iframe
                src={nominee.clip_url}
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

          {/* Desglose de porcentajes (solo modo ganador) */}
          {isWinner && results.length > 0 && (
            <div className="mt-5 space-y-3">
              <p className="label">Distribución de votos</p>
              {sortedResults.map((r) => {
                const isTop = r.nominee_id === nominee.id;
                return (
                  <div key={r.nominee_id}>
                    <div className="flex justify-between text-sm">
                      <span className={isTop ? "font-medium text-gold" : "text-cream-2"}>
                        {r.name}
                      </span>
                      <span className="font-mono text-mute">
                        <span className="clip-result-pct" data-val={r.percentage}>
                          0
                        </span>
                        %
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden bg-ink-4">
                      <div
                        className={`clip-result-bar h-full ${
                          isTop ? "bg-gold shadow-gold-glow" : "bg-dim"
                        }`}
                        data-pct={r.percentage}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
