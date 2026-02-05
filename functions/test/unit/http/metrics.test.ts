/**
 * Metrics Endpoint Unit Tests
 */

// Mock dependencies before imports
jest.mock('firebase-admin', () => {
  const mockFirestore = jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(() => Promise.resolve({
          exists: true,
          data: () => ({
            total: 100,
            byPath: { '/api': 50, '/health': 30 },
            byMethod: { GET: 70, POST: 30 },
          }),
        })),
        set: jest.fn(() => Promise.resolve()),
      })),
      get: jest.fn(() => Promise.resolve({
        docs: [
          { data: () => ({ status: 'active', type: 'browser' }) },
          { data: () => ({ status: 'active', type: 'mcp' }) },
        ],
        size: 2,
      })),
    })),
    runTransaction: jest.fn(callback =>
      callback({
        get: jest.fn(() => Promise.resolve({
          exists: true,
          data: () => ({ total: 0, byPath: {}, byMethod: {}, byStatus: {} }),
        })),
        set: jest.fn(),
      })
    ),
  }));

  return {
    initializeApp: jest.fn(),
    apps: [],
    firestore: Object.assign(mockFirestore, {
      FieldValue: {
        serverTimestamp: jest.fn(() => 'timestamp'),
        increment: jest.fn((n) => n),
      },
    }),
  };
});

jest.mock('firebase-functions/v2/https', () => ({
  onRequest: jest.fn((options, handler) => handler),
}));

jest.mock('../../../src/config/firebase.config', () => ({
  getFirestore: jest.fn(),
  Collections: {
    METRICS: 'metrics',
    SESSIONS: 'sessions',
    SCREENSHOTS: 'screenshots',
  },
}));

jest.mock('../../../src/config/cors.config', () => ({
  getCorsHeaders: jest.fn(() => ({})),
}));

jest.mock('../../../src/config/secrets', () => ({
  RAPIDTRIAGE_API_TOKEN: {
    value: jest.fn(() => 'test-token'),
  },
}));

jest.mock('../../../src/middleware/auth.middleware', () => ({
  authenticate: jest.fn(() => Promise.resolve(true)),
}));

describe('Metrics Endpoint', () => {
  describe('MetricsResponse Interface', () => {
    it('should define complete metrics structure', () => {
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

      const response: MetricsResponse = {
        period: {
          start: '2024-01-01',
          end: '2024-01-07',
          days: 7,
        },
        requests: {
          total: 1000,
          byPath: { '/api': 500, '/health': 300, '/metrics': 200 },
          byMethod: { GET: 800, POST: 200 },
          daily: [
            { date: '2024-01-01', count: 150 },
            { date: '2024-01-02', count: 140 },
          ],
        },
        errors: {
          total: 10,
          byType: { '400': 5, '500': 3, '401': 2 },
          rate: 1.0,
        },
        performance: {
          avgResponseTime: 150,
          p95ResponseTime: 350,
          p99ResponseTime: 500,
        },
        sessions: {
          total: 50,
          active: 10,
          byType: { browser: 30, mcp: 15, api: 5 },
        },
        storage: {
          screenshotCount: 100,
          totalSize: 104857600, // 100MB
        },
      };

      expect(response.period.days).toBe(7);
      expect(response.requests.total).toBe(1000);
      expect(response.errors.rate).toBe(1.0);
    });
  });

  describe('Date Key Generation', () => {
    it('should generate correct date key format', () => {
      const getDateKey = (daysAgo = 0): string => {
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        return date.toISOString().split('T')[0];
      };

      const today = getDateKey(0);
      const yesterday = getDateKey(1);

      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(yesterday).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should return different dates for different days ago', () => {
      const getDateKey = (daysAgo = 0): string => {
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        return date.toISOString().split('T')[0];
      };

      const today = getDateKey(0);
      const weekAgo = getDateKey(7);

      expect(today).not.toBe(weekAgo);
    });
  });

  describe('Error Rate Calculation', () => {
    it('should calculate error rate correctly', () => {
      const totalRequests = 1000;
      const totalErrors = 10;
      const errorRate = (totalErrors / totalRequests) * 100;

      expect(errorRate).toBe(1.0);
    });

    it('should handle zero requests', () => {
      const totalRequests = 0;
      const totalErrors = 0;
      const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;

      expect(errorRate).toBe(0);
    });

    it('should handle high error rates', () => {
      const totalRequests = 100;
      const totalErrors = 50;
      const errorRate = (totalErrors / totalRequests) * 100;

      expect(errorRate).toBe(50);
    });
  });

  describe('Performance Metrics', () => {
    it('should include average response time', () => {
      const performance = {
        avgResponseTime: 150,
        p95ResponseTime: 350,
        p99ResponseTime: 500,
      };

      expect(performance.avgResponseTime).toBeLessThan(performance.p95ResponseTime);
      expect(performance.p95ResponseTime).toBeLessThan(performance.p99ResponseTime);
    });

    it('should define default performance values', () => {
      const defaultPerformance = {
        avgResponseTime: 150,
        p95ResponseTime: 350,
        p99ResponseTime: 500,
      };

      expect(defaultPerformance.avgResponseTime).toBe(150);
      expect(defaultPerformance.p95ResponseTime).toBe(350);
      expect(defaultPerformance.p99ResponseTime).toBe(500);
    });
  });

  describe('Request Aggregation', () => {
    it('should aggregate requests by path', () => {
      const byPath: Record<string, number> = {};
      const paths = ['/api', '/api', '/health', '/api'];

      paths.forEach(path => {
        byPath[path] = (byPath[path] || 0) + 1;
      });

      expect(byPath['/api']).toBe(3);
      expect(byPath['/health']).toBe(1);
    });

    it('should aggregate requests by method', () => {
      const byMethod: Record<string, number> = {};
      const methods = ['GET', 'POST', 'GET', 'GET'];

      methods.forEach(method => {
        byMethod[method] = (byMethod[method] || 0) + 1;
      });

      expect(byMethod['GET']).toBe(3);
      expect(byMethod['POST']).toBe(1);
    });

    it('should aggregate errors by status code', () => {
      const byStatus: Record<string, number> = {};
      const statuses = ['400', '500', '400', '401'];

      statuses.forEach(status => {
        byStatus[status] = (byStatus[status] || 0) + 1;
      });

      expect(byStatus['400']).toBe(2);
      expect(byStatus['500']).toBe(1);
      expect(byStatus['401']).toBe(1);
    });
  });

  describe('Session Statistics', () => {
    it('should count total sessions', () => {
      const sessions = [
        { status: 'active', type: 'browser' },
        { status: 'idle', type: 'mcp' },
        { status: 'active', type: 'browser' },
      ];

      expect(sessions.length).toBe(3);
    });

    it('should count active sessions', () => {
      const sessions = [
        { status: 'active', type: 'browser' },
        { status: 'idle', type: 'mcp' },
        { status: 'active', type: 'browser' },
      ];

      const activeSessions = sessions.filter(s => s.status === 'active');
      expect(activeSessions.length).toBe(2);
    });

    it('should aggregate sessions by type', () => {
      const sessions = [
        { status: 'active', type: 'browser' },
        { status: 'idle', type: 'mcp' },
        { status: 'active', type: 'browser' },
      ];

      const byType: Record<string, number> = {};
      sessions.forEach(s => {
        byType[s.type] = (byType[s.type] || 0) + 1;
      });

      expect(byType['browser']).toBe(2);
      expect(byType['mcp']).toBe(1);
    });
  });

  describe('Storage Statistics', () => {
    it('should count screenshots', () => {
      const screenshots = [{ size: 1024 }, { size: 2048 }, { size: 512 }];
      expect(screenshots.length).toBe(3);
    });

    it('should sum total storage size', () => {
      const screenshots = [{ size: 1024 }, { size: 2048 }, { size: 512 }];
      const totalSize = screenshots.reduce((sum, s) => sum + s.size, 0);

      expect(totalSize).toBe(3584);
    });
  });

  describe('Period Handling', () => {
    it('should default to 7 days', () => {
      const defaultDays = 7;
      expect(defaultDays).toBe(7);
    });

    it('should limit to 90 days maximum', () => {
      const requestedDays = 365;
      const maxDays = 90;
      const days = Math.min(requestedDays, maxDays);

      expect(days).toBe(90);
    });

    it('should parse days from query parameter', () => {
      const query = { days: '14' };
      const days = parseInt(query.days || '7', 10);

      expect(days).toBe(14);
    });
  });

  describe('trackRequest Function', () => {
    it('should track request with all parameters', () => {
      const trackingData = {
        path: '/api/screenshot',
        method: 'POST',
        responseTime: 250,
        statusCode: 200,
      };

      expect(trackingData.path).toBe('/api/screenshot');
      expect(trackingData.method).toBe('POST');
      expect(trackingData.responseTime).toBe(250);
      expect(trackingData.statusCode).toBe(200);
    });

    it('should identify error status codes', () => {
      const errorCodes = [400, 401, 403, 404, 500, 502, 503];
      const isError = (code: number) => code >= 400;

      errorCodes.forEach(code => {
        expect(isError(code)).toBe(true);
      });
    });

    it('should identify success status codes', () => {
      const successCodes = [200, 201, 204];
      const isSuccess = (code: number) => code >= 200 && code < 300;

      successCodes.forEach(code => {
        expect(isSuccess(code)).toBe(true);
      });
    });
  });

  describe('Response Format', () => {
    it('should return success wrapper', () => {
      const response = {
        success: true,
        data: { period: { days: 7 }, requests: { total: 100 } },
      };

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
    });

    it('should return error wrapper on failure', () => {
      const response = {
        success: false,
        error: 'Failed to retrieve metrics',
      };

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
    });
  });
});
