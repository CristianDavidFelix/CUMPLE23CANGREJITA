/* =====================================================================
   LA CARTA FINAL
   Es lo último que ella va a leer en el juego.
   ESCRÍBELA TÚ. Lo que hay aquí es solo un andamio para que veas el formato.

   - title      : el encabezado de la carta ({name} se cambia por su nombre)
   - paragraphs : un párrafo por cada elemento del array
   - signature  : cómo firmas (\n = salto de línea)
   - afterword  : (opcional) una última línea chiquita debajo de la firma
   ===================================================================== */

export const LETTER = {
  title: 'Para {name}',

  paragraphs: [
    'Si llegaste hasta aquí, ya caminaste por todo un pueblo que no existe. ' +
    'Hablaste con dos hermanos imposibles, encendiste veintitrés velas y ' +
    'encontraste cosas que escondí para que las encontraras tú.',

    'Todo esto lo hice por una razón bastante simple: quería regalarte un rato ' +
    'dentro de algo que te gusta. No un objeto. Un rato. Un lugar al que puedas ' +
    'entrar desde el celular cuando quieras y acordarte de que alguien se puso a ' +
    'construirte un pueblo entero.',

    'Cumplir veintitrés no es llegar a ningún lado. Es seguir. Y yo quiero seguir ' +
    'viéndote seguir: con tus planes que cambian, tus tres minutos de enojo y tu ' +
    'hermosa sonrisa.',

    'Gracias por dejarme estar cerca. Gracias por los días que me has dado, son demasiado ' +
    'importantes para mi.',

    'Feliz cumpleaños, mi amor. Que este año se parezca a ti: intenso, bonito y ' +
    'completamente tuyo.'
  ],

  signature: 'Siempre tuyo,\nCristian',

  afterword: 'Mystic Falls seguirá aquí. Vuelve cuando quieras.'
};
