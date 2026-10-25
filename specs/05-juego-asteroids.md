# SPEC 05 — Juego Asteroids jugable

**Estado:** Aprobado
**Depende de:** SPEC 01, SPEC 04
**Fecha:** 2026-10-25

**Objetivo:** Portar el Asteroids de `references/started-games/02-asteroids/` a un motor TypeScript montado en `/juego/asteroids/jugar`, que conserva su canvas y su HUD propios y notifica a React para alimentar el HUD y el modal de fin de partida de la plataforma.

## Alcance

**Dentro:**

- Nueva entrada `asteroids` en `GAMES` (`lib/data.ts`), en **primera posición**:
  - `title: "ASTEROIDS"`, `cat: "SHOOTER"`, `color: "cyan"`, `cover: "cover-rocas"` (se reusa el cover existente, sin CSS nuevo).
  - `best: 0`, `plays: "0"`.
  - `short` y `long` en español basados en el README del original (rocas que se parten, triple disparo, 3 vidas).
- La entrada mock `rocas` se mantiene sin cambios.
- Motor TypeScript en `lib/games/asteroids/engine.ts`, port de `game.js`:
  - Sin estado global de módulo. Todo el estado vive en la instancia creada por `createAsteroidsGame`.
  - Canvas inyectado. No usa `document.getElementById`.
  - Mundo lógico fijo 800×600. Física y constantes idénticas al original.
  - Mecánicas idénticas: 3 vidas, invencibilidad de 3 s al reaparecer con parpadeo, asteroides 3→2→1, puntos 20/50/100, nivel N con `3 + N` asteroides (nivel 1 con 4), power-up triple disparo (15 % de drop, garantizado a las 5 destrucciones, 5 s de efecto, 12 s de vida, uno por nivel), partículas de explosión, respawn tras 2 s.
  - Sin sonido y sin OVNIs (el original no los tiene).
  - **Dos capas de UI.** El canvas conserva su HUD y React tiene el suyo. El motor es la fuente de verdad y notifica a React por callbacks.
  - Se mantiene en el canvas `drawHUD` completo: `SCORE`, `NIVEL`, vidas (`drawLifeIcon`) e indicador `3x  N.Ns` del triple disparo activo.
  - Se mantiene `drawOverlay` con el overlay `GAME OVER`. El subtítulo cambia a `PUNTAJE: N` (sin "ESPACIO PARA REINICIAR"), porque el modal React lo cubre y es el que reinicia.
  - Se elimina solo el reinicio con Espacio en estado `gameover`. Reiniciar es responsabilidad de React ("JUGAR DE NUEVO").
  - Paleta neón del vault, con colores fijos en el motor que copian los tokens de `app/globals.css`. Aplica a entidades, HUD y overlay del canvas. Las formas no cambian.
  - Emite callbacks al cambiar score, vidas o nivel, y al llegar a game over.
  - API de control: `pause()`, `resume()`, `restart()`, `destroy()`.
- Componente cliente `components/games/asteroids-canvas.tsx`:
  - Crea el motor en `useEffect` y llama a `destroy()` al desmontar.
  - Canvas con `width=800` y `height=600`, escalado por CSS al 100 % de `.crt-screen` (que ya es 4:3).
  - Recibe `paused` y `over` como props y los aplica al motor.
  - Expone `restart` al reproductor (vía `ref` o `key` que remonta el componente; se decide en implementación, ver Decisiones).
- Teclado:
  - Listeners `keydown`/`keyup` en `window`, registrados solo mientras el componente está montado y eliminados en `destroy()`.
  - `ArrowLeft`/`ArrowRight` rotan, `ArrowUp` propulsa, `Space` dispara.
  - `preventDefault` en flechas y `Space` para evitar el scroll de la página.
  - `KeyP` y `Escape` alternan pausa, igual que el botón PAUSA del HUD.
  - Las teclas de juego se ignoran en pausa y con el modal de fin abierto.
- Reproductor `app/juego/[id]/jugar/page.tsx`:
  - Si `game.id === "asteroids"`: monta `<AsteroidsCanvas>` dentro de `.crt-screen` en lugar de `.game-arena`. Score, vidas y nivel del HUD React vienen del motor. No corre el `setInterval` de score simulado.
  - HUD React sin slots nuevos. El triple disparo solo se ve en el HUD del canvas.
  - Overlay "EN PAUSA" existente se reutiliza.
  - Game over del motor abre el modal "FIN DEL JUEGO" existente, encima del overlay `GAME OVER` del canvas.
  - Botón FIN detiene el motor y abre el mismo modal con el score actual. Se puede guardar igual que en game over natural.
  - "JUGAR DE NUEVO" reinicia el motor (score 0, 3 vidas, nivel 1).
  - Guardado de score igual que SPEC 04: con sesión, `addStoredScore({ game: "asteroids", score, name: username })`. Sin sesión, enlace a `/auth`.
  - Resto de juegos: sin cambios (arena mock y score simulado).

**Fuera de este spec (no se implementa):**

- Controles táctiles o soporte jugable en móvil. En móvil el canvas se ve pero no se juega.
- Sonido y música.
- OVNIs u otros enemigos nuevos.
- Cambios de mecánica, dificultad o balance.
- Mundo de tamaño variable según el contenedor.
- Cover CSS nuevo (`cover-asteroids`).
- Eliminar o modificar la entrada `rocas`.
- Slot de triple disparo en el HUD React.
- Aviso de respawn u otros overlays nuevos.
- Puntuaciones en Supabase o leaderboard real. `/salon` y `/juego/asteroids` siguen con `seededScores`.
- `best` y `plays` reales.
- Portar los otros juegos de `references/started-games/` (tetris, arkanoid).
- Abstracción genérica de motor para múltiples juegos.

## Modelo de datos

Sin cambios en persistencia. `av_scores` (SPEC 04) recibe entradas con `game: "asteroids"`.

Nueva entrada en `lib/data.ts` (tipo `Game` existente, sin cambios de tipo):

```ts
{
  id: "asteroids",
  title: "ASTEROIDS",
  short: "…", // español, basado en el README
  long: "…",  // español, basado en el README
  cat: "SHOOTER",
  cover: "cover-rocas",
  color: "cyan",
  best: 0,
  plays: "0",
}
```

API del motor (`lib/games/asteroids/engine.ts`):

```ts
export interface AsteroidsCallbacks {
  onScore: (score: number) => void;
  onLives: (lives: number) => void;
  onLevel: (level: number) => void;
  onGameOver: (finalScore: number) => void;
}

export interface AsteroidsGame {
  pause: () => void;
  resume: () => void;
  restart: () => void;
  destroy: () => void; // cancela requestAnimationFrame y quita listeners
}

export function createAsteroidsGame(
  canvas: HTMLCanvasElement,
  callbacks: AsteroidsCallbacks,
): AsteroidsGame;
```

Estados internos del motor: `"playing" | "dead" | "paused" | "gameover"`. `paused` congela `update`, pero el motor sigue dibujando el último frame (incluido el HUD del canvas). Al reanudar, `lastTime` se resetea para que `dt` no salte.

Convenciones:

- Las clases del original (`Bullet`, `Asteroid`, `PowerUp`, `Particle`, `Ship`) se portan como clases TS dentro de `engine.ts`. Reciben `ctx` como argumento en `draw(ctx)`, sin `ctx` global. `drawHUD`, `drawLifeIcon` y `drawOverlay` también reciben `ctx`.
- Las constantes del original mantienen nombre y valor (`RADII`, `SPEEDS`, `POINTS`, `POWERUP_*`, `TRIPLE_SPREAD`).
- Callbacks solo se emiten cuando el valor cambia, no en cada frame.
- HUD del canvas y HUD React leen el mismo estado del motor; nunca pueden mostrar valores distintos.

## Plan de implementación

1. **Catálogo.** Agregar la entrada `asteroids` en primera posición de `GAMES`. `/biblioteca`, inicio, `/salon` y `/juego/asteroids` la muestran. `/juego/asteroids/jugar` funciona con la arena mock.
2. **Motor.** Crear `lib/games/asteroids/engine.ts` portando `game.js` a TS strict: estado por instancia, canvas inyectado, `draw(ctx)`, paleta neón, `drawHUD` y overlay `GAME OVER` conservados (subtítulo `PUNTAJE: N`), sin reinicio por Espacio, callbacks y API de control. Todavía no se usa.
3. **Componente.** Crear `components/games/asteroids-canvas.tsx` (`"use client"`): monta el motor, sincroniza `paused`/`over`, limpia en desmontaje. Canvas escalado al 100 % de `.crt-screen`.
4. **Reproductor.** En `app/juego/[id]/jugar/page.tsx`, rama para `asteroids`: monta el componente, HUD React desde callbacks, sin `setInterval`, game over y FIN abren el modal, "JUGAR DE NUEVO" reinicia el motor. Resto de juegos sin cambios.
5. **Teclado.** Pausa con `KeyP`/`Escape`, `preventDefault` en flechas/`Space`, teclas ignoradas en pausa y con modal.
6. **Verificación.** `npm run lint` y `npm run build` sin errores. Prueba manual con Playwright de los criterios de aceptación. Screenshots en `.playwright/screenshots`.

## Criterios de aceptación

- [ ] `ASTEROIDS` aparece primero en `/biblioteca`, en el preview de inicio y como tab por defecto en `/salon`.
- [ ] La tarjeta de `asteroids` usa el cover `cover-rocas`, color cyan y categoría SHOOTER.
- [ ] `rocas` sigue en `GAMES` sin cambios.
- [ ] `/juego/asteroids/jugar` muestra el canvas del juego dentro de la pantalla CRT, en 4:3, sin la arena mock.
- [ ] El canvas dibuja su HUD: `SCORE`, `NIVEL` y los íconos de vidas.
- [ ] Flechas rotan y propulsan la nave. `Space` dispara. La página no hace scroll con esas teclas.
- [ ] Destruir un asteroide grande suma 20, uno mediano 50 y uno pequeño 100. HUD del canvas y HUD React muestran el mismo score.
- [ ] Perder una vida baja las vidas en ambos HUD. La nave reaparece tras ~2 s y parpadea mientras es invencible.
- [ ] Limpiar todos los asteroides sube el nivel en ambos HUD y genera `3 + nivel` asteroides grandes.
- [ ] El power-up 3x aparece, activa triple disparo 5 s y el HUD del canvas muestra el contador `3x  N.Ns`.
- [ ] La paleta del canvas (entidades, HUD y overlay) usa colores neón del vault, no blanco puro.
- [ ] Botón PAUSA, `P` y `Escape` congelan el juego y muestran "EN PAUSA". Repetir la acción reanuda sin salto de posición.
- [ ] En pausa, flechas y `Space` no mueven la nave ni disparan.
- [ ] Perder las 3 vidas dibuja `GAME OVER` en el canvas y abre el modal "FIN DEL JUEGO" con el score final del motor.
- [ ] En `gameover`, `Space` no reinicia el juego.
- [ ] Botón FIN detiene el juego y abre el modal con el score actual.
- [ ] Con sesión, "GUARDAR PUNTUACIÓN" agrega a `av_scores` una entrada con `game: "asteroids"`, el score final y el username.
- [ ] Sin sesión, el modal muestra "INICIA SESIÓN PARA GUARDAR" y `av_scores` no cambia.
- [ ] "JUGAR DE NUEVO" reinicia a score 0, 3 vidas, nivel 01 en ambos HUD, con asteroides nuevos.
- [ ] Salir de la página (SALIR o navegación) detiene el loop y quita los listeners de teclado. Volver a entrar no duplica la velocidad ni los disparos.
- [ ] Los demás juegos (`/juego/caida/jugar`, etc.) siguen con arena mock y score simulado.
- [ ] `npm run lint` y `npm run build` pasan sin errores.

## Decisiones tomadas

- **Sí:** port a TypeScript con componente cliente. Encaja con TS strict y el reproductor existente; el HUD React recibe datos directos del motor.
- **No:** iframe con `index.html` + `game.js` en `public/`. JS sin tipos y comunicación por `postMessage`.
- **No:** port JS casi literal con estado global de módulo. Rompe al remontar el componente (estado viejo, loops duplicados).
- **Sí:** nueva entrada `asteroids`. Decisión del usuario.
- **Sí:** mantener `rocas`. Decisión del usuario; queda como mock.
- **Sí:** reusar `cover-rocas`. Ya ilustra rocas en el espacio; cero CSS nuevo.
- **Sí:** `asteroids` primero en `GAMES`. Es el único juego jugable; aparece en el preview de inicio.
- **Sí:** color cyan, `best: 0`, `plays: "0"`. Distingue de `rocas` (yellow) y refleja que el juego es nuevo.
- **Sí:** conservar el HUD del canvas y notificar a React. Decisión del usuario. Se usan los dos HUD; el motor es la única fuente de verdad.
- **No:** borrar `drawHUD`. Decisión del usuario; el juego mantiene su identidad visual.
- **Sí:** conservar el overlay `GAME OVER` del canvas, con subtítulo `PUNTAJE: N`. El modal React queda encima.
- **No:** reinicio con Espacio en `gameover`. Reiniciaría el motor con el modal React abierto; solo "JUGAR DE NUEVO" reinicia.
- **No:** slot de triple disparo en el HUD React. El HUD del canvas ya lo muestra; evita un callback extra y re-renders.
- **Sí:** modal React existente para fin de partida. Único lugar para guardar score y reiniciar.
- **Sí:** paleta neón del vault. Encaja con el CRT. Formas y física sin cambios.
- **Sí:** colores fijos en el motor que copian los tokens. Canvas no lee variables CSS sin `getComputedStyle`; los tokens no cambian por tema.
- **Sí:** mundo lógico 800×600 escalado por CSS. Física idéntica en cualquier pantalla; `.crt-screen` ya es 4:3.
- **No:** mundo del tamaño del contenedor. Cambia la dificultad según la pantalla.
- **Sí:** mecánicas idénticas al original, incluido el triple disparo.
- **Sí:** `P`/`Escape` pausan además del botón.
- **Sí:** FIN abre el modal y permite guardar. Mismo flujo que game over natural.
- **No:** aviso de respawn. El original no lo tiene.
- **No:** controles táctiles. Van en su propio spec.
- **Sí:** otros juegos siguen con arena mock. Este spec solo agrega un juego real.
- **No:** abstracción genérica de motor. Con un solo juego real no hay patrón que generalizar.
- **Abierta (se decide en paso 3):** reinicio vía `ref` con `restart()` o vía cambio de `key` que remonta el componente. Ambos cumplen los criterios.

## Riesgos identificados

| Riesgo                                                                                | Mitigación                                                                                         |
| ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| React Strict Mode monta efectos dos veces en dev: dos loops o listeners duplicados    | `destroy()` cancela `requestAnimationFrame` y quita listeners. Criterio de aceptación lo verifica. |
| `dt` gigante al reanudar tras pausa o al volver a la pestaña                          | Resetear `lastTime` al reanudar. Se mantiene el tope de `dt` en 0.05 s del original.               |
| Callbacks por frame causan re-render continuo del reproductor                         | Emitir callbacks solo cuando el valor cambia.                                                      |
| HUD del canvas y HUD React desincronizados                                            | Ambos leen el mismo estado del motor; callbacks se emiten en el mismo frame que el cambio.         |
| HUD del canvas ilegible al escalar el canvas en pantallas chicas                      | Aceptado. En móvil el juego no es jugable; el HUD React muestra los mismos datos.                  |
| Overlay `GAME OVER` del canvas visible a través del fondo del modal                   | Aceptado. Refuerza el fin de partida; verificar con screenshot que el modal sigue legible.         |
| `Space` o flechas hacen scroll o activan botones enfocados del HUD                    | `preventDefault` en esas teclas mientras el juego está montado.                                    |
| Teclas `P`/`Escape` o `Space` activas con el modal abierto (por ejemplo, al escribir) | Ignorar teclas de juego con `over` activo.                                                         |
| Canvas escalado por CSS se ve borroso en pantallas de alta densidad                   | Aceptado. Estética CRT con scanlines. Ajuste de `devicePixelRatio` fuera de alcance.               |
| Overlays `::before`/`::after` de `.crt-screen` tapan el canvas                        | Ya tienen `pointer-events: none`. Verificar orden de capas con screenshot.                         |
| En móvil el juego no es jugable                                                       | Aceptado. Controles táctiles van en otro spec.                                                     |

## Qué **no** entra en este spec

- Controles táctiles y móvil jugable.
- Sonido, OVNIs y cambios de mecánica.
- Cover nuevo y cambios a `rocas`.
- Slot de triple disparo en el HUD React, aviso de respawn y otros overlays nuevos.
- Puntuaciones en Supabase, leaderboard real, `best`/`plays` reales.
- Otros juegos de `references/started-games/`.
- Motor genérico para varios juegos.

Cada uno de esos, si llega, va en su propio spec.
