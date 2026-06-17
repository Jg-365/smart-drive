'use client';

import React from 'react';
import { useThemeContext } from '@/features/shared/theme';

interface BrandLogoProps {
  /** Altura em px; a largura é automática para preservar a proporção. */
  height?: number;
  style?: React.CSSProperties;
}

/**
 * Logo da marca conforme o tema (JOA-RF-07):
 * - dark  → logo branca sobre fundo escuro (public/logo-white.svg)
 * - light → logo completa sobre fundo claro (public/logo-smartdrive.svg)
 */
export function BrandLogo({ height = 28, style }: BrandLogoProps) {
  const { theme } = useThemeContext();
  const src = theme === 'light' ? '/logo-smartdrive.svg' : '/logo-white.svg';
  return (
    // eslint-disable-next-line @next/next/no-img-element -- SVG estático pequeno; next/image é desnecessário
    <img src={src} alt="SmartDrive" style={{ height, width: 'auto', display: 'block', ...style }} />
  );
}
