# SPEC 03 — Página "Acerca de" y envío de correo de contacto con Resend

**Estado:** Aprobado
**Depende de:** SPEC 02
**Fecha:** 2026-09-21

**Objetivo:** Implementar la ruta `/acerca-de` (contenido idéntico a `references/templates/home-about/about.jsx`) con un formulario de contacto que envía un correo real al admin mediante Resend, y activar el enlace "Acerca de" en la nav.

## Alcance

**Dentro:**
- Nueva ruta `app/acerca-de/page.tsx`, portando íntegro el JSX de `references/templates/home-about/about.jsx`: sección hero "ACERCA DE ARCADE VAULT" con `highlight-row` (3 tarjetas: HEART, BROWSER, PLANT), divisor animado (`about-divider`), y sección de contacto (`about-contact`) con formulario (nombre, correo, mensaje).
- Animación `.reveal`/`IntersectionObserver` del prototipo, portada como en Inicio (SPEC 02), en un client component.
- Componente `HighlightIcon` (SVG inline de HEART/BROWSER/PLANT) portado tal cual a TSX.
- `app/api/contacto/route.ts`: API route POST que recibe `{ name, email, msg }`, valida en servidor, y envía un correo vía Resend SDK a `ADMIN_EMAIL` con el contenido del formulario.
- Instalar dependencia `resend` (SDK oficial).
- Variables de entorno `RESEND_API_KEY` y `ADMIN_EMAIL` leídas server-side en el API route; se documentan en `.env.example` (nuevo archivo, sin valores reales).
- Remitente (`from`) del correo usa el dominio de pruebas `onboarding@resend.dev` (no requiere dominio verificado).
- Validación en cliente (igual al prototipo: shake si algún campo está vacío) y validación en servidor (campos no vacíos, `email` con formato válido vía regex simple) antes de llamar a Resend.
- Estado de éxito del formulario: terminal simulada (`terminal-success`) igual al prototipo, mostrada solo si el API route responde OK.
- Estado de error: si el API route falla (red, validación de servidor, error de Resend), se muestra un mensaje de error inline debajo del formulario (no se limpia el formulario, el usuario puede reintentar).
- `components/nav.tsx`: reemplazar el `<span className="disabled">Acerca de</span>` (desktop y panel móvil) por `Link href="/acerca-de"` con estado activo (`isActive("about")` cuando `pathname === "/acerca-de"`).
- Estilos: agregar a `app/globals.css` las clases `.about-*`, `.highlight*`, `.contact-*`, `.terminal-success`, `.term-*`, `@keyframes shake`, `@keyframes pxblink` portadas desde `references/templates/home-about/styles.css`.

**Fuera de este spec (no se implementa):**
- Auto-respuesta por correo al usuario que llena el formulario (solo se notifica al admin).
- Persistencia de los mensajes de contacto en base de datos o archivo (el correo es la única "persistencia").
- Verificación de dominio propio en Resend (se usa el dominio de pruebas de Resend).
- Rate limiting o protección anti-spam (captcha, honeypot) del formulario de contacto.
- Internacionalización o cambios de copy respecto al prototipo.

## Modelo de datos

No se introduce persistencia nueva (no hay base de datos ni `localStorage` para el formulario). El único "dato" nuevo es el payload en memoria de la petición POST a `/api/contacto`:

```ts
type ContactPayload = {
  name: string;
  email: string;
  msg: string;
};
```

Este payload no se guarda; solo se usa para construir el cuerpo del correo enviado por Resend.

## Plan de implementación

1. **Instalar Resend.** `npm install resend`.
2. **Variables de entorno.** Crear `.env.example` con `RESEND_API_KEY=` y `ADMIN_EMAIL=` (sin valores reales, documentando que van en `.env.local`, que el usuario debe crear con su propia API key de Resend).
3. **API route.** Crear `app/api/contacto/route.ts` (`POST`): valida `name`/`email`/`msg` no vacíos y formato de `email`; si falla, responde 400 con `{ error }`. Si es válido, usa el SDK `Resend` con `RESEND_API_KEY` para enviar un correo desde `onboarding@resend.dev` a `process.env.ADMIN_EMAIL`, asunto `Nuevo mensaje de contacto — Arcade Vault`, cuerpo con nombre/correo/mensaje. Responde 200 `{ ok: true }` en éxito, 500 `{ error }` si Resend falla.
4. **Componente de página.** Crear `app/acerca-de/page.tsx` como client component, portando el JSX de `about.jsx` (hero, highlights, divisor, formulario, `HighlightIcon`) a TSX, con estado de formulario (`form`, `sent`, `shake`, nuevo estado `error: string | null`). `onSubmit` hace `fetch("/api/contacto", { method: "POST", body: JSON.stringify(form) })`; en éxito setea `sent`; en fallo setea `error` con mensaje inline y no limpia el formulario.
5. **Estilos.** Añadir a `app/globals.css` las clases `.about-*`, `.highlight*`, `.contact-*`, `.terminal-success`, `.term-*` y las animaciones `shake`/`pxblink` desde `references/templates/home-about/styles.css`; agregar una clase nueva `.form-error` (texto de error inline, estilo consistente con `--ink-dim`/rojo de acento del tema) ya que el prototipo no la define.
6. **Activar nav.** Editar `components/nav.tsx`: reemplazar los dos `<span className="disabled">Acerca de</span>` (desktop y móvil) por `<Link href="/acerca-de">`, agregar `"about"` a `isActive` (`pathname === "/acerca-de"`).
7. **Verificación manual.** Levantar `npm run dev`, configurar `.env.local` con una API key real de Resend, navegar a `/acerca-de` desde nav (desktop y móvil), enviar el formulario con datos válidos y confirmar que llega el correo a `ADMIN_EMAIL`, verificar el estado de éxito (terminal), probar el estado de error (ej. quitando temporalmente la API key) y el shake de validación con campos vacíos.

## Criterios de aceptación

- [ ] `npm run build` compila sin errores de TypeScript ni de rutas.
- [ ] `/acerca-de` muestra hero, `highlight-row` (3 tarjetas), divisor animado y sección de contacto, visualmente equivalente a `about.jsx` + estilos portados.
- [ ] La nav (desktop y panel móvil) muestra "Acerca de" como enlace activo (no deshabilitado) que navega a `/acerca-de`, y aparece resaltado como activo en esa ruta.
- [ ] Enviar el formulario con nombre, correo y mensaje válidos dispara un POST a `/api/contacto` y llega un correo real a `ADMIN_EMAIL` vía Resend.
- [ ] Enviar el formulario con algún campo vacío dispara el shake y NO llama a `/api/contacto`.
- [ ] Si `/api/contacto` responde error (validación de servidor o fallo de Resend), se muestra un mensaje de error inline, el formulario no se limpia y el usuario puede reintentar.
- [ ] Al enviar con éxito se muestra el estado `terminal-success` con el nombre del remitente, igual al prototipo.
- [ ] `RESEND_API_KEY` y `ADMIN_EMAIL` nunca se exponen al cliente (solo se usan dentro de `app/api/contacto/route.ts`).
- [ ] Existe `.env.example` documentando `RESEND_API_KEY` y `ADMIN_EMAIL` sin valores reales.

## Decisiones tomadas

- **Solo notificación al admin, sin auto-reply al usuario**: mantiene el alcance simple (una sola llamada a Resend); el usuario pidió explícitamente no complicar con auto-respuesta.
- **Remitente `onboarding@resend.dev`** (dominio de pruebas de Resend) en vez de dominio propio verificado: evita el paso de verificación DNS, ya que no hay dominio propio disponible todavía.
- **Validación en cliente y servidor**: el cliente conserva el shake del prototipo para feedback inmediato; el servidor no confía ciegamente en el payload antes de gastar una llamada a Resend.
- **API route dedicado (`app/api/contacto/route.ts`) en vez de Server Action**: mantiene la API key de Resend estrictamente server-side y sigue el patrón estándar de Next.js App Router para este tipo de integración.
- **Error de envío se muestra como mensaje inline**, no como el shake reutilizado de validación: son casos distintos (validación de cliente vs. fallo real de envío) y el usuario prefirió una señal más clara.
- **"Acerca de" se activa en nav en este spec**: reemplaza el placeholder deshabilitado de SPEC 02, ya que ahora la página existe.

## Riesgos identificados

- El envío de correo depende de que el usuario configure `RESEND_API_KEY` válida en `.env.local`; sin eso, el flujo de contacto siempre caerá en el estado de error (comportamiento esperado, no es un bug).
- El dominio de pruebas `onboarding@resend.dev` de Resend puede tener límites de envío o filtrarse a spam más fácilmente que un dominio propio verificado; aceptable para esta fase.
- El componente de página debe ser client component (`"use client"`) por el uso de `useState`/`useEffect`/`IntersectionObserver`, igual que Inicio en SPEC 02, para evitar mismatches de hidratación.
