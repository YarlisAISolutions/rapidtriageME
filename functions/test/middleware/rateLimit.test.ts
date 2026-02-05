/**
 * Rate Limiting Middleware Tests
 * Tests for rate limiting functionality
 */

import {
  initializeTestEnvironment,
  cleanupTestEnvironment,
  createMockRequest,
  createMockResponse,
  TestTimeouts,
} from '../setup';

// ============================================
// MOCK RATE LIMITER
// ============================================

interface RateLimitConfig {
  limit: number;
  windowMs: number;
  keyPrefix?: string;
}

interface RateLimitData {
  windowStart: number;
  count: number;
  lastRequest: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

const RateLimitPresets = {
  default: { limit: 100, windowMs: 60000 },
  strict: { limit: 20, windowMs: 60000 },
  relaxed: { limit: 500, windowMs: 60000 },
  api: { limit: 1000, windowMs: 60000 },
  screenshot: { limit: 30, windowMs: 60000 },
} as const;

// Mock storage for rate limits
const rateLimits: Map<string, RateLimitData> = new Map();

class MockRateLimiter {
  private config: RateLimitConfig;

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = {
      limit: config.limit || RateLimitPresets.default.limit,
      windowMs: config.windowMs || RateLimitPresets.default.windowMs,
      keyPrefix: config.keyPrefix || 'rate_limit',
    };
  }

  private getClientId(request: Partial<import('express').Request>): string {
    // Check for user ID in request
    const user = (request as Record<string, unknown>).user as { userId?: string; keyId?: string } | undefined;
    if (user?.userId) return `user:${user.userId}`;
    if (user?.keyId) return `key:${user.keyId}`;

    // Check headers for IP
    const headers = request.headers || {};
    if (headers['cf-connecting-ip']) return `ip:${headers['cf-connecting-ip']}`;
    if (headers['x-forwarded-for']) {
      const ip = String(headers['x-forwarded-for']).split(',')[0].trim();
      return `ip:${ip}`;
    }
    if (headers['x-real-ip']) return `ip:${headers['x-real-ip']}`;

    return 'ip:unknown';
  }

  private hashKey(key: string): string {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = ((hash << 5) - hash) + key.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  async check(request: Partial<import('express').Request>): Promise<RateLimitResult> {
    const clientId = this.getClientId(request);
    const key = `${this.config.keyPrefix}:${clientId}`;
    const hashedKey = this.hashKey(key);
    const now = Date.now();

    const data = rateLimits.get(hashedKey);

    // New window or window expired
    if (!data || now - data.windowStart > this.config.windowMs) {
      rateLimits.set(hashedKey, {
        windowStart: now,
        count: 1,
        lastRequest: now,
      });

      return {
        allowed: true,
        remaining: this.config.limit - 1,
        resetTime: now + this.config.windowMs,
      };
    }

    // Check if limit exceeded
    if (data.count >= this.config.limit) {
      const retryAfter = Math.ceil((data.windowStart + this.config.windowMs - now) / 1000);
      return {
        allowed: false,
        remaining: 0,
        resetTime: data.windowStart + this.config.windowMs,
        retryAfter,
      };
    }

    // Increment counter
    data.count++;
    data.lastRequest = now;
    rateLimits.set(hashedKey, data);

    return {
      allowed: true,
      remaining: this.config.limit - data.count,
      resetTime: data.windowStart + this.config.windowMs,
    };
  }

  middleware() {
    return async (
      req: Partial<import('express').Request>,
      res: ReturnType<typeof createMockResponse>['response'],
      next: () => void
    ) => {
      const result = await this.check(req);

      res.set!('X-RateLimit-Limit', this.config.limit.toString());
      res.set!('X-RateLimit-Remaining', result.remaining.toString());
      res.set!('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString());

      if (!result.allowed) {
        res.set!('Retry-After', result.retryAfter?.toString() || '60');
        res.status!(429);
        res.json!({
          success: false,
          error: 'Too Many Requests',
          retryAfter: result.retryAfter,
        });
        return;
      }

      next();
    };
  }

  async reset(clientId: string): Promise<void> {
    const key = `${this.config.keyPrefix}:${clientId}`;
    rateLimits.delete(this.hashKey(key));
  }

  async getStatus(clientId: string): Promise<RateLimitData | null> {
    const key = `${this.config.keyPrefix}:${clientId}`;
    return rateLimits.get(this.hashKey(key)) || null;
  }
}

// ============================================
// TEST SUITE
// ============================================

describe('Rate Limiting Middleware', () => {
  beforeAll(() => {
    initializeTestEnvironment(false);
  });

  afterAll(() => {
    cleanupTestEnvironment();
  });

  beforeEach(() => {
    rateLimits.clear();
  });

  describe('Client Identification', () => {
    it('should identify client by user ID when authenticated', async () => {
      const rateLimiter = new MockRateLimiter();
      const req = createMockRequest({ method: 'GET', path: '/api/test' });
      (req as Record<string, unknown>).user = { userId: 'test-user-123' };

      const { response, getHeaders } = createMockResponse();
      let nextCalled = false;

      await rateLimiter.middleware()(req, response, () => { nextCalled = true; });

      expect(nextCalled).toBe(true);
      expect(getHeaders()['X-RateLimit-Limit']).toBe('100');
    }, TestTimeouts.SHORT);

    it('should identify client by API key ID', async () => {
      const rateLimiter = new MockRateLimiter();
      const req = createMockRequest({ method: 'GET', path: '/api/test' });
      (req as Record<string, unknown>).user = { keyId: 'key-456' };

      const { response } = createMockResponse();
      let nextCalled = false;

      await rateLimiter.middleware()(req, response, () => { nextCalled = true; });

      expect(nextCalled).toBe(true);
    }, TestTimeouts.SHORT);

    it('should identify client by CF-Connecting-IP header', async () => {
      const rateLimiter = new MockRateLimiter();
      const req = createMockRequest({
        method: 'GET',
        path: '/api/test',
        headers: { 'cf-connecting-ip': '192.168.1.100' },
      });

      const { response } = createMockResponse();
      let nextCalled = false;

      await rateLimiter.middleware()(req, response, () => { nextCalled = true; });

      expect(nextCalled).toBe(true);
    }, TestTimeouts.SHORT);

    it('should identify client by X-Forwarded-For header', async () => {
      const rateLimiter = new MockRateLimiter();
      const req = createMockRequest({
        method: 'GET',
        path: '/api/test',
        headers: { 'x-forwarded-for': '10.0.0.1, 192.168.1.1' },
      });

      const { response } = createMockResponse();
      let nextCalled = false;

      await rateLimiter.middleware()(req, response, () => { nextCalled = true; });

      expect(nextCalled).toBe(true);
    }, TestTimeouts.SHORT);
  });

  describe('Rate Limit Enforcement', () => {
    it('should allow requests under the limit', async () => {
      const rateLimiter = new MockRateLimiter({ limit: 10, windowMs: 60000 });

      for (let i = 0; i < 10; i++) {
        const req = createMockRequest({
          method: 'GET',
          path: '/api/test',
          headers: { 'x-real-ip': '127.0.0.1' },
        });
        const { response, getHeaders } = createMockResponse();
        let nextCalled = false;

        await rateLimiter.middleware()(req, response, () => { nextCalled = true; });

        expect(nextCalled).toBe(true);
        expect(parseInt(getHeaders()['X-RateLimit-Remaining'])).toBe(10 - i - 1);
      }
    }, TestTimeouts.SHORT);

    it('should block requests over the limit', async () => {
      const rateLimiter = new MockRateLimiter({ limit: 3, windowMs: 60000 });

      // Make 3 requests to exhaust limit
      for (let i = 0; i < 3; i++) {
        const req = createMockRequest({
          method: 'GET',
          path: '/api/test',
          headers: { 'x-real-ip': '127.0.0.1' },
        });
        const { response } = createMockResponse();
        await rateLimiter.middleware()(req, response, () => {});
      }

      // 4th request should be blocked
      const req = createMockRequest({
        method: 'GET',
        path: '/api/test',
        headers: { 'x-real-ip': '127.0.0.1' },
      });
      const { response, getStatus, getBody, getHeaders } = createMockResponse();
      let nextCalled = false;

      await rateLimiter.middleware()(req, response, () => { nextCalled = true; });

      expect(nextCalled).toBe(false);
      expect(getStatus()).toBe(429);
      expect((getBody() as Record<string, unknown>).error).toBe('Too Many Requests');
      expect(getHeaders()['Retry-After']).toBeDefined();
    }, TestTimeouts.SHORT);

    it('should track limits separately for different clients', async () => {
      const rateLimiter = new MockRateLimiter({ limit: 3, windowMs: 60000 });

      // Exhaust limit for client 1
      for (let i = 0; i < 3; i++) {
        const req = createMockRequest({
          method: 'GET',
          path: '/api/test',
          headers: { 'x-real-ip': '192.168.1.1' },
        });
        const { response } = createMockResponse();
        await rateLimiter.middleware()(req, response, () => {});
      }

      // Client 2 should still be allowed
      const req = createMockRequest({
        method: 'GET',
        path: '/api/test',
        headers: { 'x-real-ip': '192.168.1.2' },
      });
      const { response, getHeaders } = createMockResponse();
      let nextCalled = false;

      await rateLimiter.middleware()(req, response, () => { nextCalled = true; });

      expect(nextCalled).toBe(true);
      expect(getHeaders()['X-RateLimit-Remaining']).toBe('2');
    }, TestTimeouts.SHORT);
  });

  describe('Rate Limit Headers', () => {
    it('should set X-RateLimit-Limit header', async () => {
      const rateLimiter = new MockRateLimiter({ limit: 50 });
      const req = createMockRequest({
        method: 'GET',
        path: '/api/test',
        headers: { 'x-real-ip': '127.0.0.1' },
      });
      const { response, getHeaders } = createMockResponse();

      await rateLimiter.middleware()(req, response, () => {});

      expect(getHeaders()['X-RateLimit-Limit']).toBe('50');
    }, TestTimeouts.SHORT);

    it('should set X-RateLimit-Remaining header', async () => {
      const rateLimiter = new MockRateLimiter({ limit: 100 });
      const req = createMockRequest({
        method: 'GET',
        path: '/api/test',
        headers: { 'x-real-ip': '127.0.0.1' },
      });
      const { response, getHeaders } = createMockResponse();

      await rateLimiter.middleware()(req, response, () => {});

      expect(getHeaders()['X-RateLimit-Remaining']).toBe('99');
    }, TestTimeouts.SHORT);

    it('should set X-RateLimit-Reset header', async () => {
      const rateLimiter = new MockRateLimiter({ limit: 100, windowMs: 60000 });
      const req = createMockRequest({
        method: 'GET',
        path: '/api/test',
        headers: { 'x-real-ip': '127.0.0.1' },
      });
      const { response, getHeaders } = createMockResponse();

      await rateLimiter.middleware()(req, response, () => {});

      const resetTime = parseInt(getHeaders()['X-RateLimit-Reset']);
      const expectedReset = Math.ceil((Date.now() + 60000) / 1000);

      // Allow 2 second tolerance
      expect(Math.abs(resetTime - expectedReset)).toBeLessThan(2);
    }, TestTimeouts.SHORT);

    it('should set Retry-After header when rate limited', async () => {
      const rateLimiter = new MockRateLimiter({ limit: 1, windowMs: 30000 });

      // Exhaust limit
      const req1 = createMockRequest({
        method: 'GET',
        path: '/api/test',
        headers: { 'x-real-ip': '127.0.0.1' },
      });
      await rateLimiter.middleware()(req1, createMockResponse().response, () => {});

      // Second request should be blocked
      const req2 = createMockRequest({
        method: 'GET',
        path: '/api/test',
        headers: { 'x-real-ip': '127.0.0.1' },
      });
      const { response, getHeaders } = createMockResponse();
      await rateLimiter.middleware()(req2, response, () => {});

      const retryAfter = parseInt(getHeaders()['Retry-After']);
      expect(retryAfter).toBeGreaterThan(0);
      expect(retryAfter).toBeLessThanOrEqual(30);
    }, TestTimeouts.SHORT);
  });

  describe('Preset Configurations', () => {
    it('should have correct default preset values', () => {
      expect(RateLimitPresets.default.limit).toBe(100);
      expect(RateLimitPresets.default.windowMs).toBe(60000);
    }, TestTimeouts.SHORT);

    it('should have strict preset with lower limit', () => {
      expect(RateLimitPresets.strict.limit).toBe(20);
    }, TestTimeouts.SHORT);

    it('should have relaxed preset with higher limit', () => {
      expect(RateLimitPresets.relaxed.limit).toBe(500);
    }, TestTimeouts.SHORT);

    it('should have api preset with high limit', () => {
      expect(RateLimitPresets.api.limit).toBe(1000);
    }, TestTimeouts.SHORT);

    it('should have screenshot preset with moderate limit', () => {
      expect(RateLimitPresets.screenshot.limit).toBe(30);
    }, TestTimeouts.SHORT);
  });

  describe('Rate Limit Reset', () => {
    it('should reset rate limit for a client', async () => {
      const rateLimiter = new MockRateLimiter({ limit: 3, windowMs: 60000 });

      // Exhaust limit
      for (let i = 0; i < 3; i++) {
        const req = createMockRequest({
          method: 'GET',
          path: '/api/test',
        });
        (req as Record<string, unknown>).user = { userId: 'test-user' };
        const { response } = createMockResponse();
        await rateLimiter.middleware()(req, response, () => {});
      }

      // Reset the limit
      await rateLimiter.reset('user:test-user');

      // Should be allowed again
      const req = createMockRequest({
        method: 'GET',
        path: '/api/test',
      });
      (req as Record<string, unknown>).user = { userId: 'test-user' };
      const { response, getHeaders } = createMockResponse();
      let nextCalled = false;

      await rateLimiter.middleware()(req, response, () => { nextCalled = true; });

      expect(nextCalled).toBe(true);
      expect(getHeaders()['X-RateLimit-Remaining']).toBe('2');
    }, TestTimeouts.SHORT);
  });

  describe('Rate Limit Status', () => {
    it('should get current status for a client', async () => {
      const rateLimiter = new MockRateLimiter({ limit: 10, windowMs: 60000 });

      // Make some requests
      for (let i = 0; i < 5; i++) {
        const req = createMockRequest({
          method: 'GET',
          path: '/api/test',
        });
        (req as Record<string, unknown>).user = { userId: 'status-test-user' };
        const { response } = createMockResponse();
        await rateLimiter.middleware()(req, response, () => {});
      }

      const status = await rateLimiter.getStatus('user:status-test-user');

      expect(status).toBeDefined();
      expect(status?.count).toBe(5);
    }, TestTimeouts.SHORT);

    it('should return null for unknown client', async () => {
      const rateLimiter = new MockRateLimiter();

      const status = await rateLimiter.getStatus('user:unknown-user');

      expect(status).toBeNull();
    }, TestTimeouts.SHORT);
  });
});
