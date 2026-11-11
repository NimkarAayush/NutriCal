'use client';

// Lightweight, dependency-free chart primitives.
// Everything is SVG/CSS so it inherits the design tokens and themes.

import React, { useEffect, useId, useMemo, useState } from 'react';

/* ---------------- Progress ring ---------------- */

export function ProgressRing({
  value,
  size = 168,
  stroke = 13,
  color = 'var(--color-brand)',
  trackColor = 'var(--color-surface-soft)',
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  trackColor?: string;
  children?: React.ReactNode;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const [shown, setShown] = useState(0);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(clamped));
    return () => cancelAnimationFrame(frame);
  }, [clamped]);

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${Math.round(clamped)} percent of daily goal`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - shown / 100)}
          className="ring-progress"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  );
}

/* ---------------- Line chart ---------------- */

export interface ChartSeries {
  key: string;
  label: string;
  color: string;
  values: number[];
}

// Picks a readable axis step. The ladder is deliberately fine-grained:
// jumping straight from 2 to 5 wastes a lot of vertical space (a 2,250 kcal
// day on a 5,000 axis looks flat).
function niceStep(value: number): number {
  if (value <= 0) return 1;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / magnitude;
  const steps = [1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
  const step = steps.find((candidate) => normalized <= candidate) ?? 10;
  return step * magnitude;
}

// Formats an axis label. Larger values collapse to "k" so the axis stays narrow.
function formatTick(value: number): string {
  if (value >= 1000) return `${Math.round(value / 100) / 10}k`;
  return String(value);
}

function buildSmoothPath(points: Array<[number, number]>): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0][0]} ${points[0][1]}`;

  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const current = points[i];
    const midX = (prev[0] + current[0]) / 2;
    d += ` C ${midX} ${prev[1]}, ${midX} ${current[1]}, ${current[0]} ${current[1]}`;
  }
  return d;
}

export function LineChart({
  labels,
  series,
  height = 220,
  goal,
  goalLabel,
  valueSuffix = '',
}: {
  labels: string[];
  series: ChartSeries[];
  height?: number;
  goal?: number;
  goalLabel?: string;
  valueSuffix?: string;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const width = 640;
  const padding = { top: 16, right: 14, bottom: 28, left: 42 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  // Five evenly spaced gridlines on a "nice" step, so the axis reads
  // 0 / 500 / 1k / 1.5k / 2k instead of arbitrary rounded values.
  const { max, step } = useMemo(() => {
    const values = series.flatMap((s) => s.values);
    const peak = Math.max(...values, goal ?? 0, 1);
    const chosen = niceStep((peak * 1.1) / 4);
    return { max: chosen * 4, step: chosen };
  }, [series, goal]);

  const count = Math.max(labels.length, 2);
  const xFor = (index: number) => padding.left + (index / (count - 1)) * innerW;
  const yFor = (value: number) =>
    padding.top + innerH - (Math.max(0, value) / max) * innerH;

  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const first = series[0];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto w-full"
      role="img"
      aria-label={`${series.map((s) => s.label).join(', ')} trend chart`}
    >
      <defs>
        <linearGradient id={`area-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={first?.color ?? 'var(--color-brand)'} stopOpacity="0.22" />
          <stop offset="100%" stopColor={first?.color ?? 'var(--color-brand)'} stopOpacity="0" />
        </linearGradient>
      </defs>

      {ticks.map((tick) => {
        const y = padding.top + innerH * tick;
        const value = step * (4 - Math.round(tick * 4));
        return (
          <g key={tick}>
            <line
              x1={padding.left}
              x2={width - padding.right}
              y1={y}
              y2={y}
              stroke="var(--color-line-soft)"
              strokeWidth="1"
            />
            <text
              x={padding.left - 8}
              y={y + 3.5}
              textAnchor="end"
              fontSize="10"
              fill="var(--color-faint)"
            >
              {formatTick(value)}
            </text>
          </g>
        );
      })}

      {goal !== undefined && (
        <g>
          <line
            x1={padding.left}
            x2={width - padding.right}
            y1={yFor(goal)}
            y2={yFor(goal)}
            stroke="var(--color-faint)"
            strokeWidth="1"
            strokeDasharray="4 5"
          />
          {goalLabel && (
            <text
              x={width - padding.right}
              y={Math.max(yFor(goal) - 6, padding.top + 9)}
              textAnchor="end"
              fontSize="9"
              fill="var(--color-faint)"
              // Halo keeps the label readable where a series line runs beneath it.
              stroke="var(--color-surface)"
              strokeWidth="3"
              paintOrder="stroke"
            >
              {goalLabel}
            </text>
          )}
        </g>
      )}

      {first && (
        <path
          d={`${buildSmoothPath(first.values.map((v, i) => [xFor(i), yFor(v)]))} L ${xFor(
            first.values.length - 1
          )} ${padding.top + innerH} L ${xFor(0)} ${padding.top + innerH} Z`}
          fill={`url(#area-${uid})`}
        />
      )}

      {series.map((s, seriesIndex) => (
        <path
          key={s.key}
          d={buildSmoothPath(s.values.map((v, i) => [xFor(i), yFor(v)]))}
          fill="none"
          stroke={s.color}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          className="chart-line"
          style={{ '--d': `${seriesIndex * 120}ms` } as React.CSSProperties}
        />
      ))}

      {series.map((s) =>
        s.values.map((value, index) =>
          value > 0 ? (
            <circle
              key={`${s.key}-${index}`}
              cx={xFor(index)}
              cy={yFor(value)}
              r="2.4"
              fill="var(--color-surface)"
              stroke={s.color}
              strokeWidth="1.5"
            >
              <title>{`${s.label}: ${Math.round(value)}${valueSuffix}`}</title>
            </circle>
          ) : null
        )
      )}

      {labels.map((label, index) => (
        <text
          key={`${label}-${index}`}
          x={xFor(index)}
          y={height - 8}
          textAnchor="middle"
          fontSize="10"
          fill="var(--color-faint)"
        >
          {label}
        </text>
      ))}
    </svg>
  );
}

export function ChartLegend({ series }: { series: ChartSeries[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {series.map((s) => (
        <span key={s.key} className="flex items-center gap-1.5 text-[11px] font-medium text-muted">
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: s.color }}
            aria-hidden="true"
          />
          {s.label}
        </span>
      ))}
    </div>
  );
}

/* ---------------- Bars ---------------- */

export function BarChart({
  labels,
  values,
  goal,
  color = 'var(--color-brand)',
  height = 150,
  valueSuffix = '',
}: {
  labels: string[];
  values: number[];
  goal?: number;
  color?: string;
  height?: number;
  valueSuffix?: string;
}) {
  const max = Math.max(...values, goal ?? 0, 1) * 1.1;

  return (
    <div className="w-full">
      <div className="relative w-full" style={{ height }}>
        {goal !== undefined && (
          <div
            className="absolute inset-x-0 border-t border-dashed border-faint/60"
            style={{ bottom: `${(goal / max) * 100}%` }}
          >
            <span className="absolute right-0 -top-4 text-[9px] font-medium text-faint">
              goal
            </span>
          </div>
        )}
        <div className="flex h-full items-end gap-1.5 sm:gap-2">
          {values.map((value, index) => {
            const pct = Math.max(0, Math.min(100, (value / max) * 100));
            return (
              <div key={`${labels[index]}-${index}`} className="group relative flex h-full flex-1 flex-col justify-end">
                <div
                  className="chart-bar w-full rounded-t-[5px] opacity-90 transition group-hover:opacity-100"
                  style={{
                    height: `${pct}%`,
                    background: color,
                    '--d': `${index * 35}ms`,
                  } as React.CSSProperties}
                  title={`${labels[index]}: ${Math.round(value)}${valueSuffix}`}
                />
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-2 flex gap-1.5 sm:gap-2">
        {labels.map((label, index) => (
          <span
            key={`${label}-${index}`}
            className="flex-1 truncate text-center text-[9px] text-faint sm:text-[10px]"
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Donut ---------------- */

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

export function DonutChart({
  slices,
  size = 176,
  stroke = 22,
  centerLabel,
  centerValue,
}: {
  slices: DonutSlice[];
  size?: number;
  stroke?: number;
  centerLabel?: string;
  centerValue?: string;
}) {
  const total = slices.reduce((sum, slice) => sum + Math.max(0, slice.value), 0) || 1;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const arcs = slices.map((slice, index) => {
    const previous = slices
      .slice(0, index)
      .reduce((sum, item) => sum + Math.max(0, item.value), 0);
    const fraction = Math.max(0, slice.value) / total;
    return {
      ...slice,
      dash: fraction * circumference,
      offset: (previous / total) * circumference,
    };
  });

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label="Macro distribution"
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-surface-soft)"
          strokeWidth={stroke}
        />
        {arcs.map((arc) => (
          <circle
            key={arc.label}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={arc.color}
            strokeWidth={stroke}
            strokeLinecap="butt"
            strokeDasharray={`${Math.max(arc.dash - 3, 0)} ${circumference}`}
            strokeDashoffset={-arc.offset}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {centerValue && (
          <span className="nums display text-2xl leading-none">{centerValue}</span>
        )}
        {centerLabel && (
          <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">
            {centerLabel}
          </span>
        )}
      </div>
    </div>
  );
}
