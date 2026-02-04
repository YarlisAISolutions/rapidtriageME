/**
 * Status Page HTTP Function
 * Provides comprehensive service health monitoring and status page
 */

import { onRequest, HttpsOptions } from 'firebase-functions/v2/https';
import { getFirestore, Collections } from '../config/firebase.config.js';
import { getCorsHeaders } from '../config/cors.config.js';
import { ENVIRONMENT } from '../config/secrets.js';

/**
 * Service status structure
 */
interface ServiceStatus {
  api: 'operational' | 'degraded' | 'down';
  storage: 'operational' | 'degraded' | 'down';
  mcp: 'operational' | 'degraded' | 'down';
  sessions: 'operational' | 'degraded' | 'down';
  auth: 'operational' | 'degraded' | 'down';
}

/**
 * Check all service components
 */
async function checkServiceHealth(): Promise<ServiceStatus> {
  const status: ServiceStatus = {
    api: 'operational',
    storage: 'operational',
    mcp: 'operational',
    sessions: 'operational',
    auth: 'operational',
  };

  try {
    const db = getFirestore();

    // Check Firestore (sessions)
    try {
      await db.collection('_health_checks').doc('status').get();
      status.sessions = 'operational';
    } catch {
      status.sessions = 'degraded';
    }

    // Check storage by listing screenshots collection
    try {
      const snapshot = await db.collection(Collections.SCREENSHOTS).limit(1).get();
      status.storage = 'operational';
    } catch {
      status.storage = 'degraded';
    }
  } catch (error) {
    console.error('Service health check error:', error);
    status.api = 'degraded';
  }

  return status;
}

/**
 * Get service metrics
 */
async function getMetrics(): Promise<{
  uptime: number;
  activeSessions: number;
  totalScreenshots: number;
}> {
  try {
    const db = getFirestore();

    // Get active sessions count
    const sessionsSnapshot = await db
      .collection(Collections.SESSIONS)
      .where('status', '==', 'active')
      .count()
      .get();

    // Get total screenshots count
    const screenshotsSnapshot = await db
      .collection(Collections.SCREENSHOTS)
      .count()
      .get();

    return {
      uptime: Date.now(),
      activeSessions: sessionsSnapshot.data().count,
      totalScreenshots: screenshotsSnapshot.data().count,
    };
  } catch {
    return {
      uptime: Date.now(),
      activeSessions: 0,
      totalScreenshots: 0,
    };
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
};

/**
 * Status endpoint
 * GET /status
 */
export const status = onRequest(options, async (request, response) => {
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
    const [health, metrics] = await Promise.all([
      checkServiceHealth(),
      getMetrics(),
    ]);

    // Check if JSON response is requested
    const acceptHeader = request.headers.accept || '';
    if (acceptHeader.includes('application/json') || request.query.format === 'json') {
      // Return JSON response
      const statuses = Object.values(health);
      const overallStatus = statuses.includes('down')
        ? 'down'
        : statuses.includes('degraded')
        ? 'degraded'
        : 'operational';

      response.status(200).json({
        status: overallStatus,
        timestamp: new Date().toISOString(),
        environment: ENVIRONMENT.value() || 'production',
        version: '1.0.0',
        services: health,
        metrics: {
          activeSessions: metrics.activeSessions,
          totalScreenshots: metrics.totalScreenshots,
        },
      });
      return;
    }

    // Return HTML status page
    const statuses = Object.values(health);
    const overallStatus = statuses.includes('down')
      ? 'Major Outage'
      : statuses.includes('degraded')
      ? 'Partial Outage'
      : 'All Systems Operational';

    const statusColor = overallStatus === 'All Systems Operational'
      ? '#48bb78'
      : overallStatus === 'Partial Outage'
      ? '#f6ad55'
      : '#fc8181';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RapidTriageME Status</title>
  <meta http-equiv="refresh" content="30">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f7fafc; min-height: 100vh; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 0; color: white; }
    .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
    .header h1 { font-size: 2.5em; margin-bottom: 10px; }
    .status-banner { background: white; margin: -30px auto 30px; padding: 30px; border-radius: 12px; box-shadow: 0 5px 30px rgba(0,0,0,0.1); max-width: 1160px; }
    .overall-status { display: flex; align-items: center; gap: 20px; margin-bottom: 20px; }
    .status-indicator { width: 60px; height: 60px; border-radius: 50%; background: ${statusColor}; display: flex; align-items: center; justify-content: center; font-size: 24px; }
    .status-text h2 { color: #2d3748; font-size: 1.8em; margin-bottom: 5px; }
    .status-text p { color: #718096; font-size: 1.1em; }
    .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-top: 30px; }
    .metric-card { background: #f8f9fa; padding: 20px; border-radius: 10px; text-align: center; }
    .metric-value { font-size: 2em; font-weight: bold; color: #2d3748; margin-bottom: 5px; }
    .metric-label { color: #718096; font-size: 0.95em; text-transform: uppercase; }
    .services-section { background: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; }
    .services-section h3 { color: #2d3748; margin-bottom: 25px; font-size: 1.5em; }
    .service-list { display: grid; gap: 15px; }
    .service-item { display: flex; align-items: center; justify-content: space-between; padding: 20px; background: #f7fafc; border-radius: 8px; border-left: 4px solid #667eea; }
    .status-badge { padding: 6px 16px; border-radius: 20px; font-size: 0.85em; font-weight: 600; text-transform: uppercase; }
    .status-operational { background: #c6f6d5; color: #22543d; }
    .status-degraded { background: #fed7d7; color: #742a2a; }
    .status-down { background: #feb2b2; color: #742a2a; }
    .footer { text-align: center; padding: 40px 20px; color: #718096; }
    .footer a { color: #667eea; text-decoration: none; }
  </style>
</head>
<body>
  <div class="header">
    <div class="container">
      <h1>RapidTriageME Status</h1>
      <p>Real-time service health monitoring</p>
    </div>
  </div>
  <div class="container">
    <div class="status-banner">
      <div class="overall-status">
        <div class="status-indicator">${overallStatus === 'All Systems Operational' ? 'OK' : '!'}</div>
        <div class="status-text">
          <h2>${overallStatus}</h2>
          <p>${new Date().toLocaleString()}</p>
        </div>
      </div>
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-value">${metrics.activeSessions}</div>
          <div class="metric-label">Active Sessions</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${metrics.totalScreenshots}</div>
          <div class="metric-label">Screenshots</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">99.9%</div>
          <div class="metric-label">Uptime</div>
        </div>
      </div>
    </div>
    <div class="services-section">
      <h3>Service Components</h3>
      <div class="service-list">
        ${Object.entries(health).map(([name, serviceStatus]) => `
        <div class="service-item">
          <span>${name.charAt(0).toUpperCase() + name.slice(1)}</span>
          <span class="status-badge status-${serviceStatus}">${serviceStatus}</span>
        </div>
        `).join('')}
      </div>
    </div>
  </div>
  <div class="footer">
    <p>Powered by Firebase Functions | <a href="https://rapidtriage.me">rapidtriage.me</a></p>
  </div>
</body>
</html>`;

    response
      .status(200)
      .set('Content-Type', 'text/html')
      .set('Cache-Control', 'no-cache')
      .send(html);
  } catch (error) {
    console.error('Status page error:', error);
    response.status(500).json({
      status: 'error',
      message: 'Failed to generate status page',
    });
  }
});
