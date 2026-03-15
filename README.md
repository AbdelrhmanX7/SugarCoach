# SugarCoach

AI-powered diabetes management app for kids and young people. Log blood sugar, insulin, and meals naturally through chat — SugarCoach parses your input and tracks everything for you.

## What It Does

- **Natural language logging** — Type "my blood sugar is 120" or "I took 5 units of NovoRapid" and the AI parses it into structured data
- **Food photo analysis** — Snap a photo of your meal, get instant carb/calorie/protein estimates
- **Voice input** — Speak your readings, the app transcribes and logs them
- **Blood sugar tracking** — Charts, time-in-range analysis, trend visualization
- **Diet plans** — AI-generated 7-day meal plans based on your diabetes profile and food preferences
- **CGM imports** — Import data from FreeStyle Libre, Dexcom, and MySugr
- **Smart pantry** — Track what food you have, get meal suggestions based on your inventory
- **Gamification** — XP, levels, streaks, and achievements to keep you motivated
- **Family sharing** — Add family members to view/manage diabetes data together
- **Insulin calculator** — Set your carb-to-insulin ratio, get dosing suggestions per meal

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, Turbopack) |
| UI | HeroUI v2 + Tailwind CSS v4 |
| Language | TypeScript |
| AI | Google Gemini (Flash for chat/vision, Flash Lite for simple tasks) |
| Database | Supabase (PostgreSQL + Auth + Row Level Security) |
| Auth | Supabase Auth (email/password) |
| State | Zustand (client), Server Actions (mutations) |
| Charts | Recharts |
| Animations | Framer Motion |

## Self-Deploy Guide

### Prerequisites

- Node.js 18+
- Yarn (`npm install -g yarn`)
- A [Supabase](https://supabase.com) account (free tier works)
- A [Google AI Studio](https://aistudio.google.com/apikey) API key (for Gemini)

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/SugarCoach.git
cd SugarCoach
yarn install
```

### 2. Set up Supabase

#### Option A: Supabase Cloud (recommended for production)

1. Create a new project at [supabase.com/dashboard](https://supabase.com/dashboard)
2. Go to **SQL Editor** and run the migration files in order:
   ```
   supabase/migrations/001_initial_schema.sql
   supabase/migrations/002_seed_achievements.sql
   supabase/migrations/003_pantry_items.sql
   ```
3. Go to **Settings > API** and copy your project URL and anon key

#### Option B: Local Supabase (for development)

```bash
# Install Supabase CLI
npm install -g supabase

# Start local Supabase (requires Docker)
supabase start

# Apply migrations
supabase db reset
```

The local instance runs at `http://127.0.0.1:54321` with default keys printed in the terminal.

### 3. Set up environment variables

Create a `.env.local` file in the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google Gemini
GEMINI_API_KEY=your-gemini-api-key
```

**Where to get these:**

| Variable | Where |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard > Settings > API > Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard > Settings > API > `anon` `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard > Settings > API > `service_role` key (keep secret!) |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey) > Create API Key |

### 4. Run the app

```bash
# Development
yarn dev

# Production build
yarn build
yarn start
```

The app runs at `http://localhost:3000`.

### 5. Create your first account

1. Go to `http://localhost:3000/register`
2. Create an account with email/password
3. Set up your diabetes profile (type, insulin method, targets)
4. Start logging through chat or the manual forms

## Deploying to Production

### Vercel (easiest)

1. Push your repo to GitHub
2. Import it on [vercel.com](https://vercel.com)
3. Add the environment variables from step 3 above
4. Deploy

### Other platforms

Any platform that supports Next.js 15 works — Railway, Render, Fly.io, AWS Amplify, etc. Just set the environment variables and run `yarn build && yarn start`.

## Project Structure

```
app/
  (auth)/              Login/register pages
  (dashboard)/         Protected app pages
    home/              Dashboard home
    chat/              AI chat interface
    tracking/          Blood sugar charts + log history
    diet/              Diet plan list, detail, creation
    log/               Manual logging forms (BS, insulin, meal)
    import/            CGM file import
    profile/           User profile + diabetes settings
    achievements/      Gamification badges
  api/                 API routes (Gemini chat, voice, food analysis, diet plans)

components/
  chat/                Chat bubbles, input, voice recorder
  diet/                Diet plan cards, meal rows
  gamification/        Streak sheet, XP bar, achievements
  home/                Quick log tabs, meal timer, drawers
  log/                 Blood sugar, insulin, meal forms
  pantry/              Pantry item cards, modal
  tracking/            Charts, time-in-range, log history
  ui/                  Shared components (rotating text, animated counter)

lib/
  actions/             Server actions (all data mutations)
  gemini/              Gemini client, prompts, response parsing
  import/              CGM parsers (Libre, Dexcom, MySugr)
  gamification/        XP, streaks, achievement engine
  supabase/            Supabase clients (browser + server + middleware)
  stores/              Zustand stores

supabase/
  migrations/          Database schema SQL files
```

## Key Concepts

**Unstructured to Structured** — Users type naturally ("I ate a sandwich and took 3 units"). Gemini parses this into typed records (meal log + insulin log). The user reviews and confirms before saving.

**Insulin-to-Carb Ratio** — Users set their ratio in profile settings. When logging meals, the app calculates the recommended insulin dose based on carb content.

**CGM Import** — Supports CSV files from FreeStyle Libre, Dexcom, and MySugr. The app normalizes all formats into a unified `blood_sugar_readings` table.

**Gamification** — Every log action awards XP. Users earn achievements for streaks, milestones, and consistency. The streak counter persists across sessions.

## Supported CGM Formats

| Device | Format | Notes |
|--------|--------|-------|
| FreeStyle Libre | CSV | Exported from LibreView |
| Dexcom | CSV | Exported from Dexcom Clarity |
| MySugr | CSV / Excel | Exported from the MySugr app |

## Development

```bash
# Start dev server (Turbopack)
yarn dev

# Lint with autofix
yarn lint

# Type check
npx tsc --noEmit
```

## Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Make your changes
4. Run `yarn lint` to fix formatting
5. Commit and push
6. Open a pull request

## License

MIT
