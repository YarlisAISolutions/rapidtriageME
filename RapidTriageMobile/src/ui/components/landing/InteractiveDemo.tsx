/**
 * Interactive Demo component
 * Provides a playground for users to test RapidTriage functionality
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../styles/themes';
import { SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/themes';
import { H3, H4, Body1, Body2, Caption } from '../common/Typography';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { useTriageStore } from '@store/index';

const { width } = Dimensions.get('window');

export interface InteractiveDemoProps {
  onDemoComplete?: (results: any) => void;
}

export const InteractiveDemo: React.FC<InteractiveDemoProps> = ({
  onDemoComplete,
}) => {
  const theme = useTheme();
  const { startScan, currentScan, isScanning, error } = useTriageStore();
  
  const [url, setUrl] = useState('');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['performance', 'accessibility']);
  const [demoStep, setDemoStep] = useState<'input' | 'scanning' | 'results'>('input');

  const isValidUrl = (urlString: string) => {
    try {
      const url = new URL(urlString);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleStartDemo = async () => {
    if (!url.trim()) {
      Alert.alert('Error', 'Please enter a website URL to analyze');
      return;
    }

    if (!isValidUrl(url)) {
      Alert.alert('Error', 'Please enter a valid URL (including http:// or https://)');
      return;
    }

    setDemoStep('scanning');
    try {
      await startScan(url);
      setDemoStep('results');
      onDemoComplete?.(currentScan?.results);
    } catch (err) {
      Alert.alert('Demo Error', 'Unable to complete demo scan. Please try again.');
      setDemoStep('input');
    }
  };

  const toggleMetric = (metric: string) => {
    setSelectedMetrics(prev => 
      prev.includes(metric) 
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  };

  const getMetricScore = (metricType: string) => {
    if (!currentScan?.results) return 0;
    
    switch (metricType) {
      case 'performance':
        return currentScan.results.performance?.score || 0;
      case 'accessibility':
        return currentScan.results.accessibility?.score || 0;
      case 'seo':
        return currentScan.results.seo?.score || 0;
      case 'bestPractices':
        return currentScan.results.bestPractices?.score || 0;
      default:
        return 0;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return theme.SUCCESS;
    if (score >= 70) return theme.WARNING;
    return theme.ERROR;
  };

  const resetDemo = () => {
    setUrl('');
    setDemoStep('input');
    setSelectedMetrics(['performance', 'accessibility']);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.BACKGROUND_SECONDARY }]}>
      {/* Header */}
      <View style={styles.header}>
        <H3 style={[styles.title, { color: theme.TEXT }]}>
          Try RapidTriage Now
        </H3>
        <Body1 style={[styles.subtitle, { color: theme.TEXT_SECONDARY }]}>
          Enter any website URL to see our analysis in action
        </Body1>
      </View>

      {/* Demo playground */}
      <Card style={styles.demoCard} padding="LG" shadow="LG">
        {demoStep === 'input' && (
          <View style={styles.inputSection}>
            {/* URL Input */}
            <View style={styles.urlInputContainer}>
              <Caption style={[styles.inputLabel, { color: theme.TEXT_SECONDARY }]}>
                Website URL
              </Caption>
              <TextInput
                style={[styles.urlInput, { 
                  backgroundColor: theme.BACKGROUND_TERTIARY,
                  borderColor: theme.BORDER_PRIMARY,
                  color: theme.TEXT 
                }]}
                value={url}
                onChangeText={setUrl}
                placeholder="https://example.com"
                placeholderTextColor={theme.TEXT_TERTIARY}
                keyboardType="url"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Metrics Selection */}
            <View style={styles.metricsContainer}>
              <Caption style={[styles.inputLabel, { color: theme.TEXT_SECONDARY }]}>
                Analysis Type
              </Caption>
              <View style={styles.metricsGrid}>
                {demoMetrics.map((metric) => (
                  <Button
                    key={metric.id}
                    title={metric.name}
                    onPress={() => toggleMetric(metric.id)}
                    variant={selectedMetrics.includes(metric.id) ? 'primary' : 'outline'}
                    size="small"
                    style={styles.metricButton}
                  />
                ))}
              </View>
            </View>

            {/* Demo button */}
            <Button
              title="Analyze Website"
              onPress={handleStartDemo}
              variant="primary"
              size="large"
              fullWidth
              style={styles.demoButton}
            />

            {/* Sample URLs */}
            <View style={styles.sampleUrls}>
              <Caption style={[styles.sampleLabel, { color: theme.TEXT_TERTIARY }]}>
                Try these sample sites:
              </Caption>
              <View style={styles.sampleUrlsContainer}>
                {sampleUrls.map((sample, index) => (
                  <Button
                    key={index}
                    title={sample.name}
                    onPress={() => setUrl(sample.url)}
                    variant="ghost"
                    size="small"
                    style={styles.sampleButton}
                  />
                ))}
              </View>
            </View>
          </View>
        )}

        {demoStep === 'scanning' && (
          <View style={styles.scanningSection}>
            <View style={styles.scanningContent}>
              <ActivityIndicator size="large" color={theme.PRIMARY} />
              <H4 style={[styles.scanningTitle, { color: theme.TEXT }]}>
                Analyzing {new URL(url).hostname}
              </H4>
              <Body1 style={[styles.scanningText, { color: theme.TEXT_SECONDARY }]}>
                Running comprehensive analysis...
              </Body1>
              
              {/* Progress indicators */}
              <View style={styles.progressContainer}>
                {scanningSteps.map((step, index) => (
                  <View key={index} style={styles.progressStep}>
                    <View style={[
                      styles.progressDot,
                      { backgroundColor: theme.SUCCESS }
                    ]} />
                    <Caption style={[styles.progressText, { color: theme.TEXT_SECONDARY }]}>
                      {step}
                    </Caption>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {demoStep === 'results' && currentScan?.results && (
          <View style={styles.resultsSection}>
            <H4 style={[styles.resultsTitle, { color: theme.TEXT }]}>
              Analysis Complete
            </H4>
            <Body2 style={[styles.resultsUrl, { color: theme.TEXT_SECONDARY }]}>
              {new URL(url).hostname}
            </Body2>

            {/* Results grid */}
            <View style={styles.resultsGrid}>
              {selectedMetrics.map((metricType) => {
                const metric = demoMetrics.find(m => m.id === metricType);
                const score = getMetricScore(metricType);
                const color = getScoreColor(score);
                
                return (
                  <View key={metricType} style={[styles.resultCard, { borderColor: color }]}>
                    <Caption style={[styles.resultLabel, { color: theme.TEXT_TERTIARY }]}>
                      {metric?.name}
                    </Caption>
                    <H4 style={[styles.resultScore, { color }]}>
                      {score}
                    </H4>
                    <Caption style={[styles.resultStatus, { color }]}>
                      {score >= 90 ? 'Good' : score >= 70 ? 'Needs Improvement' : 'Poor'}
                    </Caption>
                  </View>
                );
              })}
            </View>

            {/* Action buttons */}
            <View style={styles.resultsActions}>
              <Button
                title="View Full Report"
                onPress={() => onDemoComplete?.(currentScan.results)}
                variant="primary"
                size="medium"
                style={styles.actionButton}
              />
              <Button
                title="Try Another URL"
                onPress={resetDemo}
                variant="outline"
                size="medium"
                style={styles.actionButton}
              />
            </View>
          </View>
        )}
      </Card>

      {/* Bottom info */}
      <View style={styles.bottomInfo}>
        <Body2 style={[styles.infoText, { color: theme.TEXT_SECONDARY }]}>
          This demo uses cached results for demonstration. 
          Sign up for real-time analysis and detailed reports.
        </Body2>
      </View>
    </View>
  );
};

// Demo configuration data
const demoMetrics = [
  { id: 'performance', name: 'Performance' },
  { id: 'accessibility', name: 'Accessibility' },
  { id: 'seo', name: 'SEO' },
  { id: 'bestPractices', name: 'Best Practices' },
];

const sampleUrls = [
  { name: 'Google', url: 'https://google.com' },
  { name: 'GitHub', url: 'https://github.com' },
  { name: 'Wikipedia', url: 'https://wikipedia.org' },
];

const scanningSteps = [
  'Loading page content',
  'Analyzing performance',
  'Checking accessibility',
  'Evaluating SEO factors',
  'Generating report',
];

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.XXL,
    paddingHorizontal: SPACING.LG,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.XL,
  },
  title: {
    textAlign: 'center',
    marginBottom: SPACING.SM,
  },
  subtitle: {
    textAlign: 'center',
  },
  demoCard: {
    marginBottom: SPACING.LG,
  },
  inputSection: {
    // Input section styles handled by individual components
  },
  urlInputContainer: {
    marginBottom: SPACING.LG,
  },
  inputLabel: {
    marginBottom: SPACING.SM,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  urlInput: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.MD,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.MD,
    fontSize: 16,
  },
  metricsContainer: {
    marginBottom: SPACING.LG,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.SM,
  },
  metricButton: {
    marginRight: SPACING.SM,
    marginBottom: SPACING.SM,
  },
  demoButton: {
    marginBottom: SPACING.LG,
  },
  sampleUrls: {
    alignItems: 'center',
  },
  sampleLabel: {
    marginBottom: SPACING.SM,
    fontSize: 12,
  },
  sampleUrlsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.SM,
  },
  sampleButton: {
    marginHorizontal: SPACING.XS,
  },
  scanningSection: {
    alignItems: 'center',
    paddingVertical: SPACING.XL,
  },
  scanningContent: {
    alignItems: 'center',
  },
  scanningTitle: {
    marginTop: SPACING.LG,
    marginBottom: SPACING.SM,
    textAlign: 'center',
  },
  scanningText: {
    textAlign: 'center',
    marginBottom: SPACING.XL,
  },
  progressContainer: {
    alignItems: 'flex-start',
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.SM,
  },
  progressText: {
    fontSize: 14,
  },
  resultsSection: {
    alignItems: 'center',
  },
  resultsTitle: {
    marginBottom: SPACING.SM,
  },
  resultsUrl: {
    marginBottom: SPACING.LG,
  },
  resultsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: SPACING.LG,
    gap: SPACING.MD,
  },
  resultCard: {
    alignItems: 'center',
    padding: SPACING.MD,
    borderWidth: 2,
    borderRadius: BORDER_RADIUS.MD,
    minWidth: 100,
  },
  resultLabel: {
    fontSize: 11,
    marginBottom: SPACING.XS,
    textTransform: 'uppercase',
  },
  resultScore: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: SPACING.XS,
  },
  resultStatus: {
    fontSize: 11,
    fontWeight: '600',
  },
  resultsActions: {
    flexDirection: 'row',
    gap: SPACING.MD,
  },
  actionButton: {
    flex: 1,
  },
  bottomInfo: {
    alignItems: 'center',
    paddingHorizontal: SPACING.MD,
  },
  infoText: {
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
  },
});