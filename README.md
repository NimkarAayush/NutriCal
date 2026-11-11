<div align="center">

# NutriCal

**Understand what you eat. Live healthier.**

An AI-powered personal nutrition companion — track calories and macros in plain
language, get targets built for your body, and turn today's meals into tomorrow's plan.

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat&logo=next.js&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-087ea4?style=flat&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06b6d4?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat)](LICENSE)

**[Live Demo](https://nutri-cal-brown.vercel.app/)** · **Source** · **Report an issue**

</div>

---

## The Problem

Most nutrition apps ask you to do the tedious part: look up food codes, weigh
portions, and maintain a spreadsheet of every meal. People quit within a week.

NutriCal flips the model — you describe a meal the way you'd say it out loud
(*"2 boiled eggs, toast & an apple"*), and the app estimates calories, macros,
and key micronutrients in seconds. Everything else — targets, trends, coaching —
is built on top of that data.

## Highlights

### 🍽️ AI meal estimation
Type a meal in plain language. Gemini parses it into calories, protein, carbs,
fats, and six micronutrients. Nothing is saved until you review and confirm.

### 🎯 Targets built for your body
Mifflin-St Jeor BMR × activity multiplier × goal adjustment. You review the
starting point, adjust it, and stay in control. Goals can be edited any time.

### 💬 A coach with context
The AI Coach sees your profile, your targets, and what you actually ate today.
Actions like logging a meal or changing goals **always require explicit
confirmation** before anything is written to the database.

### 📊 Analytics that answer questions
Weekly/monthly calorie trend against your target, protein consistency, macro
split, goal completion rate, streak history, and a calendar of every logged day.

### 🌙 Light & dark themes
A full token-based design system with a pre-paint theme script — no flash on
load, and the choice persists across sessions.

### 📱 Responsive by design
Desktop sidebar, tablet, and a dedicated mobile bottom nav. Every page works
from 320px up.

## Architecture

```
app/
├── page.tsx              # Landing page
├── login/                # Auth + password recovery
├── dashboard/            # Today: rings, trends, log meal, micronutrients
├── analytics/            # 7/30/90-day trends, macro split, consistency
├── history/              # Calendar of logged days + daily totals
├── coach/                # Context-aware AI chat with confirmable actions
├── assess/               # Guided plan builder
├── profile/              # Full profile + body measurements
├── settings/             # Account, theme, data export, password reset
└── api/
    ├── estimate/         # Gemini meal estimation
    ├── coach/            # Chat completions (with model fallback)
    ├── coach/action/     # Confirmed actions (log meal / change goals)
    └── assess/           # Guided questionnaire

components/
├── nav.tsx               # AppShell — sidebar, topbar, mobile nav
├── ui.tsx                # Design-system primitives
├── charts.tsx            # Dependency-free SVG charts
└── icons.tsx             # Inline SVG icon set

lib/
├── stats.ts              # Local-date aggregation, streaks, percentages
├── goals.ts              # BMR/goal calculation
└── supabase.ts           # Browser client
```

**Key decisions**

- **Dependency-free charts.** `components/charts.tsx` is hand-rolled SVG that
  inherits CSS custom properties — so charts theme automatically with zero
  charting-library weight.
- **Local calendar dates.** All date logic uses `YYYY-MM-DD` local keys rather
  than `toISOString()`. The latter silently shifts a late-night meal to the
  wrong day for anyone not on UTC.
- **RLS-first data model.** Every table has Row Level Security policies scoped
  to `auth.uid() = user_id`. The client never relies on hiding data in the UI.
- **Confirmation before writes.** The AI can propose actions but never executes
  them without an explicit user confirmation step.

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19 + TypeScript 5 |
| Styling | Tailwind CSS 4 (CSS-first `@theme` tokens) |
| Backend | Supabase (Postgres, Auth, Row Level Security) |
| AI | Google Gemini (with per-request timeout + model fallback) |
| Charts | Custom SVG components |
| Hosting | Vercel |

## Getting Started

```bash
git clone https://github.com/NimkarAayush/NutriCal.git
cd NutriCal
npm install
```

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
GEMINI_API_KEY=<your-gemini-key>
```

Then apply the database schema:

```bash
# Run these in the Supabase SQL Editor, in order
supabase/migrations/001_create_profiles_table.sql
supabase/migrations/002_create_nutrition_goals_table.sql
supabase/migrations/003_meal_logs_rls.sql
supabase/migrations/004_profiles_missing_columns.sql
supabase/migrations/005_meal_logs_micronutrients.sql
supabase/migrations/006_table_privileges.sql
```

> **Note:** migration `006` grants table privileges to the `anon` and
> `authenticated` roles. Without it, PostgreSQL rejects queries with
> `permission denied for table ...` before RLS is ever evaluated. `anon` and
> `authenticated` are separate roles — grant both.

Run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
npm run dev     # start dev server
npm run build   # production build
npm run start   # serve production build
npm run lint    # eslint
```

## ⚠️ Disclaimer

NutriCal provides **general nutrition guidance and estimates**. It is not a
substitute for professional medical advice. Estimates are approximate and may
not be accurate for every food or individual.

## License

MIT
