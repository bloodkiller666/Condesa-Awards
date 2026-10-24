"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { gsap, useGSAP } from "@/lib/gsap";
import ClipModal from "@/components/ClipModal";
import SubmissionModal from "@/components/SubmissionModal";
import AlreadyVotedModal from "@/components/AlreadyVotedModal";
import { ArrowIcon, CheckIcon, PlayIcon, WarningIcon, CloseIcon } from "@/components/ui/Icons";
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

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Asistente de votación paso a paso (1 categoría por pantalla).
 *
 * - Las selecciones viven en estado local (`selectedVotes`); NO se toca la DB
 *   mientras se navega entre categorías.
 * - Transiciones GSAP (slide + fade + cascada de tarjetas) entre pasos.
 * - Riel lateral con todas las categorías para saltar directamente.
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

  // Entrada de la página (una sola vez).
  useGSAP(
    () => {
      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .from(".vw-head > *", { opacity: 0, y: 22, duration: 0.55, stagger: 0.09 })
        .from(".vw-rail", { opacity: 0, x: -24, duration: 0.55 }, "-=0.35")
        .from(".vw-panel", { opacity: 0, y: 28, duration: 0.6 }, "-=0.5");
    },
    { scope: rootRef }
  );

  // Transición de entrada (slide + fade + cascada) de cada categoría.
  useGSAP(
    () => {
      const stage = stageRef.current;
      if (!stage) return;
      const fromX = dir === "next" ? 70 : -70;
      gsap.fromTo(
        stage,
        { opacity: 0, x: fromX },
        {
          opacity: 1,
          x: 0,
          duration: 0.4,
          ease: "power3.out",
          onComplete: () => {
            busyRef.current = false;
          }
        }
      );
      gsap.fromTo(
        stage.querySelectorAll(".nom-card"),
        { opacity: 0, y: 26 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: "power3.out",
          stagger: 0.06,
          delay: 0.08,
          clearProps: "opacity,transform"
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
          x: d === "next" ? -60 : 60,
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

    // Feedback táctil: la tarjeta elegida "encaja" y el check hace pop.
    const card = stageRef.current?.querySelector<HTMLElement>(
      `[data-nominee="${nomineeId}"]`
    );
    if (card) {
      gsap.fromTo(
        card,
        { scale: 0.96 },
        { scale: 1, duration: 0.45, ease: "back.out(3)", clearProps: "transform" }
      );
      const check = card.querySelector<HTMLElement>(".nom-check");
      if (check) {
        gsap.fromTo(
          check,
          { scale: 0, rotate: -30 },
          { scale: 1, rotate: 0, duration: 0.45, ease: "back.out(4)", clearProps: "transform" }
        );
      }
    }
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
    <section
      id="votacion"
      ref={rootRef}
      className="mx-auto w-full max-w-6xl px-4 py-10 sm:py-14"
    >
      {/* Encabezado */}
      <div className="vw-head mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow mb-3">Edición 2026</p>
          <h2 className="font-display text-5xl font-medium tracking-wide text-cream sm:text-6xl">
            VOTACIÓN
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-mute">
            Elige UNA nominación por categoría · {total} fases
          </p>
        </div>

        {/* Progreso general de votos */}
        <div className="w-full md:w-72">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="label">Votos</span>
            <span className="font-crt text-4xl leading-none text-cream">
              {pad(votedCount)}
              <span className="text-dim"> / {pad(total)}</span>
            </span>
          </div>
          <div className="flex gap-1" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={votedCount}>
            {categories.map((c) => (
              <span
                key={c.id}
                className={`h-2 flex-1 transition-colors duration-300 ${
                  selectedVotes[c.id]
                    ? "bg-pink shadow-[0_0_10px_rgba(255,79,163,0.6)]"
                    : "bg-ink-4"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Aviso de sesión / error local */}
      {notice && (
        <div className="panel panel--danger mb-6 flex items-center gap-3 p-4 text-sm text-cream">
          <WarningIcon size={16} className="text-[#ff5d6c]" />
          {notice}
        </div>
      )}

      {/* Panel de advertencia: categorías sin votar */}
      {warningOpen && missing.length > 0 && (
        <div className="panel panel--danger mb-6 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <WarningIcon size={18} className="mt-0.5 shrink-0 text-[#ff5d6c]" />
              <div>
                <p className="mb-1 font-display text-lg font-medium tracking-wide text-cream">
                  VOTACIÓN INCOMPLETA
                </p>
                <p className="mb-4 text-sm text-mute">
                  {isAuthenticated
                    ? `Faltan ${missing.length} categoría(s) por votar. Toca una para ir directamente o completa todas antes de enviar.`
                    : ""}
                </p>
              </div>
            </div>
            <button
              onClick={() => setWarningOpen(false)}
              className="shrink-0 text-mute transition-colors hover:text-cream"
              aria-label="Cerrar aviso"
            >
              <CloseIcon size={14} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {missing.map((cat, i) => (
              <button
                key={cat.id}
                onClick={() => jumpToMissing(cat.id)}
                className="border border-[#ff5d6c]/40 px-3 py-1.5 font-mono text-xs text-[#ff9aa4] transition-colors hover:bg-[#ff5d6c] hover:text-ink"
              >
                {pad(i + 1)} {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[17rem_1fr]">
        {/* Riel de categorías (escritorio) */}
        <nav
          aria-label="Categorías"
          className="vw-rail panel hidden self-start p-3 lg:sticky lg:top-24 lg:block"
        >
          <p className="label px-2 pb-3 pt-1">Categorías</p>
          <ul className="max-h-[60vh] space-y-1 overflow-y-auto pr-1">
            {categories.map((cat, i) => {
              const voted = !!selectedVotes[cat.id];
              const active = i === current;
              return (
                <li key={cat.id}>
                  <button
                    onClick={() => goTo(i, i > current ? "next" : "prev")}
                    aria-current={active ? "step" : undefined}
                    className={`group flex w-full items-center gap-3 px-2.5 py-2 text-left transition-colors ${
                      active
                        ? "bg-pink/10 shadow-[inset_2px_0_0_0_var(--pink)]"
                        : "hover:bg-white/[0.04]"
                    }`}
                  >
                    <span
                      className={`font-mono text-[11px] ${
                        active ? "text-pink-400" : "text-dim"
                      }`}
                    >
                      {pad(i + 1)}
                    </span>
                    <span
                      className={`flex-1 truncate text-sm ${
                        active ? "font-medium text-cream" : "text-mute group-hover:text-cream"
                      }`}
                    >
                      {cat.name}
                    </span>
                    <span
                      className={`flex h-4 w-4 items-center justify-center ${
                        voted ? "bg-pink text-ink" : "border border-line-strong"
                      }`}
                      style={voted ? undefined : { borderColor: "var(--line-strong)" }}
                    >
                      {voted && <CheckIcon size={11} />}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Marco del wizard */}
        <div className="vw-panel panel p-5 sm:p-8">
          {/* Indicador de fase */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <span className="label">
              Fase{" "}
              <span className="text-pink-400">{pad(current + 1)}</span>
              <span className="text-dim"> / {pad(total)}</span>
            </span>
            {/* Puntos de navegación (móvil) */}
            <div className="flex gap-1.5 lg:hidden">
              {categories.map((cat, i) => {
                const voted = !!selectedVotes[cat.id];
                const isCurrentStep = i === current;
                return (
                  <button
                    key={cat.id}
                    onClick={() => goTo(i, i > current ? "next" : "prev")}
                    aria-label={`Ir a categoría ${i + 1}`}
                    className={`h-2.5 transition-all ${
                      isCurrentStep
                        ? "w-6 bg-pink"
                        : voted
                          ? "w-2.5 bg-pink/50"
                          : "w-2.5 bg-ink-5"
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* Fase actual (categoría por categoría) */}
          <div ref={stageRef} className="will-change-transform">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {currentCat.icon && (
                  <div className="px-frame px-frame--accent flex h-14 w-14 shrink-0 items-center justify-center text-2xl">
                    {currentCat.icon}
                  </div>
                )}
                <h3 className="font-display text-3xl font-medium leading-tight tracking-wide text-cream sm:text-4xl">
                  {currentCat.name}
                </h3>
              </div>
              {selectionForCurrent && (
                <span className="inline-flex items-center gap-2 bg-pink/15 px-3 py-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-pink-300">
                  <CheckIcon size={12} />
                  Seleccionado
                </span>
              )}
            </div>

            {currentCat.description && (
              <p className="mb-6 max-w-2xl text-sm leading-relaxed text-mute">
                {currentCat.description}
              </p>
            )}

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {currentCat.nominees.map((nom, i) => {
                const isSelected = selectionForCurrent === nom.id;
                return (
                  <div
                    key={nom.id}
                    data-nominee={nom.id}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSelected}
                    onClick={() => handleSelect(currentCat.id, nom.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleSelect(currentCat.id, nom.id);
                      }
                    }}
                    className={`nom-card group relative flex min-h-[10rem] cursor-pointer select-none flex-col justify-between overflow-hidden p-5 transition-[background,box-shadow,transform] duration-200 hover:-translate-y-1 ${
                      isSelected
                        ? "bg-pink/10 shadow-[inset_0_0_0_2px_var(--pink),0_0_36px_-12px_rgba(255,79,163,0.7)]"
                        : "bg-ink-3 shadow-[inset_0_0_0_1px_var(--line)] hover:bg-ink-4 hover:shadow-[inset_0_0_0_1px_rgba(255,79,163,0.55)]"
                    }`}
                  >
                    {/* Numeral grande de fondo */}
                    <span
                      aria-hidden
                      className={`pointer-events-none absolute -right-1 -top-3 font-crt text-8xl leading-none transition-colors ${
                        isSelected ? "text-pink/25" : "text-white/[0.05] group-hover:text-pink/15"
                      }`}
                    >
                      {pad(i + 1)}
                    </span>

                    <p className="relative z-[1] pr-10 text-lg font-semibold leading-snug text-cream">
                      {nom.name}
                    </p>

                    <div className="relative z-[1] mt-6 flex items-center justify-between gap-3">
                      {/* Botón de clip (no dispara la selección) */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setClip({ nominee: nom, categoryName: currentCat.name });
                        }}
                        className="link-pixel"
                      >
                        <PlayIcon size={11} />
                        Ver clip
                      </button>

                      <span
                        className={`nom-check flex h-6 w-6 items-center justify-center transition-colors ${
                          isSelected
                            ? "bg-pink text-ink"
                            : "border border-dashed text-transparent"
                        }`}
                        style={isSelected ? undefined : { borderColor: "var(--line-strong)" }}
                      >
                        <CheckIcon size={14} />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Navegación */}
          <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6">
            <div className="min-w-[130px]">
              {!isFirst && (
                <button onClick={handlePrev} className="btn btn-ghost">
                  <ArrowIcon size={14} dir="left" />
                  ANTERIOR
                </button>
              )}
            </div>

            <div className="flex min-w-[130px] justify-end">
              {!isLast ? (
                <button onClick={handleNext} className="btn btn-primary">
                  SIGUIENTE
                  <ArrowIcon size={14} />
                </button>
              ) : (
                <button
                  onClick={handleSubmitClick}
                  className={`btn btn-lg ${complete ? "btn-gold" : "btn-primary"}`}
                >
                  ENVIAR VOTACIÓN
                  <ArrowIcon size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <p className="mt-6 text-center font-mono text-[11px] uppercase tracking-[0.16em] text-dim">
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
