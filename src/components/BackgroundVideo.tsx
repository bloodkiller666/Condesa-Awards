"use client";

import { useEffect, useRef } from "react";
import { BG_VIDEO_URL } from "@/lib/assets";

interface BackgroundVideoProps {
  /** Opacidad del video (0–1). Menor = más tenue. */
  opacity?: number;
  /** Capa oscura extra sobre el video (0–1) para que el texto siempre gane. */
  dim?: number;
}

/**
 * Fondo animado (loop mp4 de R2) con brillo controlado:
 * - El video corre muteado, en loop y con filtro de brillo/contraste bajado.
 * - Una capa oscura adicional (`dim`) garantiza legibilidad del contenido.
 * - `pointer-events-none` + `fixed` => nunca interfiere con la UI.
 * - `aria-hidden` => ignorado por lectores de pantalla.
 */
export default function BackgroundVideo({
  opacity = 0.3,
  dim = 0.55
}: BackgroundVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Autoplay en navegadores estrictos: reintenta play() tras el montaje.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.play().catch(() => {
      const retry = setTimeout(() => v.play().catch(() => {}), 500);
      return () => clearTimeout(retry);
    });
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        style={{
          opacity,
          filter: "brightness(0.6) contrast(1.05) saturate(0.85)"
        }}
        src={BG_VIDEO_URL}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />
      {/* Capa de oscurecimiento para legibilidad del texto */}
      <div className="absolute inset-0 bg-black" style={{ opacity: dim }} />
      {/* Scanlines CRT sutiles sobre el fondo */}
      <div className="absolute inset-0 crt-scanlines opacity-20" />
    </div>
  );
}
