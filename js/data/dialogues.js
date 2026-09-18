/* =====================================================================
   DIALOGOS
   Un objeto = un nodo de conversacion.

   FORMATO
     speaker  : nombre que sale arriba (pon '' para voz narradora)
     portrait : id de retrato ('damon','stefan','bonnie','player', null)
     lines    : array. Cada linea puede ser:
                  'texto'                       -> la dice el speaker del nodo
                  { s:'Stefan', p:'stefan', t:'texto' }  -> cambia de hablante
     choices  : opciones al final del nodo
     effects  : se aplican al terminar el nodo
     next     : id del nodo siguiente (o null para cerrar)

   EFECTOS DISPONIBLES
     { flag:'x' }                     marca una bandera
     { memory:'mem_x' }               desbloquea un recuerdo
     { objective:['q1_explore','talk_stefan'] }
     { reason:0 }                     desbloquea una de las 23 razones
     { photo:'id' }                   abre una foto al cerrar el dialogo
     { minigame:true }                arranca el Birthday Rush
     { finale:true }                  dispara el final
     { toast:{ title:'', sub:'' } }

   {name} se sustituye por el nombre de ella (js/data/playerConfig.js)
   ===================================================================== */

export const DIALOGUES = {

  /* ================================================================
     BONNIE  --  guía amable en la plaza del pueblo
     ================================================================ */
  bonnie_first: {
    speaker: 'Bonnie', portrait: 'bonnie',
    lines: [
      'Ahí estás. Te sentía venir desde esta mañana.',
      'Tranquila, no es nada raro. Bueno... es un poco raro.',
      'Soy Bonnie. Y hoy el pueblo está distinto.',
      'Hay algo tejido por encima de Mystic Falls. Como un hechizo, pero amable.',
      'Alguien dejó cosas para ti en todos los rincones de este sitio.'
    ],
    choices: [
      { text: '¿Y cómo las encuentro?', next: 'bonnie_howto' },
      { text: '¿Quién las dejó?',       next: 'bonnie_who' }
    ],
    effects: [{ flag: 'met_bonnie' }]
  },

  bonnie_howto: {
    speaker: 'Bonnie', portrait: 'bonnie',
    lines: [
      'Caminando. Nada más.',
      'Cuando te acerques a algo importante, el botón de la derecha se enciende.',
      'Si algo brilla, es porque quiere que lo mires.',
      'Y revisa el diario de vez en cuando. Todo lo que encuentres se guarda ahí.'
    ],
    next: 'bonnie_end'
  },

  bonnie_who: {
    speaker: 'Bonnie', portrait: 'bonnie',
    lines: [
      'Eso no me toca decirlo a mí.',
      'Los hechizos buenos tienen una regla: la persona tiene que llegar sola al final.',
      'Pero te puedo decir una cosa.',
      'Quien hizo esto se tomó su tiempo. Muchísimo tiempo.'
    ],
    next: 'bonnie_end'
  },

  bonnie_end: {
    speaker: 'Bonnie', portrait: 'bonnie',
    lines: [
      'Empieza por el Grill, siempre hay gente. Después busca a Stefan.',
      'Suele estar en el cementerio. No preguntes.',
      'Ah, y feliz cumpleaños.'
    ]
  },

  bonnie_hint_q1: {
    speaker: 'Bonnie', portrait: 'bonnie',
    lines: [
      'Todavía te queda pueblo por ver.',
      'El Grill y el instituto están aquí mismo, en la plaza.',
      'Stefan está en el cementerio, saliendo por el este.',
      'Y fíjate en las cosas que brillan. Brillan por algo.'
    ]
  },

  bonnie_hint_q2: {
    speaker: 'Bonnie', portrait: 'bonnie',
    lines: [
      'Ahora viene la parte bonita.',
      'En el bosque, hacia el oeste, hay tres señales. Las vas a reconocer.',
      'Y en el cementerio hay un jardín con veintitrés velas. Cada una trae un deseo para ti.',
      'Lo del Grill... eso es más bien un juego. Ya verás.'
    ]
  },

  bonnie_hint_q3: {
    speaker: 'Bonnie', portrait: 'bonnie',
    lines: [
      'Ya está. Lo hiciste todo.',
      'Vuelve a la casa de los Salvatore, subiendo la calle hacia el norte.',
      'Los dos hermanos de acuerdo en algo. Eso no pasa nunca.',
      'Ve. Te están esperando.'
    ]
  },

  bonnie_done: {
    speaker: 'Bonnie', portrait: 'bonnie',
    lines: [
      'El pueblo se siente distinto ahora, ¿no?',
      'Los hechizos buenos no se deshacen. Se quedan.',
      'Vuelve cuando quieras. Mystic Falls no se va a ningún lado.'
    ]
  },

  /* ================================================================
     DAMON  --  Salvatore Boarding House
     ================================================================ */
  damon_first: {
    speaker: 'Damon', portrait: 'damon',
    lines: [
      'Vaya, vaya, vaya.',
      'Alguien entró a mi casa sin llamar.',
      'Odio eso.',
      '...Miento. Me encanta.',
      'Así que tú eres la cumpleañera.',
      '¿Veintitrés?',
      'Qué desafortunado.',
      'Por suerte, sigues viéndote bien.'
    ],
    choices: [
      { text: '¿Eso fue un cumplido?',   next: 'damon_a1' },
      { text: '¿Y tú cuántos cumples?',  next: 'damon_a2' },
      { text: '(No decir nada)',         next: 'damon_a3' }
    ]
  },

  damon_a1: {
    speaker: 'Damon', portrait: 'damon',
    lines: [
      'Fue lo más cerca que voy a estar de uno.',
      'Disfrútalo. No se repite.'
    ],
    next: 'damon_b'
  },

  damon_a2: {
    speaker: 'Damon', portrait: 'damon',
    lines: [
      'Los suficientes para saber que el número deja de importar.',
      'Tú todavía no llegas a esa parte.',
      'Tranquila. Los veintitrés te quedan bien.'
    ],
    next: 'damon_b'
  },

  damon_a3: {
    speaker: 'Damon', portrait: 'damon',
    lines: [
      'Ah. De las calladas.',
      'Esas son las peligrosas.',
      'Me caes bien. No se lo digas a nadie.'
    ],
    next: 'damon_b'
  },

  damon_b: {
    speaker: 'Damon', portrait: 'damon',
    lines: [
      'Escúchame, cumpleañera.',
      'Este pueblo tiene una sola regla: nada es lo que parece.',
      'Hoy, por una vez, sí lo es.',
      'Alguien se tomó la molestia de esconder cosas por todo Mystic Falls.',
      'Para ti. Específicamente para ti.',
      'Yo no hago preguntas. Yo sirvo bourbon.',
      '(Llena dos vasos y levanta el suyo sin mirarte)',
      'Por los veintitrés.',
      'Feliz cumpleaños.'
    ],
    effects: [
      { flag: 'met_damon' },
      { memory: 'mem_bourbon' }
    ],
    next: 'damon_c'
  },

  damon_c: {
    speaker: 'Damon', portrait: 'damon',
    lines: [
      'Ahora ve. Camina. El pueblo es chiquito, no te vas a perder.',
      'Y si te pierdes, bueno. Eso también es parte.',
      'Cuando hayas visto todo, vuelve aquí.',
      'Voy a estar exactamente donde estoy ahora.',
      'Es mi gran talento.'
    ]
  },

  damon_wait_q1: {
    speaker: 'Damon', portrait: 'damon',
    lines: [
      '¿Ya? Qué eficiente.',
      'Todavía no has visto ni la mitad del pueblo.',
      'El Grill. El instituto. El cementerio. El bosque.',
      'Y busca a mi hermano. Le encanta que lo busquen.'
    ]
  },

  damon_wait_q2: {
    speaker: 'Damon', portrait: 'damon',
    lines: [
      'Vas bien. No lo digo nunca, así que apúntalo.',
      'Te faltan las velas del cementerio y las tres cosas del bosque.',
      'Ah, y el jueguito del Grill. Eso fue idea de otra persona, no mía.',
      'Vuelve cuando termines. Vas a querer sentarte.'
    ]
  },

  /* ---- Escena final: los dos hermanos ---- */
  damon_final: {
    speaker: 'Stefan', portrait: 'stefan',
    lines: [
      'Llegaste.',
      { s: 'Damon', p: 'damon', t: 'Tarde.' },
      { s: 'Stefan', p: 'stefan', t: 'No llegó tarde.' },
      { s: 'Damon', p: 'damon', t: 'Todo el mundo llega tarde a algo, hermanito.' },
      { s: 'Damon', p: 'damon', t: '¿Sabes por qué te hicimos volver hasta aquí?' }
    ],
    choices: [
      { text: '¿Por el bourbon?',                 next: 'final_b1' },
      { text: 'No tengo idea.',                   next: 'final_b2' },
      { text: 'Porque hoy es mi cumpleaños.',     next: 'final_b3' }
    ]
  },

  final_b1: {
    speaker: 'Damon', portrait: 'damon',
    lines: [
      'Correcto. Siempre es por el bourbon.',
      { s: 'Stefan', p: 'stefan', t: 'No es por el bourbon.' },
      { s: 'Damon', p: 'damon', t: 'Es un poquito por el bourbon.' }
    ],
    next: 'final_c'
  },

  final_b2: {
    speaker: 'Damon', portrait: 'damon',
    lines: [
      'Honesta. Eso aquí es exótico.',
      { s: 'Stefan', p: 'stefan', t: 'Te lo explico yo.' }
    ],
    next: 'final_c'
  },

  final_b3: {
    speaker: 'Damon', portrait: 'damon',
    lines: [
      'Mírala. Lo dijo sin titubear.',
      { s: 'Damon', p: 'damon', t: 'Veintitrés años y ya sabe pedir lo que le toca.' },
      { s: 'Stefan', p: 'stefan', t: 'Le toca más de lo que cree.' }
    ],
    next: 'final_c'
  },

  final_c: {
    speaker: 'Stefan', portrait: 'stefan',
    lines: [
      'Las historias tienen que terminar donde empezaron.',
      'Hoy entraste por esa puerta sin saber nada de este lugar.',
      'Y mírate ahora.',
      'Encendiste veintitrés velas, una por una. Veintitrés deseos.',
      'Caminaste el pueblo entero.',
      'Encontraste cosas que llevaban mucho tiempo esperándote.',
      { s: 'Damon', p: 'damon', t: 'Y ninguna era un tesoro. Eran recados.' },
      { s: 'Damon', p: 'damon', t: 'Todos de la misma persona.' },
      { s: 'Damon', p: 'damon', t: 'Alguien te escribió un pueblo entero, cumpleañera.' },
      { s: 'Stefan', p: 'stefan', t: 'Nosotros solo cuidamos las llaves.' },
      { s: 'Damon', p: 'damon', t: 'Bueno, ya. Esto se está poniendo sentimental y yo tengo una reputación.' },
      { s: 'Damon', p: 'damon', t: '(Levanta el vaso. Esta vez sí te mira)' },
      { s: 'Damon', p: 'damon', t: 'Feliz cumpleaños, {name}.' },
      { s: 'Damon', p: 'damon', t: 'Lo digo en serio. Una sola vez.' },
      { s: 'Stefan', p: 'stefan', t: 'Feliz cumpleaños.' },
      { s: 'Stefan', p: 'stefan', t: 'Sopla las velas. Nosotros nos encargamos de la luz.' }
    ],
    effects: [
      { objective: ['q3_final', 'meet_damon'] },
      { finale: true }
    ]
  },

  damon_after: {
    speaker: 'Damon', portrait: 'damon',
    lines: [
      'Sigues aquí. Bien.',
      'La casa es grande, hay bourbon de sobra y nadie te va a apurar.',
      'Feliz cumpleaños otra vez, {name}.',
      'Y no le digas a Stefan que lo dije dos veces.'
    ]
  },

  /* ================================================================
     STEFAN  --  Cementerio
     ================================================================ */
  stefan_first: {
    speaker: 'Stefan', portrait: 'stefan',
    lines: [
      'Perdón. No esperaba a nadie aquí.',
      'Aunque tampoco esperaba la mayoría de las cosas buenas que me han pasado.',
      'Soy Stefan.'
    ],
    choices: [
      { text: 'Yo soy {name}.',        next: 'stefan_a1' },
      { text: '¿Vienes mucho aquí?',   next: 'stefan_a2' }
    ]
  },

  stefan_a1: {
    speaker: 'Stefan', portrait: 'stefan',
    lines: [
      '{name}.',
      'Lo voy a recordar. Y eso, en mi caso, es mucho tiempo.'
    ],
    next: 'stefan_b'
  },

  stefan_a2: {
    speaker: 'Stefan', portrait: 'stefan',
    lines: [
      'Más de lo que debería. Menos de lo que quisiera.'
    ],
    next: 'stefan_b'
  },

  stefan_b: {
    speaker: 'Stefan', portrait: 'stefan',
    lines: [
      'La gente cree que vengo aquí por tristeza.',
      'Vengo por lo contrario.',
      'Mira alrededor.',
      'Esto está lleno de nombres que alguien quiso tanto que los grabó en piedra.',
      'Eso no es la muerte. Es alguien negándose a olvidar.',
      '¿Sabes qué es lo más raro de vivir tanto tiempo?',
      'Que aprendes a reconocer a la gente que llega para quedarse.',
      'No avisan. No traen señales.',
      'Un día no estaban, y al día siguiente ya no te imaginas el mundo sin ellas.'
    ],
    next: 'stefan_c'
  },

  stefan_c: {
    speaker: 'Stefan', portrait: 'stefan',
    lines: [
      'Hoy cumples veintitrés.',
      'Vas a oír mucho eso de "qué rápido se te fue el año".',
      'No les creas. El tiempo no se va. Se acumula.',
      'Todo lo que viviste hasta hoy sigue ahí, debajo, sosteniéndote.',
      'Los días raros también. Sobre todo los días raros.',
      'Y hoy alguien decidió celebrarte construyéndote un pueblo entero.',
      'Yo diría que eso dice bastante de ti.',
      'No de la persona que lo construyó. De ti.'
    ],
    effects: [
      { flag: 'met_stefan' },
      { objective: ['q1_explore', 'talk_stefan'] },
      { memory: 'mem_tomb' }
    ],
    next: 'stefan_d'
  },

  stefan_d: {
    speaker: 'Stefan', portrait: 'stefan',
    lines: [
      'Ah. Antes de que te vayas.',
      'Aquí mismo, entre las tumbas, hay un jardín.',
      'Alguien dejó velas. Veintitrés, exactamente.',
      'No las conté yo.',
      'Como las de un pastel, pero sin pastel. Todavía.',
      'Enciéndelas una por una, sin prisa.',
      'Cada una guarda un deseo para tu nuevo año.'
    ]
  },

  stefan_repeat_q2: {
    speaker: 'Stefan', portrait: 'stefan',
    lines: [
      'Sigues por aquí. Me alegra.',
      'Las velas del jardín: no las apures. Los deseos se leen despacio.',
      'Y si vas al bosque, camina despacio. Hay tres cosas esperándote.',
      'No están escondidas del todo. Solo lo suficiente.'
    ]
  },

  stefan_repeat_q3: {
    speaker: 'Stefan', portrait: 'stefan',
    lines: [
      'Ya lo encontraste todo, ¿verdad?',
      'Se te nota en la cara.',
      'Ve a la casa. Yo llego antes que tú, no te ofendas.',
      'Ventajas de no necesitar caminar.'
    ]
  },

  stefan_after: {
    speaker: 'Stefan', portrait: 'stefan',
    lines: [
      'Fue un buen cumpleaños, ¿no?',
      'De esos que uno recuerda sin esforzarse.',
      'Cuídate, {name}. Y vuelve cuando quieras.'
    ]
  },

  /* ================================================================
     Comentarios de Damon después del minijuego
     ================================================================ */
  damon_rush_win: {
    speaker: 'Damon', portrait: 'damon',
    lines: [
      'Birthday combo. Qué dramático.',
      'Más de veintitrés puntos. Qué coincidencia tan absolutamente casual.',
      'Nadie planeó eso. Seguro que no.'
    ]
  },

  damon_rush_meh: {
    speaker: 'Damon', portrait: 'damon',
    lines: [
      'Bueno. Ganaste.',
      'No con estilo, pero ganaste.',
      'En este pueblo eso cuenta como victoria.'
    ]
  }
};

/* =====================================================================
   PUNTOS DE ENTRADA DE CADA NPC
   Según el estado del juego, devuelven qué nodo toca.
   S = API de estado (ver systems/GameState.js)
   ===================================================================== */
export const NPC_ENTRY = {
  damon(S) {
    if (S.flag('finale_done')) return 'damon_after';
    if (S.questActive('q3_final')) return 'damon_final';
    if (!S.flag('met_damon')) return 'damon_first';
    if (S.questActive('q2_whispers')) return 'damon_wait_q2';
    return 'damon_wait_q1';
  },

  stefan(S) {
    if (S.flag('finale_done')) return 'stefan_after';
    if (!S.flag('met_stefan')) return 'stefan_first';
    if (S.questActive('q3_final')) return 'stefan_repeat_q3';
    return 'stefan_repeat_q2';
  },

  bonnie(S) {
    if (S.flag('finale_done')) return 'bonnie_done';
    if (!S.flag('met_bonnie')) return 'bonnie_first';
    if (S.questActive('q3_final')) return 'bonnie_hint_q3';
    if (S.questActive('q2_whispers')) return 'bonnie_hint_q2';
    return 'bonnie_hint_q1';
  }
};
