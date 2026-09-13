"use client";

import { useRef } from "react";
import { gsap } from "@/lib/gsap";

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

const BASE_BTN =
  "transition-transform active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed select-none";

/**
 * Control remoto retro de TV con gating interactivo: solo los botones
 * requeridos por el paso activo de la intro están habilitados.
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
        { y: 0 },
        { y: 3, duration: 0.08, yoyo: true, repeat: 1 }
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
      onClick={() => press(() => onDigit(d))}
      className={`${BASE_BTN} bg-neutral-700 hover:bg-neutral-600 text-neutral-200 font-retro text-sm w-9 h-9 rounded-md shadow-md border border-neutral-500`}
    >
      {d}
    </button>
  );

  return (
    <div
      ref={container}
      className="bg-neutral-800 border-2 border-neutral-700 shadow-2xl p-4 w-48 rounded-2xl flex flex-col items-center gap-3"
    >
      {/* Power */}
      <button
        disabled={activeState !== "power"}
        onClick={() => press(onPower)}
        className={`${BASE_BTN} bg-red-600 hover:bg-red-500 text-white font-retro text-sm tracking-widest px-5 py-2 rounded-lg shadow-lg shadow-red-900/50 border border-red-500`}
      >
        POWER
      </button>

      {/* Teclado numérico 3x4 */}
      <div className="grid grid-cols-3 gap-2">
        {digits.map(numBtn)}

        {/* Fila por convención CH/VOL (ubicados en las dos celdas centrales) */}
        <button
          disabled
          className={`${BASE_BTN} bg-neutral-700 text-neutral-500 font-retro text-[9px] w-9 h-9 rounded-md border border-neutral-600`}
        >
          CH+
        </button>
        <button
          disabled={activeState !== "channel"}
          onClick={() => press(() => onDigit("0"))}
          className={`${BASE_BTN} bg-neutral-700 hover:bg-neutral-600 text-neutral-200 font-retro text-sm w-9 h-9 rounded-md shadow-md border border-neutral-500`}
        >
          0
        </button>
        <button
          disabled
          className={`${BASE_BTN} bg-neutral-700 text-neutral-500 font-retro text-[9px] w-9 h-9 rounded-md border border-neutral-600`}
        >
          CH-
        </button>
      </div>

      {/* Navegación de canal y volumen */}
      <div className="grid grid-cols-2 gap-2 w-full">
        <button
          disabled={activeState !== "changeChannel"}
          onClick={() => press(onChangeChannel)}
          className={`${BASE_BTN} bg-pink-600 hover:bg-pink-500 disabled:bg-neutral-700 text-white font-retro text-[10px] px-2 py-2 rounded-md shadow-md border border-pink-500`}
        >
          CAMBIAR CANAL
        </button>
        <div className="flex flex-col gap-2">
          <button
            disabled
            className={`${BASE_BTN} bg-neutral-700 text-neutral-500 font-retro text-[10px] py-1 rounded-md border border-neutral-600`}
          >
            VOL +
          </button>
          <button
            disabled
            className={`${BASE_BTN} bg-neutral-700 text-neutral-500 font-retro text-[10px] py-1 rounded-md border border-neutral-600`}
          >
            VOL -
          </button>
        </div>
      </div>

      {/* Indicador de canal ingresado */}
      <div className="font-crt text-2xl tracking-[0.5em] text-pink-400 h-8 leading-8">
        {enteredDigits.padEnd(2, "_")}
      </div>
    </div>
  );
}