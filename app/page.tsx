import Image from 'next/image';
import Link from 'next/link';
import {
  LogoMark,
  Leaf,
  Target,
  Chat,
  ArrowRight,
  Check,
  Bowl,
  Spark,
  ChartBar,
  Droplet,
  Plan,
  Flame,
  TrendUp,
} from '@/components/icons';

const FEATURE_STRIP = [
  {
    icon: Bowl,
    title: 'Meal logging',
    copy: 'Describe a meal in plain words.',
  },
  {
    icon: Target,
    title: 'Personalized goals',
    copy: 'Targets calculated from your body.',
  },
  {
    icon: Chat,
    title: 'AI nutrition coach',
    copy: 'Guidance that reads your day.',
  },
  {
    icon: TrendUp,
    title: 'Progress tracking',
    copy: 'Trends, streaks and honest totals.',
  },
];

const STEPS = [
  {
    step: '01',
    title: 'Tell us about you',
    copy: 'Age, height, weight, activity and goal — once. NutriCal calculates starting targets you review and confirm.',
    icon: Target,
  },
  {
    step: '02',
    title: 'Log meals the easy way',
    copy: 'Type “2 boiled eggs, toast & an apple”. AI estimates calories, macros and key micronutrients in seconds.',
    icon: Spark,
  },
  {
    step: '03',
    title: 'See what to do next',
    copy: 'A daily dashboard, weekly trends and a coach that knows what you ate — so the next meal is an informed one.',
    icon: ChartBar,
  },
];

const FEATURES = [
  {
    icon: Spark,
    title: 'AI meal estimation',
    copy: 'No food codes or weighing scales. Write it like you would say it and review the estimate before it is saved.',
  },
  {
    icon: Droplet,
    title: 'Micronutrients too',
    copy: 'Vitamin A, C, D, iron, calcium and potassium are estimated alongside macros, against general adult reference values.',
  },
  {
    icon: Target,
    title: 'Targets built for you',
    copy: 'Mifflin-St Jeor BMR, activity multiplier and goal adjustment produce a starting point — you stay in control.',
  },
  {
    icon: Chat,
    title: 'A coach with context',
    copy: 'It sees your profile, targets and today’s meals. Actions like logging a meal always require your confirmation.',
  },
  {
    icon: Plan,
    title: 'Guided plan builder',
    copy: 'A short conversation collects what matters and proposes a plan. Nothing is saved until you accept it.',
  },
  {
    icon: ChartBar,
    title: 'Analytics & history',
    copy: 'Weekly and monthly trends, protein consistency, macro split, goal completion and a calendar of past days.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-paper font-sans text-ink antialiased">
      {/* ---------------- Navigation ---------------- */}
      <header className="sticky top-0 z-40 border-b border-line/80 bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5" aria-label="NutriCal home">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white shadow-card">
              <LogoMark className="h-5 w-5" />
            </span>
            <span className="text-[19px] font-semibold tracking-tight">NutriCal</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Marketing">
            {[
              { label: 'Features', href: '#features' },
              { label: 'How it works', href: '#how' },
              { label: 'Analytics', href: '#analytics' },
            ].map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="rounded-full px-4 py-2 text-[13.5px] font-medium text-muted transition hover:bg-surface-soft hover:text-ink"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-control px-3.5 py-2 text-[13px] font-semibold text-ink-soft transition hover:bg-surface-soft"
            >
              Sign in
            </Link>
            <Link
              href="/login"
              className="pressable inline-flex items-center gap-1.5 rounded-control bg-brand px-4 py-2.5 text-[13px] font-semibold text-white shadow-card transition hover:bg-brand-deep"
            >
              Get started
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ---------------- Hero ---------------- */}
        <section className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-[520px] w-[520px] rounded-full bg-brand-soft/60 blur-3xl"
            aria-hidden="true"
          />
          <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-14 pt-12 sm:px-6 sm:pt-16 lg:grid-cols-[1.02fr_0.98fr] lg:px-8 lg:pb-20 lg:pt-20">
            <div className="max-w-xl">
              <p className="anim-rise inline-flex items-center gap-2 rounded-pill border border-brand/20 bg-brand-mist px-3.5 py-1.5 text-[11.5px] font-semibold text-brand-deep">
                <Leaf className="h-3.5 w-3.5" />
                AI-powered nutrition, built for real life
              </p>

              <h1
                className="display anim-rise mt-6 text-[46px] leading-[0.98] sm:text-[62px]"
                style={{ animationDelay: '60ms' }}
              >
                Understand
                <br />
                what you eat.
                <br />
                <span className="text-brand">Live Healthier.</span>
              </h1>

              <p
                className="anim-rise mt-6 max-w-lg text-[16.5px] leading-relaxed text-muted"
                style={{ animationDelay: '120ms' }}
              >
                Track calories and macros in plain language, get targets built
                for your body, and let an AI coach turn today’s meals into
                tomorrow’s plan.
              </p>

              <div
                className="anim-rise mt-8 flex flex-wrap items-center gap-3"
                style={{ animationDelay: '180ms' }}
              >
                <Link
                  href="/login"
                  className="pressable inline-flex items-center gap-2 rounded-control bg-brand px-6 py-3.5 text-[15px] font-semibold text-white shadow-lift transition hover:bg-brand-deep"
                >
                  Start your journey
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#how"
                  className="pressable inline-flex items-center gap-2 rounded-control border border-line bg-surface px-6 py-3.5 text-[15px] font-semibold text-ink-soft shadow-card transition hover:border-faint"
                >
                  See how it works
                </a>
              </div>

              <ul
                className="anim-rise mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px] text-muted"
                style={{ animationDelay: '240ms' }}
              >
                {['Free to start', 'No food database grind', 'Your data stays yours'].map(
                  (item) => (
                    <li key={item} className="flex items-center gap-1.5">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-soft text-brand-deep">
                        <Check className="h-2.5 w-2.5" />
                      </span>
                      {item}
                    </li>
                  )
                )}
              </ul>
            </div>

            {/* Product visual */}
            <div className="anim-rise relative mx-auto w-full max-w-[540px]" style={{ animationDelay: '160ms' }}>
              <div className="absolute inset-x-6 bottom-0 top-10 rounded-[40px] bg-brand-soft/70" aria-hidden="true" />
              <div className="relative mx-auto aspect-[5/4.4] w-[86%] overflow-hidden rounded-[36px] shadow-lift">
                <Image
                  src="/images/hero-bowl.jpg"
                  alt="A colourful bowl of vegetables, grains and grilled protein"
                  fill
                  priority
                  sizes="(max-width: 1024px) 90vw, 520px"
                  className="object-cover"
                />
              </div>

              <div className="anim-pop absolute right-0 top-4 flex items-center gap-3 rounded-card border border-line bg-surface/95 px-4 py-3 shadow-lift backdrop-blur sm:right-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft text-brand-deep">
                  <Flame className="h-4 w-4" />
                </span>
                <div>
                  <p className="nums text-lg font-semibold leading-none">720</p>
                  <p className="text-[10.5px] text-muted">kcal logged today</p>
                </div>
              </div>

              <div className="anim-pop absolute -bottom-3 left-0 rounded-card border border-line bg-surface/95 p-3.5 shadow-lift backdrop-blur sm:left-2" style={{ animationDelay: '120ms' }}>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-faint">
                  Today’s macros
                </p>
                <div className="flex items-center gap-4">
                  {[
                    { label: 'Protein', value: '62g', color: 'bg-macro-protein' },
                    { label: 'Carbs', value: '85g', color: 'bg-macro-carbs' },
                    { label: 'Fats', value: '28g', color: 'bg-macro-fats' },
                  ].map((macro) => (
                    <div key={macro.label} className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${macro.color}`} />
                      <div>
                        <p className="nums text-[13px] font-semibold leading-none">{macro.value}</p>
                        <p className="mt-0.5 text-[9.5px] text-faint">{macro.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="anim-pop absolute right-2 bottom-10 rounded-pill border border-brand/20 bg-brand-mist px-3 py-1.5 text-[10.5px] font-semibold text-brand-deep shadow-card">
                On track · 1,780 kcal left
              </div>
            </div>
          </div>

          {/* Feature strip */}
          <div className="relative mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURE_STRIP.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="anim-rise hover-lift flex items-start gap-3 rounded-card border border-line bg-surface p-4 shadow-card"
                    style={{ animationDelay: `${index * 60}ms` }}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-mist text-brand-deep">
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                    <div>
                      <p className="text-[13px] font-semibold">{feature.title}</p>
                      <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted">{feature.copy}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ---------------- How it works ---------------- */}
        <section id="how" className="border-y border-line bg-surface">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
              <div className="max-w-2xl">
                <p className="eyebrow text-brand">How it works</p>
                <h2 className="display mt-3 text-4xl sm:text-[46px]">
                  Three steps. No spreadsheets.
                </h2>
              </div>
              <p className="max-w-sm text-[14px] leading-relaxed text-muted">
                NutriCal stays useful because it stays simple: real targets,
                fast logging, and advice grounded in what you actually ate.
              </p>
            </div>

            <div className="mt-10 grid gap-4 lg:grid-cols-3">
              {STEPS.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.step}
                    className="anim-rise relative rounded-card border border-line bg-paper p-6"
                    style={{ animationDelay: `${index * 80}ms` }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white shadow-card">
                        <Icon className="h-[18px] w-[18px]" />
                      </span>
                      <span className="nums text-[26px] font-semibold text-line">{step.step}</span>
                    </div>
                    <h3 className="mt-5 text-[17px] font-semibold tracking-tight">{step.title}</h3>
                    <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{step.copy}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ---------------- Analytics preview ---------------- */}
        <section id="analytics" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="eyebrow text-brand">Analytics that answer questions</p>
              <h2 className="display mt-3 text-4xl sm:text-[46px]">
                Not more data.
                <br />
                Better decisions.
              </h2>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted">
                See the week at a glance, spot the protein dips, and know
                whether you’re actually hitting your target — not just logging
                into an app.
              </p>

              <ul className="mt-6 space-y-3">
                {[
                  'Calorie trend with your target line',
                  'Protein consistency and macro split',
                  'Goal completion and streak history',
                  'A calendar of every logged day',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-[14px] text-ink-soft">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-deep">
                      <Check className="h-3 w-3" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 rounded-[36px] bg-brand-mist" aria-hidden="true" />
              <div className="relative rounded-card border border-line bg-surface p-5 shadow-lift sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[15px] font-semibold">Your nutrition analytics</p>
                    <p className="mt-0.5 text-[11.5px] text-muted">A product preview</p>
                  </div>
                  <span className="rounded-pill bg-brand px-2.5 py-1 text-[10px] font-semibold text-white">
                    7D
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  {[
                    { label: 'Average calories', value: '2,230', unit: 'kcal', tone: 'text-brand-deep' },
                    { label: 'Protein consistency', value: '92', unit: '%', tone: 'text-macro-protein' },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-panel bg-paper p-3.5">
                      <p className="text-[10.5px] font-medium text-muted">{stat.label}</p>
                      <p className={`nums mt-1 text-[22px] font-semibold leading-none ${stat.tone}`}>
                        {stat.value}
                        <span className="ml-1 text-[10px] font-medium text-faint">{stat.unit}</span>
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-panel border border-line-soft p-3.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[11.5px] font-semibold text-ink-soft">Calories · last 7 days</p>
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-leaf">
                      <TrendUp className="h-3 w-3" />
                      steady
                    </span>
                  </div>
                  <svg viewBox="0 0 320 96" className="mt-2 h-auto w-full" aria-hidden="true">
                    <defs>
                      <linearGradient id="marketing-area" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-brand)" stopOpacity="0.22" />
                        <stop offset="100%" stopColor="var(--color-brand)" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {[0, 1, 2].map((line) => (
                      <line
                        key={line}
                        x1="0"
                        x2="320"
                        y1={16 + line * 28}
                        y2={16 + line * 28}
                        stroke="var(--color-line-soft)"
                      />
                    ))}
                    <path
                      d="M 8 70 C 50 58, 62 48, 92 54 C 126 61, 136 40, 168 44 C 202 48, 216 30, 246 34 C 276 38, 288 26, 312 22 L 312 96 L 8 96 Z"
                      fill="url(#marketing-area)"
                    />
                    <path
                      d="M 8 70 C 50 58, 62 48, 92 54 C 126 61, 136 40, 168 44 C 202 48, 216 30, 246 34 C 276 38, 288 26, 312 22"
                      fill="none"
                      stroke="var(--color-brand)"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                    />
                    {[
                      [8, 70],
                      [92, 54],
                      [168, 44],
                      [246, 34],
                      [312, 22],
                    ].map(([x, y]) => (
                      <circle
                        key={x}
                        cx={x}
                        cy={y}
                        r="3"
                        fill="var(--color-surface)"
                        stroke="var(--color-brand)"
                        strokeWidth="2"
                      />
                    ))}
                  </svg>
                </div>

                <div className="mt-3 flex items-center justify-between rounded-panel bg-brand-mist px-3.5 py-2.5">
                  <span className="text-[11px] font-medium text-brand-deep">Macro split</span>
                  <div className="flex items-center gap-3">
                    {[
                      { label: 'P', value: '28%', color: 'bg-macro-protein' },
                      { label: 'C', value: '52%', color: 'bg-macro-carbs' },
                      { label: 'F', value: '20%', color: 'bg-macro-fats' },
                    ].map((macro) => (
                      <span key={macro.label} className="flex items-center gap-1 text-[10.5px] text-muted">
                        <span className={`h-2 w-2 rounded-full ${macro.color}`} />
                        {macro.label} {macro.value}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------- Feature grid ---------------- */}
        <section id="features" className="border-y border-line bg-surface">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <div className="max-w-2xl">
              <p className="eyebrow text-brand">Everything included</p>
              <h2 className="display mt-3 text-4xl sm:text-[46px]">
                Built like a product, not a demo.
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-muted">
                Every feature below is live in the app — no placeholder screens,
                no imaginary integrations.
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="anim-rise hover-lift rounded-card border border-line bg-paper p-5"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand-deep">
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                    <h3 className="mt-4 text-[15.5px] font-semibold tracking-tight">{feature.title}</h3>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{feature.copy}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ---------------- CTA ---------------- */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="relative overflow-hidden rounded-[28px] bg-brand-ink px-6 py-12 text-white sm:px-12 sm:py-16">
            <div
              className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-brand/30 blur-3xl"
              aria-hidden="true"
            />
            <div className="relative max-w-2xl">
              <p className="eyebrow text-white/50">Your next meal is information</p>
              <h2 className="display mt-3 text-[38px] leading-[1.02] text-white sm:text-[54px]">
                Know your food.
                <br />
                Know your numbers.
                <br />
                <span className="text-leaf">Know what to do next.</span>
              </h2>
              <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-white/65">
                Create an account, set your targets, and log your first meal in
                under a minute.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/login"
                  className="pressable inline-flex items-center gap-2 rounded-control bg-white px-6 py-3.5 text-[14.5px] font-semibold text-brand-ink transition hover:bg-white/90"
                >
                  Start with NutriCal
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/login"
                  className="rounded-control border border-white/20 px-6 py-3.5 text-[14.5px] font-semibold text-white transition hover:bg-white/10"
                >
                  Sign in
                </Link>
              </div>
              <p className="mt-6 text-[11.5px] text-white/40">
                General nutrition guidance and estimates — not medical advice.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* ---------------- Footer ---------------- */}
      <footer className="border-t border-line bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-8 sm:flex-row">
            <div className="max-w-xs">
              <Link href="/" className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white">
                  <LogoMark className="h-4.5 w-4.5" />
                </span>
                <span className="text-[17px] font-semibold tracking-tight">NutriCal</span>
              </Link>
              <p className="mt-3 text-[12.5px] leading-relaxed text-muted">
                A personal nutrition companion. Eat with intent, built for
                everyday health.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-8 text-[12.5px] sm:grid-cols-3">
              <div>
                <p className="font-semibold text-ink">Product</p>
                <ul className="mt-3 space-y-2 text-muted">
                  <li><a className="transition hover:text-brand" href="#features">Features</a></li>
                  <li><a className="transition hover:text-brand" href="#how">How it works</a></li>
                  <li><a className="transition hover:text-brand" href="#analytics">Analytics</a></li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-ink">App</p>
                <ul className="mt-3 space-y-2 text-muted">
                  <li><Link className="transition hover:text-brand" href="/login">Sign in</Link></li>
                  <li><Link className="transition hover:text-brand" href="/login">Create account</Link></li>
                  <li><Link className="transition hover:text-brand" href="/assess">Build a plan</Link></li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-ink">Trust</p>
                <ul className="mt-3 space-y-2 text-muted">
                  <li>Private by default</li>
                  <li>No data selling</li>
                  <li>Estimates, not medical advice</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-2 border-t border-line-soft pt-5 text-[11.5px] text-faint sm:flex-row sm:items-center sm:justify-between">
            <span>© 2026 NutriCal. All rights reserved.</span>
            <span>Made for everyday nutrition.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
