# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Dev server:** `yarn dev` (uses Next.js Turbopack)
- **Build:** `yarn build`
- **Type check:** `npx tsc --noEmit`
- **Lint (with autofix):** `yarn lint`
- **Package manager:** Yarn (lockfile: `yarn.lock`)

## Architecture

SugarCoach — AI-powered diabetes management app for kids/young people. Next.js 15 (App Router) + HeroUI v2 + Tailwind CSS v4 + TypeScript + Supabase + Google Gemini.

### Tech stack
- **Frontend**: Next.js 15, HeroUI v2, Tailwind CSS v4, Framer Motion, Recharts
- **AI**: Google Gemini SDK (`@google/generative-ai`) — Flash for chat/voice/images, Pro for diet plans, Flash Lite for simple tasks (A1C estimation)
- **Database/Auth**: Supabase (PostgreSQL + Auth + Row Level Security)
- **State**: Zustand for client state, Server Actions for mutations
- **Icons**: HugeIcons (`@hugeicons/react` + `@hugeicons/core-free-icons`)

### Key structure

- `app/(auth)/` — Login/register pages (public)
- `app/(dashboard)/` — Protected app pages with shared sidebar/bottom-nav layout
- `app/api/` — API routes (chat, voice, analyze-food, search-food, diet-plan, import)
- `components/` — Feature-grouped: `chat/`, `log/`, `tracking/`, `diet/`, `import/`, `gamification/`, `profile/`, `pantry/`, `home/`, `ui/`
- `lib/actions/` — Server actions for all data mutations (auth, log, tracking, diet, gamification, pantry, a1c, chat-log, profile)
- `lib/supabase/` — Three clients: `client.ts` (browser), `server.ts` (server components/actions), `middleware.ts` (auth session refresh)
- `lib/gemini/` — `client.ts` (model factories), `prompts.ts` (system prompts), `parse-response.ts` (structured data extraction)
- `lib/import/` — CGM parsers (Libre, Dexcom, MySugr) and normalizer
- `lib/gamification/` — XP, streaks, achievement engine
- `lib/stores/` — Zustand stores
- `config/site.ts` — Site name and description
- `config/fonts.ts` — Google fonts: Comic Neue (sans/body), Baloo 2 (display/headings), Fira Code (mono)
- `types/` — Shared TypeScript types including `database.ts` for Supabase schema types
- `supabase/migrations/` — Database schema SQL (run in order: 001_initial_schema, 002_seed_achievements, 003_pantry_items)
- `hero.ts` — HeroUI theme config (colors, radii) — loaded as Tailwind plugin

### Data flow patterns

- **Chat → Structured Data → Confirm → Save**: User sends natural language to `/api/chat`, Gemini returns text with embedded structured JSON blocks, `parse-response.ts` extracts typed records (blood_sugar, insulin, meal), UI shows confirmation cards, user confirms to persist via server actions.
- **Server Actions**: All database mutations go through `lib/actions/`. Each action creates a Supabase server client via `createClient()` from `lib/supabase/server.ts`, authenticates the user, then performs the operation.
- **Auth flow**: Supabase middleware (`middleware.ts` → `lib/supabase/middleware.ts`) refreshes sessions on every request. Public paths: `/`, `/login`, `/register`. All dashboard paths require authentication. Authenticated users are redirected away from auth pages to `/home`.

### Key concepts
- **Unstructured → Structured**: User texts/speaks naturally, Gemini parses into typed records (blood sugar, insulin, meal), user confirms before saving
- **Insulin-to-carb ratio**: Users set their ratio in profile; app calculates recommended insulin per meal
- **Gamification**: XP points, levels, daily streaks, achievements — all awarded on log actions
- **Family members**: Users can add family members to view/edit their tracking data
- **CGM imports**: Libre FreeStyle CSV, Dexcom CSV, MySugr CSV/Excel — parsed and normalized into blood_sugar_readings

### Tailwind CSS v4 setup

Tailwind v4 is configured through `styles/globals.css` (no `tailwind.config.ts`). It uses:
- `@plugin '../hero.ts'` — loads HeroUI theme plugin with custom warm color palette (primary: `#F5A623` amber, secondary: `#F06418` orange)
- `@source` directive to include HeroUI theme classes
- `@custom-variant dark` for dark mode via class strategy
- PostCSS via `@tailwindcss/postcss` plugin
- Custom CSS animations defined in `globals.css`: `animate-float`, `animate-float-slow`, `animate-pulse-glow`, streak glow effects
- Custom font variables: `--font-sans` (Comic Neue), `--font-display` (Baloo 2), `--font-mono` (Fira Code)

### Path aliases

`@/*` maps to the project root (configured in `tsconfig.json`). Use `@/components/...`, `@/config/...`, etc.

### ESLint rules to note

- Import ordering enforced: type imports first, then builtin/external/internal/parent/sibling/index, with blank lines between groups.
- JSX props must be sorted alphabetically with callbacks last and reserved props first.
- Unused imports are auto-removed on lint fix.
- `no-console` is a warning.
- Blank line required before `return` statements and after variable declarations.

### Environment variables

Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (server-side only)
- `GEMINI_API_KEY` — Google AI Studio API key

### Gemini model selection

Defined in `lib/gemini/client.ts`:
- `getFlashModel()` — `gemini-3-flash-preview` for chat, voice, vision (multimodal)
- `getProModel()` — `gemini-3.1-pro-preview` for complex reasoning (diet plans, analysis)
- `getFlashLiteModel()` — `gemini-3.1-flash-lite-preview` for cheap/fast tasks (A1C estimation)
