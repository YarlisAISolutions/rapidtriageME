/**
 * Hero section component for the landing screen
 * Displays the main value proposition and call-to-action
 */

import React from 'react';
import {
  View,
  StyleSheet,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../styles/themes';
import { SPACING, BORDER_RADIUS } from '../../styles/themes';
import { H1, H2, Body1, Caption } from '../common/Typography';
import { Button } from '../common/Button';

const { width, height } = Dimensions.get('window');

export interface HeroProps {
  onGetStarted: () => void;
  onLearnMore: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  onGetStarted,
  onLearnMore,
}) => {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.BACKGROUND_PRIMARY }]}>
      <LinearGradient
        colors={[theme.PRIMARY, theme.PRIMARY_DARK]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.content}>
          {/* Main heading */}
          <View style={styles.headingContainer}>
            <H1 style={[styles.title, { color: theme.WHITE }]}>
              RapidTriage
            </H1>
            <H2 style={[styles.subtitle, { color: theme.WHITE }]}>
              Lightning-fast website diagnostics
            </H2>
          </View>

          {/* Value proposition */}
          <View style={styles.descriptionContainer}>
            <Body1 style={[styles.description, { color: theme.WHITE }]}>
              Get comprehensive performance, accessibility, SEO, and security insights 
              for any website in seconds. Built for developers, by developers.
            </Body1>
          </View>

          {/* Key benefits */}
          <View style={styles.benefitsContainer}>
            {benefits.map((benefit, index) => (
              <View key={index} style={styles.benefit}>
                <View style={[styles.benefitIcon, { backgroundColor: theme.SECONDARY }]}>
                  <Body1 style={{ color: theme.WHITE, fontSize: 16 }}>
                    {benefit.icon}
                  </Body1>
                </View>
                <Body1 style={[styles.benefitText, { color: theme.WHITE }]}>
                  {benefit.text}
                </Body1>
              </View>
            ))}
          </View>

          {/* Call-to-action buttons */}
          <View style={styles.ctaContainer}>
            <Button
              title="Get Started Free"
              onPress={onGetStarted}
              variant="secondary"
              size="large"
              style={styles.primaryButton}
            />
            <Button
              title="Learn More"
              onPress={onLearnMore}
              variant="outline"
              size="large"
              style={[styles.secondaryButton, { borderColor: theme.WHITE }]}
              textStyle={{ color: theme.WHITE }}
            />
          </View>

          {/* Trust indicators */}
          <View style={styles.trustIndicators}>
            <Body1 style={[styles.trustText, { color: theme.GRAY_200 }]}>
              Trusted by 10,000+ developers worldwide
            </Body1>
            <View style={styles.metrics}>
              <View style={styles.metric}>
                <H2 style={[styles.metricNumber, { color: theme.WHITE }]}>99.9%</H2>
                <Caption style={[styles.metricLabel, { color: theme.GRAY_200 }]}>
                  Uptime
                </Caption>
              </View>
              <View style={styles.metric}>
                <H2 style={[styles.metricNumber, { color: theme.WHITE }]}>{"<2s"}</H2>
                <Caption style={[styles.metricLabel, { color: theme.GRAY_200 }]}>
                  Avg. Scan Time
                </Caption>
              </View>
              <View style={styles.metric}>
                <H2 style={[styles.metricNumber, { color: theme.WHITE }]}>500K+</H2>
                <Caption style={[styles.metricLabel, { color: theme.GRAY_200 }]}>
                  Sites Analyzed
                </Caption>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

// Benefits data
const benefits = [
  {
    icon: '⚡',
    text: 'Instant results in under 2 seconds'
  },
  {
    icon: '🔍',
    text: 'Comprehensive multi-point analysis'
  },
  {
    icon: '📱',
    text: 'Mobile-optimized insights'
  }
];

const styles = StyleSheet.create({
  container: {
    width,
    minHeight: height * 0.9,
  },
  gradient: {
    flex: 1,
    paddingTop: 60, // Account for status bar
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.LG,
    justifyContent: 'space-between',
    paddingBottom: SPACING.XXL,
  },
  headingContainer: {
    alignItems: 'center',
    marginBottom: SPACING.LG,
  },
  title: {
    textAlign: 'center',
    marginBottom: SPACING.SM,
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.9,
  },
  descriptionContainer: {
    marginBottom: SPACING.XL,
  },
  description: {
    textAlign: 'center',
    fontSize: 18,
    lineHeight: 26,
    opacity: 0.9,
  },
  benefitsContainer: {
    marginBottom: SPACING.XL,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.MD,
    paddingHorizontal: SPACING.SM,
  },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.MD,
  },
  benefitText: {
    flex: 1,
    fontSize: 16,
  },
  ctaContainer: {
    gap: SPACING.MD,
    marginBottom: SPACING.XL,
  },
  primaryButton: {
    marginBottom: SPACING.SM,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
  },
  trustIndicators: {
    alignItems: 'center',
  },
  trustText: {
    textAlign: 'center',
    marginBottom: SPACING.LG,
    fontSize: 14,
  },
  metrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  metric: {
    alignItems: 'center',
  },
  metricNumber: {
    fontSize: 24,
    marginBottom: SPACING.XS,
  },
  metricLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
});