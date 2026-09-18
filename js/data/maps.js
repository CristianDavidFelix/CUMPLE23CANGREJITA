/* =====================================================================
   MAPAS DE MYSTIC FALLS
   Seis lugares pequenos y muy cargados de cosas, conectados en estrella
   desde la plaza del pueblo.

        Salvatore Boarding House
                  |
   Bosque  --  PLAZA  --  Cementerio
               /   \
           Grill   Instituto

   ---------------------------------------------------------------------
   LEYENDA DE TILES (cada letra = 1 tile de 16x16)
     .  cesped            ,  cesped con flores    :  adoquin
     =  acera             _  carretera            d  camino de tierra
     g  grava             T  bosque denso (solido)
     ~  agua (solido)     H  seto (solido)
     #  muro exterior     |  muro interior (solido)
     W  suelo de madera   w  madera oscura        S  suelo de piedra
   ---------------------------------------------------------------------
   Coordenadas: x,y en TILES, esquina superior izquierda del objeto.
   ===================================================================== */

/* Genera las 23 velas del cementerio en tres filas */
function makeCandles() {
  const rows = [
    { y: 15, from: 11, to: 18 },   // 8
    { y: 17, from: 10, to: 19 },   // 10
    { y: 19, from: 12, to: 16 }    // 5
  ];
  const out = [];
  let i = 0;
  for (const r of rows) {
    for (let x = r.from; x <= r.to; x++) {
      out.push({ id: 'candle_' + i, t: 'candle', x, y: r.y, reason: i, label: 'Encender la vela' });
      i++;
    }
  }
  return out;  // exactamente 23
}

/* Reparte lapidas por el cementerio sin tocar el jardin de velas */
function makeGraves() {
  const out = [];
  const spots = [
    [6, 8], [9, 8], [18, 8], [21, 8], [24, 8],
    [6, 11], [9, 11], [12, 11], [18, 11], [21, 11], [24, 11],
    [7, 13], [10, 13], [20, 13], [23, 13]
  ];
  spots.forEach(([x, y], i) => out.push({ t: i % 4 === 0 ? 'cross' : 'gravestone', x, y }));
  return out;
}

/* Bosque: arboles repartidos a mano para que haya claros y rincones */
function makeForest() {
  const coords = [
    [2, 3], [5, 2], [9, 3], [13, 2], [17, 3], [21, 2], [25, 3],
    [2, 7], [11, 6], [15, 7], [19, 5], [24, 7], [27, 5],
    [3, 11], [7, 10], [12, 11], [16, 10], [22, 11], [26, 12],
    [2, 15], [6, 16], [11, 15], [15, 16], [19, 15], [25, 16],
    [4, 18], [9, 18], [14, 18], [18, 18], [23, 18]
  ];
  return coords.map(([x, y], i) => ({
    t: i % 3 === 0 ? 'tree_pine' : (i % 7 === 0 ? 'tree_dead' : 'tree'),
    x, y
  }));
}

export const MAPS = {

  /* =================================================================
     1. PLAZA DEL PUEBLO  (hub)
     ================================================================= */
  town: {
    id: 'town',
    name: 'Mystic Falls',
    subtitle: 'Plaza del pueblo',
    kind: 'exterior',
    music: 'town',
    grid: [
      'TTTTTTTTTTTTTT__TTTTTTTTTTTTTT',
      'TTTTTTTTTTTTTT__TTTTTTTTTTTTTT',
      'TT..........TT__TT..........TT',
      'T............=__=............T',
      'T............=__=............T',
      'T............=__=............T',
      'T............=__=............T',
      'T............=__=............T',
      'T============================T',
      'T::::::::::::::::::::::::::::T',
      'T::::::::::::::::::::::::::::T',
      'T::::::::::::::::::::::::::::T',
      'T::::::::::::::::::::::::::::T',
      'T::::::::::::::::::::::::::::T',
      'T::::::::::::::::::::::::::::T',
      'T::::::::::::::::::::::::::::T',
      'T::::::::::::::::::::::::::::T',
      'T::::::::::::::::::::::::::::T',
      'T============================T',
      'T...........,,......,,.......T',
      'ddddd....................ddddd',
      'ddddd....................ddddd',
      'T............................T',
      'TT..........................TT',
      'TTTT......................TTTT',
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT'
    ],
    markers: {
      start:          [15, 16],
      from_boarding:  [15, 3],
      from_woods:     [3, 20],
      from_cemetery:  [26, 20],
      from_grill:     [6, 10],
      from_school:    [23, 10]
    },
    portals: [
      { x: 14, y: 0,  w: 2, h: 2, to: 'boarding', marker: 'from_town', label: 'Salvatore Boarding House' },
      { x: 0,  y: 20, w: 2, h: 2, to: 'woods',    marker: 'from_town', label: 'El bosque' },
      { x: 28, y: 20, w: 2, h: 2, to: 'cemetery', marker: 'from_town', label: 'El cementerio' },
      { x: 5,  y: 7,  w: 2, h: 1, to: 'grill',    marker: 'from_town', label: 'Mystic Grill' },
      { x: 22, y: 7,  w: 2, h: 1, to: 'school',   marker: 'from_town', label: 'Mystic Falls High' }
    ],
    props: [
      { t: 'building', v: 'grill',  x: 3,  y: 3, w: 7, h: 5, sign: 'MYSTIC GRILL', door: 2 },
      { t: 'building', v: 'school', x: 19, y: 3, w: 9, h: 5, sign: 'MYSTIC FALLS HIGH', door: 3 },
      { t: 'fountain',   x: 13, y: 11 },
      { t: 'clocktower', x: 5,  y: 9 },
      { t: 'oak_big',    x: 23, y: 10 },
      { t: 'lamp', x: 11, y: 9 },  { t: 'lamp', x: 18, y: 9 },
      { t: 'lamp', x: 11, y: 15 }, { t: 'lamp', x: 18, y: 15 },
      { t: 'lamp', x: 2,  y: 19 }, { t: 'lamp', x: 27, y: 19 },
      { t: 'bench', x: 12, y: 16 }, { t: 'bench', x: 16, y: 16 },
      { t: 'bench', x: 9,  y: 12 },
      { t: 'sign',  x: 17, y: 19 },
      { t: 'flowers', x: 12, y: 19 }, { t: 'flowers', x: 13, y: 19 },
      { t: 'flowers', x: 19, y: 19 }, { t: 'flowers', x: 20, y: 19 },
      { t: 'bush', x: 2, y: 22 }, { t: 'bush', x: 27, y: 22 },
      { t: 'bush', x: 10, y: 22 }, { t: 'bush', x: 19, y: 22 },
      { t: 'tree', x: 4, y: 19 }, { t: 'tree', x: 24, y: 19 }
    ],
    npcs: [
      { id: 'bonnie', x: 18, y: 13, dir: 'down', name: 'Bonnie' }
    ],
    objects: [
      { id: 'oak',      t: 'inspect', x: 24, y: 15, label: 'El roble viejo', memory: 'mem_oak' },
      { id: 'clock',    t: 'inspect', x: 6,  y: 15, label: 'La torre del reloj', memory: 'mem_bell' },
      { id: 'fountain', t: 'inspect', x: 14, y: 14, label: 'La fuente',
        text: 'El agua está helada y el fondo está lleno de monedas. Todas ' +
              'pedían algo. Alguna se habrá cumplido.' },
      { id: 'board',    t: 'inspect', x: 17, y: 20, label: 'El cartel del pueblo',
        text: 'FIESTA DE LOS FUNDADORES: PRÓXIMAMENTE. Y debajo, escrito a mano ' +
              'con otra letra: "Hoy no. Hoy el pueblo es de {name}".' }
    ],
    atmosphere: { tint: 0x243456, alpha: 0.6, fog: 1, fireflies: 6, stars: true }
  },

  /* =================================================================
     2. SALVATORE BOARDING HOUSE
     ================================================================= */
  boarding: {
    id: 'boarding',
    name: 'Salvatore Boarding House',
    subtitle: 'Chimenea encendida, como siempre',
    kind: 'interior',
    music: 'boarding',
    grid: [
      '||||||||||||||||||||||||||',
      '||||||||||||||||||||||||||',
      '|wwwwwwwwwwwwwwwwwwwwwwww|',
      '|wwwwwwwwwwwwwwwwwwwwwwww|',
      '|wwwwwwwwwwwwwwwwwwwwwwww|',
      '|wwwwwwwwwwwwwwwwwwwwwwww|',
      '|wwwwwwwwwwwwwwwwwwwwwwww|',
      '|wwwwwwwwwwwwwwwwwwwwwwww|',
      '|wwwwwwwwwwwwwwwwwwwwwwww|',
      '|wwwwwwwwwwwwwwwwwwwwwwww|',
      '|wwwwwwwwwwwwwwwwwwwwwwww|',
      '|wwwwwwwwwwwwwwwwwwwwwwww|',
      '|wwwwwwwwwwwwwwwwwwwwwwww|',
      '|wwwwwwwwwwwwwwwwwwwwwwww|',
      '|wwwwwwwwwwwwwwwwwwwwwwww|',
      '|wwwwwwwwwwwwwwwwwwwwwwww|',
      '|wwwwwwwwwwwwwwwwwwwwwwww|',
      '|wwwwwwwwwwwwwwwwwwwwwwww|',
      '|wwwwwwwwwwwwwwwwwwwwwwww|',
      '|wwwwwwwwwwwwwwwwwwwwwwww|',
      '|wwwwwwwwwwwwwwwwwwwwwwww|',
      '||||||||||||WW||||||||||||'
    ],
    markers: { from_town: [12, 19] },
    portals: [
      { x: 12, y: 21, w: 2, h: 1, to: 'town', marker: 'from_boarding', label: 'Salir al pueblo' }
    ],
    props: [
      { t: 'fireplace', x: 11, y: 2 },
      { t: 'painting',  x: 8,  y: 1 }, { t: 'painting', x: 16, y: 1 },
      { t: 'window',    x: 2,  y: 1 }, { t: 'window',   x: 21, y: 1 },
      { t: 'bookshelf', x: 3,  y: 3 }, { t: 'bookshelf', x: 6, y: 3 },
      { t: 'stairs',    x: 20, y: 2 },
      { t: 'record',    x: 19, y: 6 },
      { t: 'rugprop',   x: 10, y: 9 },
      { t: 'sofa',      x: 10, y: 11 },
      { t: 'armchair',  x: 8,  y: 9 }, { t: 'armchair', x: 15, y: 9 },
      { t: 'cart',      x: 17, y: 11 },
      { t: 'table',     x: 12, y: 15 },
      { t: 'light', x: 12, y: 8 },
      { t: 'plant', x: 3, y: 17 }, { t: 'plant', x: 21, y: 17 },
      { t: 'crate', x: 22, y: 19 }
    ],
    npcs: [
      { id: 'damon',  x: 14, y: 6, dir: 'down', name: 'Damon' },
      { id: 'stefan', x: 10, y: 6, dir: 'down', name: 'Stefan', showIf: 'q3_final' }
    ],
    objects: [
      { id: 'mantel', t: 'photo',   x: 12, y: 5,  label: 'La foto de la chimenea',
        memory: 'mem_photo_wall', photo: 'us_now' },
      { id: 'record', t: 'inspect', x: 19, y: 8,  label: 'El tocadiscos', memory: 'mem_record' },
      { id: 'books',  t: 'inspect', x: 4,  y: 6,  label: 'La estantería',
        text: 'Cientos de libros y solo uno está gastado de verdad. Dentro, marcando ' +
              'una página, hay una polaroid tuya. Damon mira hacia otro lado.' },
      { id: 'bourbon', t: 'inspect', x: 17, y: 12, label: 'El bourbon',
        text: 'Una botella de 1912 y dos vasos ya servidos. Alguien sabía ' +
              'perfectamente que ibas a venir.' }
    ],
    atmosphere: { tint: 0x2b1c14, alpha: 0.42, fog: 0, fireflies: 0, dust: true }
  },

  /* =================================================================
     3. MYSTIC GRILL
     ================================================================= */
  grill: {
    id: 'grill',
    name: 'Mystic Grill',
    subtitle: 'Hamburguesas, secretos y ruido',
    kind: 'interior',
    music: 'grill',
    grid: [
      '||||||||||||||||||||||||||',
      '||||||||||||||||||||||||||',
      '|WWWWWWWWWWWWWWWWWWWWWWWW|',
      '|WWWWWWWWWWWWWWWWWWWWWWWW|',
      '|WWWWWWWWWWWWWWWWWWWWWWWW|',
      '|WWWWWWWWWWWWWWWWWWWWWWWW|',
      '|WWWWWWWWWWWWWWWWWWWWWWWW|',
      '|WWWWWWWWWWWWWWWWWWWWWWWW|',
      '|WWWWWWWWWWWWWWWWWWWWWWWW|',
      '|WWWWWWWWWWWWWWWWWWWWWWWW|',
      '|WWWWWWWWWWWWWWWWWWWWWWWW|',
      '|WWWWWWWWWWWWWWWWWWWWWWWW|',
      '|WWWWWWWWWWWWWWWWWWWWWWWW|',
      '|WWWWWWWWWWWWWWWWWWWWWWWW|',
      '|WWWWWWWWWWWWWWWWWWWWWWWW|',
      '|WWWWWWWWWWWWWWWWWWWWWWWW|',
      '|WWWWWWWWWWWWWWWWWWWWWWWW|',
      '|WWWWWWWWWWWWWWWWWWWWWWWW|',
      '|WWWWWWWWWWWWWWWWWWWWWWWW|',
      '|WWWWWWWWWWWWWWWWWWWWWWWW|',
      '|WWWWWWWWWWWWWWWWWWWWWWWW|',
      '||||||||||||WW||||||||||||'
    ],
    markers: { from_town: [12, 19] },
    portals: [
      { x: 12, y: 21, w: 2, h: 1, to: 'town', marker: 'from_grill', label: 'Salir a la plaza' }
    ],
    props: [
      { t: 'bar',   x: 3,  y: 3 },
      { t: 'stool', x: 3,  y: 6 }, { t: 'stool', x: 5, y: 6 }, { t: 'stool', x: 9, y: 6 },
      { t: 'window', x: 14, y: 1 }, { t: 'window', x: 19, y: 1 },
      { t: 'booth', x: 2,  y: 10 }, { t: 'booth', x: 2, y: 14 }, { t: 'booth', x: 2, y: 17 },
      { t: 'table', x: 8,  y: 11 }, { t: 'table', x: 8, y: 16 },
      { t: 'pool',  x: 15, y: 12 },
      { t: 'jukebox', x: 22, y: 4 },
      { t: 'light', x: 10, y: 9 }, { t: 'light', x: 17, y: 9 },
      { t: 'plant', x: 22, y: 17 },
      { t: 'crate', x: 22, y: 19 }
    ],
    npcs: [],
    objects: [
      { id: 'rush',  t: 'minigame', x: 7,  y: 6,  label: 'Birthday Rush' },
      { id: 'booth', t: 'inspect',  x: 5,  y: 18, label: 'La mesa del rincón', memory: 'mem_booth' },
      { id: 'juke',  t: 'inspect',  x: 22, y: 6,  label: 'La rocola', memory: 'mem_jukebox' },
      { id: 'pool',  t: 'inspect',  x: 16, y: 15, label: 'La mesa de billar',
        text: 'Las bolas están colocadas para empezar una partida. Solo falta que ' +
              'alguien se atreva a romper. Damon siempre rompe.' }
    ],
    atmosphere: { tint: 0x241a2e, alpha: 0.36, fog: 0, fireflies: 0, dust: true }
  },

  /* =================================================================
     4. MYSTIC FALLS HIGH
     ================================================================= */
  school: {
    id: 'school',
    name: 'Mystic Falls High',
    subtitle: 'Pasillos vacíos a medianoche',
    kind: 'interior',
    music: 'school',
    grid: [
      '||||||||||||||||||||||||||',
      '||||||||||||||||||||||||||',
      '|SSSSSSSSSSSSSSSSSSSSSSSS|',
      '|SSSSSSSSSSSSSSSSSSSSSSSS|',
      '|SSSSSSSSSSSSSSSSSSSSSSSS|',
      '|SSSSSSSSSSSSSSSSSSSSSSSS|',
      '|SSSSSSSSSSSSSSSSSSSSSSSS|',
      '|SSSSSSSSSSSSSSSSSSSSSSSS|',
      '|SSSSSSSSSSSSSSSSSSSSSSSS|',
      '|SSSSSSSSSSSSSSSSSSSSSSSS|',
      '|SSSSSSSSSSSSSSSSSSSSSSSS|',
      '|SSSSSSSSSSSSSSSSSSSSSSSS|',
      '|SSSSSSSSSSSSSSSSSSSSSSSS|',
      '|SSSSSSSSSSSSSSSSSSSSSSSS|',
      '|SSSSSSSSSSSSSSSSSSSSSSSS|',
      '|SSSSSSSSSSSSSSSSSSSSSSSS|',
      '|SSSSSSSSSSSSSSSSSSSSSSSS|',
      '|SSSSSSSSSSSSSSSSSSSSSSSS|',
      '|SSSSSSSSSSSSSSSSSSSSSSSS|',
      '|SSSSSSSSSSSSSSSSSSSSSSSS|',
      '|SSSSSSSSSSSSSSSSSSSSSSSS|',
      '||||||||||||WW||||||||||||'
    ],
    markers: { from_town: [12, 19] },
    portals: [
      { x: 12, y: 21, w: 2, h: 1, to: 'town', marker: 'from_school', label: 'Salir a la plaza' }
    ],
    props: [
      { t: 'lockers', x: 2,  y: 3 }, { t: 'lockers', x: 5,  y: 3 },
      { t: 'lockers', x: 8,  y: 3 }, { t: 'lockers', x: 11, y: 3 },
      { t: 'lockers', x: 17, y: 3 }, { t: 'lockers', x: 20, y: 3 },
      { t: 'lockers', x: 2,  y: 17 }, { t: 'lockers', x: 5,  y: 17 },
      { t: 'lockers', x: 8,  y: 17 }, { t: 'lockers', x: 17, y: 17 },
      { t: 'lockers', x: 20, y: 17 },
      { t: 'trophy',  x: 14, y: 3 },
      { t: 'window',  x: 11, y: 1 },
      { t: 'desk',    x: 20, y: 10 }, { t: 'desk', x: 20, y: 13 },
      { t: 'plant',   x: 2,  y: 10 }, { t: 'plant', x: 2, y: 14 },
      { t: 'light', x: 11, y: 10 },
      { t: 'crate',   x: 22, y: 19 }
    ],
    npcs: [],
    objects: [
      { id: 'locker23', t: 'inspect', x: 12, y: 5, label: 'Casillero 23', memory: 'mem_locker' },
      { id: 'trophy',   t: 'inspect', x: 15, y: 5, label: 'La vitrina', memory: 'mem_trophy' },
      { id: 'board',    t: 'inspect', x: 20, y: 12, label: 'El pizarrón',
        text: 'Alguien escribió la fecha de hoy en la esquina del pizarrón y la ' +
              'encerró en un círculo. Tres veces.' }
    ],
    atmosphere: { tint: 0x1b2440, alpha: 0.46, fog: 0, fireflies: 0, dust: true }
  },

  /* =================================================================
     5. CEMENTERIO
     ================================================================= */
  cemetery: {
    id: 'cemetery',
    name: 'Cementerio de Mystic Falls',
    subtitle: 'Nombres que alguien quiso muchísimo',
    kind: 'exterior',
    music: 'cemetery',
    grid: [
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
      'TT..........................TT',
      'T............................T',
      'T....gggggggggggggggggggg....T',
      'T....gggggggggggggggggggg....T',
      'T....gggggggggggggggggggg....T',
      'T....gggggggggggggggggggg....T',
      'T....gggggggggggggggggggg....T',
      'T....gggggggggggggggggggg....T',
      'T....gggggggggggggggggggg....T',
      'T....gggggggggggggggggggg....T',
      'T....gggggggggggggggggggg....T',
      'T....gggggggggggggggggggg....T',
      'T....gggggggggggggggggggg....T',
      'T....gggggggggggggggggggg....T',
      'T....gggggggggggggggggggg....T',
      'T....gggggggggggggggggggg....T',
      'T....gggggggggggggggggggg....T',
      'T....gggggggggggggggggggg....T',
      'T....gggggggggggggggggggg....T',
      'dddddgggggggggggggggggggg....T',
      'dddddgggggggggggggggggggg....T',
      'T....gggggggggggggggggggg....T',
      'T............................T',
      'TT..........................TT',
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT'
    ],
    markers: { from_town: [4, 20] },
    portals: [
      { x: 0, y: 20, w: 2, h: 2, to: 'town', marker: 'from_cemetery', label: 'Volver a la plaza' }
    ],
    props: [
      { t: 'crypt', x: 12, y: 3 },
      ...makeGraves(),
      { t: 'tree_dead', x: 2, y: 5 }, { t: 'tree_dead', x: 26, y: 6 },
      { t: 'tree_dead', x: 2, y: 15 }, { t: 'tree_dead', x: 26, y: 16 },
      { t: 'lamp', x: 9, y: 20 }, { t: 'lamp', x: 20, y: 20 },
      { t: 'bush', x: 5, y: 23 }, { t: 'bush', x: 24, y: 23 },
      { t: 'flowers', x: 10, y: 14 }, { t: 'flowers', x: 19, y: 14 },
      { t: 'flowers', x: 11, y: 20 }, { t: 'flowers', x: 18, y: 20 }
    ],
    npcs: [
      { id: 'stefan', x: 16, y: 8, dir: 'down', name: 'Stefan', hideIf: 'q3_final' }
    ],
    objects: [
      { id: 'tomb',  t: 'inspect', x: 13, y: 7,  label: 'La tumba de los Salvatore',
        text: 'Dos nombres grabados en la misma piedra, con el mismo apellido y la ' +
              'misma fecha. Debajo, mucho más nuevo: "Todavía aquí".' },
      { id: 'diary', t: 'inspect', x: 7,  y: 12, label: 'Una hoja de diario', memory: 'mem_diary' },
      ...makeCandles()
    ],
    atmosphere: { tint: 0x1c2842, alpha: 0.64, fog: 2, fireflies: 4, stars: true }
  },

  /* =================================================================
     6. EL BOSQUE
     ================================================================= */
  woods: {
    id: 'woods',
    name: 'El bosque',
    subtitle: 'Donde el pueblo deja de mandar',
    kind: 'exterior',
    music: 'woods',
    grid: [
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
      'TTT........................TTT',
      'T............................T',
      'T............................T',
      'T............................T',
      'T............................T',
      'T............................T',
      'T............................T',
      'T............................T',
      'T............................T',
      'T............................T',
      'T............................T',
      'T............................T',
      'T............................T',
      'T............................T',
      'T............................T',
      'T............................T',
      'T............................T',
      'T............................T',
      'T..ddddddddddddddddddddddddddd',
      'T..ddddddddddddddddddddddddddd',
      'T............................T',
      'TT..........................TT',
      'TTT........................TTT',
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT'
    ],
    markers: { from_town: [26, 20] },
    portals: [
      { x: 28, y: 20, w: 2, h: 2, to: 'town', marker: 'from_woods', label: 'Volver a la plaza' }
    ],
    props: [
      { t: 'waterfall', x: 4, y: 3 },
      ...makeForest(),
      { t: 'lantern', x: 9,  y: 13 },
      { t: 'campfire', x: 21, y: 13 },
      { t: 'rock', x: 13, y: 8 }, { t: 'rock', x: 17, y: 14 }, { t: 'rock', x: 7, y: 17 },
      { t: 'log',  x: 11, y: 12 }, { t: 'log', x: 20, y: 9 },
      { t: 'bush', x: 8, y: 6 },  { t: 'bush', x: 18, y: 7 }, { t: 'bush', x: 14, y: 15 },
      { t: 'bush', x: 24, y: 13 }, { t: 'bush', x: 5, y: 14 },
      { t: 'flowers', x: 12, y: 17 }, { t: 'flowers', x: 16, y: 5 },
      { t: 'flowers', x: 22, y: 16 }
    ],
    npcs: [],
    objects: [
      { id: 'falls', t: 'inspect', x: 6, y: 9, label: 'Las cascadas',
        memory: 'mem_falls', photo: 'polaroid_secret' },
      { id: 'clue_lantern', t: 'clue', x: 9,  y: 15, label: 'Una lámpara encendida',
        memory: 'mem_lantern' },
      { id: 'clue_carving', t: 'clue', x: 20, y: 6,  label: 'Iniciales talladas',
        memory: 'mem_carving' },
      { id: 'clue_locket',  t: 'clue', x: 24, y: 17, label: 'Algo que brilla en el suelo',
        memory: 'mem_locket' }
    ],
    atmosphere: { tint: 0x14223a, alpha: 0.66, fog: 2, fireflies: 14, stars: false }
  }
};

export const MAP_IDS = Object.keys(MAPS);
export const START_MAP = 'town';

/* Nombres bonitos para la pestana "Lugares" del diario */
export const PLACE_LIST = [
  { id: 'town',     name: 'Plaza del pueblo' },
  { id: 'grill',    name: 'Mystic Grill' },
  { id: 'school',   name: 'Mystic Falls High' },
  { id: 'boarding', name: 'Salvatore Boarding House' },
  { id: 'cemetery', name: 'Cementerio' },
  { id: 'woods',    name: 'El bosque' }
];

/* Comprobacion de integridad: todas las filas deben medir lo mismo.
   Si te equivocas escribiendo un mapa, la consola te lo dice. */
export function validateMaps() {
  for (const m of Object.values(MAPS)) {
    const w = m.grid[0].length;
    m.grid.forEach((row, i) => {
      if (row.length !== w) {
        console.error(`[maps] ${m.id}: la fila ${i} mide ${row.length}, deberia medir ${w}`);
      }
    });
    m.w = w;
    m.h = m.grid.length;
  }
}
