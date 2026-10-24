"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion, scrambleText } from "@/lib/fx";
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

const WELCOME_TEXT =
  "¡GRACIAS POR ENCENDER LA TV! POR REALIZAR Y CONTARME DE NUEVO EN ESTA NUEVA EDICIÓN DE TUS PREMIACIONES CON ESTE NUEVO FORMATO, POR SALVAR NUESTRAS PRÓSTATAS Y SER MADRE LUCHONA.";

export default function HeroIntro({ onEnter }: HeroIntroProps) {
  const root = useRef<HTMLDivElement>(null);
  const screen = useRef<HTMLDivElement>(null);
  const welcomeText = useRef<HTMLParagraphElement>(null);
  const countNumber = useRef<HTMLParagraphElement>(null);
  const [state, setState] = useState<IntroState>("OFF");
  const [enteredDigits, setEnteredDigits] = useState("");
  const [countdown, setCountdown] = useState(3);
  const [showTerms, setShowTerms] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useGSAP(
    () => {
      gsap.to(".hero-grid", {
        backgroundPosition: "0px 176px",
        duration: 4,
        repeat: -1,
        ease: "none"
      });

      // Entrada de la escena: la TV "aterriza" y el control sube.
      if (!prefersReducedMotion()) {
        gsap.from(".intro-tv", { opacity: 0, y: 40, scale: 0.97, duration: 0.8, ease: "power3.out" });
        gsap.from(".intro-remote", {
          opacity: 0,
          y: 60,
          duration: 0.8,
          delay: 0.2,
          ease: "power3.out"
        });
      }
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

    // Encendido CRT: la imagen se abre desde una línea con un fogonazo.
    const tl = gsap.timeline();
    tl.fromTo(
      screen.current,
      { scaleY: 0.005, scaleX: 0.4, opacity: 0, filter: "brightness(4)" },
      { scaleY: 0.005, scaleX: 1, opacity: 1, duration: 0.18, ease: "power2.out" }
    ).to(screen.current, {
      scaleY: 1,
      filter: "brightness(1)",
      duration: 0.5,
      ease: "power4.out"
    });

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

  // Mensaje de bienvenida: se "decodifica" en pantalla.
  useEffect(() => {
    if (state !== "WELCOME" || !welcomeText.current) return;
    const tween = scrambleText(welcomeText.current, WELCOME_TEXT, 1.8);
    return () => {
      tween.kill();
      if (welcomeText.current) welcomeText.current.textContent = WELCOME_TEXT;
    };
  }, [state]);

  // Cada número de la cuenta regresiva entra con un golpe (scale + RGB).
  useEffect(() => {
    if (state !== "COUNTDOWN" || !countNumber.current || prefersReducedMotion()) return;
    const tween = gsap.fromTo(
      countNumber.current,
      { scale: 1.9, opacity: 0, "--rgb-split": "18px" },
      { scale: 1, opacity: 1, "--rgb-split": "2px", duration: 0.55, ease: "expo.out" }
    );
    const ring = gsap.fromTo(
      ".count-ring",
      { scale: 0.4, opacity: 0.9 },
      { scale: 1.6, opacity: 0, duration: 0.9, ease: "power2.out" }
    );
    return () => {
      tween.kill();
      ring.kill();
    };
  }, [state, countdown]);

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
    <div
      ref={root}
      className="fixed inset-0 z-50 overflow-y-auto bg-ink"
      style={{
        backgroundImage:
          "radial-gradient(ellipse 70% 50% at 50% 38%, rgba(255,79,163,0.10), transparent 70%), radial-gradient(ellipse at 50% 100%, rgba(255,79,163,0.06), transparent 60%)"
      }}
    >
      <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col items-center justify-center gap-6 px-4 py-6 sm:gap-8">
        {/* Carcasa de TV */}
        <div className="intro-tv tv w-full">
          <div className="tv-bezel">
            <div
              ref={screen}
              className={`tv-screen flex h-[clamp(230px,36vh,480px)] items-center justify-center ${
                state === "OFF" ? "bg-ink-3" : "bg-black"
              }`}
            >
              {/* Overlays CRT permanentes */}
              <div className="pointer-events-none absolute inset-0 z-20 crt-scanlines opacity-40" />
              <div className="pointer-events-none absolute inset-0 z-20 crt-vignette" />
              <div className="tv-glare" />

              {/* State 1: SEÑAL PERDIDA */}
              {state === "OFF" && (
                <>
                  <div className="crt-static absolute inset-0 z-10 opacity-80" />
                  <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-10 bg-gradient-to-b from-transparent via-white/15 to-transparent [animation:tracking-bar_3.4s_linear_infinite]" />
                  <div className="relative z-10 bg-black/75 px-8 py-5 text-center font-crt text-cream shadow-[0_0_0_2px_rgba(255,255,255,0.12)]">
                    <p className="animate-pulse-glow text-5xl tracking-widest sm:text-6xl">
                      SEÑAL PERDIDA
                    </p>
                    <p className="mt-3 text-2xl tracking-wider text-mute">
                      USA EL CONTROL REMOTO
                    </p>
                  </div>
                </>
              )}

              {/* State 2: Entrada de canal */}
              {state === "CHANNEL_ENTRY" && (
                <div className="relative z-10 px-6 text-center font-crt text-cream">
                  <p className="phosphor-cream text-3xl tracking-widest sm:text-4xl">
                    INGRESE CANAL EN EL CONTROL REMOTO
                  </p>
                  <p className="phosphor mt-6 text-7xl tracking-[0.4em] text-pink-400">
                    [ {enteredDigits.padEnd(2, "_")} ]
                  </p>
                </div>
              )}

              {/* State 3: Mensaje de bienvenida */}
              {state === "WELCOME" && (
                <div className="relative z-10 max-w-3xl p-8 text-center">
                  <p className="mb-6 font-crt text-2xl tracking-[0.3em] text-mute">
                    CH 69 - AV INPUT
                  </p>
                  <p
                    ref={welcomeText}
                    className="phosphor font-crt text-3xl leading-snug text-pink-300 sm:text-4xl"
                  >
                    {WELCOME_TEXT}
                  </p>
                  <p className="mt-6 font-mono text-xs uppercase tracking-[0.2em] text-cream">
                    PRESIONA &apos;CAMBIAR CANAL&apos; PARA ENTRAR.
                    <span className="ml-1 animate-blink text-pink-400">▌</span>
                  </p>
                </div>
              )}

              {/* State 4: Countdown retro */}
              {state === "COUNTDOWN" && (
                <>
                  <div className="absolute inset-x-0 bottom-0 h-[58%] overflow-hidden [perspective:420px]">
                    <div className="hero-grid retro-grid absolute -inset-x-1/2 top-0 bottom-0 origin-top opacity-70 [transform:rotateX(64deg)] [mask-image:linear-gradient(to_bottom,transparent,black_55%)]" />
                  </div>
                  <div className="relative z-10 flex items-center justify-center">
                    <span className="count-ring absolute h-56 w-56 rounded-full border-2 border-pink/70" />
                    <p
                      ref={countNumber}
                      className="rgb-split font-crt text-[10rem] leading-none text-cream sm:text-[13rem]"
                    >
                      {countdown}
                    </p>
                  </div>
                </>
              )}

              {/* State 5: Título principal */}
              {state === "TITLE" && <TitleScreen onEnter={() => setShowTerms(true)} />}
            </div>
          </div>

          {/* Franja inferior de la TV: marca, rejilla y LED de encendido */}
          <div className="flex items-center justify-between px-3 pb-1 pt-3">
            <span className="font-display text-sm font-medium tracking-[0.25em] text-mute">
              CONDESA
            </span>
            <div className="tv-grille hidden h-2 w-28 rounded-full opacity-60 sm:block" />
            <div className="flex items-center gap-3">
              <span className="font-mono text-[9px] tracking-[0.2em] text-dim">
                {state === "OFF" ? "STBY" : "ON"}
              </span>
              <span className="tv-led" data-on={state !== "OFF"} />
            </div>
          </div>
        </div>

        <div className="intro-remote">
          <RemoteControl
            activeState={remoteActiveState}
            enteredDigits={enteredDigits}
            onPower={handlePower}
            onDigit={handleDigit}
            onChangeChannel={handleChangeChannel}
          />
        </div>
      </div>

      {showTerms && (
        <TermsModal onAccept={onEnter} onReject={() => setShowTerms(false)} />
      )}
    </div>
  );
}
