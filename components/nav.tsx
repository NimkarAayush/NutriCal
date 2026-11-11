'use client';

// Shared NutriCal app shell — dark emerald sidebar on desktop,
// top bar with account menu, and a dedicated mobile bottom navigation.

import React, { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Progress } from './ui';
import {
  LogoMark,
  DashboardGrid,
  Chat,
  Plan,
  User,
  SignOut,
  Flame,
  ChartBar,
  Clock,
  Settings,
  Calendar,
  Plus,
  ChevronRight,
  ChevronDown,
} from './icons';

export type NavKey =
  | 'dashboard'
  | 'coach'
  | 'assess'
  | 'analytics'
  | 'history'
  | 'profile'
  | 'settings';

const NAV_ITEMS: Array<{
  key: NavKey;
  label: string;
  href: string;
  icon: (props: { className?: string }) => React.ReactNode;
}> = [
  { key: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: DashboardGrid },
  { key: 'coach', label: 'AI Coach', href: '/coach', icon: Chat },
  { key: 'assess', label: 'Build Plan', href: '/assess', icon: Plan },
  { key: 'analytics', label: 'Analytics', href: '/analytics', icon: ChartBar },
  { key: 'history', label: 'History', href: '/history', icon: Clock },
  { key: 'profile', label: 'Profile', href: '/profile', icon: User },
  { key: 'settings', label: 'Settings', href: '/settings', icon: Settings },
];

const SECTION_LABEL: Record<NavKey, string> = {
  dashboard: 'Dashboard',
  coach: 'AI Coach',
  assess: 'Build Plan',
  analytics: 'Analytics',
  history: 'History',
  profile: 'Profile',
  settings: 'Settings',
};

const MOBILE_ITEMS: NavKey[] = ['dashboard', 'coach', 'analytics', 'history', 'profile'];

function initialsFrom(name?: string | null, email?: string | null): string {
  const source = name?.trim() || email?.split('@')[0] || 'N';
  const parts = source.replace(/[._-]+/g, ' ').split(/\s+/).filter(Boolean);
  const letters = parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase());
  return letters.join('') || 'N';
}

function avatarTone(seed: string): string {
  const tones = [
    'bg-brand-soft text-brand',
    'bg-teal-soft text-teal',
    'bg-macro-protein-soft text-macro-protein',
    'bg-macro-carbs-soft text-macro-carbs',
    'bg-macro-fats-soft text-macro-fats',
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) % 997;
  return tones[hash % tones.length];
}

export function AppShell({
  active,
  children,
  userEmail,
  userName,
  streak,
  fullHeight = false,
}: {
  active: NavKey;
  children: React.ReactNode;
  userEmail?: string | null;
  userName?: string | null;
  streak?: number;
  fullHeight?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dateLabel, setDateLabel] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Deferred so the first client render matches the server output, then the
    // local date fills in without a synchronous cascading render.
    const frame = requestAnimationFrame(() => {
      setDateLabel(
        new Date().toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      );
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [menuOpen]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const initials = initialsFrom(userName, userEmail);
  const tone = avatarTone(initials);

  return (
    <div className={fullHeight ? 'h-dvh overflow-hidden bg-paper' : 'min-h-dvh bg-paper'}>
      {/* ---------------- Sidebar (desktop) ---------------- */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[252px] flex-col bg-brand-ink text-white lg:flex">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2.5 px-6 pb-5 pt-6 text-left"
          aria-label="NutriCal dashboard"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/10">
            <LogoMark className="h-5 w-5" />
          </span>
          <span className="text-[19px] font-semibold tracking-tight">NutriCal</span>
        </button>

        <div className="px-4 pb-1">
          <button
            onClick={() => router.push('/dashboard#log-meal')}
            className="pressable flex w-full items-center justify-center gap-2 rounded-control bg-[#167a52] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1b8b5d]"
          >
            <Plus className="h-4 w-4" />
            Log a meal
          </button>
        </div>

        <nav className="thin-scroll mt-6 flex-1 space-y-1 overflow-y-auto px-3" aria-label="Primary">
          {NAV_ITEMS.map((item) => {
            const isActive = active === item.key || pathname === item.href;
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => router.push(item.href)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative flex w-full items-center gap-3 rounded-control px-3.5 py-2.5 text-left text-[13.5px] font-medium transition ${
                  isActive
                    ? 'bg-white/[0.11] text-white'
                    : 'text-white/65 hover:bg-white/[0.06] hover:text-white'
                }`}
              >
                {isActive && (
                  <span
                    className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-leaf"
                    aria-hidden="true"
                  />
                )}
                <Icon className={`h-[18px] w-[18px] ${isActive ? 'text-leaf' : ''}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="space-y-3 px-4 pb-5 pt-4">
          <div className="rounded-panel bg-white/[0.06] p-3.5 ring-1 ring-white/10">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white/45">
              <Flame className={`h-3.5 w-3.5 ${streak && streak > 0 ? 'text-ember' : 'text-white/40'}`} />
              Stay on track
            </div>
            <p className="mt-1.5 text-[13px] font-semibold text-white">
              {typeof streak === 'number'
                ? streak > 0
                  ? `${streak}-day streak`
                  : 'Start your streak'
                : 'Track today’s meals'}
            </p>
            <Progress
              value={typeof streak === 'number' ? Math.min((streak / 7) * 100, 100) : 0}
              colorClass="bg-leaf"
              trackClass="bg-white/10"
              className="mt-2.5"
            />
            <p className="mt-2 text-[10.5px] leading-relaxed text-white/45">
              {typeof streak === 'number'
                ? 'Hit 90–110% of your calorie target to extend it.'
                : 'Log a meal and see today’s picture.'}
            </p>
          </div>

          <div className="flex items-center gap-2 border-t border-white/10 pt-3.5">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${tone}`}
            >
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12.5px] font-semibold text-white/90">
                {userName || 'Your account'}
              </p>
              <p className="truncate text-[10.5px] text-white/40">{userEmail || ''}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="rounded-full p-1.5 text-white/45 transition hover:bg-white/10 hover:text-white"
              title="Sign out"
              aria-label="Sign out"
            >
              <SignOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ---------------- Content column ---------------- */}
      <div className="flex h-full min-h-0 flex-col lg:pl-[252px]">
        <header className="sticky top-0 z-30 border-b border-line bg-paper/85 backdrop-blur-md">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="hidden items-center gap-2 text-[13px] md:flex">
              <span className="font-medium text-faint">NutriCal</span>
              <ChevronRight className="h-3.5 w-3.5 text-faint" />
              <span className="font-semibold text-ink">{SECTION_LABEL[active]}</span>
            </div>

            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 md:hidden"
              aria-label="NutriCal dashboard"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white">
                <LogoMark className="h-4.5 w-4.5" />
              </span>
              <span className="text-[17px] font-semibold tracking-tight">NutriCal</span>
            </button>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="hidden items-center gap-2 rounded-pill border border-line bg-surface px-3 py-1.5 text-[12px] font-medium text-muted shadow-card sm:flex">
                <Calendar className="h-3.5 w-3.5 text-faint" />
                {dateLabel}
              </span>

              {typeof streak === 'number' && streak > 0 && (
                <span className="hidden items-center gap-1.5 rounded-pill border border-line bg-surface px-3 py-1.5 text-[12px] font-semibold text-ink-soft shadow-card md:flex">
                  <Flame className="h-3.5 w-3.5 text-ember" />
                  {streak} day{streak === 1 ? '' : 's'}
                </span>
              )}

              <button
                onClick={() => router.push('/dashboard#log-meal')}
                className="pressable hidden items-center gap-1.5 rounded-control bg-brand px-3.5 py-2 text-[12.5px] font-semibold text-white shadow-card transition hover:bg-brand-deep sm:flex"
              >
                <Plus className="h-3.5 w-3.5" />
                Log meal
              </button>

              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((open) => !open)}
                  className="flex items-center gap-1.5 rounded-full p-0.5 pr-1 transition hover:bg-surface-soft"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  aria-label="Account menu"
                >
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-bold ${tone}`}
                  >
                    {initials}
                  </span>
                  <ChevronDown className="hidden h-3.5 w-3.5 text-faint sm:block" />
                </button>

                {menuOpen && (
                  <div
                    role="menu"
                    className="anim-pop absolute right-0 top-[calc(100%+8px)] z-50 w-60 overflow-hidden rounded-card border border-line bg-surface p-1.5 shadow-pop"
                  >
                    <div className="border-b border-line-soft px-3 py-2.5">
                      <p className="truncate text-[13px] font-semibold text-ink">
                        {userName || 'Your account'}
                      </p>
                      <p className="truncate text-[11px] text-faint">{userEmail || ''}</p>
                    </div>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        router.push('/profile');
                      }}
                      className="flex w-full items-center gap-2.5 rounded-control px-3 py-2 text-left text-[13px] font-medium text-ink-soft transition hover:bg-surface-soft"
                      role="menuitem"
                    >
                      <User className="h-4 w-4 text-faint" />
                      Profile
                    </button>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        router.push('/settings');
                      }}
                      className="flex w-full items-center gap-2.5 rounded-control px-3 py-2 text-left text-[13px] font-medium text-ink-soft transition hover:bg-surface-soft"
                      role="menuitem"
                    >
                      <Settings className="h-4 w-4 text-faint" />
                      Settings
                    </button>
                    <div className="my-1 border-t border-line-soft" />
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2.5 rounded-control px-3 py-2 text-left text-[13px] font-medium text-danger transition hover:bg-danger-soft"
                      role="menuitem"
                    >
                      <SignOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main
          className={
            fullHeight
              ? 'flex min-h-0 flex-1 flex-col overflow-hidden px-3 pb-[calc(70px+env(safe-area-inset-bottom))] pt-3 sm:px-6 lg:px-8 lg:pb-4'
              : 'flex-1 px-4 pb-[calc(88px+env(safe-area-inset-bottom))] pt-6 sm:px-6 lg:px-8 lg:pb-10'
          }
        >
          {children}
        </main>
      </div>

      {/* ---------------- Mobile navigation ---------------- */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur-md lg:hidden"
        aria-label="Primary mobile"
      >
        <div className="mx-auto grid max-w-md grid-cols-5 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5">
          {MOBILE_ITEMS.map((key) => {
            const item = NAV_ITEMS.find((entry) => entry.key === key)!;
            const Icon = item.icon;
            const isActive = active === key || pathname === item.href;
            return (
              <button
                key={key}
                onClick={() => router.push(item.href)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex min-h-[54px] flex-col items-center justify-center gap-1 rounded-control text-[10.5px] font-semibold transition ${
                  isActive ? 'text-brand' : 'text-faint active:text-ink'
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
