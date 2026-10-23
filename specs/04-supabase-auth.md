# SPEC 04 — Supabase: conexión y autenticación

**Estado:** Aprobado
**Depende de:** SPEC 01, SPEC 03
**Fecha:** 2026-10-23

**Objetivo:** Conectar la app a Supabase con clientes browser/server listos y reemplazar el usuario mock de `localStorage` (`av_user`) por Supabase Auth con email + contraseña, sin tocar la base de datos.

## Alcance

**Dentro:**

- Instalar `@supabase/ssr` y `@supabase/supabase-js`.
- Usar el proyecto remoto de Supabase `mqzsjcwwwaridghazjtq` (el mismo de `.mcp.json`).
- Variables de entorno `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` en `.env.local`, documentadas en `.env.example` sin valores reales.
- Clientes Supabase listos para uso futuro: `lib/supabase/client.ts` (`createBrowserClient`) y `lib/supabase/server.ts` (`createServerClient` con `cookies()` de `next/headers`). En este spec solo se usan para Auth; ninguna query a tablas.
- `proxy.ts` en la raíz (convención de Next 16, antes `middleware.ts`) que refresca la sesión de Supabase en cada request. No protege rutas.
- Página `/auth` (`app/auth/page.tsx`) con email + contraseña:
  - Tab "INICIAR SESIÓN": campos correo + contraseña (`signInWithPassword`).
  - Tab "CREAR CUENTA": campos usuario + correo + contraseña (`signUp` con `options.data.username`).
  - Validación de `username` en cliente: 3 a 16 caracteres.
  - Errores (credenciales inválidas, correo ya registrado, contraseña corta, username fuera de rango) se muestran inline en español con la clase `.form-error` de SPEC 03. El formulario no se limpia.
  - Botón submit deshabilitado mientras la petición está en curso.
  - Éxito en cualquiera de los dos tabs redirige a `/biblioteca`.
  - Usuario con sesión activa que visita `/auth` es redirigido a `/biblioteca`.
  - Botón "JUGAR COMO INVITADO" se mantiene y navega a `/biblioteca` sin sesión.
- Confirmación de email desactivada en el proyecto Supabase: la sesión inicia al registrarse.
- Nav (`components/nav.tsx`): muestra `user_metadata.username` en mayúsculas con sesión, y "Iniciar Sesión" sin sesión. "Salir" llama a `supabase.auth.signOut()`.
- Reproductor (`app/juego/[id]/jugar/page.tsx`):
  - Con sesión: HUD muestra el `username`. "Guardar puntuación" usa `addStoredScore` de `lib/storage.ts` con el `username` como `name`.
  - Sin sesión: HUD muestra `INVITADO`. La partida se juega, pero el score no se guarda. El botón de guardar se reemplaza por un enlace a `/auth`.
- Salón de la Fama (`app/salon/page.tsx`): la fila "TÚ" se muestra solo con sesión Supabase. Sus valores de rank y score siguen mock.
- `lib/storage.ts`: quitar la parte de usuario (`StoredUser`, `getStoredUser`, `setStoredUser`, `clearStoredUser`, clave `av_user`). Se mantiene la parte de scores (`StoredScoreEntry`, `getStoredScores`, `addStoredScore`, clave `av_scores`).

**Fuera de este spec (no se implementa):**

- Tablas, campos, vistas, funciones, triggers, políticas RLS o migraciones en la base de datos.
- Tipos TS generados del esquema (`lib/supabase/types.ts`).
- Leaderboard o ranking con datos reales. `/salon` y `/juego/[id]` siguen con `seededScores`.
- Puntuaciones en Supabase. Siguen en `localStorage` (`av_scores`).
- Username único.
- Login con username.
- OAuth (Google, GitHub). Los botones ghost actuales de `/auth` quedan sin funcionalidad.
- Magic link y recuperación de contraseña.
- Confirmación de email y ruta `/auth/callback`.
- Rutas protegidas.
- Endpoint de chequeo de conexión.
- Migración de datos viejos de `av_user`. Se ignoran.
- Edición de perfil.
- Supabase local con CLI y Docker.

## Modelo de datos

Sin cambios en la base de datos. Solo se usa el `user_metadata` que Supabase Auth ya provee:

```ts
// options.data enviado en signUp; Supabase lo guarda en user.user_metadata
type UserMetadata = {
  username: string; // 3 a 16 caracteres, validado en cliente
};
```

`lib/storage.ts` queda solo con:

```ts
interface StoredScoreEntry {
  game: string;
  score: number;
  name: string; // username de la sesión
  at: number;
}
// clave: "av_scores"
```

Conventions:

- `username` se guarda tal cual lo escribe el usuario. La UI lo muestra en mayúsculas.
- El nombre visible se lee de `user.user_metadata.username`. Si falta, se usa la parte local del correo.

## Plan de implementación

1. **Dependencias y env.** `npm install @supabase/ssr @supabase/supabase-js`. Agregar `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` vacías a `.env.example`. El usuario completa `.env.local` con los valores del proyecto `mqzsjcwwwaridghazjtq`.
2. **Clientes.** Crear `lib/supabase/client.ts` y `lib/supabase/server.ts`. Leer antes la guía de `cookies()` en `node_modules/next/dist/docs/`. La app sigue igual.
3. **Proxy.** Crear `proxy.ts` que refresca la sesión con `supabase.auth.getUser()`. Leer antes `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`. La app sigue igual.
4. **Configuración de Auth.** Desactivar "Confirm email" en el dashboard de Supabase. Paso manual del usuario.
5. **Página `/auth`.** Tab "in": correo + contraseña con `signInWithPassword`. Tab "up": usuario + correo + contraseña con `signUp`. Validar username en cliente. Mapear errores de Supabase a español con `.form-error`. Redirigir a `/biblioteca` en éxito o si ya hay sesión.
6. **Nav.** En `components/nav.tsx` reemplazar `getStoredUser`/`clearStoredUser` por `getUser` + `onAuthStateChange`. "Salir" llama a `signOut()`.
7. **Reproductor.** En `app/juego/[id]/jugar/page.tsx` reemplazar `getStoredUser` por la sesión Supabase. HUD con `username` o `INVITADO`. Invitado ve enlace a `/auth` en lugar de guardar.
8. **Salón.** En `app/salon/page.tsx` reemplazar `getStoredUser` por la sesión Supabase para mostrar u ocultar la fila "TÚ".
9. **Limpieza.** Quitar la parte de usuario de `lib/storage.ts`.

## Criterios de aceptación

- [ ] `npm run build` compila sin errores de TypeScript.
- [ ] `npm run lint` pasa sin errores.
- [ ] Existen `lib/supabase/client.ts`, `lib/supabase/server.ts` y `proxy.ts`.
- [ ] No existen `getStoredUser`, `setStoredUser`, `clearStoredUser` ni la clave `av_user` en el código.
- [ ] No existe carpeta `supabase/migrations/`. El esquema del proyecto `mqzsjcwwwaridghazjtq` no tiene tablas, vistas, triggers ni políticas nuevas.
- [ ] Crear cuenta con usuario + correo + contraseña válidos inicia sesión, guarda `username` en `user_metadata` y redirige a `/biblioteca`.
- [ ] Crear cuenta con correo ya registrado muestra mensaje inline en español y no limpia el formulario.
- [ ] Crear cuenta con username de menos de 3 o más de 16 caracteres muestra mensaje inline sin llamar a Supabase.
- [ ] Iniciar sesión con credenciales incorrectas muestra mensaje inline en español.
- [ ] Con sesión, la nav muestra el username en mayúsculas. Tras "Salir", muestra "Iniciar Sesión".
- [ ] Recargar la página mantiene la sesión.
- [ ] Visitar `/auth` con sesión activa redirige a `/biblioteca`.
- [ ] Sin sesión, el HUD muestra `INVITADO`, no aparece el botón de guardar y `av_scores` no cambia al terminar la partida.
- [ ] Con sesión, el HUD muestra el username y "guardar puntuación" agrega una entrada a `av_scores` con ese username.
- [ ] La fila "TÚ" del Salón aparece con sesión y no aparece sin sesión.
- [ ] `/salon` y `/juego/[id]` siguen mostrando `seededScores` sin cambios visuales.
- [ ] `.env.example` documenta `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` sin valores reales.

## Decisiones tomadas

- **Sí:** Auth + conexión a Supabase en un spec. La conexión sin Auth no aporta valor visible.
- **No:** tablas, campos, vistas, triggers, RLS o migraciones. Restricción explícita del usuario.
- **Sí:** clientes listos sin queries a tablas. Base para un spec futuro de puntuaciones.
- **No:** tipos generados del esquema. El esquema está vacío; se generan cuando existan tablas.
- **No:** endpoint de chequeo de conexión. Auth ya demuestra que la conexión funciona.
- **Sí:** `@supabase/ssr`. Librería oficial para App Router; maneja la sesión en cookies para server y proxy.
- **No:** solo `@supabase/supabase-js` en browser. No permite leer la sesión server-side.
- **Sí:** proyecto remoto `mqzsjcwwwaridghazjtq`. Ya está configurado en `.mcp.json`.
- **No:** Supabase local con CLI y Docker. Agrega infraestructura sin necesidad actual.
- **Sí:** email + contraseña. Encaja con el formulario actual sin providers externos.
- **No:** OAuth y magic link. Requieren configuración de providers o SMTP y ruta de callback.
- **Sí:** login con correo + contraseña. Supabase Auth autentica por correo.
- **No:** login con username. Requiere tabla o RPC para resolver el correo.
- **Sí:** `username` en `user_metadata`. No toca el esquema.
- **No:** tabla `profiles`. Requiere modificar la base de datos.
- **No:** username único. Sin tabla no hay constraint; se acepta en esta fase.
- **Sí:** confirmación de email desactivada. Evita SMTP y ruta de callback.
- **Sí:** scores siguen en `av_scores`; solo con sesión se guardan. Mantiene el reproductor sin base de datos.
- **No:** leaderboard real. Sin tabla de scores no hay datos globales.
- **Sí:** proxy solo refresca sesión. El modo invitado sigue funcionando en todas las rutas.
- **No:** proteger `/juego/[id]/jugar`. Eliminaría el modo invitado.
- **Sí:** quitar `av_user` sin migrar datos locales. Era mock.
- **Sí:** errores de `/auth` con `.form-error`. Reutiliza el patrón de SPEC 03.

## Riesgos identificados

| Riesgo                                                                                   | Mitigación                                                                  |
| ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Next 16 renombró `middleware.ts` a `proxy.ts`; ejemplos de Supabase usan `middleware.ts` | Leer `proxy.md` en `node_modules/next/dist/docs/` antes del paso 3.         |
| Confirm email activo por defecto en Supabase                                             | Paso 4 manual. Verificar antes de probar registro.                          |
| Dos usuarios pueden registrar el mismo username                                          | Aceptado. Unicidad va en el spec que agregue tabla de perfiles.             |
| `user_metadata` es editable por el propio usuario vía `updateUser`                       | Aceptado. Solo se usa para mostrar el nombre; no da permisos.               |
| `.env.local` sin las variables de Supabase rompe Auth                                    | Documentar en `.env.example`. Sin sesión, la app funciona en modo invitado. |
| Scores en `localStorage` no se comparten entre dispositivos                              | Aceptado. Igual que hoy; persistencia real va en otro spec.                 |

## Qué **no** entra en este spec

- Tablas, campos, vistas, triggers, RLS, migraciones y tipos generados.
- Leaderboard y puntuaciones en Supabase.
- Username único, login con username y edición de perfil.
- OAuth, magic link, recuperación de contraseña, confirmación de email.
- Rutas protegidas.
- Migración de datos de `localStorage`.

Cada uno de esos, si llega, va en su propio spec.
