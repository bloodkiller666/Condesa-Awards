import type { Metadata } from "next";
import { Inter, Press_Start_2P, Chakra_Petch, VT323 } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

const pressStart = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-press-start",
  display: "swap"
});

const chakra = Chakra_Petch({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-chakra",
  display: "swap"
});

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

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${pressStart.variable} ${chakra.variable} ${vt323.variable}`}
    >
      <body className="bg-black text-white font-sans antialiased min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}