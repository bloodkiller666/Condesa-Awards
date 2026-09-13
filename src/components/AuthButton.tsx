"use client";

import Image from "next/image";
import { useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface AuthButtonProps {
  user: User | null;
  onLoginClick?: () => void;
}

/**
 * Botón de acceso en el header.
 * - Si hay sesión: muestra avatar, nombre y botón [ SALIR ]
 * - Si no hay sesión: muestra botón [ INICIAR SESIÓN ] que dispara onLoginClick
 */
export default function AuthButton({ user, onLoginClick }: AuthButtonProps) {
  const [pending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.reload();
    });
  };

  if (user) {
    return (
      <div className="flex items-center gap-3">
        {user.user_metadata?.avatar_url && (
          <Image
            src={user.user_metadata.avatar_url}
            alt="avatar"
            width={28}
            height={28}
            className="rounded-full border border-pink-500/60"
          />
        )}
        <span className="font-retro text-pink-400 text-sm">
          {user.user_metadata?.user_name ??
            user.user_metadata?.preferred_username ??
            user.user_metadata?.full_name ??
            user.email}
        </span>
        <button
          onClick={handleLogout}
          disabled={pending}
          className="font-pixel text-[9px] px-3 py-2 border border-white/30 text-neutral-300 rounded-sm hover:border-white hover:text-white transition-colors disabled:opacity-50"
        >
          [ SALIR ]
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={onLoginClick}
      className="font-pixel text-[9px] px-4 py-2 bg-black text-pink-400 border-2 border-pink-500 rounded-sm shadow-pink-glow hover:bg-pink-500 hover:text-black transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-black"
    >
      [ INICIAR SESIÓN ]
    </button>
  );
}