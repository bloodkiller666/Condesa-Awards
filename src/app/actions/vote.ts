"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type VoteResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

/**
 * Registra / actualiza el voto de un usuario para una categoría.
 * - Valida la sesión del servidor (previene doble voto por usuario).
 * - Valida que el nominee pertenezca a la categoría.
 * - Realiza un UPSERT sobre la constraint unique (user_id, category_id).
 */
export async function castVote(
  categoryId: string,
  nomineeId: string
): Promise<VoteResult> {
  const supabase = await createClient();

  // Verificar configuración de Supabase
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { ok: false, error: "Configuración de Supabase incompleta. Contacta al administrador." };
  }

  // 1. Sesión obligatoria (seguridad server-side, anti-duplicación).
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error("Auth error:", authError);
    return { ok: false, error: "Debes iniciar sesión para votar." };
  }

  // 2. Verificar estado de votación.
  const { data: settings } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "voting_open")
    .single();

  if (settings && settings.value === false) {
    return { ok: false, error: "Las votaciones están cerradas." };
  }

  // 3. Validar que el nominee pertenece a la categoría.
  const { data: nominee, error: nomineeError } = await supabase
    .from("nominees")
    .select("id, category_id")
    .eq("id", nomineeId)
    .single();

  if (nomineeError || !nominee || nominee.category_id !== categoryId) {
    return { ok: false, error: "Nominación inválida para esta categoría." };
  }

  // 4. Upsert: un solo voto por usuario por categoría.
  const { error } = await supabase.from("votes").upsert(
    {
      user_id: user.id,
      category_id: categoryId,
      nominee_id: nomineeId,
      updated_at: new Date().toISOString()
    },
    { onConflict: "user_id,category_id" }
  );

  if (error) {
    // Detecta la violación de la constraint (doble voto).
    if (error.code === "23505") {
      return { ok: false, error: "Ya has votado en esta categoría." };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/", "layout");
  return { ok: true, message: "VOTO REGISTRADO" };
}

export type SubmitVotesResult =
  | { ok: true; message: string; count: number }
  | { ok: false; error: string; alreadyVoted?: boolean };

export interface VoteSelection {
  categoryId: string;
  nomineeId: string;
}

/**
 * Envía la votación completa del wizard en un solo batch (una llamada por
 * categoría resuelta como un único UPSERT).
 *
 * - Valida la sesión y el estado de votación.
 * - Deduplica por categoría (última selección gana).
 * - Verifica que cada (category_id, nominee_id) exista en la DB.
 * - Inserta/actualiza todas las filas en una sola operación.
 */
export async function submitVotes(
  selections: VoteSelection[]
): Promise<SubmitVotesResult> {
  const supabase = await createClient();

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return {
      ok: false,
      error: "Configuración de Supabase incompleta. Contacta al administrador."
    };
  }

  if (!selections || selections.length === 0) {
    return { ok: false, error: "No hay votos para enviar." };
  }

  // 1. Sesión obligatoria (seguridad server-side).
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error("Auth error:", authError);
    return { ok: false, error: "Debes iniciar sesión para votar." };
  }

  // 2. Verificar estado de votación.
  const { data: settings } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "voting_open")
    .single();

  if (settings && settings.value === false) {
    return { ok: false, error: "Las votaciones están cerradas." };
  }

  // 2.5. Verificar si el usuario ya ha votado (incluso si borró caché)
  const { data: existingVotes, error: votesError } = await supabase
    .from("votes")
    .select("id")
    .eq("user_id", user.id)
    .limit(1);

  if (!votesError && existingVotes && existingVotes.length > 0) {
    return { ok: false, error: "Ya has participado en las votaciones.", alreadyVoted: true };
  }

  // 3. Deduplicar por categoría (la última selección manda).
  const byCategory = new Map<string, string>();
  selections.forEach(({ categoryId, nomineeId }) => {
    byCategory.set(categoryId, nomineeId);
  });

  // 4. Validar que cada nominado pertenezca a su categoría (una sola query).
  const nomineeIds = [...new Set(byCategory.values())];
  const { data: nominees, error: nomineesError } = await supabase
    .from("nominees")
    .select("id, category_id")
    .in("id", nomineeIds);

  if (nomineesError) {
    return { ok: false, error: nomineesError.message };
  }

  const validPairs = new Set(
    (nominees ?? []).map((n) => `${n.category_id}|${n.id}`)
  );
  const rows: {
    user_id: string;
    category_id: string;
    nominee_id: string;
    updated_at: string;
  }[] = [];

  for (const [categoryId, nomineeId] of byCategory) {
    if (!validPairs.has(`${categoryId}|${nomineeId}`)) {
      return {
        ok: false,
        error: "Nominación inválida para una de las categorías."
      };
    }
    rows.push({
      user_id: user.id,
      category_id: categoryId,
      nominee_id: nomineeId,
      updated_at: new Date().toISOString()
    });
  }

  // 5. Batch upsert (un solo viaje a Supabase).
  const { error } = await supabase
    .from("votes")
    .upsert(rows, { onConflict: "user_id,category_id" });

  if (error) {
    console.error("submitVotes error:", error);
    return { ok: false, error: error.message };
  }

  revalidatePath("/", "layout");
  return { ok: true, message: "VOTACIÓN REGISTRADA", count: rows.length };
}