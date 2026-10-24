"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { CheckIcon, CloseIcon, WarningIcon } from "@/components/ui/Icons";
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
      className="modal-backdrop fixed inset-0 z-[60] overflow-y-auto p-4"
      onClick={view === "loading" ? undefined : handleClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="flex min-h-full items-center justify-center">
        <div
          onClick={(e) => e.stopPropagation()}
          className={`panel relative w-full max-w-md p-6 sm:p-8 ${
            isError ? "panel--danger" : "panel--accent"
          }`}
        >
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <h3 className="font-display text-lg font-medium tracking-[0.14em]">
              {isError ? (
                <span className="text-[#ff7a87]">ERROR DE TRANSMISIÓN</span>
              ) : isSuccess ? (
                <span className="text-pink-400">VOTO REGISTRADO</span>
              ) : (
                <span className="text-cream">
                  ENVIANDO VOTACIÓN
                  <span className="animate-blink text-pink-400">...</span>
                </span>
              )}
            </h3>
            {view !== "loading" && (
              <button
                onClick={handleClose}
                className="text-mute transition-colors hover:text-cream"
                aria-label="Cerrar"
              >
                <CloseIcon size={14} />
              </button>
            )}
          </div>

          {view === "loading" && (
            <div>
              {/* % gigante estilo terminal */}
              <div className="mb-5 text-center">
                <span className="phosphor font-crt text-8xl leading-none text-pink-400">
                  {pctText}
                  <span className="text-cream">%</span>
                </span>
              </div>

              {/* Barra de progreso segmentada */}
              <div className="relative h-5 overflow-hidden bg-ink-4 p-[3px]">
                <div
                  className="h-full bg-pink transition-[width] duration-75 ease-linear"
                  style={{
                    width: `${percent}%`,
                    backgroundImage:
                      "repeating-linear-gradient(90deg, transparent 0 9px, rgba(7,5,11,0.55) 9px 11px)"
                  }}
                />
              </div>

              {/* Mensaje dinámico */}
              <p className="mt-5 min-h-[1.25rem] text-center font-mono text-xs uppercase tracking-[0.16em] text-mute">
                {statusText(progress)}
                <span className="animate-blink text-pink-400">▌</span>
              </p>
            </div>
          )}

          {isSuccess && (
            <div className="text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center bg-pink text-ink">
                <CheckIcon size={32} />
              </div>
              <p className="mb-2 font-display text-2xl font-medium text-cream">
                ¡Voto registrado exitosamente!
              </p>
              <p className="mb-7 text-sm text-mute">
                Gracias por participar en los CONDESA AWARDS 2026.
              </p>
              <button onClick={handleClose} className="btn btn-primary">
                CERRAR
              </button>
            </div>
          )}

          {isError && (
            <div className="text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center bg-[#ff5d6c] text-ink">
                <WarningIcon size={30} />
              </div>
              <p className="mb-2 text-sm leading-relaxed text-cream">
                Error al guardar los votos. Comprueba tu conexión o intentalo de
                nuevo.
              </p>
              {serverError && (
                <p className="mb-4 font-mono text-[11px] text-dim">{serverError}</p>
              )}
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <button onClick={handleRetry} className="btn btn-primary btn-sm">
                  REINTENTAR
                </button>
                <button onClick={handleClose} className="btn btn-ghost btn-sm">
                  CANCELAR
                </button>
              </div>
              <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.14em] text-dim">
                Tus selecciones se conservan. Puedes reintentar cuando quieras.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
