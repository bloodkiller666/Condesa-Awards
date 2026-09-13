"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { gsap, useGSAP } from "@/lib/gsap";
import ClipModal from "@/components/ClipModal";
import SubmissionModal from "@/components/SubmissionModal";
import AlreadyVotedModal from "@/components/AlreadyVotedModal";
import { submitVotes } from "@/app/actions/vote";
import type { SubmitVotesResult } from "@/app/actions/vote";
import type { CategoryWithNominees, Nominee } from "@/types";

interface VotingWizardProps {
  categories: CategoryWithNominees[];
  /** Votos ya registrados del usuario (para preseleccionarlos). */
  userVotes: Record<string, string>;
  isAuthenticated: boolean;
  /** Callback cuando se requiere autenticación (click en votar sin sesión). */
  onAuthRequired?: () => void;
}

/**
 * Asistente de votación paso a paso (1 categoría por pantalla).
 *
 * - Las selecciones viven en estado local (`selectedVotes`); NO se toca la DB
 *   mientras se navega entre categorías.
 * - Transiciones GSAP (slide + fade) entre pasos.
 * - Validación antes de enviar: si queda alguna categoría sin votar se muestra
 *   un panel de advertencia con la lista de categorías faltantes.
 * - El envío batch se delega en <SubmissionModal /> (progreso, errores y retry).
 */
export default function VotingWizard({
  categories,
  userVotes,
  isAuthenticated,
  onAuthRequired
}: VotingWizardProps) {
  const router = useRouter();

  const total = useMemo(() => categories.length, [categories]);
  const [current, setCurrent] = useState(0);
  const [dir, setDir] = useState<"next" | "prev">("next");
  const [selectedVotes, setSelectedVotes] = useState<Record<string, string>>(
    () => ({ ...userVotes })
  );
  const [clip, setClip] = useState<{ nominee: Nominee; categoryName?: string } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [warningOpen, setWarningOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [alreadyVotedOpen, setAlreadyVotedOpen] = useState(false);

  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const busyRef = useRef(false);

  const currentCat = categories[Math.min(current, total - 1)];
  const votedCount = categories.filter((c) => selectedVotes[c.id]).length;
  const missing = useMemo(
    () => categories.filter((c) => !selectedVotes[c.id]),
    [categories, selectedVotes]
  );
  const complete = missing.length === 0;
  const isFirst = current === 0;
  const isLast = current === total - 1;

  // Transición de entrada (slide + fade) de cada categoría.
  useGSAP(
    () => {
      const stage = stageRef.current;
      if (!stage) return;
      const fromX = dir === "next" ? 90 : -90;
      gsap.fromTo(
        stage,
        { opacity: 0, x: fromX },
        {
          opacity: 1,
          x: 0,
          duration: 0.38,
          ease: "power3.out",
          onComplete: () => {
            busyRef.current = false;
          }
        }
      );
    },
    { scope: rootRef, dependencies: [current, dir] }
  );

  const goTo = useCallback(
    (next: number, d: "next" | "prev") => {
      if (busyRef.current) return;
      const clamped = Math.max(0, Math.min(total - 1, next));
      if (clamped === current) return;
      busyRef.current = true;
      const stage = stageRef.current;
      if (stage) {
        gsap.to(stage, {
          opacity: 0,
          x: d === "next" ? -80 : 80,
          duration: 0.16,
          ease: "power1.in",
          onComplete: () => {
            setDir(d);
            setCurrent(clamped);
          }
        });
      } else {
        setDir(d);
        setCurrent(clamped);
      }
    },
    [current, total]
  );

  const handleSelect = (catId: string, nomineeId: string) => {
    if (!isAuthenticated) {
      onAuthRequired?.();
      return;
    }
    setNotice(null);
    setSelectedVotes((prev) => ({ ...prev, [catId]: nomineeId }));
  };

  const handleNext = () => goTo(current + 1, "next");
  const handlePrev = () => goTo(current - 1, "prev");

  /** Valida antes de abrir el modal de envío. */
  const handleSubmitClick = () => {
    setNotice(null);
    if (!complete) {
      setWarningOpen(true);
      return;
    }
    setWarningOpen(false);
    setModalOpen(true);
  };

  const jumpToMissing = (catId: string) => {
    const idx = categories.findIndex((c) => c.id === catId);
    if (idx < 0) return;
    goTo(idx, idx > current ? "next" : "prev");
  };

  // Request del envío batch (usa la snapshot actual de selecciones).
  const handleRequest = useCallback(async (): Promise<SubmitVotesResult> => {
    const selections = categories
      .filter((c) => selectedVotes[c.id])
      .map((c) => ({ categoryId: c.id, nomineeId: selectedVotes[c.id] }));
    const result = await submitVotes(selections);

    // Si el usuario ya ha votado, mostrar modal específico
    if (!result.ok && result.alreadyVoted) {
      setAlreadyVotedOpen(true);
      setModalOpen(false);
    }

    return result;
  }, [categories, selectedVotes]);

  const handleSuccess = useCallback(() => {
    // Sin bandera en localStorage: el estado "ya votó" lo decide el servidor
    // (userHasVoted) tras el revalidatePath("/", "layout") del server action.
    setModalOpen(false);
    router.refresh();
  }, [router]);

  if (total === 0) return null;

  const selectionForCurrent = selectedVotes[currentCat.id];

  return (
    <section id="votacion" ref={rootRef} className="py-8 px-4 max-w-5xl mx-auto">
      {/* Encabezado */}
      <h2 className="font-pixel text-2xl sm:text-3xl text-center text-white mb-2">
        VOTACIÓN
      </h2>
      <p className="font-retro text-center text-neutral-400 mb-10">
        Elige UNA nominación por categoría · {total} fases
      </p>

      {/* Progreso general de votos */}
      <div className="max-w-md mx-auto mb-10">
        <div className="flex items-center justify-between font-pixel text-[9px] text-neutral-400 mb-2">
          <span className="text-pink-400">▮ VOTOS</span>
          <span>
            {String(votedCount).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
        </div>
        <div className="h-2 bg-neutral-800 border border-white/10 overflow-hidden">
          <div
            className={`h-full bg-pink-500 transition-all duration-500 ${
              complete ? "shadow-pink-glow" : ""
            }`}
            style={{ width: `${total ? (votedCount / total) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Aviso de sesión / error local */}
      {notice && (
        <div className="mb-6 font-pixel text-[10px] text-red-400 text-center border border-red-500/50 bg-red-500/10 p-3 rounded-sm animate-flicker">
          ⚠ {notice}
        </div>
      )}

      {/* Panel de advertencia: categorías sin votar */}
      {warningOpen && missing.length > 0 && (
        <div className="mb-6 border-2 border-red-500/70 bg-red-500/5 p-4 rounded-sm shadow-[0_0_15px_rgba(239,68,68,0.35)] relative">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-pixel text-[10px] text-red-400 mb-2 animate-pulse">
                ⚠ VOTACIÓN INCOMPLETA
              </p>
              <p className="font-retro text-sm text-white mb-3">
                {isAuthenticated
                  ? `Faltan ${missing.length} categoría(s) por votar. Toca una para ir directamente o completa todas antes de enviar.`
                  : ""}
              </p>
            </div>
            <button
              onClick={() => setWarningOpen(false)}
              className="font-pixel text-[10px] text-neutral-400 hover:text-white shrink-0"
              aria-label="Cerrar aviso"
            >
              [X]
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {missing.map((cat, i) => (
              <button
                key={cat.id}
                onClick={() => jumpToMissing(cat.id)}
                className="font-retro text-[11px] px-2 py-1 border border-red-500/50 text-red-300 hover:bg-red-500 hover:text-black transition-colors"
              >
                {String(i + 1).padStart(2, "0")} {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Marco del wizard */}
      <div className="border border-pink-500/30 bg-neutral-900/70 rounded-sm p-5 sm:p-8 relative overflow-hidden">
        {/* Indicador de fase */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
          <span className="font-pixel text-[9px] text-neutral-500">
            FASE{" "}
            <span className="text-pink-400">
              {String(current + 1).padStart(2, "0")}
            </span>
            <span className="text-neutral-600">
              {" "}
              / {String(total).padStart(2, "0")}
            </span>
          </span>
          <div className="flex gap-1.5">
            {categories.map((cat, i) => {
              const voted = !!selectedVotes[cat.id];
              const isCurrentStep = i === current;
              return (
                <button
                  key={cat.id}
                  onClick={() => goTo(i, i > current ? "next" : "prev")}
                  aria-label={`Ir a categoría ${i + 1}`}
                  className={`h-2.5 rounded-none border transition-colors ${
                    isCurrentStep
                      ? "w-6 border-pink-400 bg-pink-500 shadow-pink-glow"
                      : voted
                        ? "w-2.5 border-pink-500/60 bg-pink-500/60"
                        : "w-2.5 border-white/20 bg-neutral-800"
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* Fase actual (categoría por categoría) */}
        <div ref={stageRef} className="will-change-transform">
          <div className="flex items-center justify-between gap-4 mb-2 flex-wrap">
            <h3 className="font-retro text-2xl sm:text-3xl text-white">
              {currentCat.icon && (
                <span className="mr-2">{currentCat.icon}</span>
              )}
              {currentCat.name}
            </h3>
            {selectionForCurrent && (
              <span className="font-pixel text-[9px] text-pink-400 neon-text animate-pulse-glow">
                ✓ SELECCIONADO
              </span>
            )}
          </div>

          {currentCat.description && (
            <p className="font-sans text-sm text-neutral-400 mb-6">
              {currentCat.description}
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {currentCat.nominees.map((nom, i) => {
              const isSelected = selectionForCurrent === nom.id;
              return (
                <div
                  key={nom.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelect(currentCat.id, nom.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSelect(currentCat.id, nom.id);
                    }
                  }}
                  className={`relative border rounded-sm p-4 cursor-pointer transition-all select-none ${
                    isSelected
                      ? "border-pink-500 bg-pink-500/10 shadow-pink-glow"
                      : "border-white/15 bg-black/40 hover:border-pink-500/70 hover:bg-neutral-800/50"
                  }`}
                >
                  {/* Nº de nominado */}
                  <span
                    className={`absolute top-2 left-2 font-pixel text-[8px] ${
                      isSelected ? "text-pink-400" : "text-neutral-600"
                    }`}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  {/* Botón de clip (no dispara la selección) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setClip({ nominee: nom, categoryName: currentCat.name });
                    }}
                    className="absolute top-2 right-2 font-retro text-[11px] text-pink-400 hover:text-white transition-colors"
                  >
                    [ VER CLIP ]
                  </button>

                  <p className="font-sans text-white font-medium mt-6 mb-3 pr-4 leading-snug">
                    {nom.name}
                  </p>

                  {/* Radio indicator estilo terminal */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-pixel text-[8px] ${
                        isSelected ? "text-pink-400" : "text-neutral-600"
                      }`}
                    >
                      {isSelected ? "► ELEGIDO" : "(SELECCIONAR)"}
                    </span>
                    <span
                      className={`inline-flex items-center justify-center w-4 h-4 border ${
                        isSelected
                          ? "border-pink-400 bg-pink-500"
                          : "border-white/30"
                      }`}
                    >
                      {isSelected && (
                        <span className="text-black font-pixel text-[8px] leading-none">
                          ✓
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Navegación */}
        <div className="mt-8 pt-5 border-t border-white/10 flex items-center justify-between gap-3 flex-wrap">
          <div className="min-w-[130px]">
            {!isFirst && (
              <button
                onClick={handlePrev}
                className="font-pixel text-[9px] px-4 py-3 bg-black text-neutral-300 border border-white/30 rounded-sm hover:border-pink-400 hover:text-pink-400 transition-colors"
              >
                [ &lt; ANTERIOR ]
              </button>
            )}
          </div>

          <div className="min-w-[130px] flex justify-end">
            {!isLast ? (
              <button
                onClick={handleNext}
                className="font-pixel text-[9px] px-5 py-3 bg-black text-pink-400 border-2 border-pink-500 rounded-sm shadow-pink-glow hover:bg-pink-500 hover:text-black transition-colors"
              >
                [ SIGUIENTE &gt; ]
              </button>
            ) : (
              <button
                onClick={handleSubmitClick}
                className="font-pixel text-[9px] px-5 py-3 bg-pink-500 text-black border-2 border-pink-500 rounded-sm shadow-pink-glow hover:bg-pink-400 transition-colors animate-flicker"
              >
                [ ENVIAR VOTACIÓN ]
              </button>
            )}
          </div>
        </div>

        <div className="pointer-events-none absolute inset-0 crt-scanlines opacity-10" />
      </div>

      <p className="mt-6 text-center font-retro text-[11px] text-neutral-600">
        Puedes cambiar tu selección en cualquier fase antes de enviar.
      </p>

      {/* Clip en preview durante la votación */}
      <ClipModal
        mode="preview"
        nominee={clip?.nominee ?? null}
        categoryName={clip?.categoryName}
        onClose={() => setClip(null)}
      />

      {/* Modal de envío (progreso / error / retry) */}
      <SubmissionModal
        open={modalOpen}
        onRequest={handleRequest}
        onSuccess={handleSuccess}
        onClose={() => setModalOpen(false)}
      />

      {/* Modal para usuario que ya ha votado */}
      <AlreadyVotedModal
        open={alreadyVotedOpen}
        onClose={() => setAlreadyVotedOpen(false)}
      />
    </section>
  );
}
