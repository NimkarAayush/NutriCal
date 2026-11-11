'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { todayKey } from '@/lib/stats';
import { AppShell } from '@/components/nav';
import { Button, Card, Alert, LoadingState } from '@/components/ui';
import {
  User,
  Sun,
  Moon,
  Monitor,
  Download,
  Trash,
  SignOut,
  ArrowRight,
  Check,
  Settings as SettingsIcon,
  Spark,
} from '@/components/icons';

type Theme = 'light' | 'dark' | 'system';

const THEME_OPTIONS: Array<{
  value: Theme;
  label: string;
  hint: string;
  icon: (props: { className?: string }) => React.ReactNode;
}> = [
  { value: 'light', label: 'Light', hint: 'Bright and warm', icon: Sun },
  { value: 'dark', label: 'Dark', hint: 'Low-light friendly', icon: Moon },
  { value: 'system', label: 'System', hint: 'Match your device', icon: Monitor },
];

function SettingCard({
  icon,
  title,
  description,
  children,
  delay = 0,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <Card className="anim-rise p-5" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-mist text-brand-deep">
          {icon}
        </span>
        <div>
          <p className="text-[14px] font-semibold">{title}</p>
          <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted">{description}</p>
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </Card>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [memberSince, setMemberSince] = useState('');
  const [theme, setTheme] = useState<Theme>('light');

  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [securityNotice, setSecurityNotice] = useState('');
  const [sendingReset, setSendingReset] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      setEmail(user.email ?? '');
      if (user.created_at) {
        setMemberSince(
          new Date(user.created_at).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })
        );
      }

      const { data: profileRow } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .single();
      if (profileRow?.full_name) setName(profileRow.full_name);

      try {
        const stored = window.localStorage.getItem('nutrical-theme');
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          setTheme(stored);
        }
      } catch {
        // Storage blocked — the default 'system' theme still applies.
      }

      setLoading(false);
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyTheme = (next: Theme) => {
    setTheme(next);
    try {
      window.localStorage.setItem('nutrical-theme', next);
    } catch {
      // Storage blocked — the theme still applies for this session.
    }
    const isDark =
      next === 'dark' ||
      (next === 'system' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', isDark);
  };

  const handlePasswordReset = async () => {
    setError('');
    setSecurityNotice('');
    if (!email) {
      setError('No email address is associated with this account.');
      return;
    }
    setSendingReset(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (error) throw error;
      setSecurityNotice('Password reset email sent. Check your inbox.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not send the reset email');
    } finally {
      setSendingReset(false);
    }
  };

  const handleExport = async () => {
    setError('');
    setNotice('');
    setExporting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('You are not signed in.');

      const [{ data: profile }, { data: goals }, { data: meals }] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', user.id).single(),
        supabase.from('nutrition_goals').select('*').eq('user_id', user.id).single(),
        supabase
          .from('meal_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('logged_date', { ascending: true }),
      ]);

      const payload = {
        exported_at: new Date().toISOString(),
        account: { email: user.email },
        profile: profile ?? null,
        nutrition_goals: goals ?? null,
        meal_logs: meals ?? [],
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `nutrical-export-${todayKey()}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);

      setNotice('Your data export has been downloaded.');
      setTimeout(() => setNotice(''), 4000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not export your data');
    } finally {
      setExporting(false);
    }
  };

  const handleClearChats = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    setClearing(true);
    try {
      const keys: string[] = [];
      for (let index = 0; index < window.localStorage.length; index++) {
        const key = window.localStorage.key(index);
        if (
          key &&
          (key.startsWith('nutrical:coach:chat') ||
            key.startsWith('nutrical:assess:chat'))
        ) {
          keys.push(key);
        }
      }
      for (const key of keys) window.localStorage.removeItem(key);
      setNotice(
        keys.length === 0
          ? 'There were no saved conversations to clear.'
          : `${keys.length} saved conversation${keys.length === 1 ? '' : 's'} cleared.`
      );
      setTimeout(() => setNotice(''), 4000);
    } catch {
      setError('Could not access browser storage to clear chats.');
    } finally {
      setClearing(false);
      setConfirmClear(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return <LoadingState label="Loading settings..." />;
  }

  return (
    <AppShell active="settings" userEmail={email} userName={name || undefined}>
      <div className="mx-auto w-full max-w-5xl space-y-4 sm:space-y-5">
        <div className="anim-rise pt-1">
          <p className="eyebrow text-brand">Settings</p>
          <h1 className="display mt-1.5 text-[28px] sm:text-[34px]">
            Account & preferences.
          </h1>
          <p className="mt-1.5 text-[13.5px] text-muted">
            Manage your account, appearance and the data NutriCal keeps.
          </p>
        </div>

        {notice && <Alert tone="success">{notice}</Alert>}
        {error && (
          <Alert tone="danger" onDismiss={() => setError('')}>
            {error}
          </Alert>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Account */}
          <SettingCard
            icon={<User className="h-4 w-4" />}
            title="Account"
            description="The identity behind your nutrition data."
            delay={40}
          >
            <div className="flex items-center gap-3 rounded-panel bg-paper p-3.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[13px] font-bold text-brand">
                {(name || email || 'N')
                  .split(/[\s@._-]+/)
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => part.charAt(0).toUpperCase())
                  .join('') || 'N'}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[13.5px] font-semibold">{name || 'Your account'}</p>
                <p className="truncate text-[11px] text-muted">{email}</p>
              </div>
            </div>

            <dl className="mt-3 space-y-2.5 text-[12px]">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Sign-in method</dt>
                <dd className="font-medium text-ink-soft">Email & password</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Member since</dt>
                <dd className="font-medium text-ink-soft">{memberSince || '—'}</dd>
              </div>
            </dl>

            <Button
              variant="outline"
              size="sm"
              className="mt-4 w-full"
              onClick={() => router.push('/profile')}
            >
              Manage profile
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </SettingCard>

          {/* Appearance */}
          <SettingCard
            icon={<Sun className="h-4 w-4" />}
            title="Appearance"
            description="Theme is saved on this device. System follows your OS setting."
            delay={80}
          >
            <div className="grid grid-cols-3 gap-2">
              {THEME_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isActive = theme === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => applyTheme(option.value)}
                    aria-pressed={isActive}
                    className={`flex flex-col items-center gap-1.5 rounded-panel border px-2 py-3 text-center transition ${
                      isActive
                        ? 'border-brand bg-brand-mist text-brand shadow-card'
                        : 'border-line bg-surface text-muted hover:border-faint'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-[11.5px] font-semibold">{option.label}</span>
                    <span className="text-[9.5px] leading-tight text-faint">{option.hint}</span>
                  </button>
                );
              })}
            </div>

            <p className="mt-3 flex items-center gap-1.5 text-[10.5px] text-faint">
              <Check className="h-3 w-3 text-brand" />
              Charts, cards and the sidebar all adapt automatically.
            </p>
          </SettingCard>

          {/* Security */}
          <SettingCard
            icon={<SettingsIcon className="h-4 w-4" />}
            title="Password & security"
            description="We’ll email you a secure link to set a new password."
            delay={120}
          >
            {securityNotice && (
              <div className="mb-3">
                <Alert tone="success">{securityNotice}</Alert>
              </div>
            )}
            <div className="flex items-center justify-between gap-3 rounded-panel bg-paper px-3.5 py-3">
              <div className="min-w-0">
                <p className="text-[12px] font-semibold">Account email</p>
                <p className="truncate text-[11px] text-muted">{email}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                loading={sendingReset}
                onClick={handlePasswordReset}
              >
                Send reset link
              </Button>
            </div>
            <p className="mt-3 text-[10.5px] leading-relaxed text-faint">
              The reset link returns you to the NutriCal sign-in page. Your
              nutrition data is never included in email.
            </p>
          </SettingCard>

          {/* Data */}
          <SettingCard
            icon={<Download className="h-4 w-4" />}
            title="Your data"
            description="Export a JSON copy or clear locally saved coach conversations."
            delay={160}
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-3 rounded-panel border border-line px-3.5 py-3">
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold">Export everything</p>
                  <p className="text-[10.5px] text-muted">Profile, goals and all meal logs</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  loading={exporting}
                  onClick={handleExport}
                >
                  Export
                </Button>
              </div>

              <div className="flex items-center justify-between gap-3 rounded-panel border border-line px-3.5 py-3">
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold">Clear saved chats</p>
                  <p className="text-[10.5px] text-muted">
                    Coach and plan conversations on this device
                  </p>
                </div>
                <Button
                  variant={confirmClear ? 'danger-ghost' : 'outline'}
                  size="sm"
                  loading={clearing}
                  onClick={handleClearChats}
                  onBlur={() => setConfirmClear(false)}
                >
                  <Trash className="h-3.5 w-3.5" />
                  {confirmClear ? 'Confirm clear' : 'Clear chats'}
                </Button>
              </div>
            </div>

            <p className="mt-3 flex items-start gap-1.5 text-[10.5px] leading-relaxed text-faint">
              <Spark className="mt-0.5 h-3 w-3 shrink-0 text-brand" />
              Meal logs and goals live in your NutriCal account. Chat history is
              stored only in this browser.
            </p>
          </SettingCard>
        </div>

        {/* Sign out */}
        <Card className="anim-rise flex flex-wrap items-center justify-between gap-3 p-5" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-danger-soft text-danger">
              <SignOut className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[13.5px] font-semibold">Sign out of NutriCal</p>
              <p className="text-[11.5px] text-muted">
                You can sign back in anytime; your data stays in your account.
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <SignOut className="h-3.5 w-3.5" />
            Sign out
          </Button>
        </Card>

        <p className="pb-2 text-center text-[10.5px] leading-relaxed text-faint">
          NutriCal provides general nutrition estimates, not medical advice.
        </p>
      </div>
    </AppShell>
  );
}
