# SPEC 01 — MVP de pantallas visuales de Arcade Vault

**Estado:** Aprobado
**Depende de:** —
**Fecha:** 2026-09-17

**Objetivo:** Portar las 5 pantallas del prototipo estático en `references/templates/` (biblioteca, detalle de juego, reproductor simulado, salón de la fama, auth) a rutas reales de Next.js 16.3 App Router con TypeScript estricto, conservando el diseño visual pixel/neón original y sin implementar ningún juego jugable de verdad.

## Alcance

**Dentro:**
- 5 pantallas como rutas de App Router:
  - `/` — Biblioteca (grid de juegos, búsqueda, filtro por categoría).
  - `/juego/[id]` — Detalle de juego (portada, descripción, stats, leaderboard).
  - `/juego/[id]/jugar` — Reproductor simulado (HUD, CRT visual, simulación de score automática, modal de fin de partida).
  - `/salon` — Salón de la Fama (tabs por juego, podio top 3, tabla de puntuaciones).
  - `/auth` — Inicio de sesión / registro / invitado.
- Componentes compartidos: `Nav` (barra superior + panel móvil), `GameCard`, fondo `av-bg`/`av-noise`, footer.
- Navegación real con `next/link` / `useRouter` entre las 5 rutas (reemplaza el hash-routing del prototipo).
- Datos mock tipados en TypeScript (`GAMES`, `CATS`, `PLAYERS`, `seededScores`) portados desde `data.jsx`.
- Sesión de usuario simulada con `localStorage` (`av_user`): login guarda `{ name }`, logout lo borra, "jugar como invitado" navega sin usuario.
- Guardado de puntuaciones simulado con `localStorage` (`av_scores`): el modal de fin de partida en el reproductor empuja `{ game, score, name, at }`.
- Simulación visual del reproductor idéntica al prototipo: score que sube solo por `setInterval`, vidas, nivel, pausa, botón "FIN", modal de fin con input de iniciales y botón "GUARDAR PUNTUACIÓN".
- Elementos decorativos no funcionales conservados tal cual: contador de créditos fijo ("CRÉDITOS · 03"), botones sociales "GOOGLE"/"GITHUB" en auth sin acción real.
- Estilos: `styles.css` portado a `app/globals.css` (ya iniciado en el repo: variables de tema, fuentes `--font-pixel`/`--font-mono` vía `next/font/google`, mapeo `@theme inline`). Se completan las clases de pantalla que faltan (`.av-hero`, `.card`, `.av-detail`, `.crt`, `.modal`, `.auth-*`, `.hall-*`, etc.) y los `<div className="av-bg">` / `<div className="av-noise">` de fondo en el layout.
- Responsive tal como está definido en el CSS original (media queries a 840px / 900px / 720px).

**Fuera de este MVP (no se implementa):**
- Cualquier juego jugable de verdad (lógica de colisiones, input de teclado/táctil, reglas de cada uno de los 8 juegos del catálogo).
- Backend real, base de datos, API routes, autenticación real (OAuth, hashing de contraseñas, sesiones de servidor).
- Persistencia real de puntuaciones entre dispositivos/usuarios (solo `localStorage` del navegador).
- Sistema de créditos/monedas funcional (el contador es decorativo, fijo en 03).
- Internacionalización (todo el copy queda en español, igual que el prototipo).
- Tests automatizados.

## Modelo de datos

Estructuras TypeScript en `lib/data.ts` (mock, sin backend), portadas desde `data.jsx`:

```ts
type GameCategory = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";

interface Game {
  id: string;
  title: string;
  short: string;
  long: string;
  cat: GameCategory;
  cover: string;   // clase CSS de portada, p.ej. "cover-bricks"
  color: "cyan" | "magenta" | "yellow" | "green";
  best: number;
  plays: string;
}

interface ScoreRow {
  rank: number;
  name: string;
  score: number;
  date: string; // dd/mm/aaaa
}

const GAMES: Game[];
const CATS: readonly ["TODOS", "ARCADE", "PUZZLE", "SHOOTER", "VERSUS"];
const PLAYERS: readonly string[];
function seededScores(seed: number, count?: number): ScoreRow[];
```

Estado de sesión y puntuaciones en `localStorage` (mismas claves que el prototipo):

```ts
interface StoredUser { name: string }
// localStorage["av_user"] = StoredUser | null

interface StoredScoreEntry { game: string; score: number; name: string; at: number }
// localStorage["av_scores"] = StoredScoreEntry[]
```

## Plan de implementación

1. **Datos mock tipados.** Crear `lib/data.ts` con `Game`, `ScoreRow`, `GAMES`, `CATS`, `PLAYERS`, `seededScores`, portando `data.jsx` 1:1.
2. **Estilos base.** Completar `app/globals.css` con todas las clases de `styles.css` que aún falten (navbar, botones, hero, grid/cards, portadas `.cover-*`, detalle, player/CRT, modal, auth, salón, media queries, animaciones). Añadir `av-bg` y `av-noise` como elementos fijos en `app/layout.tsx`.
3. **Layout y Nav.** Actualizar `app/layout.tsx` para envolver `children` con fondo (`av-bg`, `av-noise`), `Nav` (client component en `components/nav.tsx`) y footer, usando `localStorage` para leer/limpiar `av_user`. `Nav` recibe la ruta activa vía `usePathname()`.
4. **Biblioteca (`/`).** `app/page.tsx`: hero, buscador, chips de categoría y `av-grid` con `GameCard` (`components/game-card.tsx`, client component por el tilt on mouse-move). Filtro por texto + categoría en cliente.
5. **Detalle de juego (`/juego/[id]`).** `app/juego/[id]/page.tsx` con `PageProps<"/juego/[id]">`: portada, tags, descripción, stats, leaderboard (`seededScores`), botones "JUGAR AHORA" (→ `/juego/[id]/jugar`) y "VOLVER AL VAULT". `notFound()` si el id no existe en `GAMES`.
6. **Reproductor (`/juego/[id]/jugar`).** `app/juego/[id]/jugar/page.tsx` (client component): HUD, CRT visual con arena decorativa, simulación de score con `setInterval`, pausa, fin de partida, modal para guardar puntuación (push a `av_scores` en `localStorage`), botones "JUGAR DE NUEVO" / "VOLVER AL VAULT" / "SALIR".
7. **Salón de la Fama (`/salon`).** `app/salon/page.tsx` (client component): tabs por juego, podio top 3, tabla completa vía `seededScores`, fila "tu mejor marca" si hay `av_user` en `localStorage`.
8. **Auth (`/auth`).** `app/auth/page.tsx` (client component): tabs "iniciar sesión"/"crear cuenta", formulario controlado, botón "jugar como invitado", botones sociales decorativos. Al enviar, guarda `av_user` en `localStorage` y redirige a `/`.
9. **Verificación visual manual.** Levantar `npm run dev`, recorrer las 5 rutas, validar navegación, estados responsive (mobile/desktop) y que el flujo login → biblioteca → detalle → jugar → fin de partida → salón funciona visualmente de punta a punta.

## Criterios de aceptación

- [ ] `npm run build` compila sin errores de TypeScript ni de rutas.
- [ ] Existen las 5 rutas (`/`, `/juego/[id]`, `/juego/[id]/jugar`, `/salon`, `/auth`) y todas son alcanzables por navegación real (sin hash routing).
- [ ] `/juego/id-inexistente` devuelve 404 (`notFound()`).
- [ ] La barra de navegación muestra "Iniciar Sesión" sin usuario y `{nombre} ▾` con usuario logueado; el botón de logout limpia `av_user` de `localStorage`.
- [ ] En `/auth`, iniciar sesión o continuar como invitado redirige a `/` y persiste (o no, en el caso invitado) `av_user` en `localStorage`.
- [ ] En `/`, buscar por texto y filtrar por categoría reduce correctamente el grid de tarjetas; sin resultados muestra el estado vacío "NO HAY RESULTADOS".
- [ ] En `/juego/[id]`, "JUGAR AHORA" navega a `/juego/[id]/jugar`.
- [ ] En `/juego/[id]/jugar`, el score sube solo, pausa detiene el incremento, "FIN" abre el modal, guardar puntuación agrega una entrada a `av_scores` en `localStorage` y muestra el toast "PUNTUACIÓN GUARDADA_".
- [ ] En `/salon`, cambiar de tab cambia el juego mostrado en podio y tabla; con usuario logueado aparece la fila "tu mejor marca".
- [ ] El diseño visual (colores neón, tipografía pixel/mono, CRT, scanlines, grid de fondo) se ve equivalente al prototipo HTML de `references/templates/Arcade Vault.html` en escritorio y en móvil (<840px).
- [ ] Ningún juego tiene lógica jugable real (sin input de teclado/táctil que controle nada dentro del "arena" del reproductor).

## Decisiones tomadas

- **CSS tal cual, no reescritura en utilidades Tailwind:** prioriza fidelidad visual del prototipo pixel/neón y velocidad de entrega sobre "pureza" Tailwind. Tailwind v4 solo aporta el import base y el mapeo de tokens (`@theme inline`), no reemplaza las clases custom.
- **App Router real con rutas por carpeta**, no el hash-routing SPA del prototipo, porque el proyecto ya está configurado como Next.js App Router y las rutas reales dan URLs compartibles y alineadas con `LayoutProps`/`PageProps` generados.
- **`localStorage` como única "persistencia"**, igual que el prototipo: no hay backend en este MVP, es consistente con "solamente la parte visual".
- **`seededScores` se mantiene como generador pseudo-aleatorio determinista** portado a TS, en vez de datos fijos, para no perder la variedad de leaderboards que ya tenía el prototipo.
- **Reproductor conserva la simulación de score automática** (no una pantalla estática) porque es la única forma de mostrar el modal de fin de partida y el flujo de guardado sin implementar un juego real.
- **Elementos decorativos sin función real se mantienen** (créditos fijos, botones sociales) porque el spec es explícitamente "solo la parte visual".
- **Fuentes y variables de tema (`--font-pixel`, `--font-mono`, `@theme inline`) no se reinventan**: ya existen en `app/layout.tsx` y `app/globals.css` desde el commit previo del proyecto; este spec solo completa las clases de pantalla que faltan.

## Riesgos identificados

- El componente `GameCard` usa manipulación directa de `ref.current.style.transform` en `onMouseMove` (efecto tilt 3D); al portar a TS hay que tipar el `ref` como `HTMLDivElement | null` y guardar el patrón "no-op en touch" del original.
- `seededScores` y otras piezas que dependen de `Math.random`/hash de `id` deben ejecutarse solo en cliente o ser deterministas en servidor y cliente para evitar mismatches de hidratación; usar `"use client"` en las pantallas que las consumen (igual que hacía el prototipo, que era 100% cliente).
- Lectura de `localStorage` en el primer render (`av_user`) puede causar flash/mismatch de hidratación si se hace en un server component; debe leerse en un `useEffect` o en un client component, como ya lo hacía el prototipo con `useState(() => ...)`.
