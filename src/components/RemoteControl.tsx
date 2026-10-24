"use client";

import { useRef } from "react";
import { gsap } from "@/lib/gsap";
import { PowerIcon } from "@/components/ui/Icons";

export type RemoteActiveState =
  | "power"
  | "channel"
  | "changeChannel"
  | "disabled";

interface RemoteControlProps {
  activeState: RemoteActiveState;
  enteredDigits: string;
  onPower: () => void;
  onDigit: (digit: string) => void;
  onChangeChannel: () => void;
}

/**
 * Control remoto retro de TV con gating interactivo: solo los botones
 * requeridos por el paso activo de la intro están habilitados (y respiran
 * para indicar al usuario qué pulsar).
 */
export default function RemoteControl({
  activeState,
  enteredDigits,
  onPower,
  onDigit,
  onChangeChannel
}: RemoteControlProps) {
  const container = useRef<HTMLDivElement>(null);

  const press = (action: () => void) => {
    if (container.current) {
      gsap.fromTo(
        container.current,
        { y: 0, rotate: 0 },
        { y: 3, rotate: 0.6, duration: 0.08, yoyo: true, repeat: 1, clearProps: "transform" }
      );
    }
    action();
  };

  // Canales fijos: solo "6" y "9" se habilitan durante la entrada de canal.
  const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
  const isDigitEnabled = (d: string) =>
    activeState === "channel" && (d === "6" || d === "9");

  const numBtn = (d: string) => (
    <button
      key={d}
      disabled={!isDigitEnabled(d)}
      data-hint={isDigitEnabled(d)}
      onClick={() => press(() => onDigit(d))}
      aria-label={`Número ${d}`}
      className="key h-9 w-9 text-sm"
    >
      {d}
    </button>
  );

  return (
    <div ref={container} className="remote flex w-52 flex-col items-center gap-4 px-4 pb-5 pt-4">
      {/* Emisor IR + marca */}
      <div className="flex w-full items-center justify-between px-1">
        <span className="h-1.5 w-8 rounded-full bg-black shadow-[inset_0_1px_2px_rgba(0,0,0,0.9),0_1px_0_rgba(255,255,255,0.1)]" />
        <span className="font-mono text-[9px] font-semibold tracking-[0.3em] text-dim">
          CA-2026
        </span>
      </div>

      {/* Power */}
      <button
        disabled={activeState !== "power"}
        data-hint={activeState === "power"}
        onClick={() => press(onPower)}
        className="key key--power gap-2 rounded-full px-6 py-2 text-xs tracking-[0.2em]"
      >
        <PowerIcon size={12} />
        POWER
      </button>

      {/* Visor LCD del canal */}
      <div className="lcd flex h-10 w-full items-center justify-between px-3">
        <span className="font-mono text-[9px] tracking-[0.2em] text-dim">CH</span>
        <span
          className="font-crt text-3xl leading-none tracking-[0.35em] text-pink-400 phosphor"
          aria-live="polite"
        >
          {enteredDigits.padEnd(2, "_")}
        </span>
      </div>

      {/* Teclado numérico 3x4 */}
      <div className="grid grid-cols-3 gap-2.5">
        {digits.map(numBtn)}

        <button disabled className="key h-9 w-9 text-[9px] tracking-wider">
          CH+
        </button>
        <button
          disabled={activeState !== "channel"}
          onClick={() => press(() => onDigit("0"))}
          aria-label="Número 0"
          className="key h-9 w-9 text-sm"
        >
          0
        </button>
        <button disabled className="key h-9 w-9 text-[9px] tracking-wider">
          CH-
        </button>
      </div>

      {/* Navegación de canal y volumen */}
      <div className="grid w-full grid-cols-2 gap-2.5">
        <button
          disabled={activeState !== "changeChannel"}
          data-hint={activeState === "changeChannel"}
          onClick={() => press(onChangeChannel)}
          className="key key--pink rounded-lg px-2 py-2 text-[10px] leading-tight tracking-wider"
        >
          CAMBIAR CANAL
        </button>
        <div className="flex flex-col gap-2">
          <button disabled className="key rounded-md py-1 text-[10px] tracking-wider">
            VOL +
          </button>
          <button disabled className="key rounded-md py-1 text-[10px] tracking-wider">
            VOL -
          </button>
        </div>
      </div>

      {/* Rejilla decorativa del micrófono */}
      <div className="tv-grille h-3 w-16 rounded-full opacity-70" />
    </div>
  );
}
