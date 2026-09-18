/* =====================================================================
   RECUERDOS (MEMORIES)
   Se desbloquean explorando. Aparecen en el diario, pestaña "Recuerdos".

   Campos:
     title  - título corto
     place  - dónde se encontró (solo texto)
     text   - el recuerdo. Escribe aquí las cosas de ustedes dos.
     photo  - (opcional) id de js/data/photos.js
   ===================================================================== */

export const MEMORIES = {
  mem_oak: {
    title: 'El roble viejo',
    place: 'Plaza del pueblo',
    text: 'Hay un árbol en el centro del pueblo con iniciales talladas de gente ' +
          'que ya no está. Alguien, hace muchísimo, decidió que valía la pena ' +
          'dejar constancia. Te entiendo perfecto, persona de hace muchísimo.'
  },

  mem_bell: {
    title: 'La torre del reloj',
    place: 'Plaza del pueblo',
    text: 'El reloj del pueblo se paró una vez y nadie lo arregló en años. Dicen ' +
          'que fue la única época en que Mystic Falls dejó de tener prisa. Contigo ' +
          'me pasa parecido: se me olvida mirar la hora.',
    photo: 'first_night'
  },

  mem_booth: {
    title: 'La mesa del rincón',
    place: 'Mystic Grill',
    text: 'La mesa del rincón. La que siempre está ocupada por las mismas personas ' +
          'contándose las mismas historias sin cansarse nunca. Nosotros también ' +
          'tenemos una mesa así, aunque no sea una mesa.',
    photo: 'us_laughing'
  },

  mem_jukebox: {
    title: 'Canción B-23',
    place: 'Mystic Grill',
    text: 'En la rocola hay una canción que nadie pone nunca. Aun así el disco está ' +
          'gastado, o sea que alguien la puso mil veces en secreto. Yo sé quién fue.'
  },

  mem_locker: {
    title: 'Casillero 23',
    place: 'Mystic Falls High',
    text: 'Dentro hay un cuaderno con una frase escrita en el margen, con letra ' +
          'apurada: "algún día se lo voy a decir todo". Tardó, pero se lo dijo.',
    photo: 'the_trip'
  },

  mem_trophy: {
    title: 'La vitrina de trofeos',
    place: 'Mystic Falls High',
    text: 'Todas las copas tienen un año grabado. Ninguna dice para qué sirvió ' +
          'realmente ese año. La mía diría simplemente: el año en que apareciste.'
  },

  mem_record: {
    title: 'El tocadiscos',
    place: 'Salvatore Boarding House',
    text: 'El tocadiscos sigue funcionando después de un siglo entero. Damon dice ' +
          'que las cosas buenas no se rompen: solo esperan a que alguien vuelva a ' +
          'encenderlas.',
    photo: 'her_smile'
  },

  mem_photo_wall: {
    title: 'La foto de la chimenea',
    place: 'Salvatore Boarding House',
    text: 'En la repisa de la chimenea hay una foto que no debería estar ahí. ' +
          'No es de 1864. Somos nosotros.',
    photo: 'us_now'
  },

  mem_bourbon: {
    title: 'Un brindis a regañadientes',
    place: 'Salvatore Boarding House',
    text: 'Damon sirvió dos vasos y levantó el suyo sin mirarte, que es su forma de ' +
          'admitir que le importas. "Por los veintitrés", dijo. Y se lo tomó entero.'
  },

  mem_tomb: {
    title: 'La tumba de los Salvatore',
    place: 'Cementerio',
    text: 'Stefan viene aquí cuando necesita recordar por qué sigue intentándolo. ' +
          'Dice que los cementerios no son sitios tristes: son sitios llenos de gente ' +
          'a la que alguien quiso muchísimo.'
  },

  mem_diary: {
    title: 'Una hoja de diario',
    place: 'Cementerio',
    text: 'Una hoja suelta, con la tinta corrida por la lluvia: "Hoy fue un buen día. ' +
          'No pasó nada especial. Ella estaba, y eso fue todo lo especial que ' +
          'necesitaba".'
  },

  mem_falls: {
    title: 'Las cascadas',
    place: 'El bosque',
    text: 'La cascada que le da nombre al pueblo. Suena como si alguien estuviera ' +
          'contando un secreto sin parar. Si te quedas quieta un momento, se entiende ' +
          'lo que dice.',
    photo: 'polaroid_secret'
  },

  mem_lantern: {
    title: 'Una lámpara encendida',
    place: 'El bosque',
    text: 'Alguien dejó una lámpara encendida en mitad del bosque. No para ver el ' +
          'camino: para que quien viniera detrás supiera que iba bien.'
  },

  mem_carving: {
    title: 'Dos iniciales',
    place: 'El bosque',
    text: 'Dos letras talladas en la corteza, todavía frescas, con la savia sin secar. ' +
          'Alguien estuvo aquí hace muy poco pensando en ti.'
  },

  mem_locket: {
    title: 'El relicario',
    place: 'El bosque',
    text: 'Un relicario con una ramita de verbena seca dentro. En Mystic Falls eso ' +
          'significa protección. Donde yo vivo significa exactamente lo mismo: que no ' +
          'quiero que nada te pase.'
  }
};

export const MEMORY_IDS = Object.keys(MEMORIES);
