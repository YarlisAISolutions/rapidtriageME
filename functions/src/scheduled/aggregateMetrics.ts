/**
 * Aggregate Metrics Scheduled Function
 * Runs daily to aggregate and summarize metrics data
 */

import { onSchedule, ScheduleOptions } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';
import { getFirestore, Collections } from '../config/firebase.config.js';

/**
 * Scheduled function options
 */
const options: ScheduleOptions = {
  region: 'us-central1',
  schedule: '0 1 * * *', // Run at 1 AM daily
  timeZone: 'UTC',
  memory: '512MiB',
  timeoutSeconds: 540, // 9 minutes
  retryCount: 2,
};

/**
 * Get date key for a specific day
 */
function getDateKey(daysAgo = 0): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
}

/**
 * Aggregate daily metrics
 */
async function aggregateDailyMetrics(date: string): Promise<{
  requests: number;
  errors: number;
  screenshots: number;
  sessions: number;
}> {
  const db = getFirestore();

  const metrics = {
    requests: 0,
    errors: 0,
    screenshots: 0,
    sessions: 0,
  };

  try {
    // Get request metrics
    const requestDoc = await db.collection(Collections.METRICS).doc(`requests:${date}`).get();
    if (requestDoc.exists) {
      metrics.requests = (requestDoc.data() as { total?: number })?.total || 0;
    }

    // Get error metrics
    const errorDoc = await db.collection(Collections.METRICS).doc(`errors:${date}`).get();
    if (errorDoc.exists) {
      metrics.errors = (errorDoc.data() as { total?: number })?.total || 0;
    }

    // Count screenshots created on this date
    const startOfDay = new Date(date);
    const endOfDay = new Date(date);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const screenshotsSnapshot = await db
      .collection(Collections.SCREENSHOTS)
      .where('uploadedAt', '>=', startOfDay.toISOString())
      .where('uploadedAt', '<', endOfDay.toISOString())
      .count()
      .get();
    metrics.screenshots = screenshotsSnapshot.data().count;

    // Count sessions created on this date
    const sessionsSnapshot = await db
      .collection(Collections.SESSIONS)
      .where('createdAt', '>=', startOfDay.toISOString())
      .where('createdAt', '<', endOfDay.toISOString())
      .count()
      .get();
    metrics.sessions = sessionsSnapshot.data().count;
  } catch (error) {
    console.error(`Error aggregating metrics for ${date}:`, error);
  }

  return metrics;
}

/**
 * Calculate weekly summary
 */
async function calculateWeeklySummary(): Promise<{
  totalRequests: number;
  totalErrors: number;
  errorRate: number;
  totalScreenshots: number;
  totalSessions: number;
  dailyAverages: {
    requests: number;
    errors: number;
    screenshots: number;
    sessions: number;
  };
}> {
  const db = getFirestore();
  const summary = {
    totalRequests: 0,
    totalErrors: 0,
    errorRate: 0,
    totalScreenshots: 0,
    totalSessions: 0,
    dailyAverages: {
      requests: 0,
      errors: 0,
      screenshots: 0,
      sessions: 0,
    },
  };

  // Aggregate last 7 days
  for (let i = 1; i <= 7; i++) {
    const date = getDateKey(i);
    const dailyMetrics = await aggregateDailyMetrics(date);

    summary.totalRequests += dailyMetrics.requests;
    summary.totalErrors += dailyMetrics.errors;
    summary.totalScreenshots += dailyMetrics.screenshots;
    summary.totalSessions += dailyMetrics.sessions;
  }

  // Calculate averages
  summary.dailyAverages = {
    requests: Math.round(summary.totalRequests / 7),
    errors: Math.round(summary.totalErrors / 7),
    screenshots: Math.round(summary.totalScreenshots / 7),
    sessions: Math.round(summary.totalSessions / 7),
  };

  // Calculate error rate
  if (summary.totalRequests > 0) {
    summary.errorRate = (summary.totalErrors / summary.totalRequests) * 100;
  }

  return summary;
}

/**
 * Calculate storage usage
 */
async function calculateStorageUsage(): Promise<{
  totalScreenshots: number;
  totalSize: number;
  byTenant: Record<string, { count: number; size: number }>;
}> {
  const db = getFirestore();
  const usage = {
    totalScreenshots: 0,
    totalSize: 0,
    byTenant: {} as Record<string, { count: number; size: number }>,
  };

  const snapshot = await db.collection(Collections.SCREENSHOTS).get();

  snapshot.docs.forEach(doc => {
    const data = doc.data();
    usage.totalScreenshots++;
    usage.totalSize += data.size || 0;

    const tenantId = data.tenant?.identifier || 'anonymous';
    if (!usage.byTenant[tenantId]) {
      usage.byTenant[tenantId] = { count: 0, size: 0 };
    }
    usage.byTenant[tenantId].count++;
    usage.byTenant[tenantId].size += data.size || 0;
  });

  return usage;
}

/**
 * Aggregate metrics scheduled function
 */
export const aggregateMetrics = onSchedule(options, async (event) => {
  console.log('Starting metrics aggregation...');
  const startTime = Date.now();
  const db = getFirestore();

  try {
    // 1. Aggregate yesterday's metrics
    const yesterday = getDateKey(1);
    console.log(`Aggregating metrics for ${yesterday}...`);
    const dailyMetrics = await aggregateDailyMetrics(yesterday);

    // Store daily summary
    await db.collection(Collections.METRICS).doc(`daily:${yesterday}`).set({
      date: yesterday,
      ...dailyMetrics,
      aggregatedAt: new Date().toISOString(),
    });
    console.log(`Daily metrics stored for ${yesterday}`);

    // 2. Calculate weekly summary (if it's Sunday/Monday)
    const today = new Date();
    if (today.getDay() === 1) { // Monday
      console.log('Calculating weekly summary...');
      const weeklySummary = await calculateWeeklySummary();
      const weekStart = getDateKey(7);
      const weekEnd = getDateKey(1);

      await db.collection(Collections.METRICS).doc(`weekly:${weekEnd}`).set({
        weekStart,
        weekEnd,
        ...weeklySummary,
        aggregatedAt: new Date().toISOString(),
      });
      console.log('Weekly summary stored');
    }

    // 3. Calculate storage usage (monthly on 1st)
    if (today.getDate() === 1) {
      console.log('Calculating monthly storage usage...');
      const storageUsage = await calculateStorageUsage();
      const month = `${today.getFullYear()}-${(today.getMonth()).toString().padStart(2, '0')}`;

      await db.collection(Collections.METRICS).doc(`storage:${month}`).set({
        month,
        ...storageUsage,
        aggregatedAt: new Date().toISOString(),
      });
      console.log('Monthly storage usage stored');
    }

    // 4. Clean up old daily metrics (keep 90 days)
    const ninetyDaysAgo = getDateKey(90);
    const oldMetricsSnapshot = await db
      .collection(Collections.METRICS)
      .where('date', '<', ninetyDaysAgo)
      .limit(100)
      .get();

    if (!oldMetricsSnapshot.empty) {
      const batch = db.batch();
      oldMetricsSnapshot.docs.forEach(doc => {
        if (doc.id.startsWith('daily:') || doc.id.startsWith('requests:') || doc.id.startsWith('errors:')) {
          batch.delete(doc.ref);
        }
      });
      await batch.commit();
      console.log(`Cleaned up ${oldMetricsSnapshot.size} old metric records`);
    }

    const duration = Date.now() - startTime;
    console.log(`Metrics aggregation completed in ${duration}ms`);

    // Log completion
    await db.collection(Collections.AUDIT_LOGS).add({
      type: 'scheduled_aggregation',
      target: 'metrics',
      duration,
      date: yesterday,
      dailyMetrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Metrics aggregation error:', error);

    // Log error
    await db.collection(Collections.AUDIT_LOGS).add({
      type: 'scheduled_aggregation',
      target: 'metrics',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });

    throw error; // Re-throw to trigger retry
  }
});
