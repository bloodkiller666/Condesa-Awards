"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import RemoteControl, { RemoteActiveState } from "./RemoteControl";
import TermsModal from "./TermsModal";
import TitleScreen from "./TitleScreen";
import { INTRO_AUDIO_URL } from "@/lib/assets";

interface HeroIntroProps {
  onEnter: () => void;
}

type IntroState =
  | "OFF"
  | "CHANNEL_ENTRY"
  | "WELCOME"
  | "COUNTDOWN"
  | "TITLE";

export default function HeroIntro({ onEnter }: HeroIntroProps) {
  const root = useRef<HTMLDivElement>(null);
  const screen = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<IntroState>("OFF");
  const [enteredDigits, setEnteredDigits] = useState("");
  const [countdown, setCountdown] = useState(3);
  const [showTerms, setShowTerms] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useGSAP(
    () => {
      gsap.to(".hero-grid", {
        backgroundPosition: "0px 200px",
        duration: 24,
        repeat: -1,
        ease: "none"
      });

      gsap.to(".neon-title", {
        textShadow:
          "0 0 8px #f472b6, 0 0 22px #ec4899, 0 0 50px rgba(236,72,153,0.6), 0 0 90px rgba(236,72,153,0.4)",
        duration: 1.2,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut"
      });
    },
    { scope: root }
  );

  // Limpieza global: detener audio al desmontar la intro.
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  const handlePower = () => {
    if (state !== "OFF") return;
    gsap.fromTo(
      screen.current,
      { scaleY: 0.005, opacity: 0 },
      { scaleY: 1, opacity: 1, duration: 0.5 }
    );

    // Inicia "The Final Countdown" de fondo.
    if (!audioRef.current) {
      const audio = new Audio(INTRO_AUDIO_URL);
      audio.loop = true;
      audio.volume = 0.5;
      audio.addEventListener(
        "canplaythrough",
        () => {
          audio.play().catch(() => {});
        },
        { once: true }
      );
      audio.play().catch(() => {});
      audioRef.current = audio;

      // Expone el audio globalmente para que TermsModal lo "mate".
      (window as unknown as { __introAudio?: HTMLAudioElement }).__introAudio =
        audio;
    }

    setState("CHANNEL_ENTRY");
    setEnteredDigits("");
  };

  const handleDigit = (digit: string) => {
    if (state !== "CHANNEL_ENTRY") return;
    const next = enteredDigits + digit;

    if (digit === "0") {
      // "0" no forma parte del canal 69; reinicia la entrada.
      setEnteredDigits("");
      return;
    }

    if (next === "6") {
      setEnteredDigits("6");
      return;
    }

    if (next === "69") {
      setEnteredDigits("69");
      gsap.to(screen.current, { opacity: 0.3, duration: 0.12, yoyo: true, repeat: 1, onComplete: () => {
        gsap.to(screen.current, { opacity: 1, duration: 0.1 });
        setState("WELCOME");
      }});
      return;
    }

    // Cualquier otra combinación inválida reinicia la entrada.
    setEnteredDigits("");
  };

  const handleChangeChannel = () => {
    if (state !== "WELCOME") return;
    setState("COUNTDOWN");
    setCountdown(3);
  };

  // Countdown 3 -> 2 -> 1 -> TITLE
  useEffect(() => {
    if (state !== "COUNTDOWN") return;

    if (countdown > 1) {
      const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }

    const t = setTimeout(() => setState("TITLE"), 1000);
    return () => clearTimeout(t);
  }, [state, countdown]);

  const remoteActiveState: RemoteActiveState =
    state === "OFF"
      ? "power"
      : state === "CHANNEL_ENTRY"
        ? "channel"
        : state === "WELCOME"
          ? "changeChannel"
          : "disabled";

  return (
    <div ref={root} className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
      <div
        ref={screen}
        className={`relative w-full max-w-5xl h-[60vh] border-2 border-neutral-700 rounded-sm overflow-hidden flex items-center justify-center ${
          state === "OFF" ? "bg-neutral-900" : "bg-black"
        }`}
      >
        {/* Overlay CRT permanente */}
        <div className="pointer-events-none absolute inset-0 crt-scanlines opacity-30 z-20" />
        <div className="pointer-events-none absolute inset-0 crt-vignette z-20" />

        {/* State 1: SEÑAL PERDIDA */}
        {state === "OFF" && (
          <>
            <div className="absolute inset-0 crt-static z-10" />
            <div className="relative z-10 text-white font-crt text-center px-6">
              <p className="text-5xl sm:text-6xl tracking-widest animate-pulse-glow">
                SEÑAL PERDIDA
              </p>
              <p className="text-2xl mt-4 text-neutral-400">
                USA EL CONTROL REMOTO
              </p>
            </div>
          </>
        )}

        {/* State 2: Entrada de canal */}
        {state === "CHANNEL_ENTRY" && (
          <div className="relative z-10 text-white font-crt text-center px-6">
            <p className="text-3xl sm:text-4xl tracking-widest">
              INGRESE CANAL EN EL CONTROL REMOTO
            </p>
            <p className="text-6xl tracking-[0.5em] mt-6 text-pink-400">
              [ {enteredDigits.padEnd(2, "_")} ]
            </p>
          </div>
        )}

        {/* State 3: Mensaje de bienvenida */}
        {state === "WELCOME" && (
          <div className="relative z-10 text-center p-8 max-w-3xl">
            <p className="font-crt text-2xl tracking-widest text-neutral-400 mb-6">
              CH 69 - AV INPUT
            </p>
            <p className="font-crt text-3xl sm:text-4xl leading-snug text-pink-300">
              ¡GRACIAS POR ENCENDER LA TV! POR REALIZAR Y CONTARME DE NUEVO EN
              ESTA NUEVA EDICIÓN DE TUS PREMIACIONES CON ESTE NUEVO FORMATO, POR
              SALVAR NUESTRAS PRÓSTATAS Y SER MADRE LUCHONA.
            </p>
            <p className="font-retro text-lg mt-6 text-white tracking-wide">
              PRESIONA &apos;CAMBIAR CANAL&apos; PARA ENTRAR.
            </p>
          </div>
        )}

        {/* State 4: Countdown retro */}
        {state === "COUNTDOWN" && (
          <>
            <div className="absolute inset-0 hero-grid retro-grid opacity-30 z-10" />
            <div className="relative z-10 text-center">
              <p className="font-crt text-9xl sm:text-[12rem] leading-none text-white neon-text">
                {countdown}
              </p>
            </div>
          </>
        )}

        {/* State 5: Título principal con entrada CRT + glitch */}
        {state === "TITLE" && <TitleScreen onEnter={() => setShowTerms(true)} />}
      </div>

      <div className="mt-8">
        <RemoteControl
          activeState={remoteActiveState}
          enteredDigits={enteredDigits}
          onPower={handlePower}
          onDigit={handleDigit}
          onChangeChannel={handleChangeChannel}
        />
      </div>

      {showTerms && (
        <TermsModal onAccept={onEnter} onReject={() => setShowTerms(false)} />
      )}
    </div>
  );
}