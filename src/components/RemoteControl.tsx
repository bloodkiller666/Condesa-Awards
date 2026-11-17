"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { PowerIcon } from "@/components/ui/Icons";

interface RemoteControlProps {
  /** Dígitos del canal que se muestran en el visor LCD. */
  enteredDigits: string;
  /** Tecla que está siendo pulsada (la intro la acciona sola). */
  pressedKey: string | null;
}

/**
 * Control remoto retro de TV. Es decorativo: la intro lo "usa" sola (una mano
 * pulsa las teclas), así que expone `data-key` en cada botón para que GSAP
 * pueda apuntar a ellos y `pressedKey` para mostrar la tecla hundida.
 */
export default function RemoteControl({ enteredDigits, pressedKey }: RemoteControlProps) {
  const container = useRef<HTMLDivElement>(null);

  // Pequeño golpe del cuerpo del control cada vez que se pulsa una tecla.
  useEffect(() => {
    if (!pressedKey || !container.current) return;
    gsap.fromTo(
      container.current,
      { y: 0 },
      { y: 3, duration: 0.08, yoyo: true, repeat: 1, clearProps: "transform" }
    );
  }, [pressedKey]);

  const attrs = (id: string) => ({
    "data-key": id,
    "data-pressed": pressedKey === id
  });

  const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

  return (
    <div
      ref={container}
      aria-hidden
      className="remote pointer-events-none flex w-52 select-none flex-col items-center gap-4 px-4 pb-5 pt-4"
    >
      {/* Emisor IR + marca */}
      <div className="flex w-full items-center justify-between px-1">
        <span className="h-1.5 w-8 rounded-full bg-black shadow-[inset_0_1px_2px_rgba(0,0,0,0.9),0_1px_0_rgba(255,255,255,0.1)]" />
        <span className="font-mono text-[9px] font-semibold tracking-[0.3em] text-dim">
          CA-2026
        </span>
      </div>

      {/* Power */}
      <div {...attrs("power")} className="key key--power gap-2 rounded-full px-6 py-2 text-xs tracking-[0.2em]">
        <PowerIcon size={12} />
        POWER
      </div>

      {/* Visor LCD del canal */}
      <div className="lcd flex h-10 w-full items-center justify-between px-3">
        <span className="font-mono text-[9px] tracking-[0.2em] text-dim">CH</span>
        <span className="phosphor font-crt text-3xl leading-none tracking-[0.35em] text-pink-400">
          {enteredDigits.padEnd(2, "_")}
        </span>
      </div>

      {/* Teclado numérico 3x4 */}
      <div className="grid grid-cols-3 gap-2.5">
        {digits.map((d) => (
          <div key={d} {...attrs(d)} className="key h-9 w-9 text-sm">
            {d}
          </div>
        ))}
        <div className="key h-9 w-9 text-[9px] tracking-wider opacity-60">CH+</div>
        <div {...attrs("0")} className="key h-9 w-9 text-sm">
          0
        </div>
        <div className="key h-9 w-9 text-[9px] tracking-wider opacity-60">CH-</div>
      </div>

      {/* Navegación de canal y volumen */}
      <div className="grid w-full grid-cols-2 gap-2.5">
        <div
          {...attrs("change")}
          className="key key--pink rounded-lg px-2 py-2 text-center text-[10px] leading-tight tracking-wider"
        >
          CAMBIAR CANAL
        </div>
        <div className="flex flex-col gap-2 opacity-60">
          <div className="key rounded-md py-1 text-[10px] tracking-wider">VOL +</div>
          <div className="key rounded-md py-1 text-[10px] tracking-wider">VOL -</div>
        </div>
      </div>

      {/* Rejilla decorativa del micrófono */}
      <div className="tv-grille h-3 w-16 rounded-full opacity-70" />
    </div>
  );
}
