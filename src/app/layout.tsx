import type { Metadata, Viewport } from "next";
import { Inter, Pixelify_Sans, IBM_Plex_Mono, VT323 } from "next/font/google";
import "./globals.css";

// Cuerpo de texto: neutro y legible.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

// Display: pixel font moderna, con pesos variables y buena legibilidad
// (reemplaza a Press Start 2P, que a tamaños chicos se vuelve ilegible).
const pixelify = Pixelify_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-display",
  display: "swap"
});

// Etiquetas, datos y microcopy: mono de estilo terminal / broadcast.
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono-ui",
  display: "swap"
});

// Texto "en pantalla" de la TV (se mantiene).
const vt323 = VT323({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-vt323",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Condesa Awards 2026",
  description:
    "Sistema oficial de votaciones para los Condesa Awards 2026",
  icons: {
    icon: "https://pub-53e40d5efaa74d428edff220a9eb1b21.r2.dev/Condesa%20Awards/1472319345874047028.webp",
    shortcut:
      "https://pub-53e40d5efaa74d428edff220a9eb1b21.r2.dev/Condesa%20Awards/1472319345874047028.webp",
    apple: "https://pub-53e40d5efaa74d428edff220a9eb1b21.r2.dev/Condesa%20Awards/1472319345874047028.webp"
  }
};

export const viewport: Viewport = {
  themeColor: "#07050b"
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${pixelify.variable} ${plexMono.variable} ${vt323.variable}`}
    >
      <body className="bg-ink text-cream font-sans antialiased min-h-screen flex flex-col">
        {children}
        {/* Textura global de pantalla (grano + scanlines muy sutiles) */}
        <div aria-hidden className="screen-grain" />
        <div aria-hidden className="screen-lines" />
      </body>
    </html>
  );
}
