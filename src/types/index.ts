export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sort_order: number;
  icon: string | null;
}

export interface Nominee {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  clip_url: string | null;
  clip_platform: string | null;
  sort_order: number;
}

export interface Vote {
  id: string;
  user_id: string;
  category_id: string;
  nominee_id: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  provider: string | null;
}

export interface CategoryResult {
  nominee_id: string;
  name: string;
  vote_count: number;
  percentage: number;
  /** Clip del nominado (para el revelado del ganador). */
  clip_url?: string | null;
  clip_platform?: string | null;
}

/**
 * Modos del ClipModal:
 * - "preview": previsualización de clip durante la fase de votación.
 * - "winner": revelado del ganador durante la gala.
 */
export type ClipModalMode = "preview" | "winner";

export interface CategoryWithNominees extends Category {
  nominees: Nominee[];
}

export interface CategoryWithResult extends Category {
  results: CategoryResult[];
}