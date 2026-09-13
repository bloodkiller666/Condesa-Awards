"use client";

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
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal content */}
      <div className="relative bg-neutral-900 border-2 border-pink-500/50 shadow-pink-glow p-8 rounded-sm max-w-md w-full">
        {/* Header */}
        <h2 className="font-pixel text-lg sm:text-xl text-pink-400 neon-text mb-6 tracking-wider text-center">
          [ ¡YA HAS PARTICIPADO! ]
        </h2>

        {/* Body message */}
        <p className="font-retro text-neutral-400 text-base mb-8 leading-relaxed text-center">
          Ya has registrado tu votación en los Condesa Awards 2026. Tu participación ha sido procesada correctamente.
        </p>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full font-pixel text-sm px-6 py-4 bg-pink-500 text-black border-2 border-pink-500 rounded-sm hover:bg-pink-400 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-neutral-900"
        >
          [ CONTINUAR ]
        </button>

        {/* CRT scanlines overlay */}
        <div className="pointer-events-none absolute inset-0 crt-scanlines opacity-15" />
      </div>
    </div>
  );
}
