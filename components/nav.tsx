'use client';

// Shared NutriCal navigation — desktop header + mobile bottom bar.

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  LogoMark,
  DashboardGrid,
  Chat,
  Plan,
  User,
  SignOut,
  Flame,
} from './icons';

export type NavKey = 'dashboard' | 'coach' | 'assess' | 'profile';

const LINKS: Array<{
  key: NavKey;
  label: string;
  href: string;
  icon: (props: { className?: string }) => React.ReactNode;
}> = [
  { key: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: DashboardGrid },
  { key: 'coach', label: 'Coach', href: '/coach', icon: Chat },
  { key: 'assess', label: 'Build Plan', href: '/assess', icon: Plan },
  { key: 'profile', label: 'Profile', href: '/profile', icon: User },
];

export function AppHeader({
  active,
  streak = 0,
  email,
  onSignOut,
}: {
  active: NavKey;
  streak?: number;
  email?: string | null;
  onSignOut: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => router.push('/dashboard')}
            className="mr-1 flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-2.5 transition hover:bg-surface-soft sm:mr-3"
            aria-label="Go to dashboard"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-white">
              <LogoMark className="h-[18px] w-[18px]" />
            </span>
            <span className="display text-[17px] text-ink">NutriCal</span>
          </button>

          <nav
            className="hidden items-center gap-0.5 md:flex"
            aria-label="Primary"
          >
            {LINKS.map((link) => {
              const isActive = active === link.key || pathname === link.href;
              return (
                <button
                  key={link.key}
                  onClick={() => router.push(link.href)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`rounded-full px-3.5 py-2 text-[13.5px] font-semibold transition ${
                    isActive
                      ? 'bg-ink text-white'
                      : 'text-muted hover:bg-surface-soft hover:text-ink'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div
            className="flex items-center gap-1.5 rounded-pill border border-line bg-paper px-2.5 py-1.5 text-xs font-semibold text-muted"
            title={
              streak > 0
                ? `${streak} consecutive day(s) hitting daily nutrition targets`
                : 'Hit your daily target (90%-110% calories) to build your streak'
            }
          >
            <Flame
              className={`h-3.5 w-3.5 ${streak > 0 ? 'text-ember' : 'text-faint'}`}
            />
            <span className="nums">
              {streak > 0 ? `${streak}d streak` : 'No streak'}
            </span>
          </div>

          {email && (
            <span className="hidden max-w-[140px] truncate text-xs text-faint lg:inline">
              {email}
            </span>
          )}

          <button
            onClick={onSignOut}
            className="flex items-center gap-1.5 rounded-full px-2.5 py-2 text-[13px] font-semibold text-muted transition hover:bg-surface-soft hover:text-ink"
          >
            <SignOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export function MobileNav({ active }: { active: NavKey }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur-md md:hidden"
      aria-label="Primary mobile"
    >
      <div className="mx-auto grid max-w-md grid-cols-4 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5">
        {LINKS.map((link) => {
          const isActive = active === link.key || pathname === link.href;
          const Icon = link.icon;
          return (
            <button
              key={link.key}
              onClick={() => router.push(link.href)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-control text-[11px] font-semibold transition ${
                isActive ? 'text-brand-deep' : 'text-faint active:text-ink'
              }`}
            >
              <Icon className="h-5 w-5" />
              {link.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
