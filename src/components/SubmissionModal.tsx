"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import type { SubmitVotesResult } from "@/app/actions/vote";

interface SubmissionModalProps {
  open: boolean;
  /** Lanza la petición batch (upsert) con las selecciones actuales. */
  onRequest: () => Promise<SubmitVotesResult>;
  /** Se invoca cuando el envío terminó exitosamente. */
  onSuccess: () => void;
  /** Cierra el modal (tras éxito o cancelación) sin perder selecciones. */
  onClose: () => void;
}

const SAFETY_TIMEOUT_MS = 20000;
const PROGRESS_DURATION_MS = 4200;

type ModalView = "loading" | "error" | "success";

/** Mensajes dinámicos según el porcentaje de progreso. */
function statusText(progress: number): string {
  if (progress >= 100) return "¡Voto registrado exitosamente!";
  if (progress >= 80) return "Terminando de subir votación...";
  if (progress >= 40) return "Esto podría tardar unos segundos...";
  return "Subiendo votación...";
}

/**
 * Modal de envío de votación (CRT / pink neon).
 *
 * - Barra de progreso animada con GSAP (0% → 99% mientras la petición corre y
 *   salta a 100% cuando Supabase responde OK).
 * - Mensajes dinámicos según el progreso.
 * - Safety timeout: si Supabase tarda demasiado (o devuelve error) se muestra
 *   la vista de error con [ REINTENTAR ], sin perder las selecciones.
 * - En éxito muestra "¡Voto registrado exitosamente!" y se auto-cierra.
 */
export default function SubmissionModal({
  open,
  onRequest,
  onSuccess,
  onClose
}: SubmissionModalProps) {
  const [view, setView] = useState<ModalView>("loading");
  const [progress, setProgress] = useState(0);
  const [serverError, setServerError] = useState<string | null>(null);

  // Refrescos de props (sin reiniciar el intento en curso).
  const requestRef = useRef(onRequest);
  requestRef.current = onRequest;
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Control del ciclo de vida: cada "run" captura una epoch; si cambia (nuevo
  // intento o desmontaje) las continuaciones del intento viejo se descartan.
  const epochRef = useRef(0);
  const runningRef = useRef(false);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoCloseRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (autoCloseRef.current) clearTimeout(autoCloseRef.current);
    timeoutRef.current = null;
    autoCloseRef.current = null;
  };

  const killTween = () => {
    tweenRef.current?.kill();
    tweenRef.current = null;
  };

  // Control de apertura: evita reintentos dobles del mismo evento de apertura.
  const wasOpenRef = useRef(false);

  // Desmontaje: aborta cualquier intento en vuelo (y permite re-arrancar el
  // envío si React remonta el modal, p.ej. en StrictMode de desarrollo).
  useEffect(() => {
    return () => {
      epochRef.current += 1;
      runningRef.current = false;
      wasOpenRef.current = false;
      killTween();
      clearTimers();
    };
  }, []);

  /** Intenta (o reintenta) el envío: anima progreso + espera la petición. */
  const start = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;

    const epoch = ++epochRef.current;
    killTween();
    clearTimers();
    setServerError(null);
    setView("loading");
    setProgress(0);

    const alive = () => epochRef.current === epoch;

    const proxy = { p: 0 };
    // 1. Barra de progreso: sube hasta 99% mientras la petición corre.
    tweenRef.current = gsap.to(proxy, {
      p: 0.99,
      duration: PROGRESS_DURATION_MS / 1000,
      ease: "power1.inOut",
      onUpdate: () => {
        if (alive()) setProgress(proxy.p);
      }
    });

    const result = await Promise.race<SubmitVotesResult>([
      requestRef
        .current()
        .catch((e: unknown): SubmitVotesResult => ({
          ok: false,
          error: e instanceof Error ? e.message : "Error de red"
        })),
      new Promise<SubmitVotesResult>((resolve) => {
        timeoutRef.current = setTimeout(
          () => resolve({ ok: false, error: "__timeout__" }),
          SAFETY_TIMEOUT_MS
        );
      })
    ]);

    if (!alive()) return; // superado por otro intento / desmontaje

    if (result.ok) {
      // 2. Respuesta OK: completa la barra al 100% y muestra el mensaje final.
      tweenRef.current = gsap.to(proxy, {
        p: 1,
        duration: 0.5,
        ease: "power2.out",
        onUpdate: () => {
          if (alive()) setProgress(proxy.p);
        },
        onComplete: () => {
          if (!alive()) return;
          setProgress(1);
          runningRef.current = false;
          // Deja visible un instante el 100% + el mensaje de éxito.
          autoCloseRef.current = setTimeout(() => {
            if (!alive()) return;
            setView("success");
            onSuccessRef.current();
            autoCloseRef.current = setTimeout(() => {
              if (!alive()) return;
              onCloseRef.current();
            }, 2400);
          }, 900);
        }
      });
    } else {
      // 3. Error de Supabase (o safety timeout): vista de error.
      runningRef.current = false;
      setServerError(result.error === "__timeout__" ? null : result.error);
      setView("error");
    }
  }, []);

  // Al abrir el modal, arranca el envío automáticamente.
  useEffect(() => {
    if (open && !wasOpenRef.current) {
      start();
    }
    wasOpenRef.current = open;
  }, [open, start]);

  const handleRetry = () => {
    start();
  };

  const handleClose = () => {
    if (view === "loading") return; // no cancelar un envío a mitad de camino
    epochRef.current += 1; // descarta timers/tweens pendientes
    killTween();
    clearTimers();
    onCloseRef.current();
  };

  if (!open) return null;

  const percent = Math.round(progress * 100);
  const pctText = String(percent).padStart(3, "0");
  const isError = view === "error";
  const isSuccess = view === "success";

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={view === "loading" ? undefined : handleClose}
    >
      <div className="flex items-center justify-center min-h-full">
        <div
          onClick={(e) => e.stopPropagation()}
          className={`relative w-full max-w-md bg-neutral-900 border-2 rounded-sm p-6 shadow-pink-glow ${
            isError
              ? "border-red-500/70"
              : isSuccess
                ? "border-pink-500/80"
                : "border-pink-500/60"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-pixel text-xs text-white">
              {isError ? (
                <span className="text-red-400">ERROR DE TRANSMISIÓN</span>
              ) : isSuccess ? (
                <span className="text-pink-400 neon-text">VOTO REGISTRADO</span>
              ) : (
                <>
                  ENVIANDO VOTACIÓN
                  <span className="text-pink-400 animate-pulse">...</span>
                </>
              )}
            </h3>
            {view === "loading" ? (
              <span className="font-pixel text-[9px] text-neutral-500">
                {pctText}%
              </span>
            ) : (
              <button
                onClick={handleClose}
                className="font-pixel text-xs text-neutral-400 hover:text-white transition-colors"
                aria-label="Cerrar"
              >
                [X]
              </button>
            )}
          </div>

          {view === "loading" && (
            <div>
              {/* % gigante estilo terminal */}
              <div className="text-center mb-4">
                <span className="font-pixel text-4xl text-pink-400 neon-text">
                  {pctText}
                  <span className="text-white">%</span>
                </span>
              </div>

              {/* Barra de progreso animada */}
              <div className="h-4 bg-neutral-800 border border-white/10 overflow-hidden relative">
                <div
                  className="h-full bg-pink-500 shadow-pink-glow transition-[width] duration-75 ease-linear"
                  style={{ width: `${percent}%` }}
                />
                <div className="pointer-events-none absolute inset-0 crt-scanlines opacity-30" />
              </div>

              {/* Mensaje dinámico */}
              <p className="mt-5 font-retro text-sm text-neutral-300 text-center min-h-[1.25rem]">
                {statusText(progress)}
                <span className="text-pink-400 animate-pulse">▌</span>
              </p>
            </div>
          )}

          {isSuccess && (
            <div className="text-center">
              <div className="font-pixel text-4xl text-pink-400 neon-text mb-4 animate-pulse-glow">
                ✓
              </div>
              <p className="font-retro text-lg text-white mb-2">
                ¡Voto registrado exitosamente!
              </p>
              <p className="font-retro text-xs text-neutral-500 mb-6">
                Gracias por participar en los CONDESA AWARDS 2026.
              </p>
              <button
                onClick={handleClose}
                className="font-pixel text-[10px] px-6 py-3 bg-black text-pink-400 border-2 border-pink-500 rounded-sm shadow-pink-glow hover:bg-pink-500 hover:text-black transition-colors"
              >
                [ CERRAR ]
              </button>
            </div>
          )}

          {isError && (
            <div className="text-center">
              <div className="font-pixel text-3xl text-red-400 animate-flicker mb-4">
                ⚠
              </div>
              <p className="font-retro text-sm text-white mb-2">
                Error al guardar los votos. Comprueba tu conexión o intentalo de
                nuevo.
              </p>
              {serverError && (
                <p className="font-retro text-[11px] text-neutral-500 mb-4">
                  {serverError}
                </p>
              )}
              <div className="flex gap-3 justify-center mt-2 flex-wrap">
                <button
                  onClick={handleRetry}
                  className="font-pixel text-[9px] px-5 py-3 bg-black text-pink-400 border-2 border-pink-500 rounded-sm shadow-pink-glow hover:bg-pink-500 hover:text-black transition-colors"
                >
                  [ REINTENTAR ]
                </button>
                <button
                  onClick={handleClose}
                  className="font-pixel text-[9px] px-5 py-3 bg-black text-neutral-300 border border-white/30 rounded-sm hover:border-white hover:text-white transition-colors"
                >
                  [ CANCELAR ]
                </button>
              </div>
              <p className="mt-4 font-retro text-[10px] text-neutral-600">
                Tus selecciones se conservan. Puedes reintentar cuando quieras.
              </p>
            </div>
          )}

          {/* Overlays CRT */}
          <div className="pointer-events-none absolute inset-0 crt-scanlines opacity-20" />
        </div>
      </div>
    </div>
  );
}
