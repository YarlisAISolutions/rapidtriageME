/**
 * Unit Test Setup
 * This setup uses manual mocks for Firebase services
 */

// Mock firebase-admin before any imports
jest.mock('firebase-admin');
jest.mock('firebase-functions');
jest.mock('firebase-functions/v2/https', () => ({
  onRequest: jest.fn((options: any, handler: any) => handler || options),
  onCall: jest.fn((options: any, handler: any) => handler || options),
  HttpsError: class HttpsError extends Error {
    constructor(public code: string, message: string, public details?: any) {
      super(message);
      this.name = 'HttpsError';
    }
  },
}));
jest.mock('firebase-functions/v2/scheduler', () => ({
  onSchedule: jest.fn((options: any, handler: any) => handler || options),
}));
jest.mock('firebase-functions/v2/firestore', () => ({
  onDocumentCreated: jest.fn((options: any, handler: any) => handler || options),
  onDocumentUpdated: jest.fn((options: any, handler: any) => handler || options),
  onDocumentDeleted: jest.fn((options: any, handler: any) => handler || options),
}));
jest.mock('firebase-functions/v2/identity', () => ({
  beforeUserCreated: jest.fn((options: any, handler: any) => handler || options),
  beforeUserSignedIn: jest.fn((options: any, handler: any) => handler || options),
  HttpsError: class HttpsError extends Error {
    constructor(public code: string, message: string, public details?: any) {
      super(message);
      this.name = 'HttpsError';
    }
  },
}));
jest.mock('firebase-functions/params', () => ({
  defineSecret: jest.fn((name: string) => ({
    value: jest.fn(() => `mock-${name}-value`),
  })),
  defineString: jest.fn((name: string) => ({
    value: jest.fn(() => `mock-${name}-value`),
  })),
}));

// Mock stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    customers: {
      create: jest.fn(() => Promise.resolve({ id: 'cus_mock' })),
      retrieve: jest.fn(() => Promise.resolve({ id: 'cus_mock', email: 'test@example.com' })),
      update: jest.fn(() => Promise.resolve({ id: 'cus_mock' })),
      del: jest.fn(() => Promise.resolve({ deleted: true })),
    },
    subscriptions: {
      create: jest.fn(() => Promise.resolve({ id: 'sub_mock', status: 'active' })),
      retrieve: jest.fn(() => Promise.resolve({ id: 'sub_mock', status: 'active' })),
      update: jest.fn(() => Promise.resolve({ id: 'sub_mock', status: 'active' })),
      cancel: jest.fn(() => Promise.resolve({ id: 'sub_mock', status: 'canceled' })),
      list: jest.fn(() => Promise.resolve({ data: [] })),
    },
    checkout: {
      sessions: {
        create: jest.fn(() => Promise.resolve({ id: 'cs_mock', url: 'https://checkout.stripe.com/mock' })),
      },
    },
    billingPortal: {
      sessions: {
        create: jest.fn(() => Promise.resolve({ url: 'https://billing.stripe.com/mock' })),
      },
    },
    webhooks: {
      constructEvent: jest.fn((body, sig, secret) => JSON.parse(body)),
    },
    prices: {
      list: jest.fn(() => Promise.resolve({ data: [] })),
    },
    accounts: {
      create: jest.fn(() => Promise.resolve({ id: 'acct_mock' })),
      retrieve: jest.fn(() => Promise.resolve({ id: 'acct_mock' })),
      update: jest.fn(() => Promise.resolve({ id: 'acct_mock' })),
    },
    accountLinks: {
      create: jest.fn(() => Promise.resolve({ url: 'https://connect.stripe.com/mock' })),
    },
  }));
});

// Global test utilities
global.console = {
  ...console,
  // Suppress console logs during tests
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});
