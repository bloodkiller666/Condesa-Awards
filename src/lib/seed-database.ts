import { createClient } from "./supabase/client";
import { CATEGORIES } from "./data";

/**
 * Script para poblar la base de datos con los datos iniciales de categorías y nominados.
 * Ejecutar: node -r esbuild-register src/lib/seed-database.ts
 */

async function seedDatabase() {
  const supabase = createClient();

  console.log("🌱 Iniciando siembra de base de datos...");

  // 1. Insertar categorías
  console.log("📁 Insertando categorías...");
  for (const category of CATEGORIES) {
    const { error: catError } = await supabase.from("categories").upsert({
      id: category.id,
      slug: category.slug,
      name: category.name,
      description: category.description,
      sort_order: category.sort_order,
      icon: category.icon
    }, { onConflict: "slug" });

    if (catError) {
      console.error(`❌ Error insertando categoría ${category.name}:`, catError);
    } else {
      console.log(`✅ Categoría "${category.name}" insertada/actualizada`);
    }
  }

  // 2. Insertar nominados
  console.log("🎬 Insertando nominados...");
  for (const category of CATEGORIES) {
    for (const nominee of category.nominees) {
      const { error: nomError } = await supabase.from("nominees").upsert({
        id: nominee.id,
        category_id: nominee.category_id,
        name: nominee.name,
        description: nominee.description,
        image_url: nominee.image_url,
        clip_url: nominee.clip_url,
        clip_platform: nominee.clip_platform,
        sort_order: nominee.sort_order
      }, { onConflict: "id" });

      if (nomError) {
        console.error(`❌ Error insertando nominado ${nominee.name}:`, nomError);
      } else {
        console.log(`✅ Nominado "${nominee.name}" insertado/actualizado`);
      }
    }
  }

  // 3. Verificar configuración de votación
  console.log("⚙️ Verificando configuración de votación...");
  const { data: settings } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "voting_open")
    .single();

  if (!settings) {
    const { error: settingsError } = await supabase.from("settings").insert({
      key: "voting_open",
      value: true
    });

    if (settingsError) {
      console.error("❌ Error insertando configuración de votación:", settingsError);
    } else {
      console.log("✅ Configuración de votación creada (voting_open = true)");
    }
  } else {
    console.log("✅ Configuración de votación ya existe");
  }

  console.log("🎉 Siembra de base de datos completada!");
}

seedDatabase().catch(console.error);
