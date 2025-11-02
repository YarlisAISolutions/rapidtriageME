/**
 * Firebase Analytics Provider
 * Implements IAnalyticsProvider interface for Firebase Analytics
 */

import {
  IAnalyticsProvider,
  ITrace,
  IReportOptions,
  IAnalyticsReport,
  IExportOptions
} from '../interfaces';

import { FirebaseApp } from 'firebase/app';
import {
  Analytics,
  getAnalytics,
  logEvent,
  setUserId,
  setUserProperties,
  setCurrentScreen,
  setAnalyticsCollectionEnabled,
  isSupported
} from 'firebase/analytics';

import { Performance, getPerformance, trace } from 'firebase/performance';

export class FirebaseAnalyticsProvider implements IAnalyticsProvider {
  private analytics: Analytics | null = null;
  private performance: Performance | null = null;
  private app: FirebaseApp;
  private customMetrics: Map<string, any[]> = new Map();
  private traces: Map<string, any> = new Map();

  constructor(app: FirebaseApp) {
    this.app = app;
    this.initializeAnalytics();
  }

  /**
   * Initialize Analytics (only in browser environment)
   */
  private async initializeAnalytics(): Promise<void> {
    try {
      // Check if Analytics is supported (browser only)
      const supported = await isSupported();
      if (supported && typeof window !== 'undefined') {
        this.analytics = getAnalytics(this.app);
        this.performance = getPerformance(this.app);
      } else {
        console.warn('Firebase Analytics is not supported in this environment');
      }
    } catch (error) {
      console.error('Failed to initialize Firebase Analytics:', error);
    }
  }

  /**
   * Track an event
   */
  async trackEvent(eventName: string, parameters?: any): Promise<void> {
    try {
      if (!this.analytics) {
        console.warn('Analytics not available, storing event locally');
        this.storeEventLocally(eventName, parameters);
        return;
      }

      // Firebase has specific event names and parameter limits
      // Sanitize event name (max 40 chars, alphanumeric and underscores)
      const sanitizedEventName = eventName
        .substring(0, 40)
        .replace(/[^a-zA-Z0-9_]/g, '_');

      // Sanitize parameters (max 25 unique parameters per event)
      const sanitizedParams = this.sanitizeParameters(parameters);

      logEvent(this.analytics, sanitizedEventName, sanitizedParams);
    } catch (error: any) {
      console.error(`Failed to track event ${eventName}:`, error);
    }
  }

  /**
   * Track a page view
   */
  async trackPageView(pageName: string, parameters?: any): Promise<void> {
    try {
      if (!this.analytics) {
        console.warn('Analytics not available');
        return;
      }

      // Set current screen
      setCurrentScreen(this.analytics, pageName);

      // Log page_view event
      logEvent(this.analytics, 'page_view', {
        page_title: pageName,
        page_path: parameters?.path || window?.location?.pathname,
        page_location: parameters?.location || window?.location?.href,
        ...this.sanitizeParameters(parameters)
      });
    } catch (error: any) {
      console.error(`Failed to track page view ${pageName}:`, error);
    }
  }

  /**
   * Track user action
   */
  async trackUserAction(action: string, category: string, label?: string, value?: number): Promise<void> {
    try {
      if (!this.analytics) {
        console.warn('Analytics not available');
        return;
      }

      // Use Firebase's recommended event structure
      const eventName = `${category}_${action}`.toLowerCase()
        .substring(0, 40)
        .replace(/[^a-zA-Z0-9_]/g, '_');

      const parameters: any = {
        action_category: category,
        action_type: action
      };

      if (label) parameters.action_label = label;
      if (value !== undefined) parameters.action_value = value;

      logEvent(this.analytics, eventName, parameters);
    } catch (error: any) {
      console.error(`Failed to track user action ${action}:`, error);
    }
  }

  /**
   * Set user ID for analytics
   */
  async setUserId(userId: string): Promise<void> {
    try {
      if (!this.analytics) {
        console.warn('Analytics not available');
        return;
      }

      setUserId(this.analytics, userId);
    } catch (error: any) {
      console.error(`Failed to set user ID:`, error);
    }
  }

  /**
   * Set user properties
   */
  async setUserProperties(properties: Record<string, any>): Promise<void> {
    try {
      if (!this.analytics) {
        console.warn('Analytics not available');
        return;
      }

      // Firebase limits: max 25 unique user properties
      const sanitizedProperties = this.sanitizeUserProperties(properties);

      setUserProperties(this.analytics, sanitizedProperties);
    } catch (error: any) {
      console.error(`Failed to set user properties:`, error);
    }
  }

  /**
   * Log a custom metric
   */
  async logCustomMetric(name: string, value: number, metadata?: any): Promise<void> {
    try {
      // Store custom metric
      if (!this.customMetrics.has(name)) {
        this.customMetrics.set(name, []);
      }

      this.customMetrics.get(name)!.push({
        value,
        timestamp: new Date(),
        metadata
      });

      // Also log as event
      if (this.analytics) {
        logEvent(this.analytics, 'custom_metric', {
          metric_name: name,
          metric_value: value,
          ...this.sanitizeParameters(metadata)
        });
      }
    } catch (error: any) {
      console.error(`Failed to log custom metric ${name}:`, error);
    }
  }

  /**
   * Start a performance trace
   */
  startTrace(traceName: string): ITrace {
    if (!this.performance) {
      // Return a mock trace if Performance is not available
      return this.createMockTrace(traceName);
    }

    // Create Firebase Performance trace
    const performanceTrace = trace(this.performance, traceName);
    performanceTrace.start();

    // Store trace reference
    this.traces.set(traceName, performanceTrace);

    // Return trace wrapper
    return {
      putAttribute: (key: string, value: string | number) => {
        performanceTrace.putAttribute(key, String(value));
      },
      putMetric: (name: string, value: number) => {
        performanceTrace.putMetric(name, value);
      },
      incrementMetric: (name: string, by: number = 1) => {
        performanceTrace.incrementMetric(name, by);
      },
      stop: () => {
        performanceTrace.stop();
        this.traces.delete(traceName);
      }
    };
  }

  /**
   * Get analytics report
   */
  async getAnalyticsReport(options: IReportOptions): Promise<IAnalyticsReport> {
    try {
      // Firebase Analytics doesn't provide direct query API
      // You would typically use Firebase Console or BigQuery for reports

      // For now, return local custom metrics
      const metricsData: any[] = [];

      if (options.metrics) {
        for (const metricName of options.metrics) {
          if (this.customMetrics.has(metricName)) {
            const metrics = this.customMetrics.get(metricName)!;

            // Filter by date range
            const filteredMetrics = metrics.filter(m => {
              return m.timestamp >= options.startDate && m.timestamp <= options.endDate;
            });

            metricsData.push({
              metric: metricName,
              data: filteredMetrics
            });
          }
        }
      }

      // Calculate summary
      const summary: Record<string, any> = {};

      for (const metricData of metricsData) {
        const values = metricData.data.map((d: any) => d.value);
        summary[metricData.metric] = {
          count: values.length,
          sum: values.reduce((a: number, b: number) => a + b, 0),
          avg: values.length > 0
            ? values.reduce((a: number, b: number) => a + b, 0) / values.length
            : 0,
          min: Math.min(...values),
          max: Math.max(...values)
        };
      }

      return {
        data: metricsData,
        summary,
        charts: this.generateCharts(metricsData)
      };
    } catch (error: any) {
      throw new Error(`Failed to get analytics report: ${error.message}`);
    }
  }

  /**
   * Export analytics data
   */
  async exportAnalytics(format: 'csv' | 'json', options: IExportOptions): Promise<Blob> {
    try {
      const report = await this.getAnalyticsReport(options);

      if (format === 'json') {
        const jsonData = JSON.stringify(report, null, 2);
        return new Blob([jsonData], { type: 'application/json' });
      } else if (format === 'csv') {
        const csvData = this.convertToCSV(report.data);
        return new Blob([csvData], { type: 'text/csv' });
      } else {
        throw new Error(`Unsupported format: ${format}`);
      }
    } catch (error: any) {
      throw new Error(`Failed to export analytics: ${error.message}`);
    }
  }

  // Helper methods

  /**
   * Sanitize event parameters
   */
  private sanitizeParameters(params?: any): any {
    if (!params) return {};

    const sanitized: any = {};
    const keys = Object.keys(params).slice(0, 25); // Max 25 parameters

    for (const key of keys) {
      // Parameter names: max 40 chars, alphanumeric and underscores
      const sanitizedKey = key
        .substring(0, 40)
        .replace(/[^a-zA-Z0-9_]/g, '_');

      // Parameter values: max 100 chars for strings
      let value = params[key];
      if (typeof value === 'string') {
        value = value.substring(0, 100);
      }

      sanitized[sanitizedKey] = value;
    }

    return sanitized;
  }

  /**
   * Sanitize user properties
   */
  private sanitizeUserProperties(properties: Record<string, any>): Record<string, any> {
    const sanitized: any = {};
    const keys = Object.keys(properties).slice(0, 25); // Max 25 user properties

    for (const key of keys) {
      // Property names: max 24 chars, alphanumeric and underscores
      const sanitizedKey = key
        .substring(0, 24)
        .replace(/[^a-zA-Z0-9_]/g, '_');

      // Property values: max 36 chars for strings
      let value = properties[key];
      if (typeof value === 'string') {
        value = value.substring(0, 36);
      }

      sanitized[sanitizedKey] = value;
    }

    return sanitized;
  }

  /**
   * Store event locally when analytics is not available
   */
  private storeEventLocally(eventName: string, parameters?: any): void {
    // Store in custom metrics for later retrieval
    this.logCustomMetric('offline_event', 1, {
      eventName,
      ...parameters
    });
  }

  /**
   * Create mock trace for environments where Performance is not available
   */
  private createMockTrace(traceName: string): ITrace {
    const attributes: Record<string, string> = {};
    const metrics: Record<string, number> = {};
    const startTime = Date.now();

    return {
      putAttribute: (key: string, value: string | number) => {
        attributes[key] = String(value);
      },
      putMetric: (name: string, value: number) => {
        metrics[name] = value;
      },
      incrementMetric: (name: string, by: number = 1) => {
        metrics[name] = (metrics[name] || 0) + by;
      },
      stop: () => {
        const duration = Date.now() - startTime;
        this.logCustomMetric(`trace_${traceName}_duration`, duration, {
          attributes,
          metrics
        });
      }
    };
  }

  /**
   * Generate charts data
   */
  private generateCharts(metricsData: any[]): any[] {
    return metricsData.map(metric => ({
      type: 'line',
      name: metric.metric,
      data: metric.data.map((d: any) => ({
        x: d.timestamp,
        y: d.value
      }))
    }));
  }

  /**
   * Convert data to CSV format
   */
  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';

    const rows: string[] = [];

    // Header
    rows.push('Metric,Timestamp,Value,Metadata');

    // Data rows
    for (const metricData of data) {
      for (const point of metricData.data) {
        rows.push(
          `"${metricData.metric}","${point.timestamp.toISOString()}",${point.value},"${JSON.stringify(
            point.metadata || {}
          ).replace(/"/g, '""')}"`
        );
      }
    }

    return rows.join('\n');
  }

  /**
   * Enable or disable analytics collection
   */
  async setAnalyticsEnabled(enabled: boolean): Promise<void> {
    if (this.analytics) {
      setAnalyticsCollectionEnabled(this.analytics, enabled);
    }
  }

  /**
   * Get stored custom metrics
   */
  getCustomMetrics(): Map<string, any[]> {
    return new Map(this.customMetrics);
  }

  /**
   * Clear stored metrics
   */
  clearMetrics(): void {
    this.customMetrics.clear();
  }

  /**
   * Log conversion event
   */
  async logConversion(conversionName: string, value?: number, currency?: string): Promise<void> {
    if (!this.analytics) return;

    const params: any = {};
    if (value !== undefined) params.value = value;
    if (currency) params.currency = currency;

    logEvent(this.analytics, 'conversion', {
      conversion_name: conversionName,
      ...params
    });
  }

  /**
   * Log screen view (mobile specific)
   */
  async logScreenView(screenName: string, screenClass?: string): Promise<void> {
    if (!this.analytics) return;

    logEvent(this.analytics, 'screen_view', {
      firebase_screen: screenName,
      firebase_screen_class: screenClass || screenName
    });
  }

  /**
   * Log timing event
   */
  async logTiming(category: string, variable: string, time: number, label?: string): Promise<void> {
    if (!this.analytics) return;

    logEvent(this.analytics, 'timing_complete', {
      timing_category: category,
      timing_variable: variable,
      timing_time: time,
      timing_label: label
    });
  }
}