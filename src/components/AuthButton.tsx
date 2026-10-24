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
 * - Si hay sesión: muestra avatar, nombre y botón SALIR
 * - Si no hay sesión: muestra botón INICIAR SESIÓN que dispara onLoginClick
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
    const name =
      user.user_metadata?.user_name ??
      user.user_metadata?.preferred_username ??
      user.user_metadata?.full_name ??
      user.email;

    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 border border-line bg-ink-3/80 py-1 pl-1 pr-3">
          {user.user_metadata?.avatar_url ? (
            <Image
              src={user.user_metadata.avatar_url}
              alt="avatar"
              width={28}
              height={28}
              className="block h-7 w-7"
            />
          ) : (
            <span className="flex h-7 w-7 items-center justify-center bg-pink font-display text-sm font-medium text-ink">
              {String(name ?? "?").charAt(0).toUpperCase()}
            </span>
          )}
          <span className="hidden max-w-[10rem] truncate font-mono text-xs text-cream sm:block">
            {name}
          </span>
        </div>
        <button
          onClick={handleLogout}
          disabled={pending}
          className="btn btn-ghost btn-sm"
        >
          SALIR
        </button>
      </div>
    );
  }

  return (
    <button onClick={onLoginClick} className="btn btn-primary btn-sm">
      INICIAR SESIÓN
    </button>
  );
}
