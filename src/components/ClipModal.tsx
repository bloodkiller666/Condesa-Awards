"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
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
 * 2. "winner": revelado del ganador con clip embebido, label pulsante
 *    "[🏆 GANADOR]" y desglose animado de porcentajes.
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

      // Entrada: rebote del contenido + glow del borde.
      gsap.fromTo(
        contentRef.current,
        { scale: 0.9, opacity: 0, y: 20 },
        { scale: 1, opacity: 1, y: 0, duration: 0.35, ease: "back.out(1.8)" }
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
      className={`fixed inset-0 z-40 bg-black/80 backdrop-blur-sm p-4 transition-opacity duration-150 ${
        closing ? "opacity-0" : "opacity-100"
      }`}
      onClick={close}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          ref={contentRef}
          onClick={(e) => e.stopPropagation()}
          className={`relative w-full w-[92vw] max-w-6xl bg-neutral-900 border-2 rounded-sm p-4 shadow-pink-glow ${
            isWinner ? "border-pink-500/70" : "border-pink-500/40"
          }`}
        >
        {/* Header */}
        <div className="flex items-center justify-between mb-3 gap-4">
          <div className="min-w-0">
            {isWinner ? (
              <h3 className="font-pixel text-[11px] sm:text-sm text-pink-400 neon-text animate-pulse-glow truncate">
                🏆 GANADOR: {nominee.name.toUpperCase()}
              </h3>
            ) : (
              <h3 className="font-retro text-lg text-white truncate">
                {nominee.name}
              </h3>
            )}
            {categoryName && !isWinner && (
              <p className="font-retro text-xs text-neutral-500 mt-0.5">
                {categoryName}
              </p>
            )}
          </div>
          <button
            onClick={close}
            className="font-pixel text-xs text-neutral-400 hover:text-white transition-colors shrink-0"
            aria-label="Cerrar"
          >
            [X]
          </button>
        </div>

        {/* Reproductor */}
        <div className="aspect-video w-full bg-black border border-white/10 overflow-hidden">
          {nominee.clip_url ? (
            <iframe
              src={nominee.clip_url}
              title={nominee.name}
              className="w-full h-full"
              allow="autoplay; fullscreen"
              allowFullScreen
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-retro text-neutral-500">
              SIN CLIP DISPONIBLE
            </div>
          )}
        </div>

        {/* Desglose de porcentajes (solo modo ganador) */}
        {isWinner && results.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="font-retro text-xs text-neutral-500">
              DISTRIBUCIÓN DE VOTOS
            </p>
            {sortedResults.map((r) => {
              const isTop = r.nominee_id === nominee.id;
              return (
                <div key={r.nominee_id}>
                  <div className="flex justify-between font-retro text-sm">
                    <span className={isTop ? "text-pink-400" : "text-neutral-300"}>
                      {r.name}
                    </span>
                    <span className="text-neutral-400">
                      <span className="clip-result-pct" data-val={r.percentage}>
                        0
                      </span>
                      %
                    </span>
                  </div>
                  <div className="h-3 bg-neutral-800 overflow-hidden mt-1">
                    <div
                      className={`h-full clip-result-bar ${
                        isTop
                          ? "bg-pink-400 shadow-pink-glow"
                          : "bg-neutral-600"
                      }`}
                      data-pct={r.percentage}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Overlays CRT */}
        <div className="pointer-events-none absolute inset-0 crt-scanlines opacity-20" />
      </div>
      </div>
    </div>
  );
}