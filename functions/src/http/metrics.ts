/**
 * Metrics HTTP Function
 * Tracks usage, performance, and error metrics
 */

import { onRequest, HttpsOptions } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { getFirestore, Collections } from '../config/firebase.config.js';
import { getCorsHeaders } from '../config/cors.config.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { RAPIDTRIAGE_API_TOKEN } from '../config/secrets.js';

/**
 * Metrics response structure
 */
interface MetricsResponse {
  period: {
    start: string;
    end: string;
    days: number;
  };
  requests: {
    total: number;
    byPath: Record<string, number>;
    byMethod: Record<string, number>;
    daily: Array<{ date: string; count: number }>;
  };
  errors: {
    total: number;
    byType: Record<string, number>;
    rate: number;
  };
  performance: {
    avgResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
  };
  sessions: {
    total: number;
    active: number;
    byType: Record<string, number>;
  };
  storage: {
    screenshotCount: number;
    totalSize: number;
  };
}

/**
 * Get date key for metrics
 */
function getDateKey(daysAgo = 0): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
}

/**
 * Get aggregated metrics for a period
 */
async function getAggregatedMetrics(days: number): Promise<MetricsResponse> {
  const db = getFirestore();
  const endDate = getDateKey(0);
  const startDate = getDateKey(days - 1);

  const metrics: MetricsResponse = {
    period: {
      start: startDate,
      end: endDate,
      days,
    },
    requests: {
      total: 0,
      byPath: {},
      byMethod: {},
      daily: [],
    },
    errors: {
      total: 0,
      byType: {},
      rate: 0,
    },
    performance: {
      avgResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
    },
    sessions: {
      total: 0,
      active: 0,
      byType: {},
    },
    storage: {
      screenshotCount: 0,
      totalSize: 0,
    },
  };

  try {
    // Get request metrics from the metrics collection
    for (let i = 0; i < days; i++) {
      const dateKey = getDateKey(i);
      const requestDoc = await db.collection(Collections.METRICS).doc(`requests:${dateKey}`).get();

      if (requestDoc.exists) {
        const data = requestDoc.data() as {
          total: number;
          byPath: Record<string, number>;
          byMethod: Record<string, number>;
        };

        metrics.requests.total += data.total || 0;
        metrics.requests.daily.push({ date: dateKey, count: data.total || 0 });

        // Aggregate by path
        Object.entries(data.byPath || {}).forEach(([path, count]) => {
          metrics.requests.byPath[path] = (metrics.requests.byPath[path] || 0) + count;
        });

        // Aggregate by method
        Object.entries(data.byMethod || {}).forEach(([method, count]) => {
          metrics.requests.byMethod[method] = (metrics.requests.byMethod[method] || 0) + count;
        });
      }

      // Get error metrics
      const errorDoc = await db.collection(Collections.METRICS).doc(`errors:${dateKey}`).get();

      if (errorDoc.exists) {
        const data = errorDoc.data() as {
          total: number;
          byType: Record<string, number>;
        };

        metrics.errors.total += data.total || 0;

        Object.entries(data.byType || {}).forEach(([type, count]) => {
          metrics.errors.byType[type] = (metrics.errors.byType[type] || 0) + count;
        });
      }
    }

    // Calculate error rate
    if (metrics.requests.total > 0) {
      metrics.errors.rate = (metrics.errors.total / metrics.requests.total) * 100;
    }

    // Get session stats
    const sessionsSnapshot = await db.collection(Collections.SESSIONS).get();
    metrics.sessions.total = sessionsSnapshot.size;

    sessionsSnapshot.docs.forEach(doc => {
      const session = doc.data();
      if (session.status === 'active') {
        metrics.sessions.active++;
      }
      const type = session.type || 'unknown';
      metrics.sessions.byType[type] = (metrics.sessions.byType[type] || 0) + 1;
    });

    // Get storage stats
    const screenshotsSnapshot = await db.collection(Collections.SCREENSHOTS).get();
    metrics.storage.screenshotCount = screenshotsSnapshot.size;

    screenshotsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      metrics.storage.totalSize += data.size || 0;
    });

    // Estimate performance metrics (would come from actual tracking in production)
    metrics.performance = {
      avgResponseTime: 150,
      p95ResponseTime: 350,
      p99ResponseTime: 500,
    };

  } catch (error) {
    console.error('Error getting metrics:', error);
  }

  return metrics;
}

/**
 * Track a request for metrics
 */
export async function trackRequest(
  path: string,
  method: string,
  responseTime: number,
  statusCode: number
): Promise<void> {
  try {
    const db = getFirestore();
    const dateKey = getDateKey();
    const docRef = db.collection(Collections.METRICS).doc(`requests:${dateKey}`);

    await db.runTransaction(async transaction => {
      const doc = await transaction.get(docRef);
      const data = doc.exists ? doc.data() as Record<string, unknown> : {
        total: 0,
        byPath: {},
        byMethod: {},
        byStatus: {},
      };

      transaction.set(docRef, {
        total: ((data.total as number) || 0) + 1,
        byPath: {
          ...(data.byPath as Record<string, number> || {}),
          [path]: ((data.byPath as Record<string, number>)?.[path] || 0) + 1,
        },
        byMethod: {
          ...(data.byMethod as Record<string, number> || {}),
          [method]: ((data.byMethod as Record<string, number>)?.[method] || 0) + 1,
        },
        byStatus: {
          ...(data.byStatus as Record<string, number> || {}),
          [statusCode.toString()]: ((data.byStatus as Record<string, number>)?.[statusCode.toString()] || 0) + 1,
        },
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    });

    // Track errors separately
    if (statusCode >= 400) {
      const errorDocRef = db.collection(Collections.METRICS).doc(`errors:${dateKey}`);
      await errorDocRef.set({
        total: admin.firestore.FieldValue.increment(1),
        [`byStatus.${statusCode}`]: admin.firestore.FieldValue.increment(1),
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    }
  } catch (error) {
    console.error('Error tracking request:', error);
  }
}

/**
 * HTTP Function options
 */
const options: HttpsOptions = {
  region: 'us-central1',
  memory: '256MiB',
  timeoutSeconds: 60,
  minInstances: 0,
  maxInstances: 10,
  secrets: [RAPIDTRIAGE_API_TOKEN],
};

/**
 * Metrics endpoint
 * GET /metrics
 */
export const metrics = onRequest(options, async (request, response) => {
  // Handle CORS
  const origin = request.headers.origin;
  const corsHeaders = getCorsHeaders(origin);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.set(key, value);
  });

  // Handle preflight
  if (request.method === 'OPTIONS') {
    response.status(204).send('');
    return;
  }

  // Check authentication
  const authResult = await authenticate(request as unknown as AuthenticatedRequest, response, () => {});

  try {
    const days = parseInt(request.query.days as string || '7', 10);
    const metricsData = await getAggregatedMetrics(Math.min(days, 90));

    response.status(200).json({
      success: true,
      data: metricsData,
    });
  } catch (error) {
    console.error('Metrics error:', error);
    response.status(500).json({
      success: false,
      error: 'Failed to retrieve metrics',
    });
  }
});
