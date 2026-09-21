# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Arcade Vault: an online platform to play games and compete for the highest score. The repo is currently a fresh Create Next App scaffold (only `app/layout.tsx`, `app/page.tsx`, `app/globals.css`), so most architecture is still to be built.

Development follows Spec Driven Design using the `/spec` and `/spec-impl` skills from https://github.com/Klerith/fernando-skills (install: `npx skills@latest add Klerith/fernando-skills`). Write a spec before implementing a feature.

## Skills
Usa siempre /frontend-desing para diseñar la interfaz de usuario.

## Playwright

Graba todos los screenshots de Playwright en `.playwright/screenshots`.

## Stack notes

- Next.js 16.3 App Router, React 19.2, TypeScript strict. Next 16 differs from older versions: check `node_modules/next/dist/docs/` (`01-app/`, `03-architecture/`, …) before using any Next API.
- Route props use the global generated types (for example `LayoutProps<"/">` in `app/layout.tsx`) rather than hand-written prop interfaces.
- Tailwind CSS v4 via `@tailwindcss/postcss`. There is no `tailwind.config`: theme tokens live in `app/globals.css` under `@theme inline`, mapped from CSS variables (`--background`, `--foreground`, Geist font variables), with dark mode driven by `prefers-color-scheme`.
- Import alias `@/*` resolves to the repo root.
