/**
 * Theme provider and theme utilities
 * Provides consistent theming across the application
 */

import { useColorScheme } from 'react-native';
import { THEME, ColorTheme } from '@constants/colors';
import { useAppStore } from '@store/index';

export const useTheme = (): ColorTheme => {
  const systemColorScheme = useColorScheme();
  const { settings } = useAppStore();
  
  // Determine theme based on settings and system preference
  let activeTheme: 'light' | 'dark';
  
  if (settings.theme === 'system') {
    activeTheme = systemColorScheme === 'dark' ? 'dark' : 'light';
  } else {
    activeTheme = settings.theme as 'light' | 'dark';
  }
  
  return THEME[activeTheme.toUpperCase() as keyof typeof THEME];
};

export const createThemedStyles = <T extends Record<string, any>>(
  styleCreator: (theme: ColorTheme) => T
) => {
  return (theme: ColorTheme) => styleCreator(theme);
};

// Common spacing values following 8-point grid system
export const SPACING = {
  XS: 4,
  SM: 8,
  MD: 16,
  LG: 24,
  XL: 32,
  XXL: 40,
  XXXL: 48,
} as const;

// Common border radius values
export const BORDER_RADIUS = {
  SM: 4,
  MD: 8,
  LG: 12,
  XL: 16,
  FULL: 9999,
} as const;

// Shadow presets
export const SHADOWS = {
  SM: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  MD: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  LG: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
} as const;