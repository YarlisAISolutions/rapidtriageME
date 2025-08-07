/**
 * Minimal working Cloudflare Worker for RapidTriageME
 */

export interface Env {
  SESSIONS?: KVNamespace;
  BROWSER_SESSIONS?: DurableObjectNamespace;
  ENVIRONMENT?: string;
  AUTH_TOKEN?: string;
  JWT_SECRET?: string;
  BROWSER_TOOLS_PORT?: string;
  SSE_ENDPOINT?: string;
  HEALTH_ENDPOINT?: string;
  METRICS_ENDPOINT?: string;
  LOG_LEVEL?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    // Simple routing
    if (url.pathname === '/') {
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head><title>RapidTriageME</title></head>
        <body>
          <h1>🚀 RapidTriageME is Live!</h1>
          <p>Environment: ${env.ENVIRONMENT || 'production'}</p>
          <p>Status: Operational</p>
          <p><a href="/health">Health Check</a></p>
        </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html;charset=UTF-8' }
      });
    }
    
    if (url.pathname === '/health' || url.pathname === env.HEALTH_ENDPOINT) {
      return new Response(JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: env.ENVIRONMENT || 'production',
        version: '1.0.0',
        service: 'RapidTriageME'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response('Not Found', { status: 404 });
  },
};

// Minimal Durable Object
export class BrowserSession {
  constructor(_state: DurableObjectState) {}
  
  async fetch(_request: Request): Promise<Response> {
    return new Response('OK');
  }
}