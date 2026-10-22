# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Proyecto

Juego de Arkanoid en HTML, CSS y JavaScript puro — sin dependencias, cero frameworks. Se abre directamente en el navegador (`open index.html`).

## Desarrollo

No hay paso de build ni servidor requerido. Para probar cambios: `open index.html`.

## Flujo de trabajo spec-driven

Este proyecto usa desarrollo guiado por specs. **No escribir código sin spec aprobada.**

### Comandos

| Comando | Acción |
|---|---|
| `/spec [descripción]` | Diseña una spec nueva haciendo preguntas primero. Guarda en `specs/NN-slug.md` con estado `Draft`. |
| `/spec-impl NN-slug` | Implementa la spec aprobada paso a paso, creando rama `spec-NN-slug` y pausando tras cada paso. |

### Ciclo de vida de una spec

```
Draft → Approved → Implementado
               ↘ Obsoleto
```

El estado se cambia **manualmente** antes de ejecutar `/spec-impl`. Nunca implementar una spec en estado `Draft`.

### Estructura de una spec (`specs/NN-slug.md`)

```markdown
# NN — Título breve

- **Estado:** Draft | Approved | Implementado | Obsoleto
- **Fecha:** YYYY-MM-DD
- **Dependencias:** specs previas requeridas
- **Objetivo:** una sola frase

## Alcance
## Modelo de datos
## Plan de implementación   ← pasos numerados, cada uno commiteable
## Criterios de aceptación  ← checklist booleano
## Decisiones               ← qué se consideró y por qué
## Qué NO incluye este spec
```

La referencia completa está en `.agents/skills/spec/template.md`.
