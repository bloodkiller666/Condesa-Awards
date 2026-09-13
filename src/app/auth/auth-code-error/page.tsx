export default function AuthCodeError() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="text-center">
        <h1 className="font-pixel text-pink-400 text-xl mb-4">ERROR DE AUTENTICACIÓN</h1>
        <p className="font-retro text-neutral-400">
          No se pudo completar el inicio de sesión. Inténtalo de nuevo.
        </p>
        <a
          href="/"
          className="inline-block mt-6 font-pixel text-[10px] px-4 py-2 border border-pink-500 text-pink-400 hover:bg-pink-500 hover:text-black transition-colors"
        >
          ← VOLVER
        </a>
      </div>
    </div>
  );
}