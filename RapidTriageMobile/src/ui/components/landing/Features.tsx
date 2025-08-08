/**
 * Features showcase component
 * Displays the 6 key features of RapidTriage in a grid layout
 */

import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useTheme } from '../../styles/themes';
import { SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/themes';
import { H3, H4, Body1, Caption } from '../common/Typography';
import { Card } from '../common/Card';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - SPACING.LG * 3) / 2; // 2 columns with spacing

export interface FeaturesProps {
  onFeaturePress?: (featureId: string) => void;
}

export const Features: React.FC<FeaturesProps> = ({
  onFeaturePress,
}) => {
  const theme = useTheme();

  const handleFeaturePress = (featureId: string) => {
    onFeaturePress?.(featureId);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.BACKGROUND_SECONDARY }]}>
      <View style={styles.header}>
        <H3 style={[styles.title, { color: theme.TEXT }]}>
          Everything you need for comprehensive website analysis
        </H3>
        <Body1 style={[styles.subtitle, { color: theme.TEXT_SECONDARY }]}>
          Our platform provides deep insights across all critical aspects of web performance
        </Body1>
      </View>

      <View style={styles.grid}>
        {features.map((feature, index) => (
          <Card
            key={feature.id}
            style={[
              styles.featureCard,
              { width: CARD_WIDTH },
              index % 2 === 0 ? styles.leftCard : styles.rightCard,
            ]}
            padding="LG"
            shadow="MD"
          >
            <View style={styles.featureContent}>
              {/* Feature icon */}
              <View style={[styles.iconContainer, { backgroundColor: feature.color }]}>
                <Body1 style={[styles.icon, { color: theme.WHITE }]}>
                  {feature.icon}
                </Body1>
              </View>

              {/* Feature title */}
              <H4 style={[styles.featureTitle, { color: theme.TEXT }]}>
                {feature.title}
              </H4>

              {/* Feature description */}
              <Body1 style={[styles.featureDescription, { color: theme.TEXT_SECONDARY }]}>
                {feature.description}
              </Body1>

              {/* Feature metrics */}
              <View style={styles.metrics}>
                <View style={styles.metric}>
                  <Caption style={[styles.metricLabel, { color: theme.TEXT_TERTIARY }]}>
                    {feature.metrics.label}
                  </Caption>
                  <Body1 style={[styles.metricValue, { color: feature.color }]}>
                    {feature.metrics.value}
                  </Body1>
                </View>
              </View>

              {/* Feature status */}
              <View style={[styles.statusBadge, { backgroundColor: `${feature.color}20` }]}>
                <Caption style={[styles.statusText, { color: feature.color }]}>
                  {feature.status}
                </Caption>
              </View>
            </View>
          </Card>
        ))}
      </View>

      {/* Bottom section with additional info */}
      <View style={styles.bottomSection}>
        <H4 style={[styles.bottomTitle, { color: theme.TEXT }]}>
          Powered by industry-leading tools
        </H4>
        <Body1 style={[styles.bottomText, { color: theme.TEXT_SECONDARY }]}>
          Built on Lighthouse, WebPageTest, and custom AI-powered analysis engines
        </Body1>
      </View>
    </View>
  );
};

// Features data with comprehensive information
const features = [
  {
    id: 'performance',
    icon: '⚡',
    title: 'Performance Analysis',
    description: 'Core Web Vitals, loading metrics, and optimization opportunities',
    color: '#F59E0B', // Amber
    metrics: {
      label: 'Avg. Improvement',
      value: '40%'
    },
    status: 'Real-time'
  },
  {
    id: 'accessibility',
    icon: '♿',
    title: 'Accessibility Audit',
    description: 'WCAG compliance checks and inclusive design recommendations',
    color: '#10B981', // Emerald
    metrics: {
      label: 'Issues Detected',
      value: '95%'
    },
    status: 'Automated'
  },
  {
    id: 'seo',
    icon: '🔍',
    title: 'SEO Optimization',
    description: 'Search engine visibility analysis and ranking factors',
    color: '#3B82F6', // Blue
    metrics: {
      label: 'SEO Score',
      value: '98%'
    },
    status: 'Complete'
  },
  {
    id: 'security',
    icon: '🔒',
    title: 'Security Scan',
    description: 'Vulnerability detection and security best practices',
    color: '#EF4444', // Red
    metrics: {
      label: 'Threats Blocked',
      value: '99.9%'
    },
    status: 'Protected'
  },
  {
    id: 'mobile',
    icon: '📱',
    title: 'Mobile-First',
    description: 'Responsive design analysis and mobile optimization',
    color: '#8B5CF6', // Violet
    metrics: {
      label: 'Mobile Score',
      value: '92%'
    },
    status: 'Optimized'
  },
  {
    id: 'monitoring',
    icon: '📊',
    title: 'Continuous Monitoring',
    description: 'Track changes over time with automated alerts',
    color: '#06B6D4', // Cyan
    metrics: {
      label: 'Uptime',
      value: '99.9%'
    },
    status: '24/7 Active'
  },
];

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.XXL,
    paddingHorizontal: SPACING.LG,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.XXL,
  },
  title: {
    textAlign: 'center',
    marginBottom: SPACING.MD,
    paddingHorizontal: SPACING.SM,
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 22,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SPACING.XXL,
  },
  featureCard: {
    marginBottom: SPACING.LG,
  },
  leftCard: {
    marginRight: SPACING.SM,
  },
  rightCard: {
    marginLeft: SPACING.SM,
  },
  featureContent: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.MD,
  },
  icon: {
    fontSize: 24,
  },
  featureTitle: {
    textAlign: 'center',
    marginBottom: SPACING.SM,
  },
  featureDescription: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: SPACING.MD,
  },
  metrics: {
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  metric: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.XS,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: BORDER_RADIUS.SM,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bottomSection: {
    alignItems: 'center',
    paddingTop: SPACING.LG,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  bottomTitle: {
    textAlign: 'center',
    marginBottom: SPACING.SM,
  },
  bottomText: {
    textAlign: 'center',
    fontSize: 14,
  },
});