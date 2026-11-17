"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion, scrambleText } from "@/lib/fx";
import { createIntroSfx } from "@/lib/sfx";
import RemoteControl from "./RemoteControl";
import TermsModal from "./TermsModal";
import TitleScreen from "./TitleScreen";
import CrtTv from "@/components/ui/CrtTv";
import HandPointer, { HAND_INDEX_PIVOT, HAND_TIP } from "@/components/ui/HandPointer";
import { INTRO_AUDIO_URL } from "@/lib/assets";

interface HeroIntroProps {
  /** El usuario cruzó la pantalla: la app ya puede montarse debajo. */
  onEnter: () => void;
  /** La intro terminó de desvanecerse: ya se puede desmontar. */
  onExited?: () => void;
}

/**
 * TERMS     → aviso legal (primer paso; su botón da el permiso de audio).
 * DENIED    → el usuario rechazó los términos.
 * OFF       → TV apagada; una mano aparece y pulsa POWER.
 * CHANNEL_ENTRY → la mano marca 6 y 9.
 * TUNING    → sintonizando el canal 69 (reemplaza al mensaje largo).
 * (tras CAMBIAR CANAL la imagen rueda y se estabiliza directo en el título)
 * TITLE     → título; el usuario solo pulsa "entrar".
 */
type IntroState =
  | "TERMS"
  | "DENIED"
  | "OFF"
  | "CHANNEL_ENTRY"
  | "TUNING"
  | "TITLE";

export default function HeroIntro({ onEnter, onExited }: HeroIntroProps) {
  const root = useRef<HTMLDivElement>(null);
  const screen = useRef<HTMLDivElement>(null);
  const hand = useRef<SVGSVGElement>(null);
  const scene = useRef<HTMLDivElement>(null);
  const entering = useRef(false);
  const sfx = useRef<ReturnType<typeof createIntroSfx> | null>(null);
  const tuneTitle = useRef<HTMLParagraphElement>(null);
  const roll = useRef<HTMLDivElement>(null);
  const autopilot = useRef<gsap.core.Timeline | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const musicStarted = useRef(false);

  const [state, setState] = useState<IntroState>("TERMS");
  const [enteredDigits, setEnteredDigits] = useState("");
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  /** El título llega por la transición de "imagen que rueda" (no por saltar la intro). */
  const [rolled, setRolled] = useState(false);
  const [isEntering, setEntering] = useState(false);
  const [muted, setMuted] = useState(false);

  const tvOff = state === "TERMS" || state === "DENIED" || state === "OFF";

  useGSAP(
    () => {
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

  // Limpieza global: detener autopiloto y audio al desmontar la intro.
  useEffect(() => {
    return () => {
      autopilot.current?.kill();
      audioRef.current?.pause();
      audioRef.current = null;
      sfx.current?.dispose();
      sfx.current = null;
    };
  }, []);

  /* ---------------------------------------------------------------- */
  /* Audio                                                             */
  /* ---------------------------------------------------------------- */

  /**
   * Se llama dentro del clic de "Aceptar": el navegador concede el permiso de
   * audio a ese elemento y más adelante la música puede arrancar sola.
   */
  const primeAudio = () => {
    if (audioRef.current) return;
    const audio = new Audio(INTRO_AUDIO_URL);
    audio.loop = true;
    audio.volume = 0.5;
    audio.preload = "auto";
    audioRef.current = audio;
    audio
      .play()
      .then(() => {
        if (!musicStarted.current) {
          audio.pause();
          audio.currentTime = 0;
        }
      })
      .catch(() => {});
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    sfx.current?.setMuted(next);
    if (audioRef.current) audioRef.current.muted = next;
  };

  const startMusic = () => {
    musicStarted.current = true;
    audioRef.current?.play().catch(() => {});
  };

  const stopMusic = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
  };

  /* ---------------------------------------------------------------- */
  /* Autopiloto: la mano opera el control                              */
  /* ---------------------------------------------------------------- */

  const keyCenter = (id: string) => {
    const el = root.current?.querySelector<HTMLElement>(`[data-key="${id}"]`);
    if (!el) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  };

  /** Valores de tween que colocan la yema del índice sobre una tecla. */
  const toKey = (id: string) => ({
    x: () => keyCenter(id).x - HAND_TIP.x,
    y: () => keyCenter(id).y - HAND_TIP.y
  });

  const powerOn = () => {
    sfx.current?.stopStatic();
    sfx.current?.powerOn();
    // Encendido CRT: la imagen se abre desde una línea con un fogonazo.
    gsap
      .timeline()
      .fromTo(
        screen.current,
        { scaleY: 0.005, scaleX: 0.4, opacity: 0, filter: "brightness(4)" },
        { scaleY: 0.005, scaleX: 1, opacity: 1, duration: 0.18, ease: "power2.out" }
      )
      .to(screen.current, {
        scaleY: 1,
        filter: "brightness(1)",
        duration: 0.5,
        ease: "power4.out"
      });
    startMusic();
    setState("CHANNEL_ENTRY");
    setEnteredDigits("");
  };

  const tuneIn = () => {
    sfx.current?.tuneBurst();
    setEnteredDigits("69");
    gsap.to(screen.current, {
      opacity: 0.3,
      duration: 0.12,
      yoyo: true,
      repeat: 1,
      onComplete: () => {
        gsap.to(screen.current, { opacity: 1, duration: 0.1 });
        setState("TUNING");
      }
    });
  };

  const runAutopilot = () => {
    const h = hand.current;
    if (!h) return;

    const winH = window.innerHeight;
    gsap.set(h, {
      x: window.innerWidth / 2 - HAND_TIP.x + 60,
      y: winH + 40,
      rotate: -8,
      opacity: 1
    });

    const tl = gsap.timeline();
    autopilot.current = tl;
    if (prefersReducedMotion()) tl.timeScale(2.5);

    const index = h.querySelector(".hand-index");

    /** Un toque: la mano se hunde, el índice se flexiona, se acciona la tecla y vuelve a subir. */
    const tap = (id: string, action: () => void) => {
      tl.to(h, { y: "+=10", scale: 0.94, duration: 0.09, ease: "power2.in" })
        .to(index, { scaleY: 0.92, svgOrigin: HAND_INDEX_PIVOT, duration: 0.09, ease: "power2.in" }, "<")
        .call(() => {
          setPressedKey(id);
          sfx.current?.click();
          if (id === "6" || id === "9") sfx.current?.dtmf(id);
          action();
        })
        .to(h, { y: "-=10", scale: 1, duration: 0.15, ease: "power2.out" })
        .to(index, { scaleY: 1, svgOrigin: HAND_INDEX_PIVOT, duration: 0.15, ease: "power2.out" }, "<")
        .call(() => setPressedKey(null), [], "+=0.06");
    };

    // 1 · La mano sube y pulsa POWER.
    tl.to(h, { ...toKey("power"), rotate: -4, duration: 1.1, ease: "power3.out", delay: 0.35 });
    tap("power", powerOn);

    // 2 · Marca 6 y 9.
    tl.to(h, { ...toKey("6"), duration: 0.45, ease: "power2.inOut" }, "+=0.55");
    tap("6", () => setEnteredDigits("6"));
    tl.to(h, { ...toKey("9"), duration: 0.35, ease: "power2.inOut" }, "+=0.12");
    tap("9", tuneIn);

    // 3 · Se aparta mientras la TV sintoniza y vuelve para "Cambiar canal".
    tl.to(h, { y: winH + 40, x: "+=40", duration: 0.55, ease: "power2.in" }, "+=0.1");
    tl.to(h, { ...toKey("change"), duration: 0.9, ease: "power3.out" }, "+=0.35");
    tap("change", () => {
      sfx.current?.lock();
      setRolled(true);
      setState("TITLE");
    });

    // 4 · Sale de escena.
    tl.to(h, { y: winH + 60, duration: 0.5, ease: "power2.in" }, "+=0.15").set(h, { opacity: 0 });
  };

  /* ---------------------------------------------------------------- */
  /* Acciones del usuario                                              */
  /* ---------------------------------------------------------------- */

  const handleAcceptTerms = () => {
    primeAudio();
    if (!sfx.current) sfx.current = createIntroSfx();
    sfx.current.unlock();
    sfx.current.startStatic();
    setState("OFF");
    // Espera un frame para que el TV ya esté pintado antes de medir teclas.
    requestAnimationFrame(runAutopilot);
  };

  const handleSkip = () => {
    autopilot.current?.kill();
    autopilot.current = null;
    gsap.killTweensOf(screen.current);
    gsap.set(screen.current, { scaleX: 1, scaleY: 1, opacity: 1, filter: "none" });
    if (hand.current) gsap.set(hand.current, { opacity: 0 });
    setPressedKey(null);
    setEnteredDigits("69");
    sfx.current?.stopStatic();
    sfx.current?.startHum();
    startMusic();
    setState("TITLE");
  };

  /**
   * Entrada a la app: la cámara se mete en el cristal, la luz de la TV invade
   * la sala, un fogonazo blanco cubre todo y la intro se disuelve revelando la
   * web. `onEnter` se llama al llegar al fogonazo (la app ya monta debajo) y
   * `onExited` cuando la intro terminó de desvanecerse.
   */
  const handleEnter = () => {
    if (entering.current) return;
    entering.current = true;
    setEntering(true);
    sfx.current?.whoosh();
    sfx.current?.stopHum(1.4);

    // La música baja con la cámara.
    const audio = audioRef.current;
    if (audio) {
      gsap.to(audio, {
        volume: 0,
        duration: 1.6,
        ease: "power2.in",
        onComplete: stopMusic
      });
    }

    const r = root.current;
    const sc = screen.current;
    const sceneEl = scene.current;
    if (!r || !sc || !sceneEl || prefersReducedMotion()) {
      gsap.to(r, {
        opacity: 0,
        duration: 0.4,
        onStart: onEnter,
        onComplete: () => onExited?.()
      });
      return;
    }

    const sr = sc.getBoundingClientRect();
    const scr = sceneEl.getBoundingClientRect();
    const cx = sr.left + sr.width / 2 - scr.left;
    const cy = sr.top + sr.height / 2 - scr.top;
    // Escala que hace que el cristal cubra toda la ventana (con margen por las esquinas).
    const zoom = Math.max(window.innerWidth / sr.width, window.innerHeight / sr.height) * 1.2;

    // La cámara también centra el cristal en la ventana mientras se acerca.
    const dx = window.innerWidth / 2 - (sr.left + sr.width / 2);
    const dy = window.innerHeight / 2 - (sr.top + sr.height / 2);

    r.style.overflow = "hidden";
    gsap.set(sceneEl, { transformOrigin: `${cx}px ${cy}px` });
    // Valor inicial explícito: GSAP interpola mal los filtros desde "none".
    gsap.set(sc, { filter: "brightness(1) saturate(1)" });

    const tl = gsap.timeline();
    tl.to(sceneEl, { scale: zoom, x: dx, y: dy, duration: 1.7, ease: "power3.inOut" }, 0)
      // La luz de la TV se vuelve cada vez más intensa.
      .to(
        r,
        { "--gr": 255, "--gg": 125, "--gb": 195, "--glow-i": 1, duration: 1.4, ease: "power2.in", overwrite: "auto" },
        0
      )
      .to(sc, { filter: "brightness(1.5) saturate(1.3)", duration: 1.1, ease: "power2.in" }, 0.55)
      // Atraviesa el cristal: fogonazo, la app monta debajo y la intro se disuelve.
      .to(".enter-flash", { opacity: 1, duration: 0.2, ease: "power1.in" }, 1.45)
      .call(() => sfx.current?.zap(), [], 1.45)
      .call(onEnter, [], 1.68)
      .to(r, { opacity: 0, duration: 0.9, ease: "power2.out" }, 1.78)
      .call(() => onExited?.(), [], ">");
  };

  /* ---------------------------------------------------------------- */
  /* Efectos por estado                                                */
  /* ---------------------------------------------------------------- */

  // Sintonización: ráfaga de estática, título decodificado y barra por pasos.
  useEffect(() => {
    if (state !== "TUNING") return;
    const tl = gsap.timeline();
    tl.fromTo(".tune-static", { opacity: 0.85 }, { opacity: 0, duration: 0.5, ease: "power2.out" }, 0);
    if (tuneTitle.current) {
      scrambleText(tuneTitle.current, "SEÑAL ENCONTRADA", 0.7);
    }
    tl.fromTo(".tune-bar", { width: "0%" }, { width: "100%", duration: 1.2, ease: "steps(12)" }, 0.1);
    const found = setTimeout(() => sfx.current?.signalFound(), 1300);
    return () => {
      clearTimeout(found);
      tl.kill();
    };
  }, [state]);

  // La imagen rueda verticalmente (vertical hold) y se estabiliza con un par de
  // rebotes; el OSD de canal aparece, parpadea una vez y se apaga. Va en un
  // layout effect para que el título no se vea un fotograma en su sitio final.
  useLayoutEffect(() => {
    if (state !== "TITLE" || !rolled || !roll.current) return;
    const wrap = roll.current;
    const sc = screen.current;
    if (prefersReducedMotion()) {
      gsap.set(wrap, { yPercent: 0 });
      gsap.fromTo(".osd", { opacity: 1 }, { opacity: 0, duration: 0.4, delay: 1.6 });
      return;
    }
    gsap.set(wrap, { yPercent: 62 });
    gsap.set(".osd", { opacity: 0 });
    const tl = gsap.timeline();
    tl.to(
      wrap,
      {
        keyframes: [
          { yPercent: -9, duration: 0.38, ease: "power2.out" },
          { yPercent: 4, duration: 0.2, ease: "power1.inOut" },
          { yPercent: 0, duration: 0.22, ease: "power2.out" }
        ]
      },
      0
    )
      .to(wrap, { keyframes: { x: [-10, 7, -4, 0], easeEach: "none" }, duration: 0.5 }, 0)
      .fromTo(sc, { filter: "brightness(1.6)" }, { filter: "brightness(1)", duration: 0.5, ease: "power2.out" }, 0)
      .to(".roll-bar", { opacity: 0, duration: 0.25 }, 0.55)
      .to(".osd", { opacity: 1, duration: 0.05 }, 0.45)
      .to(".osd", { opacity: 0.15, duration: 0.07 }, 0.9)
      .to(".osd", { opacity: 1, duration: 0.07 }, 1.0)
      .to(".osd", { opacity: 0, duration: 0.3 }, 2.1);
    return () => {
      tl.kill();
    };
  }, [state, rolled]);

  // Golpe del título (al asentarse la imagen) y zumbido de rechazo.
  useEffect(() => {
    if (state === "DENIED") sfx.current?.denied();
    if (state !== "TITLE") return;
    const t = setTimeout(() => sfx.current?.titleHit(), rolled ? 700 : 0);
    return () => clearTimeout(t);
  }, [state, rolled]);

  // Centro de la pantalla en coordenadas de ventana: ahí nace la luz de la TV.
  useEffect(() => {
    const update = () => {
      const el = screen.current?.parentElement;
      const r = root.current;
      if (!el || !r) return;
      const b = el.getBoundingClientRect();
      r.style.setProperty("--gx", `${b.left + b.width / 2}px`);
      r.style.setProperty("--gy", `${b.top + b.height / 2}px`);
    };
    update();
    const settle = setTimeout(update, 1000); // tras la animación de entrada
    const ro = new ResizeObserver(update);
    if (root.current) ro.observe(root.current);
    window.addEventListener("resize", update);
    return () => {
      clearTimeout(settle);
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  // Luz de la TV: el color y la intensidad que escapan de la pantalla (y que
  // bañan gabinete, repisa y control) cambian con cada escena.
  useEffect(() => {
    const r = root.current;
    if (!r) return;
    const reduced = prefersReducedMotion();
    const kills: Array<() => void> = [];
    const to = (rgb: number[], i: number, d = 0.6, ease = "power2.out") =>
      gsap.to(r, {
        "--gr": rgb[0],
        "--gg": rgb[1],
        "--gb": rgb[2],
        "--glow-i": i,
        duration: reduced ? 0 : d,
        ease,
        overwrite: "auto"
      });

    if (state === "TERMS" || state === "OFF") {
      // Estática: luz fría y nerviosa que parpadea.
      to([150, 170, 255], 0.2, 0.4);
      if (!reduced) {
        let alive = true;
        let call: gsap.core.Tween | undefined;
        const flick = () => {
          if (!alive) return;
          gsap.to(r, {
            "--glow-i": 0.08 + Math.random() * 0.26,
            duration: 0.05 + Math.random() * 0.1,
            ease: "none",
            overwrite: "auto"
          });
          call = gsap.delayedCall(0.06 + Math.random() * 0.14, flick);
        };
        call = gsap.delayedCall(0.4, flick);
        kills.push(() => {
          alive = false;
          call?.kill();
        });
      }
    } else if (state === "DENIED") {
      to([255, 93, 108], 0.22, 0.5);
    } else if (state === "CHANNEL_ENTRY") {
      // Encendido: fogonazo blanco que se asienta en luz neutra.
      const tl = gsap.timeline();
      tl.add(to([255, 255, 255], 1, 0.08, "power2.in")).add(to([226, 229, 255], 0.38, 0.9));
      kills.push(() => tl.kill());
    } else if (state === "TUNING") {
      const tl = gsap.timeline();
      tl.add(to([150, 225, 255], 0.9, 0.1, "power2.in")).add(to([255, 140, 205], 0.45, 1));
      kills.push(() => tl.kill());
    } else if (state === "TITLE") {
      if (rolled) {
        // La imagen "engancha": un latido de luz rosa y se asienta.
        const tl = gsap.timeline();
        tl.add(to([255, 79, 163], 0.95, 0.08, "power2.in")).add(to([255, 100, 185], 0.62, 1));
        kills.push(() => tl.kill());
      } else {
        to([255, 100, 185], 0.62, 1.2);
      }
      if (!reduced) {
        const breathe = gsap.to(r, {
          "--glow-i": 0.42,
          duration: 1.8,
          yoyo: true,
          repeat: -1,
          ease: "sine.inOut",
          delay: 1.3
        });
        kills.push(() => breathe.kill());
      }
    }

    return () => kills.forEach((k) => k());
  }, [state, rolled]);

  const showSkip = !isEntering && (state === "OFF" || state === "CHANNEL_ENTRY" || state === "TUNING");

  return (
    <div
      ref={root}
      className="fixed inset-0 z-50 overflow-y-auto bg-ink"
      style={{
        backgroundImage:
          "radial-gradient(ellipse at 50% 100%, rgba(255,79,163,0.06), transparent 60%)"
      }}
    >
      {/* Luz que escapa de la pantalla (color e intensidad por escena) */}
      <div aria-hidden className="tv-glow" />

      <div
        ref={scene}
        className="relative z-10 mx-auto flex min-h-full w-full max-w-5xl flex-col items-center justify-center px-4 py-4"
      >
        {/* Escena: TV y control sobre una repisa */}
        <div className="relative flex w-full flex-col items-center gap-6 lg:flex-row lg:items-end lg:justify-center lg:gap-12">
          <CrtTv
            className="intro-tv"
            screenRef={screen}
            on={!tvOff}
            digits={enteredDigits.length}
          >
            {/* TV apagada: SEÑAL PERDIDA (mientras se aceptan los términos y
                durante el arranque de la mano) */}
            {(state === "TERMS" || state === "OFF") && (
              <>
                <div className="crt-static absolute inset-0 z-10 opacity-80" />
                <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-10 bg-gradient-to-b from-transparent via-white/15 to-transparent [animation:tracking-bar_3.4s_linear_infinite]" />
                <div className="relative z-10 bg-black/75 px-[6cqw] py-[4cqh] text-center font-crt text-cream shadow-[0_0_0_2px_rgba(255,255,255,0.12)]">
                  <p className="animate-pulse-glow text-[clamp(1.8rem,9cqw,3.75rem)] tracking-widest">
                    SEÑAL PERDIDA
                  </p>
                  <p className="mt-[1.5cqh] text-[clamp(1rem,4.2cqw,1.5rem)] tracking-wider text-mute">
                    USA EL CONTROL REMOTO
                  </p>
                </div>
              </>
            )}

            {/* Términos rechazados */}
            {state === "DENIED" && (
              <>
                <div className="crt-static absolute inset-0 z-10 opacity-60" />
                <div className="relative z-10 flex w-[86%] flex-col items-center bg-black/80 px-[4cqw] py-[4cqh] text-center font-crt text-cream shadow-[0_0_0_2px_rgba(255,255,255,0.12)]">
                  <p className="text-[clamp(1.6rem,8cqw,3rem)] tracking-widest text-pink-400">
                    ACCESO DENEGADO
                  </p>
                  <p className="mt-[1.5cqh] text-[clamp(0.95rem,3.8cqw,1.5rem)] tracking-wider text-mute">
                    ACEPTA LOS TÉRMINOS PARA CONTINUAR
                  </p>
                  <button
                    onClick={() => setState("TERMS")}
                    className="btn btn-primary btn-sm mt-[3cqh]"
                  >
                    VER TÉRMINOS
                  </button>
                </div>
              </>
            )}

            {/* Entrada de canal (la mano marca 6 y 9) */}
            {state === "CHANNEL_ENTRY" && (
              <div className="relative z-10 px-[5cqw] text-center font-crt text-cream">
                <p className="phosphor-cream text-[clamp(1.2rem,4.6cqw,2.25rem)] tracking-widest">
                  INGRESE CANAL EN EL CONTROL REMOTO
                </p>
                <p className="phosphor mt-[4cqh] text-[clamp(3rem,16cqw,5rem)] tracking-[0.4em] text-pink-400">
                  [ {enteredDigits.padEnd(2, "_")} ]
                </p>
              </div>
            )}

            {/* Sintonización corta (reemplaza al mensaje largo de bienvenida) */}
            {state === "TUNING" && (
              <div className="relative z-10 w-full px-[8cqw] text-center font-crt">
                <div className="tune-static pointer-events-none absolute -inset-40 crt-static opacity-0" />
                <p className="relative mb-[2cqh] text-[clamp(1rem,4.2cqw,1.5rem)] tracking-[0.3em] text-mute">
                  CH 69 - AV INPUT
                </p>
                <p
                  ref={tuneTitle}
                  className="phosphor relative text-[clamp(1.8rem,8cqw,3.75rem)] tracking-widest text-pink-300"
                >
                  SEÑAL ENCONTRADA
                </p>
                <div className="relative mt-[4cqh] h-3 w-full bg-ink-4 p-[2px]">
                  <div
                    className="tune-bar h-full bg-pink"
                    style={{
                      width: "0%",
                      backgroundImage:
                        "repeating-linear-gradient(90deg, transparent 0 9px, rgba(7,5,11,0.6) 9px 11px)"
                    }}
                  />
                </div>
                <p className="relative mt-[2cqh] font-mono text-[11px] uppercase tracking-[0.3em] text-dim">
                  Sintonizando<span className="animate-blink">…</span>
                </p>
              </div>
            )}

            {/* Título principal */}
            {state === "TITLE" && (
              <>
                <div ref={roll} className="absolute inset-0 z-10">
                  {/* Barra de sincronismo vertical que acompaña a la imagen al rodar */}
                  {rolled && (
                    <div className="roll-bar pointer-events-none absolute inset-x-0 -top-[16%] z-20 h-[16%] bg-gradient-to-b from-black via-[#16151a] to-black shadow-[0_1px_0_rgba(255,255,255,0.18),0_-1px_0_rgba(255,255,255,0.12)]" />
                  )}
                  <TitleScreen onEnter={handleEnter} settled={rolled} />
                </div>

                {/* OSD de canal: como el de una TV de los 90 */}
                {rolled && (
                  <div
                    aria-hidden
                    className="osd pointer-events-none absolute left-[7cqw] top-[6cqh] z-30 flex items-center gap-[2cqw] font-crt text-[clamp(1.3rem,6cqw,2.4rem)] leading-none text-cream opacity-0 [text-shadow:2px_2px_0_#000,0_0_10px_rgba(244,236,225,0.55)]"
                  >
                    <span>CH 69</span>
                    <span className="animate-blink text-[0.7em]">▶</span>
                  </div>
                )}
              </>
            )}
          </CrtTv>

          {/* Control remoto apoyado en la repisa */}
          <div className="intro-remote relative z-10 lg:origin-bottom lg:-rotate-[5deg]">
            <RemoteControl enteredDigits={enteredDigits} pressedKey={pressedKey} />
          </div>
        </div>

        {/* Repisa */}
        <div className="shelf -mt-[6px] hidden w-full max-w-[56rem] lg:block" />
      </div>

      {/* Fogonazo al cruzar el cristal */}
      <div
        aria-hidden
        className="enter-flash pointer-events-none fixed inset-0 z-[57] bg-white opacity-0"
      />

      {/* Mano que opera el control */}
      <HandPointer ref={hand} />

      {/* Silenciar música y efectos */}
      {!isEntering && state !== "TERMS" && (
        <button
          onClick={toggleMute}
          aria-pressed={muted}
          className="link-pixel fixed bottom-5 left-6 z-[56] text-mute"
        >
          Sonido: {muted ? "off" : "on"}
        </button>
      )}

      {/* Saltar la intro */}
      {showSkip && (
        <button
          onClick={handleSkip}
          className="link-pixel fixed bottom-5 right-6 z-[56] text-mute"
        >
          Saltar intro
        </button>
      )}

      {/* Aviso legal: primer paso. Aceptar da el permiso de audio y arranca la escena. */}
      {state === "TERMS" && (
        <TermsModal onAccept={handleAcceptTerms} onReject={() => setState("DENIED")} />
      )}
    </div>
  );
}
