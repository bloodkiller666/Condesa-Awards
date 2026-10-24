"use client";

import { gsap } from "@/lib/gsap";

/** true si el usuario pidió reducir el movimiento. */
export function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

const GLYPHS = "▚▞▛▜▙▟█▓▒░01@#$%&*+=<>/\\|";
const randGlyph = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)];

/** Revela `finalText` carácter por carácter con "estática" (efecto decoder). */
export function scrambleText(el: HTMLElement, finalText: string, duration = 0.8) {
  if (prefersReducedMotion()) {
    el.textContent = finalText;
    return gsap.to({}, { duration: 0 });
  }
  const proxy = { p: 0 };
  return gsap.to(proxy, {
    p: 1,
    duration,
    ease: "power2.inOut",
    onUpdate: () => {
      const reveal = Math.floor(proxy.p * finalText.length);
      let out = finalText.slice(0, reveal);
      for (let i = reveal; i < finalText.length; i++) {
        out += finalText[i] === " " ? " " : randGlyph();
      }
      el.textContent = out;
    },
    onComplete: () => {
      el.textContent = finalText;
    }
  });
}

/**
 * Pequeño "tic" de aberración cromática + salto horizontal sobre un elemento
 * que use la clase `.rgb-split`. Devuelve el timeline para poder matarlo.
 */
export function glitchBurst(el: HTMLElement) {
  const tl = gsap.timeline();
  tl.to(el, { "--rgb-split": "7px", x: -3, duration: 0.05, ease: "steps(1)" })
    .to(el, { "--rgb-split": "-5px", x: 3, skewX: -6, duration: 0.05, ease: "steps(1)" })
    .to(el, { "--rgb-split": "9px", x: -2, skewX: 4, duration: 0.04, ease: "steps(1)" })
    .to(el, {
      "--rgb-split": "1.5px",
      x: 0,
      skewX: 0,
      duration: 0.18,
      ease: "power2.out"
    });
  return tl;
}

/**
 * Efecto "magnético": el elemento sigue ligeramente al puntero. Devuelve la
 * función de limpieza.
 */
export function magnetic(el: HTMLElement, strength = 0.25) {
  if (prefersReducedMotion()) return () => {};
  const xTo = gsap.quickTo(el, "x", { duration: 0.4, ease: "power3.out" });
  const yTo = gsap.quickTo(el, "y", { duration: 0.4, ease: "power3.out" });

  const move = (e: PointerEvent) => {
    const r = el.getBoundingClientRect();
    xTo((e.clientX - (r.left + r.width / 2)) * strength);
    yTo((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const leave = () => {
    xTo(0);
    yTo(0);
  };

  el.addEventListener("pointermove", move);
  el.addEventListener("pointerleave", leave);
  return () => {
    el.removeEventListener("pointermove", move);
    el.removeEventListener("pointerleave", leave);
  };
}
