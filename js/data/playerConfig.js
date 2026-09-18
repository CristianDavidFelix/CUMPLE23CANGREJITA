/* =====================================================================
   PLAYER CONFIG  --  EDITA ESTE ARCHIVO PRIMERO
   Todo lo personal del juego sale de aqui. No necesitas tocar nada mas
   para que el juego hable de ella.
   ===================================================================== */

export const PLAYER = {
  /* Como se llama en pantalla. Usa el nombre o el apodo que mas le guste. */
  PLAYER_NAME: 'Sammy',

  /* Nombre completo, se usa solo en la carta final. Deja '' para usar PLAYER_NAME. */
  PLAYER_FULL_NAME: '',

  /* Cumpleanos en formato AAAA-MM-DD. Se usa en el diario y en el final. */
  PLAYER_BIRTHDAY: '2003-09-18',

  /* Edad que cumple. El juego entero gira alrededor de este numero. */
  PLAYER_AGE: 23,

  /* Pronombres. Cambia si hace falta: el juego los usa en los textos. */
  PLAYER_PRONOUNS: {
    subject: 'she',      // she / he / they
    object: 'her',       // her  / him / them
    possessive: 'her',   // her  / his / their
    reflexive: 'herself' // herself / himself / themselves
  },

  /* ---------------------------------------------------------------
     AVATAR
     El sprite se dibuja por codigo (no necesitas ningun archivo).
     Cambia los colores a gusto: pelo, piel, ropa.
     hairStyle: 'long' | 'short' | 'bun' | 'wavy'
     --------------------------------------------------------------- */
  PLAYER_AVATAR: {
    skin:   '#e8b98f',
    hair:   '#2e1d14',
    hairStyle: 'wavy',
    top:    '#7d1f2b',
    bottom: '#242838',
    shoes:  '#15161d',
    accent: '#c9a227'   // detalle (collar, cinturon)
  },

  /* Foto real para el retrato de dialogo (opcional).
     Deja null para usar el retrato dibujado en pixel art.
     Si pones una foto: assets/photos/ella.jpg  */
  PLAYER_PORTRAIT: null,

  /* Como firma la carta final */
  SIGNED_BY: 'Tu cangrejito eternamente enamorado, CrissFx'
};

/* Sustituye {name}, {age}, {she}, {her}... dentro de cualquier texto del juego. */
export function fillTokens(text) {
  if (!text) return '';
  const p = PLAYER.PLAYER_PRONOUNS;
  return String(text)
    .replaceAll('{name}', PLAYER.PLAYER_NAME)
    .replaceAll('{NAME}', PLAYER.PLAYER_NAME.toUpperCase())
    .replaceAll('{age}', String(PLAYER.PLAYER_AGE))
    .replaceAll('{she}', p.subject)
    .replaceAll('{her}', p.object)
    .replaceAll('{hers}', p.possessive)
    .replaceAll('{herself}', p.reflexive);
}
