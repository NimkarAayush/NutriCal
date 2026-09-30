'use client';

// Shared NutriCal primitives — one visual language everywhere.

import React, { useEffect } from 'react';
import { X } from './icons';

/* ---------------- Button ---------------- */

type ButtonVariant = 'brand' | 'dark' | 'outline' | 'ghost' | 'danger-ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

const buttonVariants: Record<ButtonVariant, string> = {
  brand:
    'bg-brand text-white hover:bg-brand-deep shadow-card disabled:bg-brand/40',
  dark: 'bg-ink text-white hover:bg-ink-soft shadow-card disabled:opacity-40',
  outline:
    'border border-line bg-surface text-ink-soft hover:border-muted hover:bg-surface-soft disabled:opacity-40',
  ghost: 'text-muted hover:text-ink hover:bg-surface-soft disabled:opacity-40',
  'danger-ghost':
    'text-muted hover:text-danger hover:bg-danger-soft disabled:opacity-40',
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: 'px-3.5 py-1.5 text-[13px] rounded-full',
  md: 'px-5 py-2.5 text-sm rounded-full',
  lg: 'px-6 py-3 text-[15px] rounded-full',
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export function Button({
  variant = 'brand',
  size = 'md',
  loading = false,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`pressable inline-flex items-center justify-center gap-2 font-semibold tracking-tight transition focus-visible:outline-2 disabled:cursor-not-allowed ${buttonVariants[variant]} ${buttonSizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span
          className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  );
}

/* ---------------- Card ---------------- */

export function Card({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-card border border-line bg-surface shadow-card ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

/* ---------------- Section heading ---------------- */

export function SectionHeading({
  eyebrow,
  title,
  hint,
  action,
}: {
  eyebrow?: string;
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="eyebrow mb-1.5 text-faint">{eyebrow}</p>
        )}
        <h2 className="h-tight text-lg font-semibold text-ink">{title}</h2>
        {hint && <p className="mt-1 text-[13px] text-muted">{hint}</p>}
      </div>
      {action}
    </div>
  );
}

/* ---------------- Form field ---------------- */

export const inputClass =
  'w-full rounded-control border border-line bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-faint hover:border-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:opacity-50';

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label className="eyebrow mb-1.5 block text-muted">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-faint">{hint}</p>}
    </div>
  );
}

/* ---------------- Progress bar ---------------- */

export function Progress({
  value,
  colorClass = 'bg-brand',
  trackClass = 'bg-surface-soft',
  className = '',
  animate = true,
  label,
}: {
  value: number; // 0–100
  colorClass?: string;
  trackClass?: string;
  className?: string;
  animate?: boolean;
  label?: string;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      className={`h-1.5 w-full overflow-hidden rounded-full ${trackClass} ${className}`}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className={`h-full rounded-full ${colorClass} ${animate ? 'bar-grow' : ''}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

/* ---------------- Badge ---------------- */

export function Badge({
  tone = 'neutral',
  children,
  className = '',
}: {
  tone?: 'neutral' | 'brand' | 'ember';
  children: React.ReactNode;
  className?: string;
}) {
  const tones = {
    neutral: 'bg-surface-soft text-muted',
    brand: 'bg-brand-soft text-brand-deep',
    ember: 'bg-ember-soft text-ember',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-pill px-2.5 py-1 text-[11px] font-semibold tracking-wide ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

/* ---------------- Empty state ---------------- */

export function EmptyState({
  icon,
  title,
  hint,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-card border border-dashed border-line bg-surface/60 px-6 py-12 text-center">
      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-surface-soft text-faint">
        {icon}
      </div>
      <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
      {hint && (
        <p className="mx-auto mt-1 max-w-xs text-[13px] leading-relaxed text-muted">
          {hint}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ---------------- Alert banner ---------------- */

export function Alert({
  tone = 'danger',
  children,
  onDismiss,
}: {
  tone?: 'danger' | 'success';
  children: React.ReactNode;
  onDismiss?: () => void;
}) {
  const tones = {
    danger: 'border-danger/25 bg-danger-soft text-danger',
    success: 'border-brand/25 bg-brand-soft text-brand-deep',
  };
  return (
    <div
      role="alert"
      className={`anim-fade flex items-center justify-between gap-3 rounded-panel border px-4 py-3 text-sm font-medium ${tones[tone]}`}
    >
      <span>{children}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="rounded-full p-1 opacity-60 hover:opacity-100"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

/* ---------------- Loading state ---------------- */

export function LoadingState({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper">
      <div className="flex items-center gap-3">
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-brand border-t-transparent"
          aria-hidden="true"
        />
        <span className="text-sm font-medium text-muted">{label}</span>
      </div>
    </div>
  );
}

/* ---------------- Modal ---------------- */

export function Modal({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="anim-fade fixed inset-0 z-50 flex items-end justify-center bg-ink/45 p-0 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={`anim-pop w-full ${wide ? 'max-w-lg' : 'max-w-md'} rounded-t-[24px] border border-line bg-surface p-6 shadow-pop sm:rounded-card`}
      >
        <div className="mb-5 flex items-center justify-between border-b border-line-soft pb-4">
          <h3 className="h-tight text-base font-semibold text-ink">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-faint hover:bg-surface-soft hover:text-ink"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ---------------- Data stat ---------------- */

export function Stat({
  label,
  value,
  unit,
  sub,
  accentClass = 'text-ink',
}: {
  label: string;
  value: React.ReactNode;
  unit?: string;
  sub?: React.ReactNode;
  accentClass?: string;
}) {
  return (
    <div>
      <p className="eyebrow text-faint">{label}</p>
      <p className={`nums mt-1 text-[26px] font-semibold tracking-tight ${accentClass}`}>
        {value}
        {unit && (
          <span className="ml-1 text-[13px] font-medium text-faint">{unit}</span>
        )}
      </p>
      {sub}
    </div>
  );
}
