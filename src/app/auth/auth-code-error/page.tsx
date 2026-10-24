import { WarningIcon, ArrowIcon } from "@/components/ui/Icons";

export default function AuthCodeError() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4">
      <div className="panel panel--danger w-full max-w-md p-10 text-center">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center bg-[#ff5d6c] text-ink">
          <WarningIcon size={26} />
        </div>
        <h1 className="mb-3 font-display text-2xl font-medium tracking-wide text-cream">
          ERROR DE AUTENTICACIÓN
        </h1>
        <p className="text-sm leading-relaxed text-mute">
          No se pudo completar el inicio de sesión. Inténtalo de nuevo.
        </p>
        <a href="/" className="btn btn-primary mt-8 inline-flex">
          <ArrowIcon size={14} dir="left" />
          VOLVER
        </a>
      </div>
    </div>
  );
}
