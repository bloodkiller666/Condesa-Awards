"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { CheckIcon } from "@/components/ui/Icons";

interface AlreadyVotedModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Modal informativo: el servidor rechazó el envío porque el usuario ya tiene
 * votos registrados. Al cerrarse, MainApp muestra AlreadyVotedView tan pronto
 * el prop userHasVoted (fuente de verdad del servidor) llegue en true.
 */
export default function AlreadyVotedModal({ open, onClose }: AlreadyVotedModalProps) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!open) return;
      gsap.from(".avm-card", {
        opacity: 0,
        y: 24,
        scale: 0.95,
        duration: 0.4,
        ease: "back.out(1.6)"
      });
    },
    { scope: root, dependencies: [open] }
  );

  if (!open) return null;

  return (
    <div
      ref={root}
      className="fixed inset-0 z-[70] flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div className="modal-backdrop absolute inset-0" onClick={onClose} />

      {/* Modal content */}
      <div className="avm-card panel panel--accent relative w-full max-w-md p-8 text-center">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center bg-pink text-ink">
          <CheckIcon size={24} />
        </div>

        <h2 className="mb-3 font-display text-2xl font-medium tracking-wide text-cream">
          ¡YA HAS PARTICIPADO!
        </h2>

        <p className="mb-8 text-sm leading-relaxed text-mute">
          Ya has registrado tu votación en los Condesa Awards 2026. Tu participación ha sido procesada correctamente.
        </p>

        <button onClick={onClose} className="btn btn-primary w-full">
          CONTINUAR
        </button>
      </div>
    </div>
  );
}
