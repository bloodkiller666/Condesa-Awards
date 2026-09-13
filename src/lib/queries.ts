import { createClient } from "@/lib/supabase/server";
import type {
  Category,
  CategoryResult,
  CategoryWithNominees,
  CategoryWithResult,
  Nominee
} from "@/types";
import { CATEGORIES as STATIC_CATEGORIES } from "@/lib/data";

/**
 * Devuelve las categorías con sus nominados (desde DB; fallback estático).
 */
export async function getCategoriesWithNominees(): Promise<CategoryWithNominees[]> {
  const supabase = await createClient();

  const [{ data: categories }, { data: nominees }] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order"),
    supabase.from("nominees").select("*").order("sort_order")
  ]);

  if (!categories || categories.length === 0) {
    return STATIC_CATEGORIES;
  }

  const cats = categories as Category[];
  const noms = (nominees ?? []) as Nominee[];

  return cats.map((c) => ({
    ...c,
    nominees: noms
      .filter((n) => n.category_id === c.id)
      .sort((a, b) => a.sort_order - b.sort_order)
  }));
}

export async function getVotingOpen(): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "voting_open")
    .single();

  if (!data) return true;
  return data.value !== false;
}

/**
 * Devuelve los votos del usuario autenticado (para marcar qué ya votó).
 */
export async function getUserVotes(): Promise<Record<string, string>> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return {};

  const { data: votes } = await supabase
    .from("votes")
    .select("category_id, nominee_id")
    .eq("user_id", user.id);

  const map: Record<string, string> = {};
  (votes ?? []).forEach((v: { category_id: string; nominee_id: string }) => {
    map[v.category_id] = v.nominee_id;
  });
  return map;
}

/**
 * Verifica si el usuario ya ha votado (tiene al menos un voto registrado).
 */
export async function hasUserVoted(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data: votes } = await supabase
    .from("votes")
    .select("id")
    .eq("user_id", user.id)
    .limit(1);

  return (votes ?? []).length > 0;
}

/**
 * Devuelve los resultados (porcentajes) por categoría para la vista de ganadores.
 */
export async function getCategoryResults(): Promise<CategoryWithResult[]> {
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");

  if (!categories || categories.length === 0) {
    return STATIC_CATEGORIES.map((c) => ({
      ...c,
      results: c.nominees.map((n) => ({
        nominee_id: n.id,
        name: n.name,
        vote_count: 0,
        percentage: 0,
        clip_url: n.clip_url,
        clip_platform: n.clip_platform
      }))
    }));
  }

  // Carga los nominados una sola vez para resolver clip_url del ganador.
  const { data: nominees } = await supabase.from("nominees").select("*");
  const clipMap = new Map<string, Nominee>();
  ((nominees ?? []) as Nominee[]).forEach((n) => clipMap.set(n.id, n));

  const results: CategoryWithResult[] = [];

  for (const c of categories as Category[]) {
    const { data } = await supabase.rpc("category_results", {
      cat_id: c.id
    });
    const enriched = ((data ?? []) as CategoryResult[]).map((r) => ({
      ...r,
      clip_url: clipMap.get(r.nominee_id)?.clip_url ?? null,
      clip_platform: clipMap.get(r.nominee_id)?.clip_platform ?? null
    }));
    results.push({
      ...c,
      results: enriched
    });
  }

  return results;
}