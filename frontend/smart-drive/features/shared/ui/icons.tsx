'use client';

import React from 'react';

type IconFn = (s?: number, c?: string) => React.ReactElement;

export const Icon: Record<string, IconFn> = {
  speed: (s = 14, c) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c || 'currentColor'} strokeWidth="1.8">
      <path d="M12 21a9 9 0 1 0-9-9" />
      <path d="M12 12l5-4" strokeLinecap="round" />
    </svg>
  ),
  brake: (s = 14, c) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c || 'currentColor'} strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path d="M9 9l6 6M15 9l-6 6" strokeLinecap="round" />
    </svg>
  ),
  bolt: (s = 14, c) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={c || 'currentColor'}>
      <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" />
    </svg>
  ),
  turn: (s = 14, c) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c || 'currentColor'} strokeWidth="1.8">
      <path d="M4 20c0-8 5-12 12-12" />
      <path d="M12 4l4 4-4 4" strokeLinejoin="round" />
    </svg>
  ),
  impact: (s = 14, c) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={c || 'currentColor'}>
      <path d="M12 2l2 6 6-2-3 5 5 3-6 2 2 6-5-3-3 5-2-6-6 2 3-5-5-3 6-2-2-6 5 3z" />
    </svg>
  ),
  fuel: (s = 14, c) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c || 'currentColor'} strokeWidth="1.8" strokeLinejoin="round">
      <path d="M4 21V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v16" />
      <path d="M3 21h13" />
      <path d="M15 9l3 0a2 2 0 0 1 2 2v6a2 2 0 0 0 2 2" />
    </svg>
  ),
  map: (s = 14, c) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c || 'currentColor'} strokeWidth="1.8" strokeLinejoin="round">
      <path d="M9 3l-6 3v15l6-3 6 3 6-3V3l-6 3z" />
      <path d="M9 3v15M15 6v15" />
    </svg>
  ),
  car: (s = 14, c) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c || 'currentColor'} strokeWidth="1.8" strokeLinejoin="round">
      <path d="M3 14l2-5a3 3 0 0 1 3-2h8a3 3 0 0 1 3 2l2 5v5h-3v-2H6v2H3z" />
      <circle cx="7.5" cy="16.5" r="1.5" fill="currentColor" />
      <circle cx="16.5" cy="16.5" r="1.5" fill="currentColor" />
    </svg>
  ),
  chip: (s = 14, c) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c || 'currentColor'} strokeWidth="1.8">
      <rect x="6" y="6" width="12" height="12" />
      <path d="M9 9h6v6H9zM3 9h3M3 15h3M18 9h3M18 15h3M9 3v3M15 3v3M9 18v3M15 18v3" />
    </svg>
  ),
  pulse: (s = 14, c) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c || 'currentColor'} strokeWidth="1.8" strokeLinejoin="round">
      <path d="M2 12h4l2-6 4 12 2-6h8" />
    </svg>
  ),
  gear: (s = 14, c) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c || 'currentColor'} strokeWidth="1.8">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.5 4.5l2 2M17.5 17.5l2 2M4.5 19.5l2-2M17.5 6.5l2-2" />
    </svg>
  ),
  arrow: (s = 14, c) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c || 'currentColor'} strokeWidth="2" strokeLinecap="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  play: (s = 14, c) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={c || 'currentColor'}>
      <path d="M6 4l14 8-14 8z" />
    </svg>
  ),
  pause: (s = 14, c) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={c || 'currentColor'}>
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  ),
  stop: (s = 14, c) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={c || 'currentColor'}>
      <rect x="5" y="5" width="14" height="14" />
    </svg>
  ),
  reset: (s = 14, c) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c || 'currentColor'} strokeWidth="1.8" strokeLinecap="round">
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
    </svg>
  ),
  sat: (s = 14, c) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c || 'currentColor'} strokeWidth="1.8" strokeLinejoin="round">
      <path d="M5 19l-2 2M19 5l2-2" />
      <path d="M9 3l4 4M11 5l8 8M13 11l8 8M17 13l4 4" />
      <circle cx="6" cy="18" r="3" />
    </svg>
  ),
  wifi: (s = 14, c) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c || 'currentColor'} strokeWidth="1.8" strokeLinecap="round">
      <path d="M2 9c5-5 15-5 20 0" />
      <path d="M5 12c4-4 10-4 14 0" />
      <path d="M8 15c2-2 6-2 8 0" />
      <circle cx="12" cy="18" r="1" fill="currentColor" />
    </svg>
  ),
  bell: (s = 14, c) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c || 'currentColor'} strokeWidth="1.8" strokeLinejoin="round">
      <path d="M6 16l-2 2v1h16v-1l-2-2V11a6 6 0 0 0-12 0v5z" />
      <path d="M10 21a2 2 0 0 0 4 0" />
    </svg>
  ),
  flag: (s = 14, c) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c || 'currentColor'} strokeWidth="1.8" strokeLinejoin="round">
      <path d="M5 3v18" />
      <path d="M5 4h12l-2 4 2 4H5" />
    </svg>
  ),
  plus: (s = 14, c) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c || 'currentColor'} strokeWidth="2" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  more: (s = 14, c) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={c || 'currentColor'}>
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
    </svg>
  ),
  search: (s = 14, c) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c || 'currentColor'} strokeWidth="1.8" strokeLinecap="round">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-4-4" />
    </svg>
  ),
  back: (s = 14, c) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c || 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </svg>
  ),
};
