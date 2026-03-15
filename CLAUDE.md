# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Dev server:** `yarn dev` (uses Next.js Turbopack)
- **Build:** `yarn build`
- **Start production:** `yarn start`
- **Lint (with autofix):** `yarn lint`
- **Package manager:** Yarn (lockfile: `yarn.lock`)

## Architecture

SugarCoach — AI-powered diabetes management app for kids/young people. Next.js 15 (App Router) + HeroUI v2 + Tailwind CSS v4 + TypeScript + Supabase + Google Gemini.

### Tech stack
- **Frontend**: Next.js 15, HeroUI v2, Tailwind CSS v4, Framer Motion, Recharts
- **AI**: Google Gemini SDK (`@google/generative-ai`) — Flash for chat/voice/images, Pro for diet plans
- **Database/Auth**: Supabase (PostgreSQL + Auth + Storage)
- **State**: Zustand for client state, Server Actions for mutations

### Key structure

- `app/(auth)/` — Login/register pages (public)
- `app/(dashboard)/` — Protected app pages (chat, log, tracking, diet, import, profile, achievements)
- `app/api/` — API routes for Gemini chat, voice, food analysis, diet plans, CGM import
- `components/chat/` — Chat interface components (bubbles, input, voice recorder, structured data cards)
- `components/log/` — Manual logging form components
- `components/tracking/` — Charts and tracking visualizations
- `components/diet/` — Diet plan components
- `components/import/` — CGM file import components
- `components/gamification/` — XP bar, streaks, achievements, celebrations
- `components/profile/` — Profile and family member components
- `components/ui/` — Shared UI components (sidebar, stat cards, animated counter)
- `lib/supabase/` — Supabase client (browser + server) and middleware
- `lib/gemini/` — Gemini client, system prompts, response parsing
- `lib/import/` — CGM parsers (Libre, Dexcom, MySugr) and normalizer
- `lib/gamification/` — XP, streaks, achievement engine
- `lib/actions/` — Server actions for all data mutations
- `lib/stores/` — Zustand stores
- `config/site.ts` — Central site config: nav items, menu items
- `config/fonts.ts` — Google font definitions (Inter sans, Fira Code mono)
- `types/` — Shared TypeScript types including database types
- `supabase/migrations/` — Database schema SQL

### Key concepts
- **Unstructured → Structured**: User texts/speaks naturally, Gemini parses into typed records (blood sugar, insulin, meal), user confirms before saving
- **Insulin-to-carb ratio**: Users set their ratio in profile; app calculates recommended insulin per meal
- **Gamification**: XP points, levels, daily streaks, achievements — all awarded on log actions
- **Family members**: Users can add family members to view/edit their tracking data
- **CGM imports**: Libre FreeStyle CSV, Dexcom CSV, MySugr CSV/Excel — parsed and normalized into blood_sugar_readings

### Tailwind CSS v4 setup

Tailwind v4 is configured through `styles/globals.css` (no `tailwind.config.ts`). It uses:
- `@plugin '../hero.ts'` — loads HeroUI theme plugin
- `@source` directive to include HeroUI theme classes
- `@custom-variant dark` for dark mode via class strategy
- PostCSS via `@tailwindcss/postcss` plugin

### Path aliases

`@/*` maps to the project root (configured in `tsconfig.json`). Use `@/components/...`, `@/config/...`, etc.

### ESLint rules to note

- Import ordering enforced: type imports first, then builtin/external/internal/parent/sibling/index, with blank lines between groups.
- JSX props must be sorted alphabetically with callbacks last and reserved props first.
- Unused imports are auto-removed on lint fix.
- `no-console` is a warning.
- Blank line required before `return` statements and after variable declarations.
