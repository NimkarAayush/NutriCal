import Link from 'next/link';
import { LogoMark, Leaf, Target, Chat, ArrowRight } from '@/components/icons';

const DAY_MEALS = [
  {
    tag: 'Breakfast · 8:10',
    name: 'Oats, banana & milk',
    detail: 'Protein 14g · Carbs 68g · Fat 9g',
    kcal: '412 kcal',
  },
  {
    tag: 'Lunch · 1:20',
    name: 'Paneer rice bowl',
    detail: 'Protein 28g · Carbs 74g · Fat 18g',
    kcal: '568 kcal',
  },
  {
    tag: 'Snack · 4:45',
    name: 'Greek yogurt & fruit',
    detail: 'Protein 18g · Carbs 24g · Fat 4g',
    kcal: '214 kcal',
  },
  {
    tag: 'Dinner · 8:00',
    name: 'Dal, roti & vegetables',
    detail: 'Protein 22g · Carbs 71g · Fat 12g',
    kcal: '486 kcal',
  },
];

const MACROS = [
  { label: 'Protein', value: '112g', target: '140g', pct: 80, bar: 'bg-macro-protein', note: 'eggs · dal · yogurt' },
  { label: 'Carbs', value: '208g', target: '250g', pct: 66, bar: 'bg-macro-carbs', note: 'oats · rice · roti' },
  { label: 'Fats', value: '51g', target: '65g', pct: 58, bar: 'bg-macro-fats', note: 'milk · paneer · nuts' },
];

const GOALS = [
  { label: 'Daily calories', value: '2,200', unit: 'kcal' },
  { label: 'Protein', value: '140', unit: 'g' },
  { label: 'Carbs', value: '250', unit: 'g' },
  { label: 'Fats', value: '65', unit: 'g' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-paper font-sans text-ink antialiased">
      {/* Masthead */}
      <header className="border-b border-line">
        <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between px-4 sm:px-6">
          <span className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white">
              <LogoMark className="h-5 w-5" />
            </span>
            <span className="display text-[19px]">NutriCal</span>
          </span>
          <div className="flex items-center gap-1.5">
            <Link
              href="/login"
              className="rounded-full px-4 py-2 text-sm font-medium text-muted transition hover:bg-surface-soft hover:text-ink"
            >
              Sign in
            </Link>
            <Link
              href="/login"
              className="pressable rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink-soft"
            >
              Start tracking
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ============ HERO — editorial, asymmetric ============ */}
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 sm:pt-16 lg:pt-20">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
            <div className="max-w-xl">
              <p
                className="anim-rise flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-deep"
                style={{ '--d': '0ms' } as React.CSSProperties}
              >
                <Leaf className="h-4 w-4" />
                A personal nutrition companion
              </p>
              <h1
                className="display anim-rise mt-5 text-[48px] leading-[1.02] sm:text-[68px]"
                style={{ '--d': '70ms' } as React.CSSProperties}
              >
                Understand what{' '}
                <em className="display-italic text-brand-deep">you</em> eat.
              </h1>
              <p
                className="anim-rise mt-6 max-w-md text-[17px] leading-relaxed text-muted"
                style={{ '--d': '140ms' } as React.CSSProperties}
              >
                NutriCal turns your everyday meals into a clear picture of
                your calories, macros and nutrition — so you know what to do
                next.
              </p>
              <div
                className="anim-rise mt-8 flex flex-wrap items-center gap-3"
                style={{ '--d': '210ms' } as React.CSSProperties}
              >
                <Link
                  href="/login"
                  className="pressable inline-flex items-center gap-2 rounded-full bg-brand px-7 py-3.5 text-[15px] font-semibold text-white shadow-card transition hover:bg-brand-deep"
                >
                  Start tracking
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="#how"
                  className="pressable inline-flex items-center gap-2 rounded-full border border-line bg-surface px-7 py-3.5 text-[15px] font-semibold text-ink-soft transition hover:border-muted"
                >
                  See how it works
                </Link>
              </div>
              <p
                className="anim-rise mt-6 text-[13px] text-faint"
                style={{ '--d': '260ms' } as React.CSSProperties}
              >
                Free to start · No credit card · Your data stays yours
              </p>
            </div>

            {/* Today snapshot — the product, working */}
            <div
              className="anim-rise lg:pt-6"
              style={{ '--d': '180ms' } as React.CSSProperties}
            >
              <div className="rounded-card border border-line bg-surface p-7 shadow-lift sm:p-8">
                <div className="flex items-baseline justify-between">
                  <p className="eyebrow text-faint">Today</p>
                  <p className="text-xs text-faint">Wed, Sep 30</p>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="nums display text-6xl sm:text-7xl">
                    1,842
                  </span>
                  <span className="text-sm text-faint">
                    kcal <span className="nums">of 2,200</span>
                  </span>
                </div>
                <div
                  className="mt-4 h-2 overflow-hidden rounded-full bg-surface-soft"
                  role="img"
                  aria-label="84 percent of calorie target"
                >
                  <div
                    className="bar-grow h-full w-[84%] rounded-full bg-brand"
                    style={{ '--d': '350ms' } as React.CSSProperties}
                  />
                </div>
                <div className="mt-6 space-y-4">
                  {[
                    { label: 'Protein', v: '112g', t: '140g', pct: 80, bar: 'bg-macro-protein' },
                    { label: 'Carbs', v: '208g', t: '250g', pct: 66, bar: 'bg-macro-carbs' },
                    { label: 'Fats', v: '51g', t: '65g', pct: 58, bar: 'bg-macro-fats' },
                  ].map((m, i) => (
                    <div key={m.label} className="flex items-center gap-3">
                      <span className="w-14 text-[13px] font-medium text-muted">
                        {m.label}
                      </span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-soft">
                        <div
                          className={`bar-grow h-full rounded-full ${m.bar}`}
                          style={{ width: `${m.pct}%`, '--d': `${450 + i * 100}ms` } as React.CSSProperties}
                        />
                      </div>
                      <span className="nums w-[92px] text-right text-[13px] text-muted">
                        {m.v} <span className="text-faint">/ {m.t}</span>
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-6 border-t border-line-soft pt-4 text-sm leading-relaxed text-ink-soft">
                  You&apos;re <strong className="nums font-semibold">358 kcal</strong> away
                  from your daily target.
                </p>
              </div>
              <p className="mt-3 text-center text-xs text-faint">
                An actual NutriCal day — not a mockup style.
              </p>
            </div>
          </div>
        </section>

        {/* ============ FROM MEAL TO INSIGHT ============ */}
        <section id="how" className="border-t border-line">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <div className="max-w-2xl">
              <p className="eyebrow text-brand-deep">From meal to insight</p>
              <h2 className="display mt-3 text-4xl sm:text-5xl">
                You eat. <em className="display-italic">NutriCal</em> does the
                maths.
              </h2>
              <p className="mt-4 max-w-lg text-[16px] leading-relaxed text-muted">
                Just write what you had, the way you&apos;d say it. NutriCal
                estimates the nutrition and files it into your day.
              </p>
            </div>

            <div className="mt-10 grid gap-x-10 gap-y-8 lg:grid-cols-[0.95fr_1.05fr]">
              {/* Meal log example */}
              <div className="anim-rise rounded-card border border-line bg-surface p-6 shadow-card sm:p-7">
                <p className="eyebrow text-faint">A day of eating</p>
                <ul className="mt-4 divide-y divide-line-soft">
                  {DAY_MEALS.map((m) => (
                    <li key={m.name} className="flex items-baseline justify-between gap-4 py-3.5">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-faint">
                          {m.tag}
                        </p>
                        <p className="mt-0.5 font-display text-[19px] font-medium tracking-tight">
                          {m.name}
                        </p>
                        <p className="mt-0.5 text-[13px] text-muted">{m.detail}</p>
                      </div>
                      <span className="nums shrink-0 text-[15px] font-semibold">
                        {m.kcal}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* What the user gets */}
              <div className="flex flex-col justify-center">
                <div className="space-y-7">
                  {[
                    {
                      n: '01',
                      t: 'Record it simply',
                      b: '“Dal, roti & vegetables” is enough. No weighing scales, no food codes, no friction.',
                    },
                    {
                      n: '02',
                      t: 'See the full picture',
                      b: 'Calories and macros land in your daily totals the moment you log, with progress against your targets.',
                    },
                    {
                      n: '03',
                      t: 'Know what to do next',
                      b: 'Short on protein at 7pm? NutriCal says so — and suggests what would close the gap.',
                    },
                  ].map((s) => (
                    <div key={s.n} className="flex gap-5">
                      <span className="nums display-italic text-2xl text-faint">
                        {s.n}
                      </span>
                      <div>
                        <h3 className="h-tight text-lg font-semibold">{s.t}</h3>
                        <p className="mt-1 max-w-md text-[15px] leading-relaxed text-muted">
                          {s.b}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ NUTRITION AT A GLANCE ============ */}
        <section className="border-t border-line bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
              <div>
                <p className="eyebrow text-brand-deep">Nutrition at a glance</p>
                <h2 className="display mt-3 text-4xl sm:text-5xl">
                  Four numbers tell the whole story.
                </h2>
              </div>
              <p className="max-w-md text-[15px] leading-relaxed text-muted lg:justify-self-end">
                No chart overload. Calories set the budget; protein, carbs and
                fats show the balance. Readable in under five seconds.
              </p>
            </div>

            <div className="mt-10 grid gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
              <div className="bg-surface p-7">
                <p className="eyebrow text-faint">Calories</p>
                <p className="nums display mt-2 text-5xl text-brand-deep">1,842</p>
                <p className="nums mt-1 text-sm text-muted">of 2,200 kcal · 84%</p>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-soft">
                  <div className="bar-grow h-full w-[84%] rounded-full bg-brand" />
                </div>
              </div>
              {MACROS.map((m, i) => (
                <div key={m.label} className="bg-surface p-7">
                  <p className="eyebrow text-faint">{m.label}</p>
                  <p className="nums display mt-2 text-5xl">
                    {m.value}
                    <span className="ml-1 align-middle font-sans text-sm font-medium text-faint">
                      / {m.target}
                    </span>
                  </p>
                  <p className="mt-1 text-[13px] text-faint">{m.note}</p>
                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-soft">
                    <div
                      className={`bar-grow h-full rounded-full ${m.bar}`}
                      style={{ width: `${m.pct}%`, '--d': `${i * 120}ms` } as React.CSSProperties}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ PERSONALIZED GOALS ============ */}
        <section className="border-t border-line">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <div className="grid gap-10 lg:grid-cols-2">
              <div>
                <p className="eyebrow text-brand-deep">Personalized goals</p>
                <h2 className="display mt-3 text-4xl sm:text-5xl">
                  Targets built for your body, not everybody&apos;s.
                </h2>
                <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted">
                  Tell NutriCal about yourself once — age, weight, activity,
                  goal — and it calculates starting targets you confirm
                  yourself. Nothing is ever overwritten silently.
                </p>
                <Link
                  href="/login"
                  className="pressable mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition hover:bg-ink-soft"
                >
                  Build my plan
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <dl className="divide-y divide-line border-y border-line">
                {GOALS.map((g) => (
                  <div key={g.label} className="flex items-baseline justify-between py-4">
                    <dt className="text-[15px] font-medium text-muted">{g.label}</dt>
                    <dd className="nums display text-3xl">
                      {g.value}
                      <span className="ml-1 font-sans text-sm font-medium text-faint">
                        {g.unit}
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        {/* ============ AI ASSESSMENT + COACH ============ */}
        <section className="border-t border-line bg-brand-ink text-white">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <p className="eyebrow text-white/50">Guidance, not gimmicks</p>
            <h2 className="display mt-3 max-w-2xl text-4xl sm:text-5xl">
              A coach that reads your day before it speaks.
            </h2>

            <div className="mt-10 grid gap-5 lg:grid-cols-2">
              {/* Assessment */}
              <div className="rounded-card bg-white/[0.06] p-7 ring-1 ring-white/10 sm:p-8">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
                    <Target className="h-[18px] w-[18px]" />
                  </span>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/60">
                    Daily assessment
                  </p>
                </div>
                <blockquote className="mt-5 font-display text-[22px] font-medium leading-snug">
                  “Your protein intake is on track today. Adding a
                  protein-rich snack could help you reach your target.”
                </blockquote>
                <p className="mt-4 text-sm leading-relaxed text-white/60">
                  Every evening, NutriCal studies your meals against your
                  targets and writes one thoughtful summary — what went well,
                  what could improve, and the single thing worth focusing on.
                </p>
              </div>

              {/* Coach */}
              <div className="rounded-card bg-white/[0.06] p-7 ring-1 ring-white/10 sm:p-8">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
                    <Chat className="h-[18px] w-[18px]" />
                  </span>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/60">
                    AI coach
                  </p>
                </div>
                <div className="mt-5 space-y-3 text-[15px]">
                  <p className="ml-auto w-fit max-w-[90%] rounded-[18px] rounded-br-md bg-white px-4 py-2.5 text-ink">
                    What should I eat for dinner?
                  </p>
                  <p className="w-fit max-w-[95%] rounded-[18px] rounded-bl-md bg-white/10 px-4 py-3 leading-relaxed text-white ring-1 ring-white/10">
                    You&apos;re slightly short on protein today. A paneer
                    bowl, eggs with toast, or dal with curd would help close
                    the gap.
                  </p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {['What should I eat next?', 'Am I low on protein?', 'How was my day?'].map(
                    (chip) => (
                      <span
                        key={chip}
                        className="rounded-pill px-3.5 py-1.5 text-[13px] font-medium text-white/80 ring-1 ring-white/20"
                      >
                        {chip}
                      </span>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ FINAL CTA ============ */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="max-w-2xl">
            <h2 className="display text-[40px] leading-[1.05] sm:text-[56px]">
              Know your food.
              <br />
              Know your numbers.
              <br />
              <em className="display-italic text-brand-deep">
                Know what to do next.
              </em>
            </h2>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/login"
                className="pressable inline-flex items-center gap-2 rounded-full bg-brand px-8 py-4 text-base font-semibold text-white shadow-card transition hover:bg-brand-deep"
              >
                Start with NutriCal
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <p className="mt-5 text-[13px] text-faint">
              General nutrition guidance and estimates — not medical advice.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-7 text-[13px] text-faint sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-soft text-brand-deep">
              <LogoMark className="h-3.5 w-3.5" />
            </span>
            <span className="display text-[15px] text-ink">NutriCal</span>
          </span>
          <span>Eat with intent. Built for everyday nutrition.</span>
        </div>
      </footer>
    </div>
  );
}
