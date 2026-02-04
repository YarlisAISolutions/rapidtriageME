/**
 * Rate Limiting Middleware using Firestore
 * Prevents abuse and ensures fair usage across all clients
 */

import * as admin from 'firebase-admin';
import { Request, Response, NextFunction } from 'express';
import { getFirestore, Collections } from '../config/firebase.config.js';
import { AuthenticatedRequest } from './auth.middleware.js';

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  limit: number;           // Max requests per window
  windowMs: number;        // Window size in milliseconds
  keyPrefix?: string;      // Prefix for storage keys
  skipFailedRequests?: boolean;
  skipSuccessfulRequests?: boolean;
  handler?: (req: Request, res: Response) => void;
}

/**
 * Rate limit data stored in Firestore
 */
interface RateLimitData {
  windowStart: number;
  count: number;
  lastRequest: number;
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

/**
 * Default rate limit configurations
 */
export const RateLimitPresets = {
  default: { limit: 100, windowMs: 60000 },           // 100 req/min
  strict: { limit: 20, windowMs: 60000 },             // 20 req/min
  relaxed: { limit: 500, windowMs: 60000 },           // 500 req/min
  api: { limit: 1000, windowMs: 60000 },              // 1000 req/min
  screenshot: { limit: 30, windowMs: 60000 },         // 30 req/min
  lighthouse: { limit: 10, windowMs: 60000 },         // 10 req/min
  sse: { limit: 50, windowMs: 60000 },                // 50 req/min
} as const;

/**
 * Rate Limiter Class
 */
export class RateLimiter {
  private db: admin.firestore.Firestore;
  private config: RateLimitConfig;
  private collectionPath: string;

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.db = getFirestore();
    this.config = {
      limit: config.limit || RateLimitPresets.default.limit,
      windowMs: config.windowMs || RateLimitPresets.default.windowMs,
      keyPrefix: config.keyPrefix || 'rate_limit',
      skipFailedRequests: config.skipFailedRequests || false,
      skipSuccessfulRequests: config.skipSuccessfulRequests || false,
      handler: config.handler,
    };
    this.collectionPath = Collections.RATE_LIMITS;
  }

  /**
   * Get client identifier from request
   */
  private getClientId(request: Request): string {
    // Try authenticated user ID first
    const authReq = request as AuthenticatedRequest;
    if (authReq.user?.userId) {
      return `user:${authReq.user.userId}`;
    }

    if (authReq.user?.keyId) {
      return `key:${authReq.user.keyId}`;
    }

    // Try IP addresses
    const cfIp = request.headers['cf-connecting-ip'] as string;
    if (cfIp) return `ip:${cfIp}`;

    const xForwardedFor = request.headers['x-forwarded-for'];
    if (xForwardedFor) {
      const ip = Array.isArray(xForwardedFor)
        ? xForwardedFor[0]
        : xForwardedFor.split(',')[0].trim();
      return `ip:${ip}`;
    }

    const xRealIp = request.headers['x-real-ip'] as string;
    if (xRealIp) return `ip:${xRealIp}`;

    // Fallback to socket address
    return `ip:${request.socket?.remoteAddress || 'unknown'}`;
  }

  /**
   * Check rate limit for a request
   */
  async check(request: Request): Promise<RateLimitResult> {
    const clientId = this.getClientId(request);
    const key = `${this.config.keyPrefix}:${clientId}`;
    const now = Date.now();

    try {
      const docRef = this.db.collection(this.collectionPath).doc(this.hashKey(key));

      // Use transaction for atomic updates
      const result = await this.db.runTransaction(async (transaction) => {
        const doc = await transaction.get(docRef);
        const data = doc.data() as RateLimitData | undefined;

        // Check if we need a new window
        if (!data || now - data.windowStart > this.config.windowMs) {
          // Start new window
          const newData: RateLimitData = {
            windowStart: now,
            count: 1,
            lastRequest: now,
          };
          transaction.set(docRef, newData);

          return {
            allowed: true,
            remaining: this.config.limit - 1,
            resetTime: now + this.config.windowMs,
          };
        }

        // Check if limit exceeded
        if (data.count >= this.config.limit) {
          const retryAfter = Math.ceil((data.windowStart + this.config.windowMs - now) / 1000);
          return {
            allowed: false,
            remaining: 0,
            resetTime: data.windowStart + this.config.windowMs,
            retryAfter,
          };
        }

        // Increment counter
        transaction.update(docRef, {
          count: admin.firestore.FieldValue.increment(1),
          lastRequest: now,
        });

        return {
          allowed: true,
          remaining: this.config.limit - data.count - 1,
          resetTime: data.windowStart + this.config.windowMs,
        };
      });

      return result;
    } catch (error) {
      console.error('Rate limiter error:', error);
      // Fail open - allow request if rate limiting fails
      return {
        allowed: true,
        remaining: this.config.limit,
        resetTime: now + this.config.windowMs,
      };
    }
  }

  /**
   * Hash key to valid Firestore document ID
   */
  private hashKey(key: string): string {
    // Simple hash for document ID
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Express middleware function
   */
  middleware() {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const result = await this.check(req);

        // Set rate limit headers
        res.set('X-RateLimit-Limit', this.config.limit.toString());
        res.set('X-RateLimit-Remaining', result.remaining.toString());
        res.set('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString());

        if (!result.allowed) {
          res.set('Retry-After', result.retryAfter?.toString() || '60');

          if (this.config.handler) {
            this.config.handler(req, res);
            return;
          }

          res.status(429).json({
            success: false,
            error: 'Too Many Requests',
            message: `Rate limit exceeded. Try again in ${result.retryAfter} seconds.`,
            retryAfter: result.retryAfter,
          });
          return;
        }

        next();
      } catch (error) {
        console.error('Rate limit middleware error:', error);
        // Fail open
        next();
      }
    };
  }

  /**
   * Reset rate limit for a client
   */
  async reset(clientId: string): Promise<void> {
    const key = `${this.config.keyPrefix}:${clientId}`;
    const docRef = this.db.collection(this.collectionPath).doc(this.hashKey(key));
    await docRef.delete();
  }

  /**
   * Get current rate limit status for a client
   */
  async getStatus(clientId: string): Promise<RateLimitData | null> {
    const key = `${this.config.keyPrefix}:${clientId}`;
    const docRef = this.db.collection(this.collectionPath).doc(this.hashKey(key));
    const doc = await docRef.get();
    return doc.exists ? doc.data() as RateLimitData : null;
  }
}

/**
 * Create rate limiter with preset configuration
 */
export function createRateLimiter(
  preset: keyof typeof RateLimitPresets = 'default',
  overrides?: Partial<RateLimitConfig>
): RateLimiter {
  return new RateLimiter({
    ...RateLimitPresets[preset],
    ...overrides,
  });
}

// Export default rate limiter
export const defaultRateLimiter = new RateLimiter(RateLimitPresets.default);

// Export middleware functions
export const rateLimit = (config?: Partial<RateLimitConfig>) =>
  new RateLimiter(config).middleware();

export const apiRateLimit = new RateLimiter(RateLimitPresets.api).middleware();
export const screenshotRateLimit = new RateLimiter(RateLimitPresets.screenshot).middleware();
export const lighthouseRateLimit = new RateLimiter(RateLimitPresets.lighthouse).middleware();
export const sseRateLimit = new RateLimiter(RateLimitPresets.sse).middleware();
