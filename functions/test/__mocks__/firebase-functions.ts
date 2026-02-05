/**
 * Firebase Functions Mock
 * This mock is automatically used by Jest when firebase-functions is imported
 */

export const logger = {
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  write: jest.fn(),
};

export const config = jest.fn(() => ({
  stripe: { secret_key: 'sk_test_mock' },
  jwt: { secret: 'mock-jwt-secret' },
}));

export const https = {
  HttpsError: class HttpsError extends Error {
    constructor(public code: string, public message: string, public details?: any) {
      super(message);
      this.name = 'HttpsError';
    }
  },
  onRequest: jest.fn((handler: any) => handler),
  onCall: jest.fn((handler: any) => handler),
};

export class HttpsError extends Error {
  constructor(public code: string, message: string, public details?: any) {
    super(message);
    this.name = 'HttpsError';
  }
}

export default {
  logger,
  config,
  https,
  HttpsError,
};
