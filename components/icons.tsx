// Consistent NutriCal icon set — single stroke style, no emoji.
// 24x24 viewBox, 1.8px stroke, round caps. Size via className.

import React from 'react';

type IconProps = React.SVGProps<SVGSVGElement>;

function Base({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function LogoMark(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 21c-5 0-8-3.2-8-7.5C4 8 8.5 4.5 12 3c3.5 1.5 8 5 8 10.5 0 4.3-3 7.5-8 7.5Z" />
      <path d="M12 21c0-6 1.5-10.5 5-13.5" />
    </Base>
  );
}

export function Plus(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 5v14M5 12h14" />
    </Base>
  );
}

export function ArrowLeft(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </Base>
  );
}

export function ChevronLeft(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M15 18l-6-6 6-6" />
    </Base>
  );
}

export function ChevronRight(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M9 18l6-6-6-6" />
    </Base>
  );
}

export function Flame(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 22c4 0 7-2.8 7-6.8 0-3.2-2-5.4-3.6-7C14 6.6 13 5 13 2.5 9.5 5 8 8 8 10.5c-1-.5-1.8-1.4-2.2-2.7C4.6 9.4 5 10.5 5 15.2 5 19.2 8 22 12 22Z" />
    </Base>
  );
}

export function Chat(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M21 11.5c0 4-3.8 7-8.5 7-1 0-2-.2-2.9-.5L4 19l1.2-3.4C3.8 14.3 3 12.9 3 11.5 3 7.5 6.8 4.5 11.5 4.5S20 7.5 21 11.5Z" />
    </Base>
  );
}

export function Target(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </Base>
  );
}

export function Plan(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M9 11l3 3 8-8" />
      <path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h11" />
    </Base>
  );
}

export function User(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
    </Base>
  );
}

export function Trash(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    </Base>
  );
}

export function X(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M18 6 6 18M6 6l12 12" />
    </Base>
  );
}

export function Check(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M20 6 9 17l-5-5" />
    </Base>
  );
}

export function Spark(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l2.5 2.5M16.5 16.5 19 19M19 5l-2.5 2.5M7.5 16.5 5 19" />
      <circle cx="12" cy="12" r="3.2" />
    </Base>
  );
}

export function ArrowRight(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M5 12h14M12 5l7 7-7 7" />
    </Base>
  );
}

export function Leaf(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M5 19C5 9 13 4 20 4c0 8-5 15-15 15Z" />
      <path d="M5 19c3-5 7-9 12-11" />
    </Base>
  );
}

export function Bowl(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 12h16a8 8 0 0 1-16 0Z" />
      <path d="M9 8c0-2 1-3 1-5M14 8c0-2 1-3 1-5" />
    </Base>
  );
}

export function DashboardGrid(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3" y="3" width="7.5" height="7.5" rx="2" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="2" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="2" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" />
    </Base>
  );
}

export function SignOut(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
    </Base>
  );
}

export function Calendar(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
      <path d="M8 2.5v4M16 2.5v4M3 10h18" />
    </Base>
  );
}

export function Bell(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M18 8a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6" />
      <path d="M10.3 20a2 2 0 0 0 3.4 0" />
    </Base>
  );
}

export function Search(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" />
    </Base>
  );
}

export function ChartBar(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </Base>
  );
}

export function Clock(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.2 2" />
    </Base>
  );
}

export function Settings(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6h.09A1.7 1.7 0 0 0 10 3.05V3a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9v.09a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1Z" />
    </Base>
  );
}

export function Droplet(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 2.7s6 6.2 6 11a6 6 0 0 1-12 0c0-4.8 6-11 6-11Z" />
    </Base>
  );
}

export function Trophy(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" />
      <path d="M8 5H4v2a4 4 0 0 0 4 4M16 5h4v2a4 4 0 0 1-4 4M12 13v4M8 21h8M10 17h4" />
    </Base>
  );
}

export function Scale(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <path d="M8 15a4 4 0 0 1 8 0" />
      <path d="M12 15l1.8-3.5" />
    </Base>
  );
}

export function Sun(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </Base>
  );
}

export function Moon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
    </Base>
  );
}

export function Menu(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Base>
  );
}

export function ChevronDown(props: IconProps) {
  return (
    <Base {...props}>
      <path d="m6 9 6 6 6-6" />
    </Base>
  );
}

export function Dumbbell(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M6.5 6.5v11M3 9v6M17.5 6.5v11M21 9v6M6.5 12h11" />
    </Base>
  );
}

export function TrendUp(props: IconProps) {
  return (
    <Base {...props}>
      <path d="m3 17 6-6 4 4 7-7" />
      <path d="M15 8h5v5" />
    </Base>
  );
}

export function ArrowUpRight(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M7 17 17 7M8 7h9v9" />
    </Base>
  );
}

export function Monitor(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3" y="4" width="18" height="12.5" rx="2" />
      <path d="M8 20h8M12 16.5V20" />
    </Base>
  );
}

export function Download(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 3v12M7.5 10.5 12 15l4.5-4.5" />
      <path d="M4 19.5h16" />
    </Base>
  );
}

