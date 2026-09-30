import Link from 'next/link';
import { LogoMark, Spark, Target, Chat, Check, ArrowLeft } from '@/components/icons';

function Feature({
  icon,
  title,
  body,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  delay?: string;
}) {
  return (
    <div
      className="anim-rise rounded-card border border-line bg-surface p-6 shadow-card"
      style={{ '--d': delay ?? '0ms' } as React.CSSProperties}
    >
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-panel bg-brand-soft text-brand-deep">
        {icon}
      </div>
      <h3 className="h-tight text-[17px] font-semibold text-ink">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">{body}</p>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-paper font-sans text-ink antialiased">
      {/* Top bar */}
      <header className="border-b border-line bg-surface/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <span className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-white">
              <LogoMark className="h-[18px] w-[18px]" />
            </span>
            <span className="display text-[17px]">NutriCal</span>
          </span>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-full px-4 py-2 text-sm font-semibold text-muted transition hover:bg-surface-soft hover:text-ink"
            >
              Sign in
            </Link>
            <Link
              href="/login"
              className="pressable rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink-soft"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-20 sm:px-6">
        {/* Hero */}
        <section className="grid items-center gap-10 pb-14 pt-12 sm:pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <div>
            <p
              className="anim-rise mb-4 inline-flex items-center gap-1.5 rounded-pill border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-brand-deep"
              style={{ '--d': '0ms' } as React.CSSProperties}
            >
              <Spark className="h-3.5 w-3.5" />
              AI-powered nutrition companion
            </p>
            <h1
              className="display anim-rise text-[42px] text-ink sm:text-[56px]"
              style={{ '--d': '60ms' } as React.CSSProperties}
            >
              Know what you eat. Eat with intent.
            </h1>
            <p
              className="anim-rise mt-5 max-w-md text-[17px] leading-relaxed text-muted"
              style={{ '--d': '120ms' } as React.CSSProperties}
            >
              Log meals in plain language, track calories and macros against
              personalized targets, and get guidance from an AI coach that
              knows your goals.
            </p>
            <div
              className="anim-rise mt-7 flex flex-wrap items-center gap-3"
              style={{ '--d': '180ms' } as React.CSSProperties}
            >
              <Link
                href="/login"
                className="pressable inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-[15px] font-semibold text-white shadow-card transition hover:bg-brand-deep"
              >
                Start tracking free
              </Link>
              <Link
                href="/dashboard"
                className="pressable inline-flex items-center gap-2 rounded-full border border-line bg-surface px-6 py-3 text-[15px] font-semibold text-ink-soft transition hover:border-muted"
              >
                Open dashboard
                <ArrowLeft className="h-4 w-4 rotate-180" />
              </Link>
            </div>
            <ul
              className="anim-rise mt-7 space-y-2 text-sm text-muted"
              style={{ '--d': '240ms' } as React.CSSProperties}
            >
              {[
                'Natural-language meal logging with AI estimates',
                'Personalized calorie and macro targets',
                'Goal streaks that keep you consistent',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-soft text-brand-deep">
                    <Check className="h-3 w-3" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Product snapshot */}
          <div
            className="anim-rise rounded-card border border-line bg-surface p-6 shadow-lift sm:p-7"
            style={{ '--d': '200ms' } as React.CSSProperties}
            aria-label="NutriCal dashboard preview"
          >
            <p className="eyebrow text-faint">Today&apos;s energy</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="nums display text-5xl text-ink">1,420</span>
              <span className="text-sm text-faint">/ 2,200 kcal</span>
            </div>
            <div
              className="mt-4 h-2 overflow-hidden rounded-full bg-surface-soft"
              role="img"
              aria-label="65 percent of calorie target"
            >
              <div
                className="bar-grow h-full w-[65%] rounded-full bg-brand"
                style={{ '--d': '300ms' } as React.CSSProperties}
              />
            </div>
            <div className="mt-6 grid grid-cols-3 gap-4 border-t border-line-soft pt-5">
              {[
                { label: 'Protein', value: '96g', target: '140g', pct: 69, bar: 'bg-brand' },
                { label: 'Carbs', value: '148g', target: '250g', pct: 59, bar: 'bg-ember' },
                { label: 'Fats', value: '42g', target: '65g', pct: 65, bar: 'bg-macro-fats' },
              ].map((m, i) => (
                <div key={m.label}>
                  <p className="text-xs font-medium text-muted">{m.label}</p>
                  <p className="nums mt-0.5 text-xl font-semibold tracking-tight text-ink">
                    {m.value}
                    <span className="ml-1 text-[11px] font-medium text-faint">
                      / {m.target}
                    </span>
                  </p>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-soft">
                    <div
                      className={`bar-grow h-full rounded-full ${m.bar}`}
                      style={{ width: `${m.pct}%`, '--d': `${380 + i * 90}ms` } as React.CSSProperties}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-panel bg-brand-mist px-4 py-3 text-[13px] leading-relaxed text-brand-ink">
              <span className="font-semibold">Coach insight — </span>
              44g of protein to go. A Greek-yogurt snack after your workout
              would close the gap.
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-line pt-12">
          <p className="eyebrow text-faint">How it works</p>
          <h2 className="display mt-2 max-w-xl text-3xl text-ink sm:text-4xl">
            A companion, not just a tracker
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <Feature
              icon={<Spark className="h-5 w-5" />}
              title="Log in plain language"
              body="Type “2 eggs, toast and coffee” and NutriCal estimates calories, protein, carbs and fats instantly."
              delay="0ms"
            />
            <Feature
              icon={<Target className="h-5 w-5" />}
              title="Targets that fit you"
              body="Build a profile once and get calorie and macro targets calculated for your body and goals."
              delay="80ms"
            />
            <Feature
              icon={<Chat className="h-5 w-5" />}
              title="Ask your AI coach"
              body="“What should I eat tonight?” The coach answers with your day, your goals and your diet in mind."
              delay="160ms"
            />
          </div>
        </section>

        {/* CTA */}
        <section className="mt-14 overflow-hidden rounded-card bg-ink px-6 py-12 text-center sm:px-12">
          <h2 className="display mx-auto max-w-lg text-3xl text-white sm:text-4xl">
            Start your first logged day today
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-white/70">
            Create an account, complete your profile, and let NutriCal build
            your personalized nutrition plan.
          </p>
          <Link
            href="/login"
            className="pressable mt-7 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-[15px] font-semibold text-ink transition hover:bg-brand-soft"
          >
            Create free account
            <ArrowLeft className="h-4 w-4 rotate-180" />
          </Link>
          <p className="mt-4 text-xs text-white/50">
            General nutrition guidance and estimates — not medical advice.
          </p>
        </section>

        <footer className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-line pt-6 text-[13px] text-faint sm:flex-row">
          <span className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-soft text-brand-deep">
              <LogoMark className="h-3.5 w-3.5" />
            </span>
            NutriCal — eat with intent
          </span>
          <span>Built for consistent, everyday nutrition.</span>
        </footer>
      </main>
    </div>
  );
}
