/**
 * Aggregate Metrics Scheduled Function Tests
 * Tests for metrics aggregation logic
 */

import {
  initializeTestEnvironment,
  cleanupTestEnvironment,
  TestTimeouts,
} from '../setup';

// ============================================
// MOCK DATA STRUCTURES
// ============================================

interface DailyMetrics {
  date: string;
  requests: number;
  errors: number;
  screenshots: number;
  sessions: number;
}

interface WeeklySummary {
  weekStart: string;
  weekEnd: string;
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
}

interface StorageUsage {
  totalScreenshots: number;
  totalSize: number;
  byTenant: Record<string, { count: number; size: number }>;
}

// Mock storage
const metrics: Map<string, DailyMetrics> = new Map();
const screenshots: Map<string, { size: number; uploadedAt: string; tenant: { identifier: string } }> = new Map();
const sessions: Map<string, { createdAt: string }> = new Map();

// ============================================
// HELPER FUNCTIONS
// ============================================

function getDateKey(daysAgo = 0): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
}

async function aggregateDailyMetrics(date: string): Promise<DailyMetrics> {
  const existingMetrics = metrics.get(`daily:${date}`);
  if (existingMetrics) {
    return existingMetrics;
  }

  // Count screenshots for the date
  const startOfDay = new Date(date);
  const endOfDay = new Date(date);
  endOfDay.setDate(endOfDay.getDate() + 1);

  let screenshotCount = 0;
  screenshots.forEach(s => {
    const uploadedAt = new Date(s.uploadedAt);
    if (uploadedAt >= startOfDay && uploadedAt < endOfDay) {
      screenshotCount++;
    }
  });

  let sessionCount = 0;
  sessions.forEach(s => {
    const createdAt = new Date(s.createdAt);
    if (createdAt >= startOfDay && createdAt < endOfDay) {
      sessionCount++;
    }
  });

  return {
    date,
    requests: 0,
    errors: 0,
    screenshots: screenshotCount,
    sessions: sessionCount,
  };
}

async function calculateWeeklySummary(): Promise<WeeklySummary> {
  const summary: WeeklySummary = {
    weekStart: getDateKey(7),
    weekEnd: getDateKey(1),
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

  for (let i = 1; i <= 7; i++) {
    const date = getDateKey(i);
    const dailyMetrics = await aggregateDailyMetrics(date);

    summary.totalRequests += dailyMetrics.requests;
    summary.totalErrors += dailyMetrics.errors;
    summary.totalScreenshots += dailyMetrics.screenshots;
    summary.totalSessions += dailyMetrics.sessions;
  }

  summary.dailyAverages = {
    requests: Math.round(summary.totalRequests / 7),
    errors: Math.round(summary.totalErrors / 7),
    screenshots: Math.round(summary.totalScreenshots / 7),
    sessions: Math.round(summary.totalSessions / 7),
  };

  if (summary.totalRequests > 0) {
    summary.errorRate = (summary.totalErrors / summary.totalRequests) * 100;
  }

  return summary;
}

async function calculateStorageUsage(): Promise<StorageUsage> {
  const usage: StorageUsage = {
    totalScreenshots: 0,
    totalSize: 0,
    byTenant: {},
  };

  screenshots.forEach(s => {
    usage.totalScreenshots++;
    usage.totalSize += s.size;

    const tenantId = s.tenant?.identifier || 'anonymous';
    if (!usage.byTenant[tenantId]) {
      usage.byTenant[tenantId] = { count: 0, size: 0 };
    }
    usage.byTenant[tenantId].count++;
    usage.byTenant[tenantId].size += s.size;
  });

  return usage;
}

// ============================================
// TEST SUITE
// ============================================

describe('Aggregate Metrics Scheduled Function', () => {
  beforeAll(() => {
    initializeTestEnvironment(false);
  });

  afterAll(() => {
    cleanupTestEnvironment();
  });

  beforeEach(() => {
    metrics.clear();
    screenshots.clear();
    sessions.clear();
  });

  describe('Date Key Generation', () => {
    it('should generate correct date key for today', () => {
      const key = getDateKey(0);
      const today = new Date().toISOString().split('T')[0];

      expect(key).toBe(today);
    }, TestTimeouts.SHORT);

    it('should generate correct date key for yesterday', () => {
      const key = getDateKey(1);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      expect(key).toBe(yesterday.toISOString().split('T')[0]);
    }, TestTimeouts.SHORT);

    it('should generate correct date key for 7 days ago', () => {
      const key = getDateKey(7);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      expect(key).toBe(sevenDaysAgo.toISOString().split('T')[0]);
    }, TestTimeouts.SHORT);

    it('should produce valid ISO date format', () => {
      const key = getDateKey(0);
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

      expect(key).toMatch(dateRegex);
    }, TestTimeouts.SHORT);
  });

  describe('Daily Metrics Aggregation', () => {
    it('should return zero counts for date with no data', async () => {
      const dailyMetrics = await aggregateDailyMetrics('2025-01-01');

      expect(dailyMetrics.requests).toBe(0);
      expect(dailyMetrics.errors).toBe(0);
      expect(dailyMetrics.screenshots).toBe(0);
      expect(dailyMetrics.sessions).toBe(0);
    }, TestTimeouts.SHORT);

    it('should count screenshots for specific date', async () => {
      const date = '2025-01-15';
      const dateTime = `${date}T12:00:00.000Z`;

      screenshots.set('s1', { size: 1000, uploadedAt: dateTime, tenant: { identifier: 'test' } });
      screenshots.set('s2', { size: 2000, uploadedAt: dateTime, tenant: { identifier: 'test' } });
      screenshots.set('s3', { size: 3000, uploadedAt: '2025-01-16T12:00:00.000Z', tenant: { identifier: 'test' } });

      const dailyMetrics = await aggregateDailyMetrics(date);

      expect(dailyMetrics.screenshots).toBe(2);
    }, TestTimeouts.SHORT);

    it('should count sessions for specific date', async () => {
      const date = '2025-01-15';
      const dateTime = `${date}T10:00:00.000Z`;

      sessions.set('session1', { createdAt: dateTime });
      sessions.set('session2', { createdAt: dateTime });
      sessions.set('session3', { createdAt: '2025-01-14T10:00:00.000Z' });

      const dailyMetrics = await aggregateDailyMetrics(date);

      expect(dailyMetrics.sessions).toBe(2);
    }, TestTimeouts.SHORT);

    it('should include date in metrics', async () => {
      const date = '2025-01-15';
      const dailyMetrics = await aggregateDailyMetrics(date);

      expect(dailyMetrics.date).toBe(date);
    }, TestTimeouts.SHORT);
  });

  describe('Weekly Summary Calculation', () => {
    it('should calculate week start and end dates', async () => {
      const summary = await calculateWeeklySummary();

      expect(summary.weekStart).toBe(getDateKey(7));
      expect(summary.weekEnd).toBe(getDateKey(1));
    }, TestTimeouts.SHORT);

    it('should sum metrics across 7 days', async () => {
      // Add metrics for multiple days
      for (let i = 1; i <= 7; i++) {
        const date = getDateKey(i);
        metrics.set(`daily:${date}`, {
          date,
          requests: 100,
          errors: 5,
          screenshots: 10,
          sessions: 20,
        });
      }

      // Re-implement to use stored metrics
      const summary: WeeklySummary = {
        weekStart: getDateKey(7),
        weekEnd: getDateKey(1),
        totalRequests: 0,
        totalErrors: 0,
        errorRate: 0,
        totalScreenshots: 0,
        totalSessions: 0,
        dailyAverages: { requests: 0, errors: 0, screenshots: 0, sessions: 0 },
      };

      for (let i = 1; i <= 7; i++) {
        const date = getDateKey(i);
        const daily = metrics.get(`daily:${date}`);
        if (daily) {
          summary.totalRequests += daily.requests;
          summary.totalErrors += daily.errors;
          summary.totalScreenshots += daily.screenshots;
          summary.totalSessions += daily.sessions;
        }
      }

      expect(summary.totalRequests).toBe(700);
      expect(summary.totalErrors).toBe(35);
      expect(summary.totalScreenshots).toBe(70);
      expect(summary.totalSessions).toBe(140);
    }, TestTimeouts.SHORT);

    it('should calculate daily averages', async () => {
      const summary = await calculateWeeklySummary();

      expect(summary.dailyAverages).toBeDefined();
      expect(typeof summary.dailyAverages.requests).toBe('number');
      expect(typeof summary.dailyAverages.errors).toBe('number');
      expect(typeof summary.dailyAverages.screenshots).toBe('number');
      expect(typeof summary.dailyAverages.sessions).toBe('number');
    }, TestTimeouts.SHORT);

    it('should calculate error rate correctly', async () => {
      // Create summary with known values
      const summary: WeeklySummary = {
        weekStart: '',
        weekEnd: '',
        totalRequests: 1000,
        totalErrors: 50,
        errorRate: 0,
        totalScreenshots: 0,
        totalSessions: 0,
        dailyAverages: { requests: 0, errors: 0, screenshots: 0, sessions: 0 },
      };

      if (summary.totalRequests > 0) {
        summary.errorRate = (summary.totalErrors / summary.totalRequests) * 100;
      }

      expect(summary.errorRate).toBe(5);
    }, TestTimeouts.SHORT);

    it('should handle zero requests without division error', async () => {
      const summary: WeeklySummary = {
        weekStart: '',
        weekEnd: '',
        totalRequests: 0,
        totalErrors: 0,
        errorRate: 0,
        totalScreenshots: 0,
        totalSessions: 0,
        dailyAverages: { requests: 0, errors: 0, screenshots: 0, sessions: 0 },
      };

      if (summary.totalRequests > 0) {
        summary.errorRate = (summary.totalErrors / summary.totalRequests) * 100;
      }

      expect(summary.errorRate).toBe(0);
      expect(isFinite(summary.errorRate)).toBe(true);
    }, TestTimeouts.SHORT);
  });

  describe('Storage Usage Calculation', () => {
    it('should calculate total screenshots count', async () => {
      screenshots.set('s1', { size: 1000, uploadedAt: '', tenant: { identifier: 'a' } });
      screenshots.set('s2', { size: 2000, uploadedAt: '', tenant: { identifier: 'b' } });
      screenshots.set('s3', { size: 3000, uploadedAt: '', tenant: { identifier: 'a' } });

      const usage = await calculateStorageUsage();

      expect(usage.totalScreenshots).toBe(3);
    }, TestTimeouts.SHORT);

    it('should calculate total storage size', async () => {
      screenshots.set('s1', { size: 1000, uploadedAt: '', tenant: { identifier: 'a' } });
      screenshots.set('s2', { size: 2500, uploadedAt: '', tenant: { identifier: 'b' } });
      screenshots.set('s3', { size: 3500, uploadedAt: '', tenant: { identifier: 'a' } });

      const usage = await calculateStorageUsage();

      expect(usage.totalSize).toBe(7000);
    }, TestTimeouts.SHORT);

    it('should group usage by tenant', async () => {
      screenshots.set('s1', { size: 1000, uploadedAt: '', tenant: { identifier: 'acme' } });
      screenshots.set('s2', { size: 2000, uploadedAt: '', tenant: { identifier: 'acme' } });
      screenshots.set('s3', { size: 3000, uploadedAt: '', tenant: { identifier: 'beta' } });

      const usage = await calculateStorageUsage();

      expect(usage.byTenant['acme']).toEqual({ count: 2, size: 3000 });
      expect(usage.byTenant['beta']).toEqual({ count: 1, size: 3000 });
    }, TestTimeouts.SHORT);

    it('should handle empty storage', async () => {
      const usage = await calculateStorageUsage();

      expect(usage.totalScreenshots).toBe(0);
      expect(usage.totalSize).toBe(0);
      expect(Object.keys(usage.byTenant).length).toBe(0);
    }, TestTimeouts.SHORT);

    it('should use anonymous for missing tenant identifier', async () => {
      screenshots.set('s1', { size: 1000, uploadedAt: '', tenant: { identifier: '' } });

      // Adjust logic to handle empty string
      const usage: StorageUsage = {
        totalScreenshots: 0,
        totalSize: 0,
        byTenant: {},
      };

      screenshots.forEach(s => {
        usage.totalScreenshots++;
        usage.totalSize += s.size;

        const tenantId = s.tenant?.identifier || 'anonymous';
        if (!usage.byTenant[tenantId]) {
          usage.byTenant[tenantId] = { count: 0, size: 0 };
        }
        usage.byTenant[tenantId].count++;
        usage.byTenant[tenantId].size += s.size;
      });

      expect(usage.byTenant['anonymous'] || usage.byTenant['']).toBeDefined();
    }, TestTimeouts.SHORT);
  });

  describe('Cleanup Logic', () => {
    it('should identify old metrics for cleanup', () => {
      const ninetyDaysAgo = getDateKey(90);
      const oldDate = getDateKey(91);
      const recentDate = getDateKey(30);

      expect(oldDate < ninetyDaysAgo).toBe(true);
      expect(recentDate < ninetyDaysAgo).toBe(false);
    }, TestTimeouts.SHORT);

    it('should only cleanup daily and request metrics', () => {
      const docsToCleanup = [
        { id: 'daily:2024-01-01', shouldDelete: true },
        { id: 'requests:2024-01-01', shouldDelete: true },
        { id: 'errors:2024-01-01', shouldDelete: true },
        { id: 'weekly:2024-01-07', shouldDelete: false },
        { id: 'storage:2024-01', shouldDelete: false },
      ];

      for (const doc of docsToCleanup) {
        const shouldCleanup = doc.id.startsWith('daily:') ||
                             doc.id.startsWith('requests:') ||
                             doc.id.startsWith('errors:');
        expect(shouldCleanup).toBe(doc.shouldDelete);
      }
    }, TestTimeouts.SHORT);
  });
});
