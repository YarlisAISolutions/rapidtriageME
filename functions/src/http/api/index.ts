/**
 * API Routes HTTP Function
 * Main API endpoints for browser triage operations
 */

import { onRequest, HttpsOptions } from 'firebase-functions/v2/https';
import { Request, Response } from 'express';
import { getCorsHeaders } from '../../config/cors.config.js';
import { authMiddleware, AuthenticatedRequest } from '../../middleware/auth.middleware.js';
import { createRateLimiter } from '../../middleware/rateLimit.middleware.js';
import { screenshotService } from '../../services/screenshot.service.js';
import { sessionService } from '../../services/session.service.js';
import { RAPIDTRIAGE_API_TOKEN, JWT_SECRET } from '../../config/secrets.js';

/**
 * HTTP Function options
 */
const options: HttpsOptions = {
  region: 'us-central1',
  memory: '512MiB',
  timeoutSeconds: 120,
  minInstances: 0,
  maxInstances: 50,
  secrets: [RAPIDTRIAGE_API_TOKEN, JWT_SECRET],
};

/**
 * Rate limiters for different endpoints
 */
const screenshotRateLimiter = createRateLimiter('screenshot');
const lighthouseRateLimiter = createRateLimiter('lighthouse');
const defaultRateLimiter = createRateLimiter('api');

/**
 * Handle API routes
 */
async function handleApiRequest(req: Request, res: Response): Promise<void> {
  const path = req.path.replace(/^\/api/, '') || '/';
  const method = req.method;

  try {
    // Check authentication for protected endpoints
    const authResult = await authMiddleware.verify(req);

    // Screenshot endpoints
    if (path === '/screenshot' || path === '/screenshots') {
      // Check rate limit
      const rateLimitResult = await screenshotRateLimiter.check(req);
      if (!rateLimitResult.allowed) {
        res.status(429).json({
          success: false,
          error: 'Rate limit exceeded',
          retryAfter: rateLimitResult.retryAfter,
        });
        return;
      }

      if (method === 'POST') {
        // Capture/store screenshot
        const { data, url, title, sessionId, project, tags, viewport } = req.body;

        if (!data || !url) {
          res.status(400).json({
            success: false,
            error: 'Screenshot data and URL are required',
          });
          return;
        }

        const result = await screenshotService.storeScreenshot({
          data,
          url,
          title: title || 'Untitled',
          userId: (req as AuthenticatedRequest).user?.userId,
          sessionId,
          project,
          tags,
          viewport,
        });

        res.status(201).json({
          success: true,
          data: result,
        });
        return;
      }

      if (method === 'GET') {
        // List screenshots
        const result = await screenshotService.listScreenshots({
          userId: (req as AuthenticatedRequest).user?.userId,
          sessionId: req.query.sessionId as string,
          project: req.query.project as string,
          limit: parseInt(req.query.limit as string || '20', 10),
          cursor: req.query.cursor as string,
        });

        res.status(200).json({
          success: true,
          data: result,
        });
        return;
      }
    }

    // Get specific screenshot
    if (path.match(/^\/screenshot\/[\w-]+$/) && method === 'GET') {
      const id = path.split('/').pop();
      if (!id) {
        res.status(400).json({ success: false, error: 'Screenshot ID required' });
        return;
      }

      const result = await screenshotService.getScreenshot(id);
      if (!result) {
        res.status(404).json({ success: false, error: 'Screenshot not found' });
        return;
      }

      res.status(200).json({ success: true, data: result });
      return;
    }

    // Delete screenshot
    if (path.match(/^\/screenshot\/[\w-]+$/) && method === 'DELETE') {
      if (!authResult.authenticated) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const id = path.split('/').pop();
      if (!id) {
        res.status(400).json({ success: false, error: 'Screenshot ID required' });
        return;
      }

      const deleted = await screenshotService.deleteScreenshot(
        id,
        (req as AuthenticatedRequest).user?.userId
      );

      res.status(200).json({ success: deleted, message: deleted ? 'Deleted' : 'Not found' });
      return;
    }

    // Console logs endpoint
    if (path === '/console-logs' && method === 'POST') {
      const { logs, sessionId, url } = req.body;

      if (!logs || !Array.isArray(logs)) {
        res.status(400).json({
          success: false,
          error: 'Logs array is required',
        });
        return;
      }

      // Update session log count
      if (sessionId) {
        await sessionService.updateSession(sessionId, {
          incrementConsole: logs.length,
        });
      }

      res.status(200).json({
        success: true,
        message: `${logs.length} console logs received`,
        sessionId,
      });
      return;
    }

    // Network logs endpoint
    if (path === '/network-logs' && method === 'POST') {
      const { logs, sessionId } = req.body;

      if (!logs || !Array.isArray(logs)) {
        res.status(400).json({
          success: false,
          error: 'Logs array is required',
        });
        return;
      }

      // Update session log count
      if (sessionId) {
        await sessionService.updateSession(sessionId, {
          incrementNetwork: logs.length,
        });
      }

      res.status(200).json({
        success: true,
        message: `${logs.length} network logs received`,
        sessionId,
      });
      return;
    }

    // Lighthouse audit endpoint
    if (path === '/lighthouse' && method === 'POST') {
      // Check rate limit
      const rateLimitResult = await lighthouseRateLimiter.check(req);
      if (!rateLimitResult.allowed) {
        res.status(429).json({
          success: false,
          error: 'Rate limit exceeded',
          retryAfter: rateLimitResult.retryAfter,
        });
        return;
      }

      const { url, categories = ['performance', 'accessibility'] } = req.body;

      if (!url) {
        res.status(400).json({
          success: false,
          error: 'URL is required',
        });
        return;
      }

      // Return simulated audit results
      // In production, this would connect to a browser automation service
      const scores: Record<string, number> = {};
      categories.forEach((cat: string) => {
        scores[cat] = Math.floor(70 + Math.random() * 30);
      });

      res.status(200).json({
        success: true,
        data: {
          url,
          scores,
          recommendations: [
            'Optimize image sizes',
            'Enable text compression',
            'Add proper heading hierarchy',
          ],
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    // Session management endpoints
    if (path === '/session' || path === '/sessions') {
      if (method === 'POST') {
        // Create new session
        const { type = 'browser', extensionId, browserInfo } = req.body;

        const session = await sessionService.createSession({
          type,
          userId: (req as AuthenticatedRequest).user?.userId,
          extensionId,
          browserInfo,
          ipAddress: req.ip || req.headers['x-forwarded-for'] as string,
          origin: req.headers.origin,
        });

        res.status(201).json({
          success: true,
          data: session,
        });
        return;
      }

      if (method === 'GET') {
        if (!authResult.authenticated) {
          res.status(401).json({ success: false, error: 'Authentication required' });
          return;
        }

        const sessions = await sessionService.getUserSessions(
          (req as AuthenticatedRequest).user?.userId || '',
          { activeOnly: req.query.active === 'true' }
        );

        res.status(200).json({
          success: true,
          data: sessions,
        });
        return;
      }
    }

    // Get/update specific session
    if (path.match(/^\/session\/[\w-]+$/)) {
      const sessionId = path.split('/').pop();
      if (!sessionId) {
        res.status(400).json({ success: false, error: 'Session ID required' });
        return;
      }

      if (method === 'GET') {
        const session = await sessionService.getSession(sessionId);
        if (!session) {
          res.status(404).json({ success: false, error: 'Session not found' });
          return;
        }
        res.status(200).json({ success: true, data: session });
        return;
      }

      if (method === 'PUT' || method === 'PATCH') {
        const session = await sessionService.touchSession(sessionId);
        res.status(200).json({ success: session, message: session ? 'Updated' : 'Not found' });
        return;
      }

      if (method === 'DELETE') {
        const ended = await sessionService.endSession(sessionId);
        res.status(200).json({ success: ended, message: ended ? 'Ended' : 'Not found' });
        return;
      }
    }

    // Triage report endpoint
    if (path === '/triage-report' && method === 'POST') {
      const { sessionId, includeScreenshot, includeLogs } = req.body;

      res.status(200).json({
        success: true,
        data: {
          id: `report-${Date.now()}`,
          sessionId,
          generatedAt: new Date().toISOString(),
          summary: {
            consoleErrors: 0,
            networkErrors: 0,
            performanceScore: 85,
          },
          recommendations: [
            'Fix console errors',
            'Optimize image loading',
          ],
        },
      });
      return;
    }

    // Navigate endpoint
    if (path === '/navigate' && method === 'POST') {
      const { url } = req.body;

      if (!url) {
        res.status(400).json({
          success: false,
          error: 'URL is required',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: `Navigation request received for ${url}`,
        note: 'Remote navigation requires browser connector',
      });
      return;
    }

    // Execute JavaScript endpoint
    if (path === '/execute-js' && method === 'POST') {
      const { code } = req.body;

      if (!code) {
        res.status(400).json({
          success: false,
          error: 'Code is required',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'JavaScript execution request received',
        note: 'Remote execution requires browser connector',
      });
      return;
    }

    // Inspect element endpoint
    if (path === '/inspect-element' && method === 'POST') {
      const { selector } = req.body;

      if (!selector) {
        res.status(400).json({
          success: false,
          error: 'Selector is required',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: `Element inspection request for ${selector}`,
        note: 'Remote inspection requires browser connector',
      });
      return;
    }

    // Route not found
    res.status(404).json({
      success: false,
      error: 'API endpoint not found',
      path,
    });
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({
      success: false,
      error: 'API error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * API HTTP Function
 * Handles /api/* routes
 */
export const api = onRequest(options, async (request, response) => {
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

  await handleApiRequest(request, response);
});
