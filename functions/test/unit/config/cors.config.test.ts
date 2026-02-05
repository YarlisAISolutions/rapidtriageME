/**
 * CORS Config Unit Tests
 */

import {
  corsOptions,
  getCorsHeaders,
  handleCors,
} from '../../../src/config/cors.config';

describe('CORS Config', () => {
  describe('corsOptions', () => {
    it('should have origin function', () => {
      expect(typeof corsOptions.origin).toBe('function');
    });

    it('should have methods array', () => {
      expect(Array.isArray(corsOptions.methods)).toBe(true);
      expect(corsOptions.methods).toContain('GET');
      expect(corsOptions.methods).toContain('POST');
      expect(corsOptions.methods).toContain('OPTIONS');
    });

    it('should include all HTTP methods', () => {
      expect(corsOptions.methods).toContain('PUT');
      expect(corsOptions.methods).toContain('DELETE');
      expect(corsOptions.methods).toContain('PATCH');
    });

    it('should allow credentials', () => {
      expect(corsOptions.credentials).toBe(true);
    });

    it('should have max age set', () => {
      expect(corsOptions.maxAge).toBe(86400); // 24 hours
    });

    it('should have allowed headers', () => {
      expect(Array.isArray(corsOptions.allowedHeaders)).toBe(true);
      expect(corsOptions.allowedHeaders).toContain('Content-Type');
      expect(corsOptions.allowedHeaders).toContain('Authorization');
    });

    it('should have exposed headers', () => {
      expect(Array.isArray(corsOptions.exposedHeaders)).toBe(true);
      expect(corsOptions.exposedHeaders).toContain('X-RateLimit-Limit');
      expect(corsOptions.exposedHeaders).toContain('X-Request-Id');
    });

    it('origin callback should allow valid origin', () => {
      const callback = jest.fn();
      (corsOptions.origin as Function)('https://rapidtriage.me', callback);
      expect(callback).toHaveBeenCalledWith(null, true);
    });

    it('origin callback should allow localhost', () => {
      const callback = jest.fn();
      (corsOptions.origin as Function)('http://localhost:3000', callback);
      expect(callback).toHaveBeenCalledWith(null, true);
    });

    it('origin callback should allow chrome extension', () => {
      const callback = jest.fn();
      (corsOptions.origin as Function)('chrome-extension://abc123', callback);
      expect(callback).toHaveBeenCalledWith(null, true);
    });

    it('origin callback should allow undefined origin', () => {
      const callback = jest.fn();
      (corsOptions.origin as Function)(undefined, callback);
      expect(callback).toHaveBeenCalledWith(null, true);
    });

    it('origin callback should reject invalid origin', () => {
      const callback = jest.fn();
      (corsOptions.origin as Function)('https://malicious.com', callback);
      expect(callback).toHaveBeenCalled();
      // The callback is called with an error
      expect(callback.mock.calls[0][0]).toBeInstanceOf(Error);
    });
  });

  describe('getCorsHeaders', () => {
    it('should return CORS headers for allowed origin', () => {
      const headers = getCorsHeaders('https://rapidtriage.me');
      expect(headers['Access-Control-Allow-Origin']).toBe('https://rapidtriage.me');
      expect(headers['Access-Control-Allow-Methods']).toBeDefined();
      expect(headers['Access-Control-Allow-Headers']).toBeDefined();
    });

    it('should return wildcard for undefined origin', () => {
      const headers = getCorsHeaders(undefined);
      expect(headers['Access-Control-Allow-Origin']).toBe('*');
    });

    it('should include credentials header', () => {
      const headers = getCorsHeaders('https://rapidtriage.me');
      expect(headers['Access-Control-Allow-Credentials']).toBe('true');
    });

    it('should set max age header', () => {
      const headers = getCorsHeaders('https://rapidtriage.me');
      expect(headers['Access-Control-Max-Age']).toBe('86400');
    });

    it('should include all required methods', () => {
      const headers = getCorsHeaders('https://rapidtriage.me');
      const methods = headers['Access-Control-Allow-Methods'];
      expect(methods).toContain('GET');
      expect(methods).toContain('POST');
      expect(methods).toContain('PUT');
      expect(methods).toContain('DELETE');
      expect(methods).toContain('OPTIONS');
    });

    it('should return empty origin for disallowed origin', () => {
      const headers = getCorsHeaders('https://malicious.com');
      expect(headers['Access-Control-Allow-Origin']).toBe('');
    });
  });

  describe('handleCors', () => {
    it('should be a function', () => {
      expect(typeof handleCors).toBe('function');
    });

    it('should handle preflight requests', () => {
      const mockRequest = {
        method: 'OPTIONS',
        headers: { origin: 'https://rapidtriage.me' },
      };
      const mockResponse = {
        set: jest.fn().mockReturnThis(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
      };

      const result = handleCors(mockRequest as any, mockResponse as any);
      expect(result).toBe(true);
      expect(mockResponse.status).toHaveBeenCalledWith(204);
    });

    it('should set CORS headers for allowed origin', () => {
      const mockRequest = {
        method: 'GET',
        headers: { origin: 'https://rapidtriage.me' },
      };
      const mockResponse = {
        set: jest.fn().mockReturnThis(),
      };

      const result = handleCors(mockRequest as any, mockResponse as any);
      expect(result).toBe(false);
      expect(mockResponse.set).toHaveBeenCalledWith(
        'Access-Control-Allow-Origin',
        'https://rapidtriage.me'
      );
    });

    it('should return false for non-OPTIONS requests', () => {
      const mockRequest = {
        method: 'POST',
        headers: { origin: 'https://rapidtriage.me' },
      };
      const mockResponse = {
        set: jest.fn().mockReturnThis(),
      };

      const result = handleCors(mockRequest as any, mockResponse as any);
      expect(result).toBe(false);
    });
  });

  describe('Origin Validation Rules', () => {
    it('should allow rapidtriage.me', () => {
      const callback = jest.fn();
      (corsOptions.origin as Function)('https://rapidtriage.me', callback);
      expect(callback).toHaveBeenCalledWith(null, true);
    });

    it('should allow www.rapidtriage.me', () => {
      const callback = jest.fn();
      (corsOptions.origin as Function)('https://www.rapidtriage.me', callback);
      expect(callback).toHaveBeenCalledWith(null, true);
    });

    it('should allow test.rapidtriage.me', () => {
      const callback = jest.fn();
      (corsOptions.origin as Function)('https://test.rapidtriage.me', callback);
      expect(callback).toHaveBeenCalledWith(null, true);
    });

    it('should allow localhost variants', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      const callback3 = jest.fn();

      (corsOptions.origin as Function)('http://localhost:3000', callback1);
      (corsOptions.origin as Function)('http://localhost:3025', callback2);
      (corsOptions.origin as Function)('http://127.0.0.1:3000', callback3);

      expect(callback1).toHaveBeenCalledWith(null, true);
      expect(callback2).toHaveBeenCalledWith(null, true);
      expect(callback3).toHaveBeenCalledWith(null, true);
    });

    it('should allow GitHub Pages domain', () => {
      const callback = jest.fn();
      (corsOptions.origin as Function)('https://yarlisaisolutions.github.io', callback);
      expect(callback).toHaveBeenCalledWith(null, true);
    });
  });
});
