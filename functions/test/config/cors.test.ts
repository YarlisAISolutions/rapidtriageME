/**
 * CORS Configuration Tests
 * Tests for cross-origin request handling
 */

import {
  initializeTestEnvironment,
  cleanupTestEnvironment,
  createMockRequest,
  createMockResponse,
  TestTimeouts,
} from '../setup';

// ============================================
// MOCK CORS IMPLEMENTATION
// ============================================

const allowedOrigins = [
  'https://rapidtriage.me',
  'https://www.rapidtriage.me',
  'https://test.rapidtriage.me',
  'https://yarlisaisolutions.github.io',
  'http://localhost:3000',
  'http://localhost:3025',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3025',
];

function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  if (origin.startsWith('chrome-extension://')) return true;
  if (origin.includes('localhost') || origin.includes('127.0.0.1')) return true;
  if (origin.endsWith('.rapidtriage.me')) return true;
  return false;
}

function handleCors(
  request: Partial<import('express').Request>,
  response: ReturnType<typeof createMockResponse>['response']
): boolean {
  const origin = request.headers?.['origin'] as string | undefined;

  if (isAllowedOrigin(origin)) {
    response.set!('Access-Control-Allow-Origin', origin || '*');
  }

  response.set!('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.set!('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Extension-Id, X-Session-Id, X-API-Key');
  response.set!('Access-Control-Allow-Credentials', 'true');
  response.set!('Access-Control-Max-Age', '86400');

  if (request.method === 'OPTIONS') {
    response.status!(204);
    response.send!('');
    return true;
  }

  return false;
}

function getCorsHeaders(origin?: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': isAllowedOrigin(origin) ? (origin || '*') : '',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Extension-Id, X-Session-Id',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  };
}

// ============================================
// TEST SUITE
// ============================================

describe('CORS Configuration', () => {
  beforeAll(() => {
    initializeTestEnvironment(false);
  });

  afterAll(() => {
    cleanupTestEnvironment();
  });

  describe('Origin Validation', () => {
    it('should allow production origin', () => {
      expect(isAllowedOrigin('https://rapidtriage.me')).toBe(true);
    }, TestTimeouts.SHORT);

    it('should allow www subdomain', () => {
      expect(isAllowedOrigin('https://www.rapidtriage.me')).toBe(true);
    }, TestTimeouts.SHORT);

    it('should allow test subdomain', () => {
      expect(isAllowedOrigin('https://test.rapidtriage.me')).toBe(true);
    }, TestTimeouts.SHORT);

    it('should allow any rapidtriage.me subdomain', () => {
      expect(isAllowedOrigin('https://api.rapidtriage.me')).toBe(true);
      expect(isAllowedOrigin('https://staging.rapidtriage.me')).toBe(true);
      expect(isAllowedOrigin('https://preview-123.rapidtriage.me')).toBe(true);
    }, TestTimeouts.SHORT);

    it('should allow GitHub Pages origin', () => {
      expect(isAllowedOrigin('https://yarlisaisolutions.github.io')).toBe(true);
    }, TestTimeouts.SHORT);

    it('should allow localhost variations', () => {
      expect(isAllowedOrigin('http://localhost:3000')).toBe(true);
      expect(isAllowedOrigin('http://localhost:3025')).toBe(true);
      expect(isAllowedOrigin('http://localhost:5173')).toBe(true);
      expect(isAllowedOrigin('http://localhost:8080')).toBe(true);
    }, TestTimeouts.SHORT);

    it('should allow 127.0.0.1 variations', () => {
      expect(isAllowedOrigin('http://127.0.0.1:3000')).toBe(true);
      expect(isAllowedOrigin('http://127.0.0.1:3025')).toBe(true);
    }, TestTimeouts.SHORT);

    it('should allow Chrome extension origins', () => {
      expect(isAllowedOrigin('chrome-extension://abcdefghijklmnop')).toBe(true);
      expect(isAllowedOrigin('chrome-extension://xyz123456789')).toBe(true);
    }, TestTimeouts.SHORT);

    it('should allow requests with no origin (server-to-server)', () => {
      expect(isAllowedOrigin(undefined)).toBe(true);
    }, TestTimeouts.SHORT);

    it('should reject unknown origins', () => {
      expect(isAllowedOrigin('https://malicious-site.com')).toBe(false);
      expect(isAllowedOrigin('https://attacker.example.com')).toBe(false);
    }, TestTimeouts.SHORT);

    it('should reject origins that look similar but are not allowed', () => {
      expect(isAllowedOrigin('https://rapidtriage.me.evil.com')).toBe(false);
      expect(isAllowedOrigin('https://notrapidtriage.me')).toBe(false);
    }, TestTimeouts.SHORT);
  });

  describe('Preflight Request Handling', () => {
    it('should handle OPTIONS request and return 204', () => {
      const req = createMockRequest({
        method: 'OPTIONS',
        path: '/api/test',
        headers: {
          'origin': 'https://rapidtriage.me',
        },
      });
      const { response, getStatus, getHeaders } = createMockResponse();

      const handled = handleCors(req, response);

      expect(handled).toBe(true);
      expect(getStatus()).toBe(204);
      expect(getHeaders()['Access-Control-Allow-Origin']).toBe('https://rapidtriage.me');
    }, TestTimeouts.SHORT);

    it('should continue for non-OPTIONS requests', () => {
      const req = createMockRequest({
        method: 'GET',
        path: '/api/test',
        headers: {
          'origin': 'https://rapidtriage.me',
        },
      });
      const { response, getHeaders } = createMockResponse();

      const handled = handleCors(req, response);

      expect(handled).toBe(false);
      expect(getHeaders()['Access-Control-Allow-Origin']).toBe('https://rapidtriage.me');
    }, TestTimeouts.SHORT);
  });

  describe('CORS Headers', () => {
    it('should set Access-Control-Allow-Origin header', () => {
      const req = createMockRequest({
        method: 'GET',
        path: '/api/test',
        headers: {
          'origin': 'https://rapidtriage.me',
        },
      });
      const { response, getHeaders } = createMockResponse();

      handleCors(req, response);

      expect(getHeaders()['Access-Control-Allow-Origin']).toBe('https://rapidtriage.me');
    }, TestTimeouts.SHORT);

    it('should set Access-Control-Allow-Methods header', () => {
      const req = createMockRequest({
        method: 'GET',
        path: '/api/test',
        headers: {
          'origin': 'https://rapidtriage.me',
        },
      });
      const { response, getHeaders } = createMockResponse();

      handleCors(req, response);

      expect(getHeaders()['Access-Control-Allow-Methods']).toContain('GET');
      expect(getHeaders()['Access-Control-Allow-Methods']).toContain('POST');
      expect(getHeaders()['Access-Control-Allow-Methods']).toContain('PUT');
      expect(getHeaders()['Access-Control-Allow-Methods']).toContain('DELETE');
      expect(getHeaders()['Access-Control-Allow-Methods']).toContain('OPTIONS');
    }, TestTimeouts.SHORT);

    it('should set Access-Control-Allow-Headers header', () => {
      const req = createMockRequest({
        method: 'GET',
        path: '/api/test',
        headers: {
          'origin': 'https://rapidtriage.me',
        },
      });
      const { response, getHeaders } = createMockResponse();

      handleCors(req, response);

      expect(getHeaders()['Access-Control-Allow-Headers']).toContain('Content-Type');
      expect(getHeaders()['Access-Control-Allow-Headers']).toContain('Authorization');
      expect(getHeaders()['Access-Control-Allow-Headers']).toContain('X-Extension-Id');
      expect(getHeaders()['Access-Control-Allow-Headers']).toContain('X-Session-Id');
    }, TestTimeouts.SHORT);

    it('should set Access-Control-Allow-Credentials header', () => {
      const req = createMockRequest({
        method: 'GET',
        path: '/api/test',
        headers: {
          'origin': 'https://rapidtriage.me',
        },
      });
      const { response, getHeaders } = createMockResponse();

      handleCors(req, response);

      expect(getHeaders()['Access-Control-Allow-Credentials']).toBe('true');
    }, TestTimeouts.SHORT);

    it('should set Access-Control-Max-Age header', () => {
      const req = createMockRequest({
        method: 'GET',
        path: '/api/test',
        headers: {
          'origin': 'https://rapidtriage.me',
        },
      });
      const { response, getHeaders } = createMockResponse();

      handleCors(req, response);

      expect(getHeaders()['Access-Control-Max-Age']).toBe('86400');
    }, TestTimeouts.SHORT);

    it('should use wildcard for requests without origin', () => {
      const req = createMockRequest({
        method: 'GET',
        path: '/api/test',
      });
      const { response, getHeaders } = createMockResponse();

      handleCors(req, response);

      expect(getHeaders()['Access-Control-Allow-Origin']).toBe('*');
    }, TestTimeouts.SHORT);
  });

  describe('getCorsHeaders Helper', () => {
    it('should return headers for allowed origin', () => {
      const headers = getCorsHeaders('https://rapidtriage.me');

      expect(headers['Access-Control-Allow-Origin']).toBe('https://rapidtriage.me');
      expect(headers['Access-Control-Allow-Methods']).toBeDefined();
      expect(headers['Access-Control-Allow-Headers']).toBeDefined();
      expect(headers['Access-Control-Allow-Credentials']).toBe('true');
      expect(headers['Access-Control-Max-Age']).toBe('86400');
    }, TestTimeouts.SHORT);

    it('should return wildcard for undefined origin', () => {
      const headers = getCorsHeaders(undefined);

      expect(headers['Access-Control-Allow-Origin']).toBe('*');
    }, TestTimeouts.SHORT);

    it('should return empty origin for disallowed origins', () => {
      const headers = getCorsHeaders('https://malicious.com');

      expect(headers['Access-Control-Allow-Origin']).toBe('');
    }, TestTimeouts.SHORT);
  });

  describe('Security Considerations', () => {
    it('should not reflect arbitrary origins', () => {
      const maliciousOrigin = 'https://evil.com';
      const headers = getCorsHeaders(maliciousOrigin);

      expect(headers['Access-Control-Allow-Origin']).not.toBe(maliciousOrigin);
    }, TestTimeouts.SHORT);

    it('should support credentials for allowed origins', () => {
      const req = createMockRequest({
        method: 'GET',
        path: '/api/test',
        headers: {
          'origin': 'https://rapidtriage.me',
        },
      });
      const { response, getHeaders } = createMockResponse();

      handleCors(req, response);

      // When credentials are allowed, origin cannot be wildcard
      expect(getHeaders()['Access-Control-Allow-Credentials']).toBe('true');
      expect(getHeaders()['Access-Control-Allow-Origin']).not.toBe('*');
    }, TestTimeouts.SHORT);

    it('should cache preflight results appropriately', () => {
      const headers = getCorsHeaders('https://rapidtriage.me');

      // 86400 seconds = 24 hours
      expect(parseInt(headers['Access-Control-Max-Age'])).toBe(86400);
    }, TestTimeouts.SHORT);
  });
});
