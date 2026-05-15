'use client';

import React from 'react';
import { sdVars as SD } from '@/lib/sd-vars';

// ── Stat ──────────────────────────────────────────────────────────────────────
interface StatProps {
  label: string;
  value: string | number;
  unit?: string;
  accent?: string;
  mono?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  sub?: string;
}

export function Stat({ label, value, unit, accent, mono = true, size = 'md', sub }: StatProps) {
  const sizes = { sm: 22, md: 34, lg: 56, xl: 78 };
  const fs = sizes[size];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div className="sd-label" style={{ fontSize: 10 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <div
          className={mono ? 'sd-mono' : 'sd-display'}
          style={{ fontSize: fs, lineHeight: 0.95, color: accent || SD.text, fontWeight: mono ? 600 : 900 }}
        >
          {value}
        </div>
        {unit && (
          <div className="sd-mono" style={{ fontSize: Math.max(11, fs * 0.28), color: SD.textDim }}>
            {unit}
          </div>
        )}
      </div>
      {sub && <div className="sd-mono" style={{ fontSize: 10, color: SD.textMute }}>{sub}</div>}
    </div>
  );
}

// ── Panel ─────────────────────────────────────────────────────────────────────
interface PanelProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  accent?: string;
  title?: string;
  kicker?: string;
  tools?: React.ReactNode;
  padding?: number;
  dense?: boolean;
}

export function Panel({ children, style = {}, accent, title, kicker, tools, padding = 18, dense = false }: PanelProps) {
  return (
    <div style={{ background: SD.surface, border: `1.5px solid ${accent || SD.border}`, position: 'relative', ...style }}>
      {(title || kicker || tools) && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: `${dense ? 10 : 14}px ${padding}px`,
          borderBottom: `1px solid ${SD.border}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {accent && <div style={{ width: 6, height: 6, background: accent, borderRadius: 999 }} />}
            {kicker && <span className="sd-label" style={{ fontSize: 9, color: accent || SD.textDim }}>{kicker}</span>}
            {title && <span className="sd-display" style={{ fontSize: 14, letterSpacing: '-0.01em' }}>{title}</span>}
          </div>
          {tools}
        </div>
      )}
      <div style={{ padding }}>{children}</div>
    </div>
  );
}

// ── Tag ───────────────────────────────────────────────────────────────────────
type TagTone = 'neutral' | 'cyan' | 'red' | 'green' | 'yellow' | 'blue';

interface TagProps {
  children: React.ReactNode;
  tone?: TagTone;
  style?: React.CSSProperties;
}

export function Tag({ children, tone = 'neutral', style = {} }: TagProps) {
  const tones: Record<TagTone, { fg: string; bg: string; bd: string }> = {
    neutral: { fg: SD.text, bg: SD.surface2, bd: SD.border },
    cyan: { fg: SD.primary, bg: 'rgba(0,229,255,0.08)', bd: 'rgba(0,229,255,0.4)' },
    red: { fg: SD.danger, bg: SD.dangerSoft, bd: 'rgba(255,51,68,0.4)' },
    green: { fg: SD.success, bg: SD.successSoft, bd: 'rgba(47,224,162,0.4)' },
    yellow: { fg: SD.warning, bg: SD.warningSoft, bd: 'rgba(255,176,32,0.4)' },
    blue: { fg: SD.primaryDeep, bg: 'rgba(77,91,255,0.10)', bd: 'rgba(77,91,255,0.4)' },
  };
  const t = tones[tone];
  return (
    <span
      className="sd-label sd-mono"
      style={{
        fontSize: 9, padding: '4px 8px', color: t.fg, background: t.bg, border: `1px solid ${t.bd}`,
        display: 'inline-flex', alignItems: 'center', gap: 6, letterSpacing: '0.10em', ...style,
      }}
    >
      {children}
    </span>
  );
}

// ── Dot ───────────────────────────────────────────────────────────────────────
type DotTone = 'cyan' | 'red' | 'green' | 'yellow' | 'gray';

interface DotProps {
  tone?: DotTone;
  size?: number;
  pulse?: boolean;
}

export function Dot({ tone = 'cyan', size = 8, pulse = true }: DotProps) {
  const colors: Record<DotTone, string> = {
    cyan: SD.primary,
    red: SD.danger,
    green: SD.success,
    yellow: SD.warning,
    gray: SD.textMute,
  };
  const c = colors[tone];
  return (
    <span
      className={pulse ? 'sd-pulse' : ''}
      style={{
        width: size, height: size, background: c, borderRadius: 999, display: 'inline-block',
        boxShadow: `0 0 ${size * 1.5}px ${c}`,
      }}
    />
  );
}

// ── Btn ───────────────────────────────────────────────────────────────────────
type BtnTone = 'ghost' | 'primary' | 'danger' | 'outline' | 'solid';
type BtnSize = 'sm' | 'md' | 'lg';

interface BtnProps {
  children?: React.ReactNode;
  tone?: BtnTone;
  size?: BtnSize;
  onClick?: () => void;
  style?: React.CSSProperties;
  icon?: React.ReactNode;
  full?: boolean;
}

export function Btn({ children, tone = 'ghost', size = 'md', onClick, style = {}, icon, full }: BtnProps) {
  const sizes: Record<BtnSize, { p: string; f: number }> = {
    sm: { p: '6px 10px', f: 11 },
    md: { p: '9px 14px', f: 12 },
    lg: { p: '12px 18px', f: 13 },
  };
  const tones: Record<BtnTone, { fg: string; bg: string; bd: string }> = {
    ghost: { fg: SD.text, bg: 'transparent', bd: SD.borderHi },
    primary: { fg: SD.bg, bg: SD.primary, bd: SD.primary },
    danger: { fg: SD.text, bg: SD.danger, bd: SD.danger },
    outline: { fg: SD.primary, bg: 'transparent', bd: SD.primary },
    solid: { fg: SD.text, bg: SD.surface2, bd: SD.borderHi },
  };
  const t = tones[tone];
  const s = sizes[size];
  return (
    <button
      className="sd-btn sd-label"
      onClick={onClick}
      style={{
        padding: s.p, fontSize: s.f, fontWeight: 700, letterSpacing: '0.12em',
        color: t.fg, background: t.bg, border: `1.5px solid ${t.bd}`,
        display: 'inline-flex', alignItems: 'center', gap: 8,
        ...(full ? { width: '100%', justifyContent: 'center' } : {}),
        ...style,
      }}
    >
      {icon}{children}
    </button>
  );
}
