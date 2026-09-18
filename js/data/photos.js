/* =====================================================================
   FOTOGRAFÍAS REALES
   Cada entrada apunta a un archivo dentro de assets/photos/.
   Si el archivo no existe todavía, el juego muestra un marco vacío con el
   texto de "hint". Así puedes probar el juego sin haber puesto las fotos.

   CÓMO USARLO:
   1. Copia tus fotos en  assets/photos/  (01.jpg, 02.jpg, ...)
   2. Si usas otros nombres, cambia el campo  src
   3. Escribe la  caption: se ve con letra manuscrita debajo de la foto

   Consejo de rendimiento: exporta las fotos a ~900 px de lado y calidad 80.
   Cargan mucho más rápido en el celular y se ven igual de bien.
   ===================================================================== */

export const PHOTOS = {
  first_night: {
    src: './assets/photos/01.jpeg',
    caption: 'La carita más tierna e inocente del mundo. nada que ver con el fondo',
    hint: 'Falta la foto assets/photos/01.jpeg'
  },
  us_laughing: {
    src: './assets/photos/02.jpeg',
    caption: 'Esta sonrisa. Siempre esta sonrisa.',
    hint: 'Falta la foto assets/photos/02.jpeg'
  },
  the_trip: {
    src: './assets/photos/03.jpeg',
    caption: 'Tu manera tan particular de existir.',
    hint: 'Falta la foto assets/photos/03.jpeg'
  },
  her_smile: {
    src: './assets/photos/04.jpeg',
    caption: 'Mi lugar favorito no es un lugar.',
    hint: 'Falta la foto assets/photos/04.jpeg'
  },
  us_now: {
    src: './assets/photos/05.jpeg',
    caption: 'Tu carita tan hermosa y expresiva.',
    hint: 'Falta la foto assets/photos/05.jpeg'
  },
  polaroid_secret: {
    src: './assets/photos/06.jpeg',
    caption: '23. Y apenas estamos empezando.',
    hint: 'Falta la foto assets/photos/06.jpeg'
  }
};

export function getPhoto(id) {
  return PHOTOS[id] || null;
}
