# SPEC 02 — Página de Inicio y tab "Acerca de" desactivado

**Estado:** Implementado
**Depende de:** SPEC 01
**Fecha:** 2026-09-20

**Objetivo:** Convertir la ruta `/` en una landing page de Inicio (portada desde `references/templates/home-about/home.jsx`), mover la Biblioteca actual a `/biblioteca`, y agregar un tab "Acerca de" en la nav que se muestra desactivado sin funcionalidad todavía.

## Alcance

**Dentro:**
- Nueva ruta `/` = página de Inicio, portando las 6 secciones de `home.jsx`: Hero, "Por qué Arcade Vault", "Juegos disponibles ahora" (preview de 6 juegos), Stats, Actividad en vivo, Precios, CTA final.
- Nueva ruta `/biblioteca` = contenido actual de `app/page.tsx` (hero de biblioteca, buscador, chips de categoría, grid de `GameCard`) movido tal cual.
- `components/nav.tsx` actualizado: tabs en orden **Inicio, Biblioteca, Salón de la Fama, Acerca de**, tanto en `av-nav` (desktop) como en el panel móvil.
- "Acerca de" se renderiza como botón/enlace visualmente desactivado (estilo disabled, sin `href` funcional, sin `onClick`, sin ruta destino).
- Estado activo de nav: "Inicio" activo en `/`, "Biblioteca" activo en `/biblioteca` y en `/juego/*`, "Salón de la Fama" activo en `/salon`.
- Componentes nuevos para Inicio, portados de `home.jsx`: `FloatingSilhouettes`, `FeatureIcon`, `MiniCard` (equivalente visual a `GameCard` pero compacto, usado en el rail de juegos).
- Estilos: se agregan a `app/globals.css` todas las clases `.home-*` necesarias (hero, secciones, grid de features, rail de juegos, stats, actividad, pricing, CTA final) portadas desde `references/templates/home-about/styles.css`.
- Actualización de enlaces internos que hoy apuntan a `/` con intención de "volver a la biblioteca": `app/juego/[id]/page.tsx` (botón "VOLVER AL VAULT"), `app/salon/page.tsx` (botón inferior), `app/juego/[id]/jugar/page.tsx` (botón "VOLVER AL VAULT" del modal) → pasan a apuntar a `/biblioteca`.
- Redirección post-login/invitado en `app/auth/page.tsx` (`router.push("/")`) → pasa a `/biblioteca`.
- Logo de la nav (`components/nav.tsx`) sigue apuntando a `/` (ahora Inicio).
- Botones de la página de Inicio que en `home.jsx` navegan a `biblioteca`/`auth`/`salon`/`detalle` se mapean a `next/link`/`router.push` reales: `/biblioteca`, `/auth`, `/salon`, `/juego/[id]`.

**Fuera de este spec (no se implementa):**
- Página o ruta "Acerca de" funcional (contenido de `about.jsx`). Solo el botón desactivado en nav.
- Lógica de "primera visita" con `localStorage`/flags: Inicio es simplemente la página servida en `/` para cualquier visitante, siempre.
- Cambios a los datos mock (`lib/data.ts`) más allá de reutilizar `GAMES` existente para el rail de juegos.
- Cualquier funcionalidad nueva de autenticación, puntuaciones o juegos jugables (fuera del alcance, ya cubierto o no por SPEC 01).

## Modelo de datos

No se introducen estructuras de datos nuevas. La sección "Juegos disponibles ahora" de Inicio reutiliza `GAMES` desde `lib/data.ts` (ya existente de SPEC 01), tomando los primeros 6 con `GAMES.slice(0, 6)`. Las secciones de Stats, Actividad en vivo y Precios usan los mismos datos estáticos/hardcodeados que trae `home.jsx` (no se persisten ni se leen de `lib/data.ts`).

## Plan de implementación

1. **Mover Biblioteca.** Crear `app/biblioteca/page.tsx` con el contenido íntegro actual de `app/page.tsx` (hero, buscador, chips, grid, estado vacío), sin cambios de lógica.
2. **Componentes de Inicio.** Crear `components/home/floating-silhouettes.tsx`, `components/home/feature-icon.tsx` y `components/home/mini-card.tsx`, portando el JSX de `home.jsx` a TSX tipado (props tipadas con `Game` de `lib/data.ts` donde aplique).
3. **Página de Inicio.** Reescribir `app/page.tsx` como client component con las 6 secciones de `home.jsx`, usando los componentes del paso 2, `GAMES.slice(0, 6)` para el rail, y `next/link`/`useRouter` en vez de la prop `navigate` del prototipo (mapeo: `biblioteca`→`/biblioteca`, `auth`→`/auth`, `salon`→`/salon`, `detalle`+`id`→`/juego/${id}`).
4. **Estilos de Inicio.** Añadir a `app/globals.css` las clases `.home-*` (hero, silhouettes, feature-grid, mini-rail/mini-card, stats, activity-grid, pricing, final CTA) portadas desde `references/templates/home-about/styles.css`.
5. **Nav.** Actualizar `components/nav.tsx`: agregar tabs "Inicio" (`/`, antes del resto) y "Acerca de" (al final, desactivado) en `av-nav` y en el panel móvil; ajustar `isActive` para que "Inicio" solo esté activo en `/` y "Biblioteca" lo esté en `/biblioteca` y `/juego/*`.
6. **Actualizar enlaces internos.** Cambiar a `/biblioteca` los `href`/`router.push` de: `app/juego/[id]/page.tsx`, `app/salon/page.tsx`, `app/juego/[id]/jugar/page.tsx`, `app/auth/page.tsx` (los que hoy apuntan a `/` con intención de biblioteca).
7. **Verificación visual manual.** Levantar `npm run dev`, revisar `/` (Inicio), `/biblioteca`, nav en desktop y móvil, estado activo de cada tab, botón "Acerca de" desactivado, y que los flujos de navegación (Inicio→Biblioteca, Inicio→detalle de juego, Inicio→Salón, Inicio→Auth, login→Biblioteca) funcionan sin roturas.

## Criterios de aceptación

- [x] `npm run build` compila sin errores de TypeScript ni de rutas.
- [x] `/` muestra la página de Inicio (hero, features, rail de juegos, stats, actividad en vivo, precios, CTA final) para cualquier visitante, sin lógica de "primera visita".
- [x] `/biblioteca` muestra el mismo contenido y comportamiento (buscador, filtro por categoría, grid) que antes tenía `/`.
- [x] La nav muestra los tabs en orden Inicio, Biblioteca, Salón de la Fama, Acerca de, tanto en desktop como en el panel móvil.
- [x] "Acerca de" se ve visualmente desactivado y no navega a ningún lado al hacer clic.
- [x] "Inicio" aparece activo solo en `/`; "Biblioteca" aparece activo en `/biblioteca` y en `/juego/[id]`; "Salón de la Fama" aparece activo en `/salon`.
- [x] Desde Inicio, los botones "EXPLORAR JUEGOS"/"VER TODOS LOS JUEGOS" navegan a `/biblioteca`; "CREAR CUENTA"/"EMPEZAR GRATIS" navegan a `/auth`; "VER SALÓN" navega a `/salon`; las `MiniCard` del rail navegan a `/juego/[id]`.
- [x] Los botones "VOLVER AL VAULT" (detalle de juego, reproductor) y el botón inferior de Salón navegan a `/biblioteca`.
- [x] Iniciar sesión o continuar como invitado en `/auth` redirige a `/biblioteca`.
- [x] El diseño visual de Inicio (siluetas flotantes, tipografía pixel/neón, CRT/scanlines de fondo) se ve equivalente a `home.jsx` + `references/templates/home-about/styles.css` en escritorio y en móvil (<840px).

## Decisiones tomadas

- **Inicio reemplaza la ruta raíz `/` y Biblioteca se mueve a `/biblioteca`**, en vez de agregar Inicio como ruta nueva aparte: así "Inicio aparece al navegar por primera vez al sitio" se cumple de forma directa (`/` es lo primero que carga cualquier visitante), sin lógica de detección de primera visita.
- **Sin lógica de "primera visita" vía `localStorage`**: se descartó por simplicidad; Inicio es simplemente el landing de `/` para todos los visitantes, siempre.
- **"Acerca de" es solo un botón desactivado en nav**, sin ruta ni componente de página: el usuario pidió explícitamente no implementar Acerca de todavía.
- **El logo de la nav sigue apuntando a `/`** (ahora Inicio, antes Biblioteca), consistente con el patrón estándar de "logo = home".
- **Se reutiliza `GAMES` de `lib/data.ts`** (SPEC 01) para el rail de juegos de Inicio en vez de duplicar datos, para mantener una sola fuente de verdad.
- **Las secciones de Stats/Actividad en vivo/Precios se portan con los mismos datos estáticos hardcodeados de `home.jsx`**, sin conectarlos a `lib/data.ts` ni a `localStorage`, porque son decorativas en el prototipo original y no formaban parte de este pedido.

## Riesgos identificados

- `FloatingSilhouettes` y las animaciones `reveal`/`IntersectionObserver` de `home.jsx` deben portarse como client component (`"use client"`) para evitar mismatches de hidratación, igual que ya ocurre con `Home`/`GameCard` en SPEC 01.
- Reutilizar el nombre `MiniCard` en vez de `GameCard` evita colisión de estilos si ambos coexisten en `app/globals.css`; hay que verificar que las clases `.mini-card`/`.mini-cover`/`.mini-meta` no choquen con `.card`/`.cover`/`.meta` ya existentes.
- Cambiar los destinos de "VOLVER AL VAULT" y el redirect de auth de `/` a `/biblioteca` es un cambio de comportamiento respecto a SPEC 01; si algún test o verificación manual futura asume que "volver" va a `/`, debe actualizarse.
