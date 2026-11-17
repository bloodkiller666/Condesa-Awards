"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import HeroIntro from "@/components/HeroIntro";
import VotingWizard from "@/components/VotingWizard";
import WinnersView from "@/components/WinnersView";
import AuthButton from "@/components/AuthButton";
import AuthModal from "@/components/AuthModal";
import AlreadyVotedView from "@/components/AlreadyVotedView";
import BackgroundVideo from "@/components/BackgroundVideo";
import { CheckIcon, PixelTrophy } from "@/components/ui/Icons";
import { gsap, useGSAP } from "@/lib/gsap";
import { LOGO_URL } from "@/lib/assets";
import type { CategoryWithNominees, CategoryWithResult } from "@/types";
import type { User } from "@supabase/supabase-js";

interface MainAppProps {
  categories: CategoryWithNominees[];
  results: CategoryWithResult[];
  userVotes: Record<string, string>;
  votingOpen: boolean;
  user: User | null;
  userHasVoted: boolean;
}

export default function MainApp({
  categories,
  results,
  userVotes,
  votingOpen,
  user,
  userHasVoted
}: MainAppProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [introSeen, setIntroSeen] = useState(false);
  /** La intro sigue montada mientras se disuelve, aunque introSeen ya sea true. */
  const [showIntro, setShowIntro] = useState(true);
  const [showAuthView, setShowAuthView] = useState(false);
  const [showLoginSuccess, setShowLoginSuccess] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  // "hasVoted" comes ONLY from the server (userHasVoted prop), so deleting
  // rows in Supabase or clearing browser cache is always reflected.
  const hasVoted = userHasVoted;

  // Entrada del header cuando termina la intro.
  useGSAP(
    () => {
      if (!introSeen || !headerRef.current) return;
      gsap.from(headerRef.current, {
        yPercent: -100,
        opacity: 0,
        duration: 0.7,
        delay: 0.6,
        ease: "power3.out"
      });
    },
    { dependencies: [introSeen] }
  );

  // Check localStorage and URL params on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const seen = localStorage.getItem("condesa_intro_seen") === "true";
      setIntroSeen(seen);
      if (seen) setShowIntro(false);

      // Check for login success from OAuth callback redirect
      const loginSuccess = searchParams.get("login_success");
      if (loginSuccess === "true") {
        setShowLoginSuccess(true);
        setShowAuthView(false);
        // Clean URL without reload
        router.replace("/", { scroll: false });
      }
    }
  }, [searchParams, router, userHasVoted]);

  // Auto-hide login success banner after 1.5s
  useEffect(() => {
    if (showLoginSuccess) {
      const timer = setTimeout(() => {
        setShowLoginSuccess(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [showLoginSuccess]);

  // El wizard de intro (HeroIntro) maneja su propio TermsModal; al aceptar
  // los términos el usuario "entra" y desaparecen AMBOS (no hay clonado).
  const handleIntroComplete = () => {
    setIntroSeen(true);
    localStorage.setItem("condesa_intro_seen", "true");
  };

  const handleLoginClick = () => {
    setShowAuthView(true);
  };

  const handleAuthSuccess = () => {
    setShowAuthView(false);
    setShowLoginSuccess(true);
  };

  return (
    <>
      {showIntro && (
        <HeroIntro onEnter={handleIntroComplete} onExited={() => setShowIntro(false)} />
      )}

      {/* Fondo animado (se muestra durante la intro también, detrás) */}
      <BackgroundVideo opacity={0.3} dim={0.55} />

      <header
        ref={headerRef}
        className="sticky top-0 z-30 border-b border-line bg-ink/80 backdrop-blur-md"
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="px-frame px-frame--accent shrink-0">
              <Image
                src={LOGO_URL}
                alt="Condesa Awards"
                width={36}
                height={36}
                className="block"
                priority
              />
            </div>
            <div className="leading-none">
              <div className="font-display text-lg font-medium tracking-[0.12em] text-cream">
                CONDESA AWARDS
              </div>
              <div className="mt-1.5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.28em] text-mute">
                <span className="inline-block h-1.5 w-1.5 animate-pulse-glow bg-pink" />
                Edición 2026
              </div>
            </div>
          </div>
          <AuthButton user={user} onLoginClick={handleLoginClick} />
        </div>
        <div className="h-px w-full bg-gradient-to-r from-transparent via-pink/50 to-transparent" />
      </header>

      {/* Login Success Banner */}
      {showLoginSuccess && (
        <div
          className="animate-slide-down fixed inset-x-0 top-4 z-[90] flex justify-center px-4"
          role="status"
        >
          <div className="panel panel--accent flex items-center gap-3 px-5 py-3 shadow-hard">
            <span className="text-pink-400">
              <CheckIcon size={16} />
            </span>
            <span className="font-display text-sm font-medium tracking-[0.14em] text-cream">
              LOGIN COMPLETADO CON ÉXITO
            </span>
          </div>
        </div>
      )}

      <main className="relative flex min-h-screen flex-col">
        <div className="relative z-10 flex flex-1 items-center justify-center">
          {!introSeen ? (
            <div className="font-mono text-xs uppercase tracking-[0.3em] text-mute">
              Iniciando sistema...
              <span className="ml-1 animate-blink text-pink-400">▌</span>
            </div>
          ) : (
            // Votación cerrada => ganadores SIEMPRE (aunque el usuario ya haya votado).
            !votingOpen ? (
              <WinnersView categories={results} />
            ) : hasVoted ? (
              <AlreadyVotedView />
            ) : showAuthView ? (
              <AuthModal onLoginSuccess={handleAuthSuccess} />
            ) : (
              <VotingWizard
                categories={categories}
                userVotes={userVotes}
                isAuthenticated={!!user}
                onAuthRequired={handleLoginClick}
              />
            )
          )}
        </div>
      </main>

      <footer className="relative z-10 border-t border-line bg-ink/70 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-center sm:flex-row sm:text-left">
          <div className="flex items-center gap-3">
            <PixelTrophy size={18} className="text-gold" />
            <span className="font-display text-sm font-medium tracking-[0.2em] text-cream">
              CONDESA AWARDS
            </span>
          </div>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-dim">
            CONDESA AWARDS 2026 · © TODOS LOS DERECHOS RESERVADOS
          </p>
        </div>
      </footer>
    </>
  );
}
