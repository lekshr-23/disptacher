import type { ReactNode } from 'react';

export function StatusBadge({
  tone,
  children,
  className = '',
}: {
  tone: string;
  children: ReactNode;
  className?: string;
}) {
  const toneClass =
    {
      mint: 'bg-mint-50 text-mint-700 ring-mint-200',
      brand: 'bg-brand-50 text-brand-700 ring-brand-200',
      amber: 'bg-amber-50 text-amber-700 ring-amber-200',
      rose: 'bg-rose-50 text-rose-700 ring-rose-200',
      ink: 'bg-ink-100 text-ink-600 ring-ink-200',
    }[tone] ?? 'bg-ink-100 text-ink-600 ring-ink-200';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${toneClass} ${className}`}
    >
      {children}
    </span>
  );
}

export function StatusDot({ tone }: { tone: string }) {
  const dotClass =
    {
      mint: 'bg-mint-500',
      brand: 'bg-brand-500',
      amber: 'bg-amber-500',
      rose: 'bg-rose-500',
      ink: 'bg-ink-400',
    }[tone] ?? 'bg-ink-400';
  return (
    <span className={`inline-block h-1.5 w-1.5 rounded-full ${dotClass}`} />
  );
}

export function Card({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl bg-white ring-1 ring-ink-100 shadow-card ${className}`}
    >
      {children}
    </div>
  );
}

export function Avatar({
  name,
  hue,
  size = 'md',
}: {
  name: string;
  hue: number;
  size?: 'sm' | 'md' | 'lg';
}) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-14 w-14 text-base',
  };
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${sizes[size]}`}
      style={{
        background: `linear-gradient(135deg, hsl(${hue} 70% 48%), hsl(${hue} 70% 38%))`,
      }}
    >
      {initials}
    </span>
  );
}
