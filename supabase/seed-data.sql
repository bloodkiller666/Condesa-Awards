-- ============================================================================
-- CONDESA AWARDS 2026 — Datos iniciales (Seed Data)
-- Ejecuta este archivo desde el SQL Editor de Supabase para poblar la base de datos
-- ============================================================================

-- Insertar categorías (con UUIDs válidos)
INSERT INTO public.categories (id, slug, name, description, sort_order, icon) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'mejor-collab', 'Mejor Collab', 'La mejor colaboración de la temporada.', 1, '🤝'),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'mejor-fuera-de-contexto', 'Mejor Fuera de Contexto', 'El momento que sin contexto no tiene sentido.', 2, '🤔'),
  ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'mejor-grito', 'Mejor Grito', 'El grito más memorable del año.', 3, '😱'),
  ('d4e5f6a7-b8c9-0123-def0-234567890123', 'momento-mas-esquizo', 'Momento más esquizo', 'Conspiraciones, monólogos y teorías.', 4, '🌀'),
  ('e5f6a7b8-c9d0-1234-ef01-345678901234', 'momento-mas-cringe', 'Momento más cringe', 'El momento que duele de ver.', 5, '😬'),
  ('f6a7b8c9-d0e1-2345-f012-456789012345', 'momento-mas-dislexico', 'Momento más disléxico', 'Leer es difícil.', 6, '🔤'),
  ('a7b8c9d0-e1f2-3456-0123-567890123456', 'momento-mas-horny', 'Momento más horny', 'El momento más subido de tono.', 7, '🥵'),
  ('b8c9d0e1-f2a3-4567-1234-678901234567', 'momento-mas-pepega', 'Momento más pepega', 'El fallo más gracioso.', 8, '🐸'),
  ('c9d0e1f2-a3b4-5678-2345-789012345678', 'momento-mas-pro', 'Momento más pro', 'El clutch más impresionante.', 9, '🎯'),
  ('d0e1f2a3-b4c5-6789-3456-890123456789', 'momento-mas-pront', 'Momento más pron''t', 'El fallo épico inesperado.', 10, '💀'),
  ('e1f2a3b4-c5d6-7890-4567-901234567890', 'momento-mas-toxico', 'Momento más tóxico', 'El momento más tóxico de la comunidad.', 11, '☠️')
ON CONFLICT (slug) DO NOTHING;

-- Insertar nominados para cada categoría (con UUIDs válidos)
-- Mejor Collab
INSERT INTO public.nominees (id, category_id, name, description, clip_url, clip_platform, sort_order) VALUES
  ('11111111-1111-1111-1111-111111111111', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'El dúo épico', 'Un momento nominado para esta categoría.', 'https://clips.twitch.tv/embed?clip=AffluentFrigidMoonOneHand-5SbjKbU2o7NGcmBx&parent=localhost', 'twitch', 1),
  ('11111111-1111-1111-1111-111111111112', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'La unión inesperada', 'Un momento nominado para esta categoría.', 'https://clips.twitch.tv/embed?clip=twitch-clip-2&parent=localhost', 'twitch', 2),
  ('11111111-1111-1111-1111-111111111113', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Team-up legendario', 'Un momento nominado para esta categoría.', 'https://clips.twitch.tv/embed?clip=twitch-clip-3&parent=localhost', 'twitch', 3)
ON CONFLICT (id) DO NOTHING;

-- Mejor Fuera de Contexto
INSERT INTO public.nominees (id, category_id, name, description, clip_url, clip_platform, sort_order) VALUES
  ('22222222-2222-2222-2222-222222222221', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'La frase suelta', 'Un momento nominado para esta categoría.', 'https://clips.twitch.tv/embed?clip=SpunkyHealthyRuffAMPTropPunch-kelhb6d4tODG5IGg&parent=localhost', 'twitch', 1),
  ('22222222-2222-2222-2222-222222222222', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'El clip viral', 'Un momento nominado para esta categoría.', 'https://clips.twitch.tv/embed?clip=twitch-clip-2&parent=localhost', 'twitch', 2),
  ('22222222-2222-2222-2222-222222222223', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Sin explicación', 'Un momento nominado para esta categoría.', 'https://clips.twitch.tv/embed?clip=twitch-clip-3&parent=localhost', 'twitch', 3)
ON CONFLICT (id) DO NOTHING;

-- Mejor Grito
INSERT INTO public.nominees (id, category_id, name, description, clip_url, clip_platform, sort_order) VALUES
  ('33333333-3333-3333-3333-333333333331', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 'Grito de terror', 'Un momento nominado para esta categoría.', 'https://clips.twitch.tv/embed?clip=PoisedEndearingCroissantTakeNRG-JzSkzSMstKsxxmXW&parent=localhost', 'twitch', 1),
  ('33333333-3333-3333-3333-333333333332', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 'Grito de victoria', 'Un momento nominado para esta categoría.', 'https://clips.twitch.tv/embed?clip=twitch-clip-2&parent=localhost', 'twitch', 2),
  ('33333333-3333-3333-3333-333333333333', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 'Grito cósmico', 'Un momento nominado para esta categoría.', 'https://clips.twitch.tv/embed?clip=twitch-clip-3&parent=localhost', 'twitch', 3)
ON CONFLICT (id) DO NOTHING;

-- Momento más esquizo
INSERT INTO public.nominees (id, category_id, name, description, clip_url, clip_platform, sort_order) VALUES
  ('44444444-4444-4444-4444-444444444441', 'd4e5f6a7-b8c9-0123-def0-234567890123', 'La teoría imposible', 'Un momento nominado para esta categoría.', 'https://clips.twitch.tv/embed?clip=IncredulousShortCamelEleGiggle-4xIm-Dtqdba1E2bc&parent=localhost', 'twitch', 1),
  ('44444444-4444-4444-4444-444444444442', 'd4e5f6a7-b8c9-0123-def0-234567890123', 'Monólogo interior', 'Un momento nominado para esta categoría.', 'https://clips.twitch.tv/embed?clip=twitch-clip-2&parent=localhost', 'twitch', 2),
  ('44444444-4444-4444-4444-444444444443', 'd4e5f6a7-b8c9-0123-def0-234567890123', 'Conexión neuronal', 'Un momento nominado para esta categoría.', 'https://clips.twitch.tv/embed?clip=twitch-clip-3&parent=localhost', 'twitch', 3)
ON CONFLICT (id) DO NOTHING;

-- Momento más cringe
INSERT INTO public.nominees (id, category_id, name, description, clip_url, clip_platform, sort_order) VALUES
  ('55555555-5555-5555-5555-555555555551', 'e5f6a7b8-c9d0-1234-ef01-345678901234', 'Silencio incomodo', 'Un momento nominado para esta categoría.', 'https://clips.twitch.tv/embed?clip=BreakablePeppyPenguinPlanking-WcC6juUDgZkbubo4&parent=localhost', 'twitch', 1),
  ('55555555-5555-5555-5555-555555555552', 'e5f6a7b8-c9d0-1234-ef01-345678901234', 'El comentario', 'Un momento nominado para esta categoría.', 'https://clips.twitch.tv/embed?clip=twitch-clip-2&parent=localhost', 'twitch', 2),
  ('55555555-5555-5555-5555-555555555553', 'e5f6a7b8-c9d0-1234-ef01-345678901234', 'La situación', 'Un momento nominado para esta categoría.', 'https://clips.twitch.tv/embed?clip=twitch-clip-3&parent=localhost', 'twitch', 3)
ON CONFLICT (id) DO NOTHING;

-- Momento más disléxico
INSERT INTO public.nominees (id, category_id, name, description, clip_url, clip_platform, sort_order) VALUES
  ('66666666-6666-6666-6666-666666666661', 'f6a7b8c9-d0e1-2345-f012-456789012345', 'Lectura confusa', 'Un momento nominado para esta categoría.', 'https://clips.twitch.tv/embed?clip=LongThoughtfulDragonfruitKeepo-ogTKeah4L0AeX1-u&parent=localhost', 'twitch', 1),
  ('66666666-6666-6666-6666-666666666662', 'f6a7b8c9-d0e1-2345-f012-456789012345', 'Palabra imposible', 'Un momento nominado para esta categoría.', 'https://clips.twitch.tv/embed?clip=twitch-clip-2&parent=localhost', 'twitch', 2),
  ('66666666-6666-6666-6666-666666666663', 'f6a7b8c9-d0e1-2345-f012-456789012345', 'El trabalenguas', 'Un momento nominado para esta categoría.', 'https://clips.twitch.tv/embed?clip=twitch-clip-3&parent=localhost', 'twitch', 3)
ON CONFLICT (id) DO NOTHING;

-- Momento más horny
INSERT INTO public.nominees (id, category_id, name, description, clip_url, clip_platform, sort_order) VALUES
  ('77777777-7777-7777-7777-777777777771', 'a7b8c9d0-e1f2-3456-0123-567890123456', 'El comentario picante', 'Un momento nominado para esta categoría.', 'https://clips.twitch.tv/embed?clip=EasyAverageWaspDendiFace-m_poAMVmqEXPCclb&parent=localhost', 'twitch', 1),
  ('77777777-7777-7777-7777-777777777772', 'a7b8c9d0-e1f2-3456-0123-567890123456', 'La mirada', 'Un momento nominado para esta categoría.', 'https://clips.twitch.tv/embed?clip=twitch-clip-2&parent=localhost', 'twitch', 2),
  ('77777777-7777-7777-7777-777777777773', 'a7b8c9d0-e1f2-3456-0123-567890123456', 'El doble sentido', 'Un momento nominado para esta categoría.', 'https://clips.twitch.tv/embed?clip=twitch-clip-3&parent=localhost', 'twitch', 3)
ON CONFLICT (id) DO NOTHING;

-- Momento más pepega
INSERT INTO public.nominees (id, category_id, name, description, clip_url, clip_platform, sort_order) VALUES
  ('88888888-8888-8888-8888-888888888881', 'b8c9d0e1-f2a3-4567-1234-678901234567', 'El fallo clásico', 'Un momento nominado para esta categoría.', 'https://clips.twitch.tv/embed?clip=twitch-clip-1&parent=localhost', 'twitch', 1),
  ('88888888-8888-8888-8888-888888888882', 'b8c9d0e1-f2a3-4567-1234-678901234567', 'Botón equivocado', 'Un momento nominado para esta categoría.', 'https://clips.twitch.tv/embed?clip=twitch-clip-2&parent=localhost', 'twitch', 2),
  ('88888888-8888-8888-8888-888888888883', 'b8c9d0e1-f2a3-4567-1234-678901234567', 'La estrategia absurda', 'Un momento nominado para esta categoría.', 'https://clips.twitch.tv/embed?clip=twitch-clip-3&parent=localhost', 'twitch', 3)
ON CONFLICT (id) DO NOTHING;

-- Momento más pro
INSERT INTO public.nominees (id, category_id, name, description, clip_url, clip_platform, sort_order) VALUES
  ('99999999-9999-9999-9999-999999999991', 'c9d0e1f2-a3b4-5678-2345-789012345678', 'Clutch milagroso', 'Un momento nominado para esta categoría.', 'https://clips.twitch.tv/embed?clip=twitch-clip-1&parent=localhost', 'twitch', 1),
  ('99999999-9999-9999-9999-999999999992', 'c9d0e1f2-a3b4-5678-2345-789012345678', 'Movimiento perfecto', 'Un momento nominado para esta categoría.', 'https://clips.twitch.tv/embed?clip=twitch-clip-2&parent=localhost', 'twitch', 2),
  ('99999999-9999-9999-9999-999999999993', 'c9d0e1f2-a3b4-5678-2345-789012345678', 'La jugada imposible', 'Un momento nominado para esta categoría.', 'https://clips.twitch.tv/embed?clip=twitch-clip-3&parent=localhost', 'twitch', 3)
ON CONFLICT (id) DO NOTHING;

-- Momento más pron't
INSERT INTO public.nominees (id, category_id, name, description, clip_url, clip_platform, sort_order) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'd0e1f2a3-b4c5-6789-3456-890123456789', 'El desastre total', 'Un momento nominado para esta categoría.', 'https://clips.twitch.tv/embed?clip=twitch-clip-1&parent=localhost', 'twitch', 1),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'd0e1f2a3-b4c5-6789-3456-890123456789', 'La derrota épica', 'Un momento nominado para esta categoría.', 'https://clips.twitch.tv/embed?clip=twitch-clip-2&parent=localhost', 'twitch', 2),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'd0e1f2a3-b4c5-6789-3456-890123456789', 'Casi lo logra', 'Un momento nominado para esta categoría.', 'https://clips.twitch.tv/embed?clip=twitch-clip-3&parent=localhost', 'twitch', 3)
ON CONFLICT (id) DO NOTHING;

-- Momento más tóxico
INSERT INTO public.nominees (id, category_id, name, description, clip_url, clip_platform, sort_order) VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'e1f2a3b4-c5d6-7890-4567-901234567890', 'El rage quit', 'Un momento nominado para esta categoría.', 'https://clips.twitch.tv/embed?clip=twitch-clip-1&parent=localhost', 'twitch', 1),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'e1f2a3b4-c5d6-7890-4567-901234567890', 'El flame', 'Un momento nominado para esta categoría.', 'https://clips.twitch.tv/embed?clip=twitch-clip-2&parent=localhost', 'twitch', 2),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', 'e1f2a3b4-c5d6-7890-4567-901234567890', 'La rivalidad', 'Un momento nominado para esta categoría.', 'https://clips.twitch.tv/embed?clip=twitch-clip-3&parent=localhost', 'twitch', 3)
ON CONFLICT (id) DO NOTHING;

-- Verificar que la configuración de votación esté activa
INSERT INTO public.settings (key, value)
VALUES ('voting_open', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;
