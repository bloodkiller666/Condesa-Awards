import type { ReactNode, RefObject } from "react";

interface CrtTvProps {
  /** Ref del cristal (la intro lo anima para el encendido CRT). */
  screenRef: RefObject<HTMLDivElement | null>;
  /** TV encendida (LED y perilla de volumen). */
  on: boolean;
  /** Dígitos marcados: la perilla de canal gira un paso por dígito. */
  digits: number;
  /** Clase del contenedor (p. ej. para animarlo desde fuera). */
  className?: string;
  /** Contenido que se proyecta sobre el cristal. */
  children: ReactNode;
}

/**
 * Televisor CRT negro de los 90: tapa con ventilas, cabinet de plástico mate,
 * cristal abombado 4:3 en marco hundido y panel inferior con placa, perillas,
 * rejilla de altavoz y LED. El ancho se limita con el alto de la ventana para
 * que la TV y el control siempre quepan en pantalla.
 */
export default function CrtTv({ screenRef, on, digits, className = "", children }: CrtTvProps) {
  return (
    <div
      className={`crt-tv ${className}`}
      style={{ maxWidth: "min(40rem, calc((100dvh - 15rem) * 1.3333 + 5.5rem))" }}
    >
      <div className="crt-top" />

      <div className="crt-cabinet">
        <div className="crt-recess">
          <div ref={screenRef} className={`crt-screen flex items-center justify-center ${on ? "bg-black" : "bg-ink-3"}`}>
            {/* Overlays CRT permanentes */}
            <div className="pointer-events-none absolute inset-0 z-20 crt-scanlines opacity-40" />
            <div className="crt-glass" />
            {children}
          </div>
        </div>

        {/* Panel inferior */}
        <div className="crt-panel">
          <div className="min-w-0 flex-1 leading-none">
            <p className="crt-plate text-sm sm:text-base">CONDESA</p>
            <p className="mt-1.5 font-mono text-[9px] tracking-[0.3em] text-dim">CA-2026 · STEREO</p>
          </div>

          <div className="tv-grille hidden h-8 w-24 shrink-0 rounded-sm opacity-70 sm:block" />

          <div className="flex shrink-0 items-center gap-4">
            <div className="flex flex-col items-center gap-1.5">
              <span
                className="crt-knob"
                style={{ ["--rot" as string]: `${-50 + digits * 48}deg` }}
              />
              <span className="font-mono text-[8px] tracking-[0.2em] text-dim">CH</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <span
                className="crt-knob"
                style={{ ["--rot" as string]: on ? "35deg" : "-60deg" }}
              />
              <span className="font-mono text-[8px] tracking-[0.2em] text-dim">VOL</span>
            </div>
            <div className="flex flex-col items-center gap-2 pl-1">
              <span className="tv-led" data-on={on} />
              <span className="font-mono text-[8px] tracking-[0.2em] text-dim">{on ? "ON" : "STBY"}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="crt-feet">
        <span />
        <span />
      </div>
    </div>
  );
}
