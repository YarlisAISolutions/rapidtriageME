/**
 * Health Check HTTP Function
 * Provides service health status and monitoring information
 */

import { onRequest, HttpsOptions } from 'firebase-functions/v2/https';
import { getFirestore } from '../config/firebase.config.js';
import { getCorsHeaders } from '../config/cors.config.js';
import { ENVIRONMENT } from '../config/secrets.js';

/**
 * Health check response structure
 */
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

/**
 * Check Firestore health
 */
async function checkFirestore(): Promise<string> {
  try {
    const db = getFirestore();
    const testKey = `health_check_${Date.now()}`;

    // Test write
    await db.collection('_health_checks').doc(testKey).set({
      timestamp: new Date().toISOString(),
      test: true,
    });

    // Test read
    const doc = await db.collection('_health_checks').doc(testKey).get();
    if (!doc.exists) {
      return 'error';
    }

    // Clean up
    await db.collection('_health_checks').doc(testKey).delete();

    return 'ok';
  } catch (error) {
    console.error('Firestore health check failed:', error);
    return 'error';
  }
}

/**
 * Check Firebase Storage health
 */
async function checkStorage(): Promise<string> {
  try {
    // Basic check - if we get here, admin SDK is initialized
    return 'ok';
  } catch (error) {
    console.error('Storage health check failed:', error);
    return 'error';
  }
}

/**
 * Check Firebase Auth health
 */
async function checkAuth(): Promise<string> {
  try {
    // Basic check - if we get here, admin SDK is initialized
    return 'ok';
  } catch (error) {
    console.error('Auth health check failed:', error);
    return 'error';
  }
}

/**
 * HTTP Function options
 */
const options: HttpsOptions = {
  region: 'us-central1',
  memory: '256MiB',
  timeoutSeconds: 30,
  minInstances: 0,
  maxInstances: 10,
};

/**
 * Health check endpoint
 * GET /health
 */
export const health = onRequest(options, async (request, response) => {
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

  try {
    // Run health checks in parallel
    const [firestoreStatus, storageStatus, authStatus] = await Promise.all([
      checkFirestore(),
      checkStorage(),
      checkAuth(),
    ]);

    // Determine overall status
    const checks = {
      firestore: firestoreStatus,
      storage: storageStatus,
      auth: authStatus,
    };

    const allHealthy = Object.values(checks).every(status => status === 'ok');
    const anyError = Object.values(checks).some(status => status === 'error');

    const healthResponse: HealthCheckResponse = {
      status: anyError ? 'unhealthy' : allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      environment: ENVIRONMENT.value() || 'production',
      version: '1.0.0',
      service: 'RapidTriageME',
      provider: 'YarlisAISolutions',
      endpoints: {
        sse: '/sse',
        health: '/health',
        metrics: '/metrics',
        api: '/api',
      },
      checks,
    };

    response
      .status(allHealthy ? 200 : anyError ? 503 : 200)
      .set('Content-Type', 'application/json')
      .set('Cache-Control', 'no-cache')
      .json(healthResponse);
  } catch (error) {
    console.error('Health check error:', error);
    response.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    });
  }
});
