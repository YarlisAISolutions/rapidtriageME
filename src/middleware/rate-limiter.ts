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

    try {
      // Get current rate limit data
      const data = await this.storage.get(key, { type: 'json' }) as any;

      if (!data || now - data.windowStart > this.windowMs) {
        // New window - use exponential backoff for KV operations
        let retries = 0;
        const maxRetries = 3;

        while (retries < maxRetries) {
          try {
            await this.storage.put(key, JSON.stringify({
              windowStart: now,
              count: 1
            }), { expirationTtl: Math.max(60, Math.ceil(this.windowMs / 1000)) });
            break;
          } catch (error: any) {
            // If we hit KV write limit, disable rate limiting temporarily
            if (error.message?.includes('limit exceeded')) {
              console.warn('KV write limit exceeded - bypassing rate limiter');
              return { allowed: true };
            }
            if (error.message?.includes('429') && retries < maxRetries - 1) {
              // Exponential backoff: 100ms, 200ms, 400ms
              await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, retries)));
              retries++;
            } else {
              // Log error but allow request to proceed
              console.error('Rate limiter KV write failed:', error);
              return { allowed: true };
            }
          }
        }

        return { allowed: true };
      }
      
      if (data.count >= this.limit) {
        // Rate limit exceeded
        const retryAfter = Math.ceil((data.windowStart + this.windowMs - now) / 1000);
        return { allowed: false, retryAfter };
      }
      
      // Increment counter with retry logic
      data.count++;
      let retries = 0;
      const maxRetries = 3;

      while (retries < maxRetries) {
        try {
          await this.storage.put(key, JSON.stringify(data), {
            expirationTtl: Math.max(60, Math.ceil((data.windowStart + this.windowMs - now) / 1000))
          });
          break;
        } catch (error: any) {
          // If we hit KV write limit, disable rate limiting temporarily
          if (error.message?.includes('limit exceeded')) {
            console.warn('KV write limit exceeded - bypassing rate limiter');
            // Still allow the request even if we can't update the counter
            break;
          }
          if (error.message?.includes('429') && retries < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, retries)));
            retries++;
          } else {
            console.error('Rate limiter KV update failed:', error);
            // Still allow the request even if we can't update the counter
            break;
          }
        }
      }
      
      return { allowed: true };
    } catch (error) {
      // If rate limiting fails, allow the request but log the error
      console.error('Rate limiter error:', error);
      return { allowed: true };
    }
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