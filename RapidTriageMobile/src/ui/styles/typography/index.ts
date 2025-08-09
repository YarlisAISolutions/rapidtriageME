/**
 * Typography styles and text utilities
 * Provides consistent text styling across the application
 */

import { TextStyle } from 'react-native';
import { ColorTheme } from '@constants/colors';

// Font weights
export const FONT_WEIGHTS = {
  LIGHT: '300' as TextStyle['fontWeight'],
  REGULAR: '400' as TextStyle['fontWeight'],
  MEDIUM: '500' as TextStyle['fontWeight'],
  SEMIBOLD: '600' as TextStyle['fontWeight'],
  BOLD: '700' as TextStyle['fontWeight'],
  EXTRABOLD: '800' as TextStyle['fontWeight'],
} as const;

// Line heights for better readability
export const LINE_HEIGHTS = {
  TIGHT: 1.25,
  NORMAL: 1.5,
  RELAXED: 1.75,
} as const;

// Typography scale following Material Design guidelines
export const createTypographyStyles = (theme: ColorTheme) => ({
  // Headlines
  h1: {
    fontSize: 32,
    lineHeight: 32 * LINE_HEIGHTS.TIGHT,
    fontWeight: FONT_WEIGHTS.BOLD,
    color: theme.TEXT,
    letterSpacing: -0.5,
  } as TextStyle,
  
  h2: {
    fontSize: 28,
    lineHeight: 28 * LINE_HEIGHTS.TIGHT,
    fontWeight: FONT_WEIGHTS.BOLD,
    color: theme.TEXT,
    letterSpacing: -0.25,
  } as TextStyle,
  
  h3: {
    fontSize: 24,
    lineHeight: 24 * LINE_HEIGHTS.TIGHT,
    fontWeight: FONT_WEIGHTS.SEMIBOLD,
    color: theme.TEXT,
  } as TextStyle,
  
  h4: {
    fontSize: 20,
    lineHeight: 20 * LINE_HEIGHTS.NORMAL,
    fontWeight: FONT_WEIGHTS.SEMIBOLD,
    color: theme.TEXT,
  } as TextStyle,
  
  h5: {
    fontSize: 18,
    lineHeight: 18 * LINE_HEIGHTS.NORMAL,
    fontWeight: FONT_WEIGHTS.MEDIUM,
    color: theme.TEXT,
  } as TextStyle,
  
  h6: {
    fontSize: 16,
    lineHeight: 16 * LINE_HEIGHTS.NORMAL,
    fontWeight: FONT_WEIGHTS.MEDIUM,
    color: theme.TEXT,
  } as TextStyle,
  
  // Body text
  body1: {
    fontSize: 16,
    lineHeight: 16 * LINE_HEIGHTS.NORMAL,
    fontWeight: FONT_WEIGHTS.REGULAR,
    color: theme.TEXT,
  } as TextStyle,
  
  body2: {
    fontSize: 14,
    lineHeight: 14 * LINE_HEIGHTS.NORMAL,
    fontWeight: FONT_WEIGHTS.REGULAR,
    color: theme.TEXT,
  } as TextStyle,
  
  // Captions and labels
  caption: {
    fontSize: 12,
    lineHeight: 12 * LINE_HEIGHTS.NORMAL,
    fontWeight: FONT_WEIGHTS.REGULAR,
    color: theme.TEXT_SECONDARY,
  } as TextStyle,
  
  label: {
    fontSize: 14,
    lineHeight: 14 * LINE_HEIGHTS.NORMAL,
    fontWeight: FONT_WEIGHTS.MEDIUM,
    color: theme.TEXT,
  } as TextStyle,
  
  // Interactive elements
  button: {
    fontSize: 16,
    lineHeight: 16 * LINE_HEIGHTS.TIGHT,
    fontWeight: FONT_WEIGHTS.SEMIBOLD,
    color: theme.TEXT,
  } as TextStyle,
  
  link: {
    fontSize: 16,
    lineHeight: 16 * LINE_HEIGHTS.NORMAL,
    fontWeight: FONT_WEIGHTS.MEDIUM,
    color: theme.PRIMARY,
    textDecorationLine: 'underline',
  } as TextStyle,
  
  // Special text styles
  overline: {
    fontSize: 10,
    lineHeight: 10 * LINE_HEIGHTS.NORMAL,
    fontWeight: FONT_WEIGHTS.MEDIUM,
    color: theme.TEXT_SECONDARY,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  } as TextStyle,
  
  // Utility text styles
  textCenter: {
    textAlign: 'center',
  } as TextStyle,
  
  textLeft: {
    textAlign: 'left',
  } as TextStyle,
  
  textRight: {
    textAlign: 'right',
  } as TextStyle,
  
  textSecondary: {
    color: theme.TEXT_SECONDARY,
  } as TextStyle,
  
  textTertiary: {
    color: theme.TEXT_TERTIARY,
  } as TextStyle,
  
  textSuccess: {
    color: theme.SUCCESS,
  } as TextStyle,
  
  textError: {
    color: theme.ERROR,
  } as TextStyle,
  
  textWarning: {
    color: theme.WARNING,
  } as TextStyle,
});