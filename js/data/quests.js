/* =====================================================================
   MISIONES (QUESTS)
   Progresión lineal y suave: una misión activa a la vez.

   Cada objetivo puede completarse de cuatro maneras:
     onVisit: 'mapId'   -> al entrar a ese lugar
     onMemoryAny: true  -> al desbloquear cualquier recuerdo
     count: N           -> contador (velas, pistas); lo suben los objetos
     (sin nada)         -> lo completa un diálogo con el efecto {objective}
   ===================================================================== */

export const FIRST_QUEST = 'q1_explore';

export const QUESTS = {
  q1_explore: {
    title: 'Explorar Mystic Falls',
    desc: 'Nunca habías estado aquí. El pueblo es pequeño; los secretos no.',
    objectives: [
      { id: 'visit_grill',    text: 'Entrar al Mystic Grill',   onVisit: 'grill' },
      { id: 'talk_stefan',    text: 'Hablar con Stefan' },
      { id: 'find_memory',    text: 'Descubrir un recuerdo',    onMemoryAny: true },
      { id: 'visit_cemetery', text: 'Visitar el cementerio',    onVisit: 'cemetery' }
    ],
    next: 'q2_whispers',
    completeToast: 'Nueva misión desbloqueada'
  },

  q2_whispers: {
    title: 'Susurros en el bosque',
    desc: 'Alguien dejó cosas escondidas para ti por todo el pueblo. ' +
          'No es casualidad.',
    objectives: [
      { id: 'birthday_rush', text: 'Ganar el Birthday Rush en el Grill' },
      { id: 'woods_clues',   text: 'Encontrar las tres señales del bosque', count: 3 },
      { id: 'candles',       text: 'Encender las 23 velas del cementerio', count: 23 }
    ],
    next: 'q3_final',
    completeToast: 'Nueva misión desbloqueada'
  },

  q3_final: {
    title: 'El último capítulo de la cumpleañera',
    desc: 'Vuelve a la casa de los Salvatore. Te están esperando los dos.',
    objectives: [
      { id: 'return_home', text: 'Volver a la Salvatore Boarding House', onVisit: 'boarding' },
      { id: 'meet_damon',  text: 'Hablar con Damon y Stefan' }
    ],
    next: null,
    completeToast: null      // el final se dispara desde el diálogo
  }
};

export const QUEST_ORDER = ['q1_explore', 'q2_whispers', 'q3_final'];
