import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const base = (size: number, props: SVGProps<SVGSVGElement>) => ({
  width: size,
  height: size,
  "aria-hidden": true,
  focusable: false,
  ...props
});

/** Trofeo en pixel-art (grilla 11x10) — firma visual de los ganadores. */
export function PixelTrophy({ size = 20, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 11 10"
      shapeRendering="crispEdges"
      fill="currentColor"
      {...base(size, props)}
    >
      <rect x="2" y="0" width="7" height="5" />
      <rect x="3" y="5" width="5" height="1" />
      <rect x="4" y="6" width="3" height="1" />
      <rect x="0" y="1" width="2" height="1" />
      <rect x="0" y="2" width="1" height="2" />
      <rect x="1" y="4" width="2" height="1" />
      <rect x="9" y="1" width="2" height="1" />
      <rect x="10" y="2" width="1" height="2" />
      <rect x="8" y="4" width="2" height="1" />
      <rect x="4" y="7" width="3" height="1" />
      <rect x="3" y="8" width="5" height="1" />
      <rect x="2" y="9" width="7" height="1" />
      <rect x="3" y="1" width="1" height="3" fill="#fff" opacity="0.45" />
    </svg>
  );
}

export function PixelStar({ size = 14, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 9 9"
      shapeRendering="crispEdges"
      fill="currentColor"
      {...base(size, props)}
    >
      <rect x="4" y="0" width="1" height="9" />
      <rect x="0" y="4" width="9" height="1" />
      <rect x="3" y="3" width="3" height="3" />
      <rect x="2" y="2" width="1" height="1" />
      <rect x="6" y="2" width="1" height="1" />
      <rect x="2" y="6" width="1" height="1" />
      <rect x="6" y="6" width="1" height="1" />
    </svg>
  );
}

export function PlayIcon({ size = 14, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 12 12" shapeRendering="crispEdges" fill="currentColor" {...base(size, props)}>
      <rect x="2" y="1" width="2" height="10" />
      <rect x="4" y="2" width="2" height="8" />
      <rect x="6" y="3" width="2" height="6" />
      <rect x="8" y="4" width="2" height="4" />
      <rect x="10" y="5" width="1" height="2" />
    </svg>
  );
}

export function CheckIcon({ size = 14, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 12 12" shapeRendering="crispEdges" fill="currentColor" {...base(size, props)}>
      <rect x="1" y="6" width="2" height="2" />
      <rect x="3" y="8" width="2" height="2" />
      <rect x="5" y="6" width="2" height="2" />
      <rect x="7" y="4" width="2" height="2" />
      <rect x="9" y="2" width="2" height="2" />
    </svg>
  );
}

export function ArrowIcon({
  size = 14,
  dir = "right",
  ...props
}: IconProps & { dir?: "left" | "right" }) {
  return (
    <svg
      viewBox="0 0 12 12"
      shapeRendering="crispEdges"
      fill="currentColor"
      style={{ transform: dir === "left" ? "scaleX(-1)" : undefined }}
      {...base(size, props)}
    >
      <rect x="1" y="5" width="8" height="2" />
      <rect x="7" y="3" width="2" height="2" />
      <rect x="7" y="7" width="2" height="2" />
      <rect x="9" y="4" width="1" height="1" />
      <rect x="9" y="7" width="1" height="1" />
      <rect x="9" y="5" width="2" height="2" />
    </svg>
  );
}

export function CloseIcon({ size = 14, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 12 12" shapeRendering="crispEdges" fill="currentColor" {...base(size, props)}>
      <rect x="2" y="2" width="2" height="2" />
      <rect x="4" y="4" width="2" height="2" />
      <rect x="6" y="6" width="2" height="2" />
      <rect x="8" y="8" width="2" height="2" />
      <rect x="8" y="2" width="2" height="2" />
      <rect x="6" y="4" width="2" height="2" />
      <rect x="4" y="6" width="2" height="2" />
      <rect x="2" y="8" width="2" height="2" />
    </svg>
  );
}

export function WarningIcon({ size = 14, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 12 12" shapeRendering="crispEdges" fill="currentColor" {...base(size, props)}>
      <rect x="5" y="1" width="2" height="1" />
      <rect x="4" y="2" width="4" height="1" />
      <rect x="4" y="3" width="4" height="1" />
      <rect x="3" y="4" width="6" height="1" />
      <rect x="3" y="5" width="6" height="1" />
      <rect x="2" y="6" width="8" height="1" />
      <rect x="2" y="7" width="8" height="1" />
      <rect x="1" y="8" width="10" height="2" />
      <rect x="5" y="3" width="2" height="4" fill="#07050b" />
      <rect x="5" y="8" width="2" height="1" fill="#07050b" />
    </svg>
  );
}

export function PowerIcon({ size = 14, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 12 12" shapeRendering="crispEdges" fill="currentColor" {...base(size, props)}>
      <rect x="5" y="0" width="2" height="5" />
      <rect x="2" y="2" width="1" height="1" />
      <rect x="9" y="2" width="1" height="1" />
      <rect x="1" y="3" width="1" height="5" />
      <rect x="10" y="3" width="1" height="5" />
      <rect x="2" y="8" width="2" height="1" />
      <rect x="8" y="8" width="2" height="1" />
      <rect x="4" y="9" width="4" height="1" />
    </svg>
  );
}

export function TwitchIcon({ size = 18, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" {...base(size, props)}>
      <path d="M2 1h13v9l-4 4H8l-2 2H4v-2H1V3l1-2zm1.5 1.5v9H6v2l2-2h3l3-3V2.5h-10.5zM7 4.5h1.5v4H7v-4zm4 0h1.5v4H11v-4z" fillRule="evenodd" />
    </svg>
  );
}

export function DiscordIcon({ size = 18, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" {...base(size, props)}>
      <path d="M13.5 3.3A12 12 0 0 0 10.5 2.4l-.4.8a11 11 0 0 0-4.2 0l-.4-.8a12 12 0 0 0-3 .9C0.6 6.2 0.1 9 .3 11.8a12 12 0 0 0 3.7 1.9l.8-1.3c-.4-.2-.8-.4-1.2-.7l.3-.2a8.600 8.600 0 0 0 7.200 0l.3.200c-.4.300-.8.500-1.200.700l.8 1.300a12 12 0 0 0 3.700-1.900c.3-3.200-.5-5.900-2.200-8.500zM5.700 10.100c-.7 0-1.300-.7-1.300-1.500s.6-1.500 1.300-1.500 1.300.7 1.300 1.500-.6 1.500-1.300 1.500zm4.600 0c-.7 0-1.300-.7-1.300-1.500s.6-1.500 1.300-1.500 1.300.7 1.300 1.500-.6 1.500-1.300 1.500z" />
    </svg>
  );
}
