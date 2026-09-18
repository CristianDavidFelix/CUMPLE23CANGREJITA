# Mystic Falls — Una historia para Sammy

Un RPG 2D pequeño para el navegador, hecho como regalo de cumpleaños (23).
Fan project personal, sin fines comerciales, inspirado en *The Vampire Diaries*.

- **Tecnología:** HTML + CSS + JavaScript (módulos ES6) + Phaser 3 desde CDN.
- **Sin backend, sin build:** se sube tal cual a GitHub Pages.
- **Cero assets obligatorios:** el pixel art y la música se generan por código.
  Las fotos y los MP3 son opcionales y se añaden cuando quieras.
- **Mobile first:** joystick, botón de acción, tocar para caminar, safe areas del iPhone.

Duración aproximada: 25–40 minutos.

---

## 1. Personalizarlo (lo único que tienes que tocar)

| Qué | Archivo |
|---|---|
| Nombre, edad, pronombres, colores del avatar, tu firma | `js/data/playerConfig.js` |
| **La carta final** | `js/data/letter.js` |
| **Los 23 deseos** para su nuevo año (uno por vela) | `js/data/reasons.js` |
| Recuerdos que se desbloquean | `js/data/memories.js` |
| Fotos y sus textos | `js/data/photos.js` + archivos en `assets/photos/` |
| Diálogos de Damon, Stefan y Bonnie | `js/data/dialogues.js` |
| Misiones | `js/data/quests.js` |
| Mapas, objetos y textos de cada lugar | `js/data/maps.js` |

En cualquier texto puedes escribir `{name}` y se cambia por el nombre de ella.

### Fotos
Copia 6 fotos en `assets/photos/` con los nombres `01.jpg` … `06.jpg`
(o cambia los nombres en `js/data/photos.js`). Aparecen dentro del mundo:
en la repisa de la chimenea, en la torre del reloj, en el casillero 23,
en las cascadas… y quedan guardadas en el diario.
Si falta alguna, se ve un marco vacío: nada se rompe.

### Música
Pon MP3 en `assets/audio/` con estos nombres y sustituyen a la música generada:
`menu` · `town` · `boarding` · `grill` · `school` · `cemetery` · `woods` · `finale`.

---

## 2. Probarlo en tu computadora

Los módulos ES6 no funcionan abriendo el `index.html` con doble clic.
Hace falta un servidor local (cualquiera sirve):

```bash
# con Python
python -m http.server 8000
# o con Node
npx serve .
```

Y abre `http://localhost:8000`.
Para probarlo en tu celular, conéctalo a la misma wifi y abre `http://IP-DE-TU-PC:8000`.

---

## 3. Publicarlo en GitHub Pages

1. Crea un repositorio y sube **el contenido de esta carpeta** (el `index.html` en la raíz).
2. En GitHub: **Settings → Pages → Source: Deploy from a branch → `main` / `(root)`**.
3. En uno o dos minutos tendrás el enlace: `https://TU-USUARIO.github.io/NOMBRE-REPO/`.

Consejo: si quieres que sea una sorpresa, haz el repositorio con un nombre discreto.

---

## 4. Modo debug (para probar sin jugar todo)

Abre la URL con `?debug=1` (o pulsa la tecla `0`). Aparece un panel para:
teletransportarte a cualquier lugar, desbloquear recuerdos, encender las 23 velas,
completar misiones, lanzar el minijuego o el final y borrar el progreso.

Otras opciones: `?map=cemetery` empieza directamente en ese mapa.

En la consola del navegador tienes `__mf.State`, `__mf.Dialogue`, etc.

### Validar los datos
Si editas los mapas o los diálogos, este script comprueba que todo encaje
(nadie aparece dentro de una pared, no hay diálogos rotos, hay 23 velas…):

```bash
node tools/validate.mjs
```

---

## 5. Cómo se juega

| | Celular | Computadora |
|---|---|---|
| Caminar | Joystick (abajo izquierda) o tocar el suelo | WASD / flechas |
| Interactuar | Botón rojo (abajo derecha) o tocar lo que brilla | E / Espacio / Enter |
| Diario | ✦ arriba a la derecha, o tocar la misión | J |
| Menú | ≡ arriba a la derecha | Esc |

El progreso se guarda solo (localStorage). En el menú: **Continuar**,
**Nueva historia** y **Borrar progreso**.

### Progresión
1. **Explorar Mystic Falls** — entrar al Grill, hablar con Stefan (cementerio),
   descubrir un recuerdo, visitar el cementerio.
2. **Susurros en el bosque** — ganar el *Birthday Rush* en el Grill, encontrar
   las 3 señales del bosque, encender las 23 velas (23 deseos para sus 23).
3. **El último capítulo de la cumpleañera** — volver a la Salvatore Boarding House,
   donde esperan Damon y Stefan → escena final → **23** → *Feliz cumpleaños* → la carta.

Damon ya está en la casa desde el principio (primera escena con brindis incluido);
Bonnie, en la plaza, da pistas según la misión en la que vaya.

---

## 6. Estructura

```
index.html            capa de UI (HTML) + canvas
css/style.css         estilos, mobile first, safe areas
js/
  main.js             arranque y conexión entre UI y Phaser
  config.js           constantes técnicas y ajustes de rendimiento
  data/               TODO el contenido editable (textos, mapas, misiones)
  systems/            estado, guardado, diálogo, audio, controles, HUD, diario...
  entities/           Player, NPC, Interactable
  scenes/             Boot, Menu, World (los 6 lugares), Minigame, Finale
assets/               fotos y música opcionales
tools/validate.mjs    comprobación de datos (opcional, solo desarrollo)
```

Una sola escena (`WorldScene`) construye los seis lugares a partir de `maps.js`,
así que añadir o cambiar un lugar es editar datos, no código.

### Notas de rendimiento
- El suelo de cada mapa se "hornea" en una sola textura (1 draw call).
- Colisiones fusionadas en rectángulos grandes.
- El canvas va a resolución CSS (no ×3 en iPhone) con zoom entero de cámara:
  pixel art nítido y muy poco trabajo para la GPU.
- Partículas limitadas y reducidas automáticamente en teléfonos modestos.
- Texto siempre en HTML, nunca en el canvas.
