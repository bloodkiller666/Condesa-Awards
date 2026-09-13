"use client";

interface TitleScreenProps {
  onEnter: () => void;
}

/**
 * Pantalla principal de título (State 5) con entrada CRT + glitch.
 * Animación: encendido CRT (contracción vertical) -> glitch del título ->
 * revelado del botón (fade-in up con delay) -> glow neón rosa estable.
 */
export default function TitleScreen({ onEnter }: TitleScreenProps) {
  return (
    <>
      <div className="hero-grid retro-grid absolute inset-0 opacity-50 z-10" />

      {/* Encendido CRT del card principal */}
      <div className="relative z-10 text-center p-6 origin-center animate-[fade-in-up_0.5s_ease-out_both]">
        <p className="text-neutral-400 text-xs mb-2 font-retro">
          - EST. 2026 . PREMIACIÓN OFICIAL -
        </p>

        <h1 className="font-pixel text-4xl sm:text-6xl text-white mb-8 shadow-pink-glow animate-glitch-flicker">
          CONDESA AWARDS 2026
        </h1>

        <button
          onClick={onEnter}
          className="border border-pink-500 text-pink-500 px-6 py-3 font-pixel hover:bg-pink-500 hover:text-black transition-colors cursor-pointer animate-fade-in-up"
          style={{ animationDelay: "300ms" }}
        >
          [ PRESIONA AQUÍ PARA ENTRAR ]
        </button>
      </div>
    </>
  );
}