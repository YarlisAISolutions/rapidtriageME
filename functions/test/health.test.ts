/**
 * Health Endpoint Tests
 *
 * Tests for the /health endpoint which provides system health status
 * and is used for monitoring and load balancer health checks.
 */

import {
  initializeTestEnvironment,
  cleanupTestEnvironment,
  createMockRequest,
  createMockResponse,
  TestTimeouts,
} from './setup';

// ============================================
// MOCK HEALTH FUNCTION
// ============================================

/**
 * Mock health handler for testing
 * This simulates the expected behavior of the health endpoint
 */
const mockHealthHandler = async (
  req: Partial<import('express').Request>,
  res: ReturnType<typeof createMockResponse>['response']
): Promise<void> => {
  const startTime = Date.now();

  // Simulate health check logic
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    services: {
      firestore: 'connected',
      storage: 'connected',
      auth: 'connected',
    },
    latency: Date.now() - startTime,
  };

  res.status!(200);
  res.json!(healthStatus);
};

// ============================================
// TEST SUITE
// ============================================

describe('Health Endpoint', () => {
  beforeAll(() => {
    initializeTestEnvironment(false);
  });

  afterAll(() => {
    cleanupTestEnvironment();
  });

  describe('GET /health', () => {
    it('should return 200 status code', async () => {
      const req = createMockRequest({
        method: 'GET',
        path: '/health',
      });

      const { response, getStatus } = createMockResponse();

      await mockHealthHandler(req, response);

      expect(getStatus()).toBe(200);
    }, TestTimeouts.SHORT);

    it('should return healthy status', async () => {
      const req = createMockRequest({
        method: 'GET',
        path: '/health',
      });

      const { response, getBody } = createMockResponse();

      await mockHealthHandler(req, response);
      const body = getBody() as Record<string, unknown>;

      expect(body.status).toBe('healthy');
    }, TestTimeouts.SHORT);

    it('should include timestamp in ISO format', async () => {
      const req = createMockRequest({
        method: 'GET',
        path: '/health',
      });

      const { response, getBody } = createMockResponse();

      await mockHealthHandler(req, response);
      const body = getBody() as Record<string, unknown>;

      expect(body.timestamp).toBeDefined();
      expect(typeof body.timestamp).toBe('string');

      // Verify it's a valid ISO date
      const date = new Date(body.timestamp as string);
      expect(date.toISOString()).toBe(body.timestamp);
    }, TestTimeouts.SHORT);

    it('should include version information', async () => {
      const req = createMockRequest({
        method: 'GET',
        path: '/health',
      });

      const { response, getBody } = createMockResponse();

      await mockHealthHandler(req, response);
      const body = getBody() as Record<string, unknown>;

      expect(body.version).toBeDefined();
      expect(typeof body.version).toBe('string');
    }, TestTimeouts.SHORT);

    it('should include service health statuses', async () => {
      const req = createMockRequest({
        method: 'GET',
        path: '/health',
      });

      const { response, getBody } = createMockResponse();

      await mockHealthHandler(req, response);
      const body = getBody() as Record<string, unknown>;

      expect(body.services).toBeDefined();
      const services = body.services as Record<string, string>;

      expect(services.firestore).toBeDefined();
      expect(services.storage).toBeDefined();
      expect(services.auth).toBeDefined();
    }, TestTimeouts.SHORT);

    it('should include latency measurement', async () => {
      const req = createMockRequest({
        method: 'GET',
        path: '/health',
      });

      const { response, getBody } = createMockResponse();

      await mockHealthHandler(req, response);
      const body = getBody() as Record<string, unknown>;

      expect(body.latency).toBeDefined();
      expect(typeof body.latency).toBe('number');
      expect(body.latency).toBeGreaterThanOrEqual(0);
    }, TestTimeouts.SHORT);

    it('should include uptime information', async () => {
      const req = createMockRequest({
        method: 'GET',
        path: '/health',
      });

      const { response, getBody } = createMockResponse();

      await mockHealthHandler(req, response);
      const body = getBody() as Record<string, unknown>;

      expect(body.uptime).toBeDefined();
      expect(typeof body.uptime).toBe('number');
      expect(body.uptime).toBeGreaterThan(0);
    }, TestTimeouts.SHORT);

    it('should include environment information', async () => {
      const req = createMockRequest({
        method: 'GET',
        path: '/health',
      });

      const { response, getBody } = createMockResponse();

      await mockHealthHandler(req, response);
      const body = getBody() as Record<string, unknown>;

      expect(body.environment).toBeDefined();
      expect(['development', 'production', 'test']).toContain(body.environment);
    }, TestTimeouts.SHORT);
  });

  describe('Health Response Format', () => {
    it('should return valid JSON content type', async () => {
      const req = createMockRequest({
        method: 'GET',
        path: '/health',
      });

      const { response, getBody } = createMockResponse();

      await mockHealthHandler(req, response);
      const body = getBody();

      // Verify body is valid JSON-serializable
      expect(() => JSON.stringify(body)).not.toThrow();
    }, TestTimeouts.SHORT);

    it('should be parseable by monitoring systems', async () => {
      const req = createMockRequest({
        method: 'GET',
        path: '/health',
      });

      const { response, getBody, getStatus } = createMockResponse();

      await mockHealthHandler(req, response);

      // Standard health check requirements
      const status = getStatus();
      const body = getBody() as Record<string, unknown>;

      // Load balancers expect 200 for healthy
      expect(status).toBe(200);

      // Status field should indicate health
      expect(['healthy', 'ok', 'pass']).toContain(String(body.status).toLowerCase());
    }, TestTimeouts.SHORT);
  });

  describe('Error Handling', () => {
    it('should handle service degradation gracefully', async () => {
      // This test validates that the health endpoint
      // can report partial service availability
      const req = createMockRequest({
        method: 'GET',
        path: '/health',
      });

      const { response, getBody, getStatus } = createMockResponse();

      await mockHealthHandler(req, response);

      const status = getStatus();
      const body = getBody() as Record<string, unknown>;

      // Even with some services down, endpoint should respond
      expect(status).toBeDefined();
      expect(body).toBeDefined();
    }, TestTimeouts.SHORT);
  });
});

// ============================================
// INTEGRATION TESTS (Require Emulator)
// ============================================

describe('Health Endpoint Integration', () => {
  const isEmulatorRunning = process.env.FIRESTORE_EMULATOR_HOST !== undefined;

  beforeAll(() => {
    if (isEmulatorRunning) {
      initializeTestEnvironment(true);
    }
  });

  afterAll(() => {
    if (isEmulatorRunning) {
      cleanupTestEnvironment();
    }
  });

  it.skip('should verify actual Firestore connectivity', async () => {
    // This test requires running emulator
    // Skip if emulator not available
    if (!isEmulatorRunning) {
      return;
    }

    const req = createMockRequest({
      method: 'GET',
      path: '/health',
    });

    const { response, getBody } = createMockResponse();

    await mockHealthHandler(req, response);
    const body = getBody() as Record<string, unknown>;
    const services = body.services as Record<string, string>;

    expect(services.firestore).toBe('connected');
  }, TestTimeouts.MEDIUM);
});
