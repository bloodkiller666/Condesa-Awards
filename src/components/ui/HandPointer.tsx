import { forwardRef } from "react";

/** Tamaño de render (px) y punto exacto de la yema del índice dentro del SVG. */
export const HAND_WIDTH = 132;
const VIEWBOX = { w: 120, h: 260 };
const SCALE = HAND_WIDTH / VIEWBOX.w;
export const HAND_TIP = { x: 50 * SCALE, y: 12 * SCALE };
/** Base del índice (en unidades del viewBox): pivote para flexionarlo al pulsar. */
export const HAND_INDEX_PIVOT = "50 112";

const OUTLINE = "#14091f";
const SKIN = "#f3c9a8";
const SKIN_SHADE = "#dba483";
const SKIN_LIGHT = "#ffe6d2";

/**
 * Mano derecha vista por detrás, con el índice extendido y el resto de los
 * dedos cerrados; el pulgar descansa a un costado con dos falanges y uña.
 * Lleva manga de chamarra con puño acanalado y un reloj digital de los 80.
 *
 * Se dibuja con curvas, contorno uniforme de 3px y sombras planas. El origen de
 * transformación está en la yema: rotarla no desplaza el punto de contacto, así
 * GSAP puede posicionarla con exactitud sobre cada tecla. El grupo `.hand-index`
 * se puede escalar desde HAND_INDEX_PIVOT para "flexionar" el dedo al pulsar.
 */
const HandPointer = forwardRef<SVGSVGElement>(function HandPointer(_, ref) {
  return (
    <svg
      ref={ref}
      aria-hidden
      focusable={false}
      viewBox={`0 0 ${VIEWBOX.w} ${VIEWBOX.h}`}
      width={HAND_WIDTH}
      height={VIEWBOX.h * SCALE}
      className="pointer-events-none fixed left-0 top-0 z-[55] overflow-visible opacity-0 drop-shadow-[0_14px_14px_rgba(0,0,0,0.55)]"
      style={{ transformOrigin: `${HAND_TIP.x}px ${HAND_TIP.y}px` }}
    >
      <g stroke={OUTLINE} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round">
        {/* Manga de chamarra */}
        <path d="M26 214 L112 214 L170 900 L-40 900 Z" fill="#271f38" />
        <path d="M46 226 L30 900" fill="none" stroke="#3a2f52" strokeWidth={2} />
        {/* Puño acanalado */}
        <rect x="28" y="200" width="86" height="18" fill="#ff4fa3" />
        <g stroke="#a3125f" strokeWidth={2}>
          <path d="M37 202 V216 M46 202 V216 M55 202 V216 M64 202 V216 M73 202 V216 M82 202 V216 M91 202 V216 M100 202 V216 M109 202 V216" />
        </g>

        {/* Muñeca */}
        <path d="M46 170 L102 170 L100 204 L48 204 Z" fill={SKIN} />

        {/* Pulgar: dos falanges, descansa junto al dedo medio */}
        <path
          d="M46 166 C30 164 14 150 12 128 C10 110 15 97 26 96 C36 95 41 106 43 118 C44 128 48 138 52 146 Z"
          fill={SKIN_SHADE}
        />
        <path d="M17 124 C22 128 30 128 36 123" fill="none" strokeWidth={2} />
        <path
          d="M18 101 C18 96 33 95 33 101 L32 110 C29 113 22 113 19 110 Z"
          fill={SKIN_LIGHT}
          stroke="none"
        />

        {/* Dorso de la mano (se angosta hacia la muñeca) */}
        <path
          d="M40 108 C40 98 46 94 54 94 L100 94 C108 94 112 100 112 108 L111 146 C110 164 102 176 94 182 L58 182 C48 176 40 164 39 146 Z"
          fill={SKIN}
        />
        {/* Sombra plana del costado */}
        <path
          d="M100 100 C108 100 111 104 111 110 L110 146 C109 162 102 174 94 180 L88 180 C98 168 102 154 102 140 Z"
          fill={SKIN_SHADE}
          opacity="0.55"
          stroke="none"
        />

        {/* Reloj digital */}
        <rect x="44" y="184" width="58" height="15" rx="2" fill="#14091f" />
        <rect x="58" y="185" width="30" height="13" rx="2.5" fill="#aab0b8" strokeWidth={2} />
        <rect x="61" y="188" width="24" height="7" rx="1" fill="#b9dcae" stroke="none" />
        <path d="M63 191.500 H66 M68 191.500 H71 M73 191.500 H76 M78 191.500 H82" stroke="#1d2a1d" strokeWidth={2} fill="none" />

        {/* Dedos cerrados: nudillos con pliegue */}
        <rect x="94" y="84" width="17" height="38" rx="8.500" fill={SKIN} />
        <rect x="77" y="74" width="19" height="44" rx="9.500" fill={SKIN} />
        <rect x="59" y="68" width="20" height="50" rx="10" fill={SKIN} />
        <g fill="none" strokeWidth={2}>
          <path d="M97 103 q4 3 10 0" />
          <path d="M80 98 q5 3 12 0" />
          <path d="M62 92 q6 3 13 0" />
        </g>

        {/* Índice extendido */}
        <g className="hand-index">
          <rect x="40" y="8" width="20" height="112" rx="10" fill={SKIN} />
          <path d="M43 60 q7 3 14 0 M43 88 q7 3 14 0" fill="none" strokeWidth={2} />
        </g>
      </g>

      {/* Uña, luces y sombras del índice */}
      <rect x="44.500" y="13" width="11" height="13" rx="4" fill={SKIN_LIGHT} />
      <rect x="43" y="32" width="3" height="76" rx="1.500" fill="#fff" opacity="0.35" />
      <rect x="54" y="32" width="3" height="76" rx="1.500" fill={SKIN_SHADE} opacity="0.55" />
    </svg>
  );
});

export default HandPointer;
