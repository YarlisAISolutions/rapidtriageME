/**
 * Cloudflare Worker for RapidTriageME
 * YarlisAISolutions Browser Tools MCP Platform
 * 
 * This worker handles SSE connections for remote browser triage operations,
 * providing secure access to local browser debugging tools through the MCP protocol.
 */

import { RemoteBrowserMCPHandler } from './handlers/mcp-handler';
import { AuthMiddleware } from './middleware/auth';
import { RateLimiter } from './middleware/rate-limiter';
import { HealthCheck } from './handlers/health';
import { MetricsCollector } from './handlers/metrics';
// import { handleLandingPage } from './handlers/landing';
// import { Logger } from './utils/logger';

export interface Env {
  // KV namespace for session storage
  SESSIONS: KVNamespace;
  
  // Durable Object for WebSocket management
  BROWSER_SESSIONS: DurableObjectNamespace;
  
  // Environment variables
  AUTH_TOKEN: string;
  JWT_SECRET: string;
  ENVIRONMENT: string;
  BROWSER_TOOLS_PORT: string;
  SSE_ENDPOINT: string;
  HEALTH_ENDPOINT: string;
  METRICS_ENDPOINT: string;
  LOG_LEVEL?: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    // Skip logger for now - it might be causing issues
    // const logger = new Logger(env.ENVIRONMENT || 'production', env.LOG_LEVEL || 'info');
    
    // Initialize middleware - handle missing env vars gracefully
    let auth: AuthMiddleware | null = null;
    let rateLimiter: RateLimiter | null = null;
    let metrics: MetricsCollector | null = null;
    
    try {
      auth = new AuthMiddleware(env.AUTH_TOKEN || 'default-token', env.JWT_SECRET || 'default-secret');
      if (env.SESSIONS) {
        rateLimiter = new RateLimiter(env.SESSIONS);
        metrics = new MetricsCollector(env.SESSIONS);
      }
    } catch (initError) {
      console.error('Middleware initialization error:', initError);
    }
    
    // Track request metrics
    if (metrics) {
      await metrics.trackRequest(request);
    }
    
    // CORS headers for browser-based clients
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };
    
    // Handle OPTIONS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { 
        status: 204, 
        headers: corsHeaders 
      });
    }
    
    try {
      // Rate limiting check
      if (rateLimiter) {
        const rateLimitResult = await rateLimiter.check(request);
        if (!rateLimitResult.allowed) {
          return new Response('Too Many Requests', { 
            status: 429,
            headers: {
              'Retry-After': (rateLimitResult.retryAfter || 60).toString(),
              ...corsHeaders
            }
          });
        }
      }
      
      // Route handling
      switch (url.pathname) {
        case '/':
          // Landing page with documentation - temporarily use simple response
          return new Response(`
            <!DOCTYPE html>
            <html>
            <head><title>RapidTriageME</title></head>
            <body>
              <h1>RapidTriageME is Live!</h1>
              <p>Environment: ${env.ENVIRONMENT}</p>
              <p>Health Check: <a href="${env.HEALTH_ENDPOINT}">${env.HEALTH_ENDPOINT}</a></p>
              <p>SSE Endpoint: ${env.SSE_ENDPOINT}</p>
            </body>
            </html>
          `, {
            headers: {
              'Content-Type': 'text/html;charset=UTF-8',
              ...corsHeaders
            }
          });
          
        case env.HEALTH_ENDPOINT:
          // Health check endpoint
          return new HealthCheck(env).handle(request);
          
        case env.METRICS_ENDPOINT:
          // Metrics endpoint (requires auth)
          if (auth) {
            const metricsAuth = await auth.verify(request);
            if (!metricsAuth.authenticated) {
              return new Response('Unauthorized', { status: 401 });
            }
          }
          return metrics ? metrics.handle(request) : new Response('Metrics not available', { status: 503 });
          
        case env.SSE_ENDPOINT:
          // Main SSE endpoint for MCP protocol
          if (auth) {
            const sseAuth = await auth.verify(request);
            if (!sseAuth.authenticated) {
              return new Response('Unauthorized', { 
                status: 401,
                headers: corsHeaders 
              });
            }
          }
          
          // Handle SSE connection for MCP
          const mcpHandler = new RemoteBrowserMCPHandler(env);
          return mcpHandler.handleSSE(request, ctx);
          
        case '/api/screenshot':
        case '/api/console-logs':
        case '/api/network-logs':
        case '/api/lighthouse':
        case '/api/inspect-element':
        case '/api/execute-js':
        case '/api/navigate':
        case '/api/triage-report':
          // API endpoints for browser operations (requires auth)
          if (auth) {
            const apiAuth = await auth.verify(request);
            if (!apiAuth.authenticated) {
              return new Response('Unauthorized', { status: 401 });
            }
          }
          
          // Forward to browser tools handler
          const mcpApiHandler = new RemoteBrowserMCPHandler(env);
          return mcpApiHandler.handleAPI(request, url.pathname);
          
        default:
          return new Response('Not Found', { 
            status: 404,
            headers: corsHeaders 
          });
      }
      
    } catch (error) {
      // Error tracking
      if (metrics) {
        try {
          await metrics.trackError(error as Error);
        } catch (metricsErr) {
          console.error('Metrics error:', metricsErr);
        }
      }
      
      console.error('Worker error:', error);
      
      return new Response(JSON.stringify({
        error: 'Internal Server Error',
        message: (error as Error).message,
        path: url.pathname
      }), { 
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
  },
};

/**
 * Durable Object for managing browser sessions
 */
export class BrowserSession {
  state: DurableObjectState;
  sessions: Map<string, any>;
  
  constructor(state: DurableObjectState) {
    this.state = state;
    this.sessions = new Map();
  }
  
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    if (url.pathname === '/websocket') {
      // Handle WebSocket upgrade for real-time browser communication
      const upgradeHeader = request.headers.get('Upgrade');
      if (upgradeHeader !== 'websocket') {
        return new Response('Expected WebSocket', { status: 400 });
      }
      
      const [client, server] = Object.values(new WebSocketPair());
      await this.handleWebSocket(server);
      
      return new Response(null, {
        status: 101,
        webSocket: client,
      });
    }
    
    return new Response('Not Found', { status: 404 });
  }
  
  async handleWebSocket(ws: WebSocket) {
    // Accept the WebSocket connection
    ws.accept();
    
    // Handle WebSocket messages for browser control
    ws.addEventListener('message', async (event) => {
      try {
        const data = JSON.parse(event.data as string);
        
        // Process browser control commands
        switch (data.type) {
          case 'navigate':
          case 'screenshot':
          case 'console':
          case 'network':
          case 'lighthouse':
          case 'inspect':
          case 'execute':
            // Forward to browser tools handler
            const result = await this.processBrowserCommand(data);
            ws.send(JSON.stringify(result));
            break;
            
          default:
            ws.send(JSON.stringify({ error: 'Unknown command type' }));
        }
      } catch (error) {
        ws.send(JSON.stringify({ error: (error as Error).message }));
      }
    });
    
    ws.addEventListener('close', () => {
      // Clean up session
      console.log('WebSocket closed');
    });
  }
  
  async processBrowserCommand(command: any): Promise<any> {
    // Process browser commands and return results
    // This would integrate with the actual browser tools
    return {
      type: command.type,
      status: 'success',
      data: 'Command processed',
    };
  }
}