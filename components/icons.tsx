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
