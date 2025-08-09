/**
 * Typography components for consistent text styling
 * Provides semantic text components with theme support
 */

import React from 'react';
import {
  Text as RNText,
  TextProps as RNTextProps,
  TextStyle,
} from 'react-native';
import { useTheme } from '../../styles/themes';
import { createTypographyStyles } from '../../styles/typography';

interface BaseTextProps extends RNTextProps {
  children: React.ReactNode;
  color?: string;
  style?: TextStyle;
}

// Base Text component with theme support
export const Text: React.FC<BaseTextProps> = ({
  children,
  color,
  style,
  ...props
}) => {
  const theme = useTheme();
  const typography = createTypographyStyles(theme);

  return (
    <RNText
      style={[
        typography.body1,
        color && { color },
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  );
};

// Heading components
export const H1: React.FC<BaseTextProps> = ({ children, style, ...props }) => {
  const theme = useTheme();
  const typography = createTypographyStyles(theme);

  return (
    <RNText style={[typography.h1, style]} {...props}>
      {children}
    </RNText>
  );
};

export const H2: React.FC<BaseTextProps> = ({ children, style, ...props }) => {
  const theme = useTheme();
  const typography = createTypographyStyles(theme);

  return (
    <RNText style={[typography.h2, style]} {...props}>
      {children}
    </RNText>
  );
};

export const H3: React.FC<BaseTextProps> = ({ children, style, ...props }) => {
  const theme = useTheme();
  const typography = createTypographyStyles(theme);

  return (
    <RNText style={[typography.h3, style]} {...props}>
      {children}
    </RNText>
  );
};

export const H4: React.FC<BaseTextProps> = ({ children, style, ...props }) => {
  const theme = useTheme();
  const typography = createTypographyStyles(theme);

  return (
    <RNText style={[typography.h4, style]} {...props}>
      {children}
    </RNText>
  );
};

export const H5: React.FC<BaseTextProps> = ({ children, style, ...props }) => {
  const theme = useTheme();
  const typography = createTypographyStyles(theme);

  return (
    <RNText style={[typography.h5, style]} {...props}>
      {children}
    </RNText>
  );
};

export const H6: React.FC<BaseTextProps> = ({ children, style, ...props }) => {
  const theme = useTheme();
  const typography = createTypographyStyles(theme);

  return (
    <RNText style={[typography.h6, style]} {...props}>
      {children}
    </RNText>
  );
};

// Body text components
export const Body1: React.FC<BaseTextProps> = ({ children, style, ...props }) => {
  const theme = useTheme();
  const typography = createTypographyStyles(theme);

  return (
    <RNText style={[typography.body1, style]} {...props}>
      {children}
    </RNText>
  );
};

export const Body2: React.FC<BaseTextProps> = ({ children, style, ...props }) => {
  const theme = useTheme();
  const typography = createTypographyStyles(theme);

  return (
    <RNText style={[typography.body2, style]} {...props}>
      {children}
    </RNText>
  );
};

// Special text components
export const Caption: React.FC<BaseTextProps> = ({ children, style, ...props }) => {
  const theme = useTheme();
  const typography = createTypographyStyles(theme);

  return (
    <RNText style={[typography.caption, style]} {...props}>
      {children}
    </RNText>
  );
};

export const Label: React.FC<BaseTextProps> = ({ children, style, ...props }) => {
  const theme = useTheme();
  const typography = createTypographyStyles(theme);

  return (
    <RNText style={[typography.label, style]} {...props}>
      {children}
    </RNText>
  );
};

export const Overline: React.FC<BaseTextProps> = ({ children, style, ...props }) => {
  const theme = useTheme();
  const typography = createTypographyStyles(theme);

  return (
    <RNText style={[typography.overline, style]} {...props}>
      {children}
    </RNText>
  );
};