'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { LogoMark, Check } from '@/components/icons';
import { Button, Alert, inputClass } from '@/components/ui';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        router.push('/dashboard');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-paper font-sans text-ink antialiased lg:grid-cols-[1fr_1fr]">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-ink lg:block">
        <div className="flex h-full flex-col justify-between p-12">
          <span className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white">
              <LogoMark className="h-5 w-5" />
            </span>
            <span className="display text-lg text-white">NutriCal</span>
          </span>

          <div className="anim-rise">
            <p className="eyebrow text-white/50">Personal nutrition companion</p>
            <h1 className="display mt-3 max-w-md text-[44px] leading-[1.05] text-white">
              Small daily wins, compounded.
            </h1>
            <ul className="mt-7 space-y-3 text-[15px] text-white/75">
              {[
                'Log meals in plain language',
                'Hit personalized macro targets',
                'Stay consistent with goal streaks',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-white">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-[13px] text-white/40">
            General nutrition guidance and estimates — not medical advice.
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="anim-rise w-full max-w-[400px]" style={{ '--d': '80ms' } as React.CSSProperties}>
          <span className="mb-8 flex items-center gap-2 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white">
              <LogoMark className="h-5 w-5" />
            </span>
            <span className="display text-lg">NutriCal</span>
          </span>

          <h2 className="display text-[32px]">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h2>
          <p className="mt-2 text-[15px] text-muted">
            {isSignUp
              ? 'Start tracking in under a minute.'
              : 'Pick up right where you left off.'}
          </p>

          {errorMsg && (
            <div className="mt-5">
              <Alert tone="danger">{errorMsg}</Alert>
            </div>
          )}

          <form onSubmit={handleAuth} className="mt-7 space-y-4">
            <div>
              <label htmlFor="email" className="eyebrow mb-1.5 block text-muted">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="eyebrow mb-1.5 block text-muted">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                placeholder="••••••••"
              />
            </div>

            <Button type="submit" size="lg" loading={loading} className="w-full">
              {isSignUp ? 'Create account' : 'Sign in'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg('');
              }}
              className="font-semibold text-brand-deep hover:underline"
            >
              {isSignUp ? 'Sign in' : 'Create account'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
