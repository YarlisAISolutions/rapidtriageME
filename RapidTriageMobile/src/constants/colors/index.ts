/**
 * Color constants for the application
 * Defines the color palette and theme colors used throughout the app
 */

export const COLORS = {
  // Primary Brand Colors
  PRIMARY: '#2563EB', // Blue-600
  PRIMARY_DARK: '#1D4ED8', // Blue-700
  PRIMARY_LIGHT: '#3B82F6', // Blue-500
  
  // Secondary Colors
  SECONDARY: '#10B981', // Emerald-500
  SECONDARY_DARK: '#059669', // Emerald-600
  SECONDARY_LIGHT: '#34D399', // Emerald-400
  
  // Neutral Colors
  WHITE: '#FFFFFF',
  BLACK: '#000000',
  GRAY_50: '#F9FAFB',
  GRAY_100: '#F3F4F6',
  GRAY_200: '#E5E7EB',
  GRAY_300: '#D1D5DB',
  GRAY_400: '#9CA3AF',
  GRAY_500: '#6B7280',
  GRAY_600: '#4B5563',
  GRAY_700: '#374151',
  GRAY_800: '#1F2937',
  GRAY_900: '#111827',
  
  // Status Colors
  SUCCESS: '#10B981', // Emerald-500
  WARNING: '#F59E0B', // Amber-500
  ERROR: '#EF4444', // Red-500
  INFO: '#3B82F6', // Blue-500
  
  // Background Colors
  BACKGROUND_PRIMARY: '#FFFFFF',
  BACKGROUND_SECONDARY: '#F9FAFB',
  BACKGROUND_TERTIARY: '#F3F4F6',
  
  // Text Colors
  TEXT_PRIMARY: '#111827', // Gray-900
  TEXT_SECONDARY: '#6B7280', // Gray-500
  TEXT_TERTIARY: '#9CA3AF', // Gray-400
  TEXT_INVERSE: '#FFFFFF',
  
  // Border Colors
  BORDER_PRIMARY: '#E5E7EB', // Gray-200
  BORDER_SECONDARY: '#D1D5DB', // Gray-300
  BORDER_FOCUS: '#2563EB', // Blue-600
  
  // Subscription Tier Colors
  TIER_FREE: '#6B7280', // Gray-500
  TIER_PRO: '#2563EB', // Blue-600
  TIER_TEAM: '#7C3AED', // Violet-600
  TIER_ENTERPRISE: '#DC2626', // Red-600
} as const;

export const THEME = {
  LIGHT: {
    ...COLORS,
    BACKGROUND: COLORS.WHITE,
    SURFACE: COLORS.GRAY_50,
    TEXT: COLORS.TEXT_PRIMARY,
    TEXT_SECONDARY: COLORS.TEXT_SECONDARY,
    BORDER: COLORS.BORDER_PRIMARY,
  },
  DARK: {
    ...COLORS,
    PRIMARY: '#3B82F6', // Lighter blue for dark mode
    BACKGROUND: COLORS.GRAY_900,
    SURFACE: COLORS.GRAY_800,
    TEXT: COLORS.WHITE,
    TEXT_SECONDARY: COLORS.GRAY_300,
    BORDER: COLORS.GRAY_700,
    BACKGROUND_PRIMARY: COLORS.GRAY_900,
    BACKGROUND_SECONDARY: COLORS.GRAY_800,
    BACKGROUND_TERTIARY: COLORS.GRAY_700,
  }
} as const;

export type ColorTheme = typeof THEME.LIGHT;