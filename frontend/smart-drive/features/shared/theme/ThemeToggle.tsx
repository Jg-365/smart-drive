'use client';

import React from 'react';
import { useThemeContext } from './ThemeProvider';
import { Btn } from '@/components/ui/primitives';
import { Icon } from '@/components/ui/icons';

interface ThemeToggleProps {
  size?: 'sm' | 'md';
}

export function ThemeToggle({ size = 'md' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useThemeContext();

  const icon = theme === 'dark' ? Icon.gear(16) : Icon.bolt(16);

  return (
    <Btn tone="ghost" size={size} onClick={toggleTheme} icon={icon} />
  );
}
