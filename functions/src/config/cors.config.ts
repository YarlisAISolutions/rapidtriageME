/**
 * CORS Configuration for Firebase Functions
 * Handles cross-origin requests for browser-based clients
 */

import cors from 'cors';
import { Request, Response, NextFunction } from 'express';

/**
 * Allowed origins for CORS
 */
const allowedOrigins = [
  'https://rapidtriage.me',
  'https://www.rapidtriage.me',
  'https://test.rapidtriage.me',
  'https://yarlisaisolutions.github.io',
  'http://localhost:3000',
  'http://localhost:3025',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3025',
  // Chrome extension origins
  'chrome-extension://',
];

/**
 * Check if origin is allowed
 */
function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return true; // Allow requests with no origin (server-to-server)

  // Check for exact match
  if (allowedOrigins.includes(origin)) return true;

  // Check for chrome extension
  if (origin.startsWith('chrome-extension://')) return true;

  // Check for localhost variations
  if (origin.includes('localhost') || origin.includes('127.0.0.1')) return true;

  // Check for rapidtriage.me subdomains
  if (origin.endsWith('.rapidtriage.me')) return true;

  return false;
}

/**
 * CORS options configuration
 */
export const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-Extension-Id',
    'X-Session-Id',
    'X-API-Key',
    'Accept',
    'Origin',
  ],
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
    'X-Request-Id',
  ],
  credentials: true,
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

/**
 * CORS middleware instance
 */
export const corsMiddleware = cors(corsOptions);

/**
 * Manual CORS handler for non-Express contexts
 */
export function handleCors(request: Request, response: Response): boolean {
  const origin = request.headers.origin;

  // Set CORS headers
  if (isAllowedOrigin(origin)) {
    response.set('Access-Control-Allow-Origin', origin || '*');
  }

  response.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  const headers = Array.isArray(corsOptions.allowedHeaders)
    ? corsOptions.allowedHeaders.join(', ')
    : corsOptions.allowedHeaders || '*';
  response.set('Access-Control-Allow-Headers', headers);
  response.set('Access-Control-Allow-Credentials', 'true');
  response.set('Access-Control-Max-Age', '86400');

  // Handle preflight
  if (request.method === 'OPTIONS') {
    response.status(204).send('');
    return true; // Request handled
  }

  return false; // Continue processing
}

/**
 * Express middleware wrapper for CORS
 */
export function corsHandler(req: Request, res: Response, next: NextFunction): void {
  corsMiddleware(req, res, next);
}

/**
 * Get CORS headers for manual response building
 */
export function getCorsHeaders(origin?: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': isAllowedOrigin(origin) ? (origin || '*') : '',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Extension-Id, X-Session-Id',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  };
}
