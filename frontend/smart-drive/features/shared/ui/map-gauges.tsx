'use client';

import React from 'react';
import { sdVars as SD } from '@/lib/sd-vars';

// Seeded random — deterministic, no hydration mismatch
function seededRnd(i: number): number {
  const x = Math.sin(i * 9999 + 42) * 10000;
  return x - Math.floor(x);
}

// ── MapView ───────────────────────────────────────────────────────────────────
interface MapViewProps {
  width?: number;
  height?: number;
  animate?: boolean;
  mini?: boolean;
  demo?: boolean;
}

export function MapView({ width = 800, height = 480, animate = true, mini = false }: MapViewProps) {
  const cols = Math.max(8, Math.floor(width / 80));
  const rows = Math.max(5, Math.floor(height / 80));

  const blocks: { x: number; y: number; w: number; h: number; k: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (seededRnd(r * 31 + c) < 0.55) continue;
      const w = 30 + seededRnd(r * c + 1) * 40;
      const h = 30 + seededRnd(r * c + 2) * 40;
      const x = c * 80 + 8 + seededRnd(r + c) * 10;
      const y = r * 80 + 8 + seededRnd(r - c) * 10;
      blocks.push({ x, y, w, h, k: r * 999 + c });
    }
  }

  const routePts: [number, number][] = [];
  const segs = 80;
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const x = 40 + t * (width - 80) + Math.sin(t * 9) * 30;
    const y = height * 0.78 - Math.sin(t * 3.2) * (height * 0.28) + Math.cos(t * 5.5) * 24;
    routePts.push([x, y]);
  }
  const routeD = routePts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');

  const events = [
    { t: 0.22, type: 'turn' },
    { t: 0.48, type: 'brake' },
    { t: 0.79, type: 'accel' },
  ];
  const pinColor: Record<string, string> = { brake: SD.danger, turn: SD.warning, accel: SD.primary };
  const carIdx = Math.floor(routePts.length * 0.65);
  const carPt = routePts[carIdx];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid slice"
      width="100%"
      height="100%"
      style={{ display: 'block', background: '#0E0E16' }}
    >
      <defs>
        <pattern id="sd-grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M40 0H0V40" fill="none" stroke="#1A1A26" strokeWidth="1" />
        </pattern>
        <pattern id="sd-grid-fine" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M10 0H0V10" fill="none" stroke="#13131C" strokeWidth="0.5" />
        </pattern>
        <radialGradient id="sd-vignette" cx="50%" cy="50%" r="70%">
          <stop offset="60%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.7" />
        </radialGradient>
      </defs>

      <rect width={width} height={height} fill="#0B0B12" />
      <rect width={width} height={height} fill="url(#sd-grid-fine)" />
      <rect width={width} height={height} fill="url(#sd-grid)" />

      {blocks.map((b) => (
        <rect key={b.k} x={b.x} y={b.y} width={b.w} height={b.h} fill="#11111A" stroke="#1F1F2D" strokeWidth="1" />
      ))}

      {Array.from({ length: rows }).map((_, i) => (
        <line key={'h' + i} x1="0" y1={i * 80} x2={width} y2={i * 80} stroke="#1D1D2A" strokeWidth="2" />
      ))}
      {Array.from({ length: cols }).map((_, i) => (
        <line key={'v' + i} x1={i * 80} y1="0" x2={i * 80} y2={height} stroke="#1D1D2A" strokeWidth="2" />
      ))}

      <path d={routeD} fill="none" stroke={SD.primary} strokeWidth="10" opacity="0.18" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d={routeD}
        fill="none"
        stroke={SD.primary}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="6 3"
        className={animate ? 'sd-route-draw' : ''}
      />

      {events.map((e, i) => {
        const idx = Math.floor(routePts.length * e.t);
        const [x, y] = routePts[idx];
        const c = pinColor[e.type];
        return (
          <g key={i}>
            <circle cx={x} cy={y} r="14" fill={c} opacity="0.12" />
            <circle cx={x} cy={y} r="5" fill={SD.bg} stroke={c} strokeWidth="2" />
          </g>
        );
      })}

      <g transform={`translate(${routePts[0][0]} ${routePts[0][1]})`}>
        <circle r="7" fill={SD.bg} stroke={SD.success} strokeWidth="2" />
        <circle r="3" fill={SD.success} />
      </g>

      <g transform={`translate(${carPt[0]} ${carPt[1]})`}>
        <circle r="20" fill={SD.primary} opacity="0.12" className={animate ? 'sd-pulse' : ''} />
        <circle r="11" fill={SD.primary} opacity="0.25" />
        <circle r="6" fill={SD.primary} stroke={SD.bg} strokeWidth="2" />
        <path d="M-10 0 L0 -3 L0 3 Z" transform="rotate(20)" fill={SD.primary} opacity="0.7" />
      </g>

      <rect width={width} height={height} fill="url(#sd-vignette)" pointerEvents="none" />

      {!mini && (
        <>
          <g transform={`translate(${width - 56} 36)`}>
            <circle r="22" fill={SD.surface} stroke={SD.borderHi} strokeWidth="1.5" />
            <path d="M0 -14 L4 0 L0 -2 L-4 0 Z" fill={SD.danger} />
            <path d="M0 14 L4 0 L0 2 L-4 0 Z" fill={SD.text} opacity="0.6" />
            <text x="0" y="-24" textAnchor="middle" fill={SD.textDim} fontSize="9" fontFamily={SD.fontMono}>N</text>
          </g>
          <g transform={`translate(28 ${height - 28})`}>
            <line x1="0" y1="0" x2="80" y2="0" stroke={SD.text} strokeWidth="2" />
            <line x1="0" y1="-4" x2="0" y2="4" stroke={SD.text} strokeWidth="2" />
            <line x1="40" y1="-3" x2="40" y2="3" stroke={SD.text} strokeWidth="2" />
            <line x1="80" y1="-4" x2="80" y2="4" stroke={SD.text} strokeWidth="2" />
            <text x="84" y="4" fill={SD.textDim} fontSize="10" fontFamily={SD.fontMono}>200 m</text>
          </g>
        </>
      )}
    </svg>
  );
}

// ── ArcGauge ──────────────────────────────────────────────────────────────────
interface ArcGaugeProps {
  value?: number;
  max?: number;
  label?: string;
  size?: number;
  color?: string;
  thick?: number;
  hint?: string;
}

export function ArcGauge({ value = 72, max = 100, label = 'SCORE', size = 220, color, thick = 14, hint }: ArcGaugeProps) {
  const c = color || (value >= 75 ? SD.success : value >= 60 ? SD.warning : SD.danger);
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - thick;
  const start = -220;
  const end = 40;
  const pct = Math.max(0, Math.min(1, value / max));
  const sweep = start + (end - start) * pct;

  const polar = (a: number): [number, number] => [
    cx + r * Math.cos((a * Math.PI) / 180),
    cy + r * Math.sin((a * Math.PI) / 180),
  ];

  const arc = (a0: number, a1: number, stroke: string, w: number) => {
    const [x0, y0] = polar(a0);
    const [x1, y1] = polar(a1);
    const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
    return (
      <path
        d={`M${x0} ${y0} A${r} ${r} 0 ${large} 1 ${x1} ${y1}`}
        fill="none"
        stroke={stroke}
        strokeWidth={w}
        strokeLinecap="butt"
      />
    );
  };

  const ticks = [];
  for (let i = 0; i <= 10; i++) {
    const a = start + ((end - start) * i) / 10;
    const [x0, y0] = polar(a);
    const r2 = r - 18;
    const x1 = cx + r2 * Math.cos((a * Math.PI) / 180);
    const y1 = cy + r2 * Math.sin((a * Math.PI) / 180);
    ticks.push(
      <line key={i} x1={x0} y1={y0} x2={x1} y2={y1}
        stroke={i % 5 === 0 ? SD.text : SD.borderHi}
        strokeWidth={i % 5 === 0 ? 2 : 1} />
    );
  }

  return (
    <svg width={size} height={size * 0.82} viewBox={`0 0 ${size} ${size * 0.82}`}>
      {arc(start, end, SD.surface2, thick)}
      {arc(start, sweep, c, thick)}
      {ticks}
      <text x={cx} y={cy + 8} textAnchor="middle" fill={SD.text} fontFamily={SD.fontMono}
        fontSize={size * 0.28} fontWeight="600">{value}</text>
      <text x={cx} y={cy + size * 0.22} textAnchor="middle" fill={SD.textDim}
        fontFamily={SD.fontBody} fontWeight="700" fontSize="10" letterSpacing="2">{label}</text>
      {hint && (
        <text x={cx} y={cy - size * 0.22} textAnchor="middle" fill={c}
          fontFamily={SD.fontBody} fontWeight="700" fontSize="9" letterSpacing="1.5">{hint}</text>
      )}
    </svg>
  );
}

// ── Speedometer ───────────────────────────────────────────────────────────────
interface SpeedometerProps {
  kmh?: number;
  max?: number;
  size?: number;
  color?: string;
}

export function Speedometer({ kmh = 47, max = 140, size = 260, color }: SpeedometerProps) {
  const c = color || SD.primary;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 22;
  const start = -210;
  const end = 30;
  const pct = Math.max(0, Math.min(1, kmh / max));
  const sweep = start + (end - start) * pct;

  const polar = (a: number): [number, number] => [
    cx + r * Math.cos((a * Math.PI) / 180),
    cy + r * Math.sin((a * Math.PI) / 180),
  ];

  const arc = (a0: number, a1: number, stroke: string, w: number) => {
    const [x0, y0] = polar(a0);
    const [x1, y1] = polar(a1);
    const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
    return (
      <path
        d={`M${x0} ${y0} A${r} ${r} 0 ${large} 1 ${x1} ${y1}`}
        fill="none"
        stroke={stroke}
        strokeWidth={w}
        strokeLinecap="butt"
      />
    );
  };

  const ticks = [];
  for (let i = 0; i <= 14; i++) {
    const a = start + ((end - start) * i) / 14;
    const [x0, y0] = polar(a);
    const r2 = r - (i % 2 === 0 ? 18 : 10);
    const x1 = cx + r2 * Math.cos((a * Math.PI) / 180);
    const y1 = cy + r2 * Math.sin((a * Math.PI) / 180);
    ticks.push(
      <line key={i} x1={x0} y1={y0} x2={x1} y2={y1}
        stroke={i % 2 === 0 ? SD.text : SD.textMute}
        strokeWidth={i % 2 === 0 ? 2 : 1} />
    );
    if (i % 2 === 0) {
      const r3 = r - 32;
      const tx = cx + r3 * Math.cos((a * Math.PI) / 180);
      const ty = cy + r3 * Math.sin((a * Math.PI) / 180);
      ticks.push(
        <text key={'t' + i} x={tx} y={ty + 3} textAnchor="middle"
          fill={SD.textDim} fontFamily={SD.fontMono} fontSize="9">
          {Math.round((i / 14) * max)}
        </text>
      );
    }
  }

  return (
    <svg width={size} height={size * 0.78} viewBox={`0 0 ${size} ${size * 0.78}`}>
      {arc(start, end, SD.surface2, 12)}
      {arc(start, sweep, c, 12)}
      {ticks}
      <text x={cx} y={cy + 12} textAnchor="middle" fill={SD.text} fontFamily={SD.fontMono}
        fontSize={size * 0.30} fontWeight="600">{Math.round(kmh)}</text>
      <text x={cx} y={cy + size * 0.18} textAnchor="middle" fill={SD.textDim}
        fontFamily={SD.fontBody} fontWeight="700" fontSize="11" letterSpacing="2">KM/H</text>
    </svg>
  );
}

// ── Wave ──────────────────────────────────────────────────────────────────────
interface WaveProps {
  width?: number;
  height?: number;
  points?: number[];
  color?: string;
  fill?: boolean;
}

const defaultWavePoints = Array.from({ length: 60 }).map((_, i) => {
  const rnd = (seed: number) => {
    const x = Math.sin(seed * 9301 + 49297) * 233280;
    return x - Math.floor(x);
  };
  return Math.sin(i * 0.4) * 0.4 + Math.sin(i * 0.13 + 2) * 0.4 + (rnd(i) - 0.5) * 0.2;
});

export function Wave({ width = 280, height = 60, points, color, fill }: WaveProps) {
  const c = color || SD.primary;
  const pts = points || defaultWavePoints;
  const maxVal = Math.max(...pts.map(Math.abs));
  const mid = height / 2;
  const d = pts.map((v, i) => {
    const x = (i / (pts.length - 1)) * width;
    const y = mid - (v / maxVal) * (height * 0.42);
    return (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
  }).join(' ');
  const dFill = d + ` L${width} ${mid} L0 ${mid} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <line x1="0" y1={mid} x2={width} y2={mid} stroke={SD.border} strokeDasharray="3 3" />
      {fill && <path d={dFill} fill={c} opacity="0.12" />}
      <path d={d} fill="none" stroke={c} strokeWidth="1.5" />
    </svg>
  );
}

// ── AxisBars ──────────────────────────────────────────────────────────────────
interface AxisBarsProps {
  x?: number;
  y?: number;
  z?: number;
  width?: number | string;
}

export function AxisBars({ x = 0.12, y = -0.42, z = 0.98, width = 220 }: AxisBarsProps) {
  const Bar = ({ label, v, barColor }: { label: string; v: number; barColor: string }) => {
    const pct = Math.max(0, Math.min(1, Math.abs(v) / 1.2));
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span className="sd-label" style={{ fontSize: 9 }}>{label}</span>
          <span className="sd-mono" style={{ fontSize: 10, color: barColor }}>
            {(v >= 0 ? '+' : '') + v.toFixed(2)}g
          </span>
        </div>
        <div style={{ height: 6, background: SD.surface2, position: 'relative', border: `1px solid ${SD.border}` }}>
          <div style={{
            position: 'absolute', top: 0, height: '100%',
            left: v >= 0 ? '50%' : `${50 - pct * 50}%`,
            width: `${pct * 50}%`,
            background: barColor,
          }} />
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: 1, background: SD.borderBright }} />
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'grid', gap: 8, width }}>
      <Bar label="ACCEL X" v={x} barColor={SD.primary} />
      <Bar label="ACCEL Y" v={y} barColor={SD.warning} />
      <Bar label="ACCEL Z" v={z} barColor={SD.success} />
    </div>
  );
}
