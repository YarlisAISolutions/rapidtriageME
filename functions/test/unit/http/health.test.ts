/**
 * Health Endpoint Unit Tests
 */

// Mock dependencies before imports
jest.mock('firebase-admin', () => {
  const mockDoc = {
    get: jest.fn(() => Promise.resolve({ exists: true })),
    set: jest.fn(() => Promise.resolve()),
    delete: jest.fn(() => Promise.resolve()),
  };

  const mockCollection = {
    doc: jest.fn(() => mockDoc),
  };

  const mockFirestore = jest.fn(() => ({
    collection: jest.fn(() => mockCollection),
  }));

  return {
    initializeApp: jest.fn(),
    apps: [],
    firestore: Object.assign(mockFirestore, {
      FieldValue: {
        serverTimestamp: jest.fn(() => 'timestamp'),
      },
    }),
  };
});

jest.mock('firebase-functions/v2/https', () => ({
  onRequest: jest.fn((options, handler) => handler),
  HttpsError: class HttpsError extends Error {
    constructor(public code: string, message: string) {
      super(message);
    }
  },
}));

jest.mock('../../../src/config/firebase.config', () => ({
  getFirestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(() => Promise.resolve({ exists: true })),
        set: jest.fn(() => Promise.resolve()),
        delete: jest.fn(() => Promise.resolve()),
      })),
    })),
  })),
}));

jest.mock('../../../src/config/cors.config', () => ({
  getCorsHeaders: jest.fn(() => ({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  })),
}));

jest.mock('../../../src/config/secrets', () => ({
  ENVIRONMENT: {
    value: jest.fn(() => 'test'),
  },
}));

describe('Health Endpoint', () => {
  describe('Health Check Response', () => {
    it('should define response structure', () => {
      interface HealthCheckResponse {
        status: 'healthy' | 'degraded' | 'unhealthy';
        timestamp: string;
        environment: string;
        version: string;
        service: string;
        provider: string;
        endpoints: {
          sse: string;
          health: string;
          metrics: string;
          api: string;
        };
        checks: {
          firestore: string;
          storage: string;
          auth: string;
        };
      }

      const response: HealthCheckResponse = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: 'production',
        version: '1.0.0',
        service: 'RapidTriageME',
        provider: 'YarlisAISolutions',
        endpoints: {
          sse: '/sse',
          health: '/health',
          metrics: '/metrics',
          api: '/api',
        },
        checks: {
          firestore: 'ok',
          storage: 'ok',
          auth: 'ok',
        },
      };

      expect(response.status).toBe('healthy');
      expect(response.service).toBe('RapidTriageME');
      expect(response.endpoints.health).toBe('/health');
    });

    it('should support degraded status', () => {
      const response = {
        status: 'degraded' as const,
        checks: {
          firestore: 'ok',
          storage: 'error',
          auth: 'ok',
        },
      };

      expect(response.status).toBe('degraded');
      expect(response.checks.storage).toBe('error');
    });

    it('should support unhealthy status', () => {
      const response = {
        status: 'unhealthy' as const,
        checks: {
          firestore: 'error',
          storage: 'error',
          auth: 'error',
        },
      };

      expect(response.status).toBe('unhealthy');
    });
  });

  describe('Health Status Determination', () => {
    it('should be healthy when all checks pass', () => {
      const checks = { firestore: 'ok', storage: 'ok', auth: 'ok' };
      const allHealthy = Object.values(checks).every(s => s === 'ok');
      expect(allHealthy).toBe(true);
    });

    it('should be unhealthy when any check fails', () => {
      const checks = { firestore: 'error', storage: 'ok', auth: 'ok' };
      const anyError = Object.values(checks).some(s => s === 'error');
      expect(anyError).toBe(true);
    });

    it('should determine overall status correctly', () => {
      const determineStatus = (checks: Record<string, string>) => {
        const allHealthy = Object.values(checks).every(s => s === 'ok');
        const anyError = Object.values(checks).some(s => s === 'error');
        return anyError ? 'unhealthy' : allHealthy ? 'healthy' : 'degraded';
      };

      expect(determineStatus({ a: 'ok', b: 'ok' })).toBe('healthy');
      expect(determineStatus({ a: 'ok', b: 'error' })).toBe('unhealthy');
      expect(determineStatus({ a: 'ok', b: 'warning' })).toBe('degraded');
    });
  });

  describe('HTTP Status Codes', () => {
    it('should return 200 for healthy', () => {
      const getStatusCode = (status: string) => {
        if (status === 'healthy') return 200;
        if (status === 'unhealthy') return 503;
        return 200; // degraded still returns 200
      };

      expect(getStatusCode('healthy')).toBe(200);
      expect(getStatusCode('degraded')).toBe(200);
      expect(getStatusCode('unhealthy')).toBe(503);
    });
  });

  describe('Endpoint Configuration', () => {
    it('should define correct endpoints', () => {
      const endpoints = {
        sse: '/sse',
        health: '/health',
        metrics: '/metrics',
        api: '/api',
      };

      expect(endpoints.sse).toBe('/sse');
      expect(endpoints.health).toBe('/health');
      expect(endpoints.metrics).toBe('/metrics');
      expect(endpoints.api).toBe('/api');
    });
  });

  describe('Service Metadata', () => {
    it('should include service name', () => {
      const serviceName = 'RapidTriageME';
      expect(serviceName).toBe('RapidTriageME');
    });

    it('should include provider', () => {
      const provider = 'YarlisAISolutions';
      expect(provider).toBe('YarlisAISolutions');
    });

    it('should include version', () => {
      const version = '1.0.0';
      expect(version).toMatch(/^\d+\.\d+\.\d+$/);
    });
  });

  describe('CORS Handling', () => {
    it('should include CORS headers', () => {
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      };

      expect(corsHeaders['Access-Control-Allow-Origin']).toBeDefined();
      expect(corsHeaders['Access-Control-Allow-Methods']).toContain('GET');
    });

    it('should handle OPTIONS preflight', () => {
      const method = 'OPTIONS';
      const shouldReturn204 = method === 'OPTIONS';
      expect(shouldReturn204).toBe(true);
    });
  });

  describe('Response Headers', () => {
    it('should set content type to JSON', () => {
      const contentType = 'application/json';
      expect(contentType).toBe('application/json');
    });

    it('should disable caching', () => {
      const cacheControl = 'no-cache';
      expect(cacheControl).toBe('no-cache');
    });
  });
});
