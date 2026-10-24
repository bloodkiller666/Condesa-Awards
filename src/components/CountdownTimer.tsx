"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/fx";

const REVEAL_DATE = new Date("2026-12-31T23:59:59").getTime();

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

function calculateTimeLeft(): TimeLeft {
  const now = Date.now();
  const diff = REVEAL_DATE - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, isExpired: false };
}

/** Celda del reloj: el dígito cae con un pequeño golpe cuando cambia. */
function Cell({ value, label }: { value: string; label: string }) {
  const digits = useRef<HTMLSpanElement>(null);
  const prev = useRef(value);

  useEffect(() => {
    if (prev.current === value) return;
    prev.current = value;
    if (!digits.current || prefersReducedMotion()) return;
    gsap.fromTo(
      digits.current,
      { y: -14, opacity: 0.2 },
      { y: 0, opacity: 1, duration: 0.35, ease: "back.out(2.5)" }
    );
  }, [value]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="px-frame min-w-[4.5rem] overflow-hidden px-3 py-3 sm:min-w-[6.5rem] sm:px-5 sm:py-4">
        <span
          ref={digits}
          className="phosphor-cream block text-center font-crt text-5xl leading-none text-cream sm:text-7xl"
        >
          {value}
        </span>
        {/* Línea de bisagra del reloj */}
        <span className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-black/60" />
      </div>
      <span className="label text-[10px]">{label}</span>
    </div>
  );
}

export default function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const format = (n: number) => String(n).padStart(2, "0");

  return (
    <div
      className="flex items-start justify-center gap-2 sm:gap-4"
      role="timer"
      aria-label="Tiempo restante para revelar a los ganadores"
    >
      <Cell value={format(timeLeft.days)} label="Días" />
      <span className="mt-4 font-crt text-4xl text-pink-400 animate-blink sm:mt-6 sm:text-5xl">:</span>
      <Cell value={format(timeLeft.hours)} label="Horas" />
      <span className="mt-4 font-crt text-4xl text-pink-400 animate-blink sm:mt-6 sm:text-5xl">:</span>
      <Cell value={format(timeLeft.minutes)} label="Min" />
      <span className="mt-4 font-crt text-4xl text-pink-400 animate-blink sm:mt-6 sm:text-5xl">:</span>
      <Cell value={format(timeLeft.seconds)} label="Seg" />
    </div>
  );
}
