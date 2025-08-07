/**
 * Rate Limiting Middleware for RapidTriageME
 * Prevents abuse and ensures fair usage
 */

export class RateLimiter {
  private storage: KVNamespace;
  private limit: number;
  private windowMs: number;
  
  constructor(storage: KVNamespace, limit: number = 100, windowMs: number = 60000) {
    this.storage = storage;
    this.limit = limit;
    this.windowMs = windowMs;
  }
  
  async check(request: Request): Promise<{ allowed: boolean; retryAfter?: number }> {
    const clientId = this.getClientId(request);
    const key = `rate_limit:${clientId}`;
    const now = Date.now();
    
    // Get current rate limit data
    const data = await this.storage.get(key, { type: 'json' }) as any;
    
    if (!data || now - data.windowStart > this.windowMs) {
      // New window
      await this.storage.put(key, JSON.stringify({
        windowStart: now,
        count: 1
      }), { expirationTtl: Math.ceil(this.windowMs / 1000) });
      
      return { allowed: true };
    }
    
    if (data.count >= this.limit) {
      // Rate limit exceeded
      const retryAfter = Math.ceil((data.windowStart + this.windowMs - now) / 1000);
      return { allowed: false, retryAfter };
    }
    
    // Increment counter
    data.count++;
    await this.storage.put(key, JSON.stringify(data), {
      expirationTtl: Math.ceil((data.windowStart + this.windowMs - now) / 1000)
    });
    
    return { allowed: true };
  }
  
  private getClientId(request: Request): string {
    // Try to get client IP from CF-Connecting-IP header
    const cfIp = request.headers.get('CF-Connecting-IP');
    if (cfIp) return cfIp;
    
    // Fallback to X-Forwarded-For
    const xForwardedFor = request.headers.get('X-Forwarded-For');
    if (xForwardedFor) {
      return xForwardedFor.split(',')[0].trim();
    }
    
    // Fallback to a hash of headers for uniqueness
    const headersArray: [string, string][] = [];
    request.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'authorization') {
        headersArray.push([key, value]);
      }
    });
    
    const headers = headersArray
      .sort()
      .map(([key, value]) => `${key}:${value}`)
      .join('|');
    
    return this.hashString(headers);
  }
  
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }
}