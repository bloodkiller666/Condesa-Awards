"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import HeroIntro from "@/components/HeroIntro";
import VotingWizard from "@/components/VotingWizard";
import WinnersView from "@/components/WinnersView";
import AuthButton from "@/components/AuthButton";
import AuthModal from "@/components/AuthModal";
import AlreadyVotedView from "@/components/AlreadyVotedView";
import BackgroundVideo from "@/components/BackgroundVideo";
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
  const [showAuthView, setShowAuthView] = useState(false);
  const [showLoginSuccess, setShowLoginSuccess] = useState(false);

  // "hasVoted" comes ONLY from the server (userHasVoted prop), so deleting
  // rows in Supabase or clearing browser cache is always reflected.
  const hasVoted = userHasVoted;

  // Check localStorage and URL params on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIntroSeen(localStorage.getItem("condesa_intro_seen") === "true");

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
      {!introSeen && <HeroIntro onEnter={handleIntroComplete} />}

      {/* Fondo animado (se muestra durante la intro también, detrás) */}
      <BackgroundVideo opacity={0.3} dim={0.55} />

      <header className="sticky top-0 z-30 bg-black/90 backdrop-blur border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src={LOGO_URL}
              alt="Condesa Awards"
              width={36}
              height={36}
              className="rounded-sm border border-pink-500/50 shadow-pink-glow"
              priority
            />
            <div className="font-pixel text-sm text-white">
              CONDESA AWARDS
              <span className="text-pink-400 ml-1">2026</span>
            </div>
          </div>
          <AuthButton user={user} onLoginClick={handleLoginClick} />
        </div>
      </header>

      {/* Login Success Banner */}
      {showLoginSuccess && (
        <div className="fixed top-0 inset-x-0 z-50 px-4 py-3 animate-slide-down" style={{ animationDuration: "300ms" }}>
          <div className="max-w-6xl mx-auto">
            <div className="bg-emerald-500/10 border-2 border-emerald-500/50 rounded-sm p-4 text-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <span className="font-pixel text-sm text-emerald-400 neon-text animate-pulse-glow">
                [ ✔ LOGIN COMPLETADO CON ÉXITO ]
              </span>
            </div>
          </div>
        </div>
      )}

      <main className="min-h-screen flex flex-col relative">
        <div className="relative z-10 flex-1 flex items-center justify-center">
          {!introSeen ? (
            <div className="text-neutral-500 font-pixel animate-pulse">
              Iniciando sistema...
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

      <footer className="relative z-10 border-t border-white/10 py-8 text-center bg-black/60 backdrop-blur-sm">
        <p className="font-retro text-neutral-500 text-sm">
          CONDESA AWARDS 2026 · © TODOS LOS DERECHOS RESERVADOS
        </p>
      </footer>

      <style jsx global>{`
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-down {
          animation: slide-down 300ms ease-out forwards;
        }
      `}</style>
    </>
  );
}