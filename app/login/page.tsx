'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { LogoMark, Check, Leaf, Chat, Target } from '@/components/icons';
import { Button, Alert, inputClass } from '@/components/ui';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const router = useRouter();
  const supabase = createClient();

  // Supabase puts recovery tokens in the URL hash and emits PASSWORD_RECOVERY.
  useEffect(() => {
    const frame = window.location.hash.includes('type=recovery')
      ? requestAnimationFrame(() => setRecoveryMode(true))
      : null;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setRecoveryMode(true);
    });
    return () => {
      subscription.unsubscribe();
      if (frame !== null) cancelAnimationFrame(frame);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setNotice('');

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        router.push('/dashboard');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    setErrorMsg('');
    setNotice('');
    if (!email.trim()) {
      setErrorMsg('Enter your email address first, then request a reset link.');
      return;
    }
    setResetting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/login`,
      });
      if (error) throw error;
      setNotice('If an account exists for that email, a reset link is on its way.');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not send the reset email');
    } finally {
      setResetting(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setNotice('');

    if (password.length < 6) {
      setErrorMsg('Use at least 6 characters for your new password.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('The two passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setNotice('Password updated. Sign in with your new password.');
      setRecoveryMode(false);
      setPassword('');
      setConfirmPassword('');
      window.history.replaceState(null, '', window.location.pathname);
      await supabase.auth.signOut();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not update the password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-dvh bg-paper font-sans text-ink antialiased lg:grid-cols-[1.02fr_0.98fr]">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-brand-ink lg:block">
        <Image
          src="/images/salad-flatlay.jpg"
          alt="A spread of fresh, colourful whole foods"
          fill
          priority
          sizes="50vw"
          className="object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-brand-ink via-brand-ink/90 to-brand/40" />

        <div className="relative flex h-full flex-col justify-between p-12">
          <Link href="/" className="flex w-fit items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/15">
              <LogoMark className="h-5 w-5" />
            </span>
            <span className="text-lg font-semibold tracking-tight text-white">NutriCal</span>
          </Link>

          <div className="anim-rise max-w-md">
            <p className="inline-flex items-center gap-2 rounded-pill border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white/70">
              <Leaf className="h-3.5 w-3.5" />
              Personal nutrition companion
            </p>
            <h1 className="display mt-5 text-[44px] leading-[1.02] text-white">
              Small daily wins,
              <br />
              compounded.
            </h1>
            <p className="mt-4 text-[14.5px] leading-relaxed text-white/65">
              Log meals in plain language, hit targets built for your body, and
              keep the streak alive with guidance that knows your day.
            </p>

            <ul className="mt-7 space-y-3.5">
              {[
                { icon: Chat, label: 'AI meal estimation in seconds' },
                { icon: Target, label: 'Targets calculated from your profile' },
                { icon: Check, label: 'Analytics, history and micronutrients' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.label} className="flex items-center gap-3 text-[13.5px] text-white/80">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-leaf ring-1 ring-white/10">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    {item.label}
                  </li>
                );
              })}
            </ul>
          </div>

          <p className="text-[11.5px] leading-relaxed text-white/35">
            General nutrition guidance and estimates — not medical advice. Your
            data is private and never sold.
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="anim-rise w-full max-w-[410px]" style={{ animationDelay: '60ms' }}>
          <div className="mb-7 flex items-center justify-between lg:hidden">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white">
                <LogoMark className="h-5 w-5" />
              </span>
              <span className="text-lg font-semibold tracking-tight">NutriCal</span>
            </Link>
            <Link href="/" className="text-[12.5px] font-medium text-muted hover:text-ink">
              Back home
            </Link>
          </div>

          <div className="rounded-card border border-line bg-surface p-6 shadow-card sm:p-8">
            <p className="eyebrow text-brand">
              {recoveryMode ? 'Account recovery' : isSignUp ? 'Get started' : 'Welcome back'}
            </p>
            <h2 className="display mt-2 text-[30px]">
              {recoveryMode
                ? 'Set a new password'
                : isSignUp
                  ? 'Create your account'
                  : 'Sign in to NutriCal'}
            </h2>
            <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
              {recoveryMode
                ? 'Choose a new password for your account. You’ll sign in again after saving.'
                : isSignUp
                  ? 'Start tracking in under a minute. No card, no setup maze.'
                  : 'Pick up right where you left off.'}
            </p>

            {errorMsg && (
              <div className="mt-5">
                <Alert tone="danger">{errorMsg}</Alert>
              </div>
            )}
            {notice && (
              <div className="mt-5">
                <Alert tone="success">{notice}</Alert>
              </div>
            )}

            <form
              onSubmit={recoveryMode ? handleUpdatePassword : handleAuth}
              className="mt-6 space-y-4"
            >
              {!recoveryMode && (
                <div>
                  <label htmlFor="email" className="mb-1.5 block text-[12.5px] font-semibold text-ink-soft">
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
              )}

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="password" className="text-[12.5px] font-semibold text-ink-soft">
                    {recoveryMode ? 'New password' : 'Password'}
                  </label>
                  {!isSignUp && !recoveryMode && (
                    <button
                      type="button"
                      onClick={handlePasswordReset}
                      disabled={resetting}
                      className="text-[11.5px] font-semibold text-brand transition hover:text-brand-deep disabled:opacity-50"
                    >
                      {resetting ? 'Sending…' : 'Forgot password?'}
                    </button>
                  )}
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete={isSignUp || recoveryMode ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>

              {recoveryMode && (
                <div>
                  <label htmlFor="confirmPassword" className="mb-1.5 block text-[12.5px] font-semibold text-ink-soft">
                    Confirm new password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={inputClass}
                    placeholder="••••••••"
                    minLength={6}
                  />
                </div>
              )}

              <Button type="submit" size="lg" loading={loading} className="w-full">
                {recoveryMode
                  ? 'Update password'
                  : isSignUp
                    ? 'Create account'
                    : 'Sign in'}
              </Button>
            </form>

            {!recoveryMode && (
              <p className="mt-5 text-center text-[13px] text-muted">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setErrorMsg('');
                    setNotice('');
                  }}
                  className="font-semibold text-brand transition hover:text-brand-deep"
                >
                  {isSignUp ? 'Sign in' : 'Create account'}
                </button>
              </p>
            )}
          </div>

          <p className="mt-5 text-center text-[11px] leading-relaxed text-faint">
            By continuing you agree to use NutriCal as a general nutrition tool.
            Estimates are not medical advice.
          </p>
        </div>
      </div>
    </div>
  );
}
