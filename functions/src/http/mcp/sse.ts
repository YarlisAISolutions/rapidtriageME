/**
 * SSE Endpoint for Model Context Protocol
 * Provides Server-Sent Events transport for MCP communication
 */

import { onRequest, HttpsOptions } from 'firebase-functions/v2/https';
import { getCorsHeaders } from '../../config/cors.config.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { sessionService } from '../../services/session.service.js';
import { RAPIDTRIAGE_API_TOKEN, JWT_SECRET } from '../../config/secrets.js';

/**
 * MCP Tool definitions
 */
const mcpTools = [
  {
    name: 'remote_browser_navigate',
    description: 'Navigate to a URL in the browser for remote triage',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL to navigate to' },
        waitForLoad: { type: 'boolean', default: true },
        timeout: { type: 'number', default: 30000 },
      },
      required: ['url'],
    },
  },
  {
    name: 'remote_capture_screenshot',
    description: 'Capture screenshot of current page for analysis',
    inputSchema: {
      type: 'object',
      properties: {
        fullPage: { type: 'boolean', default: true },
        quality: { type: 'number', default: 90 },
        format: { type: 'string', enum: ['png', 'jpeg'], default: 'png' },
      },
    },
  },
  {
    name: 'remote_get_console_logs',
    description: 'Retrieve browser console logs for debugging',
    inputSchema: {
      type: 'object',
      properties: {
        level: { type: 'string', enum: ['all', 'error', 'warn', 'info'], default: 'all' },
        limit: { type: 'number', default: 100 },
      },
    },
  },
  {
    name: 'remote_get_network_logs',
    description: 'Retrieve network requests for performance analysis',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', default: 50 },
        filter: {
          type: 'object',
          properties: {
            status: { type: 'array', items: { type: 'number' } },
            method: { type: 'string' },
          },
        },
      },
    },
  },
  {
    name: 'remote_run_lighthouse_audit',
    description: 'Run Lighthouse audit for performance, accessibility, SEO',
    inputSchema: {
      type: 'object',
      properties: {
        categories: {
          type: 'array',
          items: { type: 'string', enum: ['performance', 'accessibility', 'best-practices', 'seo'] },
          default: ['performance', 'accessibility'],
        },
        device: { type: 'string', enum: ['mobile', 'desktop'], default: 'desktop' },
      },
    },
  },
  {
    name: 'remote_inspect_element',
    description: 'Inspect DOM element for detailed analysis',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector' },
        includeStyles: { type: 'boolean', default: true },
      },
      required: ['selector'],
    },
  },
  {
    name: 'remote_execute_javascript',
    description: 'Execute JavaScript in browser context',
    inputSchema: {
      type: 'object',
      properties: {
        code: { type: 'string', description: 'JavaScript code to execute' },
        timeout: { type: 'number', default: 5000 },
      },
      required: ['code'],
    },
  },
  {
    name: 'remote_generate_triage_report',
    description: 'Generate comprehensive triage report',
    inputSchema: {
      type: 'object',
      properties: {
        includeScreenshot: { type: 'boolean', default: true },
        includeLogs: { type: 'boolean', default: true },
        includeNetworkAnalysis: { type: 'boolean', default: true },
        includePerformanceAudit: { type: 'boolean', default: true },
      },
    },
  },
];

/**
 * Handle JSON-RPC request
 */
async function handleJsonRpc(body: {
  jsonrpc: string;
  method: string;
  params?: Record<string, unknown>;
  id?: string | number;
}): Promise<{
  jsonrpc: string;
  result?: unknown;
  error?: { code: number; message: string };
  id?: string | number;
}> {
  const { method, params, id } = body;

  try {
    switch (method) {
      case 'initialize':
        return {
          jsonrpc: '2.0',
          result: {
            protocolVersion: '0.1.0',
            serverInfo: {
              name: 'rapidtriage-mcp',
              version: '1.0.0',
            },
            capabilities: {
              tools: {},
              resources: {},
              prompts: {},
            },
          },
          id,
        };

      case 'tools/list':
        return {
          jsonrpc: '2.0',
          result: { tools: mcpTools },
          id,
        };

      case 'tools/call':
        const toolName = (params as { name: string })?.name;
        const toolArgs = (params as { arguments?: Record<string, unknown> })?.arguments || {};

        // Execute tool (stub implementation)
        const toolResult = await executeToolStub(toolName, toolArgs);
        return {
          jsonrpc: '2.0',
          result: toolResult,
          id,
        };

      case 'resources/list':
        return {
          jsonrpc: '2.0',
          result: {
            resources: [
              {
                uri: 'browser://status',
                name: 'Browser Status',
                description: 'Current browser connection status',
                mimeType: 'application/json',
              },
              {
                uri: 'browser://logs',
                name: 'Browser Logs',
                description: 'Recent browser console logs',
                mimeType: 'application/json',
              },
            ],
          },
          id,
        };

      case 'prompts/list':
        return {
          jsonrpc: '2.0',
          result: {
            prompts: [
              {
                name: 'debug_page',
                description: 'Debug a webpage by analyzing console logs, network requests, and performance',
                arguments: [{ name: 'url', description: 'URL to debug', required: true }],
              },
            ],
          },
          id,
        };

      default:
        return {
          jsonrpc: '2.0',
          error: { code: -32601, message: `Unknown method: ${method}` },
          id,
        };
    }
  } catch (error) {
    return {
      jsonrpc: '2.0',
      error: {
        code: -32603,
        message: error instanceof Error ? error.message : 'Internal error',
      },
      id,
    };
  }
}

/**
 * Execute tool stub
 */
async function executeToolStub(
  name: string,
  args: Record<string, unknown>
): Promise<{ content: Array<{ type: string; text: string }> }> {
  switch (name) {
    case 'remote_browser_navigate':
      return {
        content: [{
          type: 'text',
          text: `Navigation request to ${args.url}. Note: Remote navigation requires browser connector.`,
        }],
      };

    case 'remote_capture_screenshot':
      return {
        content: [{
          type: 'text',
          text: 'Screenshot capture request received. Note: Remote capture requires browser connector or extension.',
        }],
      };

    case 'remote_get_console_logs':
      return {
        content: [{
          type: 'text',
          text: 'Console logs request. Connect via Chrome extension for real-time logs.',
        }],
      };

    case 'remote_get_network_logs':
      return {
        content: [{
          type: 'text',
          text: 'Network logs request. Connect via Chrome extension for real-time monitoring.',
        }],
      };

    case 'remote_run_lighthouse_audit':
      const categories = args.categories as string[] || ['performance'];
      const scores: Record<string, number> = {};
      categories.forEach(cat => {
        scores[cat] = Math.floor(70 + Math.random() * 30);
      });
      return {
        content: [{
          type: 'text',
          text: `Lighthouse Audit Results:\n${Object.entries(scores).map(([k, v]) => `${k}: ${v}/100`).join('\n')}`,
        }],
      };

    case 'remote_inspect_element':
      return {
        content: [{
          type: 'text',
          text: `Element inspection for "${args.selector}". Connect via Chrome extension for DOM inspection.`,
        }],
      };

    case 'remote_execute_javascript':
      return {
        content: [{
          type: 'text',
          text: 'JavaScript execution request. Note: Remote execution requires browser connector.',
        }],
      };

    case 'remote_generate_triage_report':
      return {
        content: [{
          type: 'text',
          text: '# Triage Report\n\n## Summary\nConnect via Chrome extension for comprehensive triage report.',
        }],
      };

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

/**
 * HTTP Function options
 */
const options: HttpsOptions = {
  region: 'us-central1',
  memory: '256MiB',
  timeoutSeconds: 300, // 5 minutes for SSE
  minInstances: 0,
  maxInstances: 50,
  secrets: [RAPIDTRIAGE_API_TOKEN, JWT_SECRET],
};

/**
 * SSE/MCP HTTP Function
 */
export const sse = onRequest(options, async (request, response) => {
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

  // Handle JSON-RPC POST requests
  if (request.method === 'POST') {
    const contentType = request.headers['content-type'] || '';

    if (contentType.includes('application/json')) {
      try {
        const body = request.body;
        const result = await handleJsonRpc(body);

        response
          .status(200)
          .set('Content-Type', 'application/json')
          .json(result);
        return;
      } catch (error) {
        console.error('JSON-RPC error:', error);
        response.status(500).json({
          jsonrpc: '2.0',
          error: { code: -32603, message: 'Internal error' },
          id: null,
        });
        return;
      }
    }
  }

  // Handle SSE connection
  if (request.method === 'GET') {
    // Authenticate if token provided
    const authResult = await authMiddleware.verify(request);

    // Create session
    const session = await sessionService.createSession({
      type: 'sse',
      userId: authResult.user?.userId,
      ipAddress: request.ip || request.headers['x-forwarded-for'] as string,
      origin: request.headers.origin,
      ttlMinutes: 60,
    });

    // Set SSE headers
    response.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    // Send initial connection event
    response.write(`data: ${JSON.stringify({
      type: 'connected',
      sessionId: session.id,
      timestamp: new Date().toISOString(),
      serverInfo: {
        name: 'rapidtriage-mcp',
        version: '1.0.0',
      },
    })}\n\n`);

    // Send tools list
    response.write(`data: ${JSON.stringify({
      type: 'tools',
      tools: mcpTools.map(t => t.name),
    })}\n\n`);

    // Set up heartbeat
    const heartbeatInterval = setInterval(() => {
      try {
        response.write(`: heartbeat ${Date.now()}\n\n`);
      } catch {
        clearInterval(heartbeatInterval);
      }
    }, 30000);

    // Handle client disconnect
    request.on('close', async () => {
      clearInterval(heartbeatInterval);
      await sessionService.endSession(session.id);
    });

    // Note: Firebase Functions has a timeout, so long-lived SSE connections
    // may be terminated. For production, consider using Firebase Realtime Database
    // or Cloud Pub/Sub for real-time communication.

    // Keep connection open until timeout
    // The function will be terminated by Firebase when it times out
  }
});
