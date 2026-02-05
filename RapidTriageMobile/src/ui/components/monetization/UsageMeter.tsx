/**
 * UsageMeter Component
 * Visual representation of scan usage with progress bar
 */

import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  Animated,
} from 'react-native';
import { useTheme } from '../../styles/themes';
import { SPACING, BORDER_RADIUS } from '../../styles/themes';
import { H3, Body1, Body2 } from '../common/Typography';

export interface UsageMeterProps {
  used: number;
  limit: number | null; // null = unlimited
  label?: string;
  showPercentage?: boolean;
  showRemaining?: boolean;
  size?: 'small' | 'medium' | 'large';
  warningThreshold?: number; // percentage at which to show warning color
  criticalThreshold?: number; // percentage at which to show critical color
  style?: ViewStyle;
}

export const UsageMeter: React.FC<UsageMeterProps> = ({
  used,
  limit,
  label = 'Scans Used',
  showPercentage = true,
  showRemaining = true,
  size = 'medium',
  warningThreshold = 75,
  criticalThreshold = 90,
  style,
}) => {
  const theme = useTheme();

  // Handle unlimited case
  if (limit === null || limit === 0) {
    return (
      <View style={[styles.container, style]}>
        {label && (
          <Body2 style={[styles.label, { color: theme.TEXT_SECONDARY }]}>
            {label}
          </Body2>
        )}
        <View style={styles.unlimitedRow}>
          <H3 style={[styles.usedCount, { color: theme.PRIMARY }]}>{used}</H3>
          <Body1 style={[styles.unlimitedText, { color: theme.TEXT_SECONDARY }]}>
            scans (unlimited)
          </Body1>
        </View>
        <View
          style={[
            styles.progressBar,
            styles[`progressBar_${size}`],
            { backgroundColor: theme.BACKGROUND_SECONDARY },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              styles[`progressFill_${size}`],
              {
                backgroundColor: theme.PRIMARY,
                width: '100%',
              },
            ]}
          />
        </View>
        <Body2 style={[styles.unlimited, { color: theme.SUCCESS }]}>
          ∞ Unlimited
        </Body2>
      </View>
    );
  }

  const percentage = Math.min((used / limit) * 100, 100);
  const remaining = Math.max(limit - used, 0);

  // Determine color based on thresholds
  const getProgressColor = (): string => {
    if (percentage >= criticalThreshold) return theme.ERROR;
    if (percentage >= warningThreshold) return theme.WARNING;
    return theme.PRIMARY;
  };

  const getStatusText = (): string => {
    if (percentage >= criticalThreshold) return 'Critical - Upgrade Now';
    if (percentage >= warningThreshold) return 'Running Low';
    return '';
  };

  return (
    <View style={[styles.container, style]}>
      {/* Label */}
      {label && (
        <Body2 style={[styles.label, { color: theme.TEXT_SECONDARY }]}>
          {label}
        </Body2>
      )}

      {/* Usage Numbers */}
      <View style={styles.usageRow}>
        <View style={styles.usageNumbers}>
          <H3 style={[styles.usedCount, { color: getProgressColor() }]}>
            {used}
          </H3>
          <Body1 style={[styles.limitText, { color: theme.TEXT_SECONDARY }]}>
            / {limit}
          </Body1>
        </View>
        {showPercentage && (
          <Body2 style={[styles.percentage, { color: getProgressColor() }]}>
            {Math.round(percentage)}%
          </Body2>
        )}
      </View>

      {/* Progress Bar */}
      <View
        style={[
          styles.progressBar,
          styles[`progressBar_${size}`],
          { backgroundColor: theme.BACKGROUND_SECONDARY },
        ]}
      >
        <View
          style={[
            styles.progressFill,
            styles[`progressFill_${size}`],
            {
              backgroundColor: getProgressColor(),
              width: `${percentage}%`,
            },
          ]}
        />
      </View>

      {/* Status/Remaining */}
      <View style={styles.statusRow}>
        {showRemaining && (
          <Body2 style={[styles.remaining, { color: theme.TEXT_SECONDARY }]}>
            {remaining} remaining
          </Body2>
        )}
        {getStatusText() && (
          <Body2 style={[styles.status, { color: getProgressColor() }]}>
            {getStatusText()}
          </Body2>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.XS,
  },
  usageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: SPACING.SM,
  },
  usageNumbers: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  usedCount: {
    fontSize: 28,
    fontWeight: '700',
  },
  limitText: {
    fontSize: 16,
    marginLeft: SPACING.XS,
  },
  percentage: {
    fontSize: 14,
    fontWeight: '600',
  },
  unlimitedRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: SPACING.SM,
  },
  unlimitedText: {
    fontSize: 14,
    marginLeft: SPACING.SM,
  },
  progressBar: {
    width: '100%',
    borderRadius: BORDER_RADIUS.FULL,
    overflow: 'hidden',
  },
  progressBar_small: {
    height: 6,
  },
  progressBar_medium: {
    height: 10,
  },
  progressBar_large: {
    height: 14,
  },
  progressFill: {
    borderRadius: BORDER_RADIUS.FULL,
  },
  progressFill_small: {
    height: 6,
  },
  progressFill_medium: {
    height: 10,
  },
  progressFill_large: {
    height: 14,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.SM,
  },
  remaining: {
    fontSize: 13,
  },
  status: {
    fontSize: 12,
    fontWeight: '600',
  },
  unlimited: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: SPACING.SM,
    textAlign: 'center',
  },
});

export default UsageMeter;
