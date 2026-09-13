"use client";

interface TermsModalProps {
  onAccept: () => void;
  onReject: () => void;
}

/**
 * Kill switch global de audio: pausa y rebobina la música de la intro para
 * que los clips de Twitch se reproduzcan con audio limpio.
 */
function stopIntroAudio() {
  const intro = (
    window as unknown as { __introAudio?: HTMLAudioElement }
  ).__introAudio;
  if (intro) {
    intro.pause();
    intro.currentTime = 0;
  }
}

export default function TermsModal({ onAccept, onReject }: TermsModalProps) {
  const handleAccept = () => {
    stopIntroAudio();
    onAccept();
  };

  const handleReject = () => {
    stopIntroAudio();
    onReject();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div className="border-2 border-pink-500/50 p-8 bg-black w-full max-w-lg shadow-[0_0_15px_rgba(236,72,153,0.3)]">
        <h2 className="text-2xl font-pixel text-pink-500 mb-6 tracking-wider">[ AVISO LEGAL Y COOKIES ]</h2>
        <div className="text-neutral-300 font-pixel text-sm mb-6 max-h-64 overflow-y-auto pr-2 custom-scrollbar leading-relaxed">
          <p className="mb-4">
            AL ACCEDER A ESTE SISTEMA DE VOTACIÓN, ACEPTAS LOS SIGUIENTES TÉRMINOS:
          </p>
          <p className="mb-3">
            1. AUTENTICACIÓN: Se utilizan tokens de sesión OAuth de Twitch y Discord para verificar
            tu identidad. Estos tokens se almacenan únicamente como cookies de sesión HTTP-only.
          </p>
          <p className="mb-3">
            2. VERIFICACIÓN DE VOTO: Cada voto se registra con tu ID de usuario único para prevenir
            duplicados. No se almacena información personal adicional.
          </p>
          <p className="mb-3">
            3. GALLETAS (COOKIES): Se usan cookies técnicas estrictamente necesarias para mantener tu
            sesión de voto. No se utilizan cookies de tracking ni analytics de terceros.
          </p>
          <p className="mb-3">
            4. REVOCACIÓN: Puedes revocar el acceso desconectando la aplicación en la configuración
            de Twitch/Discord. Tu voto permanecerá anónimo en los resultados públicos.
          </p>
          <p className="text-pink-400">
            [ CONDESA AWARDS 2026 - SISTEMA OFICIAL DE VOTACIÓN ]
          </p>
        </div>
        <div className="flex justify-end gap-4">
          <button
            onClick={handleReject}
            className="text-neutral-500 hover:text-red-500 font-pixel text-sm transition-colors"
          >
            [ RECHAZAR ]
          </button>
          <button
            onClick={handleAccept}
            className="text-pink-500 hover:text-black hover:bg-pink-500 border border-pink-500 px-6 py-2 font-pixel text-sm transition-colors"
          >
            [ ACEPTAR Y CONTINUAR ]
          </button>
        </div>
      </div>
    </div>
  );
}
