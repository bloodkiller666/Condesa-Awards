import type { CategoryWithNominees, CategoryResult, Nominee } from "@/types";

export const CATEGORIES: CategoryWithNominees[] = [
  {
    id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    slug: "mejor-collab",
    name: "Mejor Collab",
    description: "La mejor colaboración de la temporada.",
    sort_order: 1,
    icon: "🤝",
    nominees: [n("El dúo épico", "a1b2c3d4-e5f6-7890-abcd-ef1234567890", "AffluentFrigidMoonOneHand-5SbjKbU2o7NGcmBx"), n("La unión inesperada", "a1b2c3d4-e5f6-7890-abcd-ef1234567890", "twitch-clip-2"), n("Team-up legendario", "a1b2c3d4-e5f6-7890-abcd-ef1234567890", "twitch-clip-3")]
  },
  {
    id: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    slug: "mejor-fuera-de-contexto",
    name: "Mejor Fuera de Contexto",
    description: "El momento que sin contexto no tiene sentido.",
    sort_order: 2,
    icon: "🤔",
    nominees: [n("La frase suelta", "b2c3d4e5-f6a7-8901-bcde-f12345678901", "SpunkyHealthyRuffAMPTropPunch-kelhb6d4tODG5IGg"), n("El clip viral", "b2c3d4e5-f6a7-8901-bcde-f12345678901", "twitch-clip-2"), n("Sin explicación", "b2c3d4e5-f6a7-8901-bcde-f12345678901", "twitch-clip-3")]
  },
  {
    id: "c3d4e5f6-a7b8-9012-cdef-123456789012",
    slug: "mejor-grito",
    name: "Mejor Grito",
    description: "El grito más memorable del año.",
    sort_order: 3,
    icon: "😱",
    nominees: [n("Grito de terror", "c3d4e5f6-a7b8-9012-cdef-123456789012", "PoisedEndearingCroissantTakeNRG-JzSkzSMstKsxxmXW"), n("Grito de victoria", "c3d4e5f6-a7b8-9012-cdef-123456789012", "twitch-clip-2"), n("Grito cósmico", "c3d4e5f6-a7b8-9012-cdef-123456789012", "twitch-clip-3")]
  },
  {
    id: "d4e5f6a7-b8c9-0123-def0-234567890123",
    slug: "momento-mas-esquizo",
    name: "Momento más esquizo",
    description: "Conspiraciones, monólogos y teorías.",
    sort_order: 4,
    icon: "🌀",
    nominees: [n("La teoría imposible", "d4e5f6a7-b8c9-0123-def0-234567890123", "IncredulousShortCamelEleGiggle-4xIm-Dtqdba1E2bc"), n("Monólogo interior", "d4e5f6a7-b8c9-0123-def0-234567890123", "twitch-clip-2"), n("Conexión neuronal", "d4e5f6a7-b8c9-0123-def0-234567890123", "twitch-clip-3")]
  },
  {
    id: "e5f6a7b8-c9d0-1234-ef01-345678901234",
    slug: "momento-mas-cringe",
    name: "Momento más cringe",
    description: "El momento que duele de ver.",
    sort_order: 5,
    icon: "😬",
    nominees: [n("Silencio incomodo", "e5f6a7b8-c9d0-1234-ef01-345678901234", "BreakablePeppyPenguinPlanking-WcC6juUDgZkbubo4"), n("El comentario", "e5f6a7b8-c9d0-1234-ef01-345678901234", "twitch-clip-2"), n("La situación", "e5f6a7b8-c9d0-1234-ef01-345678901234", "twitch-clip-3")]
  },
  {
    id: "f6a7b8c9-d0e1-2345-f012-456789012345",
    slug: "momento-mas-dislexico",
    name: "Momento más disléxico",
    description: "Leer es difícil.",
    sort_order: 6,
    icon: "🔤",
    nominees: [n("Lectura confusa", "f6a7b8c9-d0e1-2345-f012-456789012345", "LongThoughtfulDragonfruitKeepo-ogTKeah4L0AeX1-u"), n("Palabra imposible", "f6a7b8c9-d0e1-2345-f012-456789012345", "twitch-clip-2"), n("El trabalenguas", "f6a7b8c9-d0e1-2345-f012-456789012345", "twitch-clip-3")]
  },
  {
    id: "a7b8c9d0-e1f2-3456-0123-567890123456",
    slug: "momento-mas-horny",
    name: "Momento más horny",
    description: "El momento más subido de tono.",
    sort_order: 7,
    icon: "🥵",
    nominees: [n("El comentario picante", "a7b8c9d0-e1f2-3456-0123-567890123456", "EasyAverageWaspDendiFace-m_poAMVmqEXPCclb"), n("La mirada", "a7b8c9d0-e1f2-3456-0123-567890123456", "twitch-clip-2"), n("El doble sentido", "a7b8c9d0-e1f2-3456-0123-567890123456", "twitch-clip-3")]
  },
  {
    id: "b8c9d0e1-f2a3-4567-1234-678901234567",
    slug: "momento-mas-pepega",
    name: "Momento más pepega",
    description: "El fallo más gracioso.",
    sort_order: 8,
    icon: "🐸",
    nominees: [n("El fallo clásico", "b8c9d0e1-f2a3-4567-1234-678901234567", "twitch-clip-1"), n("Botón equivocado", "b8c9d0e1-f2a3-4567-1234-678901234567", "twitch-clip-2"), n("La estrategia absurda", "b8c9d0e1-f2a3-4567-1234-678901234567", "twitch-clip-3")]
  },
  {
    id: "c9d0e1f2-a3b4-5678-2345-789012345678",
    slug: "momento-mas-pro",
    name: "Momento más pro",
    description: "El clutch más impresionante.",
    sort_order: 9,
    icon: "🎯",
    nominees: [n("Clutch milagroso", "c9d0e1f2-a3b4-5678-2345-789012345678", "twitch-clip-1"), n("Movimiento perfecto", "c9d0e1f2-a3b4-5678-2345-789012345678", "twitch-clip-2"), n("La jugada imposible", "c9d0e1f2-a3b4-5678-2345-789012345678", "twitch-clip-3")]
  },
  {
    id: "d0e1f2a3-b4c5-6789-3456-890123456789",
    slug: "momento-mas-pront",
    name: "Momento más pron't",
    description: "El fallo épico inesperado.",
    sort_order: 10,
    icon: "💀",
    nominees: [n("El desastre total", "d0e1f2a3-b4c5-6789-3456-890123456789", "twitch-clip-1"), n("La derrota épica", "d0e1f2a3-b4c5-6789-3456-890123456789", "twitch-clip-2"), n("Casi lo logra", "d0e1f2a3-b4c5-6789-3456-890123456789", "twitch-clip-3")]
  },
  {
    id: "e1f2a3b4-c5d6-7890-4567-901234567890",
    slug: "momento-mas-toxico",
    name: "Momento más tóxico",
    description: "El momento más tóxico de la comunidad.",
    sort_order: 11,
    icon: "☠️",
    nominees: [n("El rage quit", "e1f2a3b4-c5d6-7890-4567-901234567890", "twitch-clip-1"), n("El flame", "e1f2a3b4-c5d6-7890-4567-901234567890", "twitch-clip-2"), n("La rivalidad", "e1f2a3b4-c5d6-7890-4567-901234567890", "twitch-clip-3")]
  }
];

function n(name: string, category_id: string, clipKey: string): Nominee {
  // Mapeo de nombres a UUIDs específicos para coincidir con la base de datos
  const nomineeIds: Record<string, string> = {
    "El dúo épico": "11111111-1111-1111-1111-111111111111",
    "La unión inesperada": "11111111-1111-1111-1111-111111111112",
    "Team-up legendario": "11111111-1111-1111-1111-111111111113",
    "La frase suelta": "22222222-2222-2222-2222-222222222221",
    "El clip viral": "22222222-2222-2222-2222-222222222222",
    "Sin explicación": "22222222-2222-2222-2222-222222222223",
    "Grito de terror": "33333333-3333-3333-3333-333333333331",
    "Grito de victoria": "33333333-3333-3333-3333-333333333332",
    "Grito cósmico": "33333333-3333-3333-3333-333333333333",
    "La teoría imposible": "44444444-4444-4444-4444-444444444441",
    "Monólogo interior": "44444444-4444-4444-4444-444444444442",
    "Conexión neuronal": "44444444-4444-4444-4444-444444444443",
    "Silencio incomodo": "55555555-5555-5555-5555-555555555551",
    "El comentario": "55555555-5555-5555-5555-555555555552",
    "La situación": "55555555-5555-5555-5555-555555555553",
    "Lectura confusa": "66666666-6666-6666-6666-666666666661",
    "Palabra imposible": "66666666-6666-6666-6666-666666666662",
    "El trabalenguas": "66666666-6666-6666-6666-666666666663",
    "El comentario picante": "77777777-7777-7777-7777-777777777771",
    "La mirada": "77777777-7777-7777-7777-777777777772",
    "El doble sentido": "77777777-7777-7777-7777-777777777773",
    "El fallo clásico": "88888888-8888-8888-8888-888888888881",
    "Botón equivocado": "88888888-8888-8888-8888-888888888882",
    "La estrategia absurda": "88888888-8888-8888-8888-888888888883",
    "Clutch milagroso": "99999999-9999-9999-9999-999999999991",
    "Movimiento perfecto": "99999999-9999-9999-9999-999999999992",
    "La jugada imposible": "99999999-9999-9999-9999-999999999993",
    "El desastre total": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1",
    "La derrota épica": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2",
    "Casi lo logra": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3",
    "El rage quit": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1",
    "El flame": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2",
    "La rivalidad": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3"
  };

  return {
    id: nomineeIds[name] || `${category_id}-${clipKey}-${name.length}`,
    category_id,
    name,
    description: "Un momento nominado para esta categoría.",
    image_url: null,
    clip_url: `https://clips.twitch.tv/embed?clip=${clipKey}&parent=localhost`,
    clip_platform: "twitch",
    sort_order: 1
  };
}