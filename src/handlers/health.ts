/**
 * Health Check Handler for RapidTriageME
 * Provides service status and monitoring information
 */

export class HealthCheck {
  private env: any;
  
  constructor(env: any) {
    this.env = env;
  }
  
  async handle(_request: Request): Promise<Response> {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: this.env.ENVIRONMENT,
      version: '1.0.0',
      service: 'RapidTriageME',
      provider: 'YarlisAISolutions',
      endpoints: {
        sse: this.env.SSE_ENDPOINT,
        health: this.env.HEALTH_ENDPOINT,
        metrics: this.env.METRICS_ENDPOINT
      },
      checks: {
        kv_storage: await this.checkKVStorage(),
        durable_objects: await this.checkDurableObjects()
      }
    };
    
    const allHealthy = Object.values(health.checks).every(check => check === 'ok');
    
    return new Response(JSON.stringify(health, null, 2), {
      status: allHealthy ? 200 : 503,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
  }
  
  private async checkKVStorage(): Promise<string> {
    try {
      // Check if KV storage is configured
      if (!this.env.SESSIONS) {
        return 'not_configured';
      }
      
      // Test KV storage availability
      const testKey = 'health_check_test';
      await this.env.SESSIONS.put(testKey, 'ok', { expirationTtl: 60 });
      const value = await this.env.SESSIONS.get(testKey);
      await this.env.SESSIONS.delete(testKey);
      return value === 'ok' ? 'ok' : 'error';
    } catch (error) {
      return 'error';
    }
  }
  
  private async checkDurableObjects(): Promise<string> {
    try {
      // Test Durable Objects availability
      // This is a simplified check - in production, you'd do more thorough testing
      return this.env.BROWSER_SESSIONS ? 'ok' : 'not_configured';
    } catch (error) {
      return 'error';
    }
  }
}