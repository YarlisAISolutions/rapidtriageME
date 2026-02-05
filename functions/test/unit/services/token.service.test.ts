/**
 * Token Service Unit Tests
 */

// Mock all dependencies before imports
jest.mock('firebase-admin', () => {
  const mockDoc = {
    get: jest.fn(),
    set: jest.fn(() => Promise.resolve()),
    update: jest.fn(() => Promise.resolve()),
    delete: jest.fn(() => Promise.resolve()),
  };

  const mockCollection = {
    doc: jest.fn(() => mockDoc),
  };

  const mockFirestore = jest.fn(() => ({
    collection: jest.fn(() => mockCollection),
    runTransaction: jest.fn((callback) => callback({
      get: jest.fn(() => Promise.resolve({ exists: false, data: () => null })),
      set: jest.fn(),
      update: jest.fn(),
    })),
  }));

  return {
    initializeApp: jest.fn(),
    apps: [],
    firestore: Object.assign(mockFirestore, {
      FieldValue: {
        serverTimestamp: jest.fn(() => 'timestamp'),
        increment: jest.fn((n) => n),
      },
    }),
  };
});

jest.mock('firebase-functions', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

import {
  TOKEN_LIMITS,
  TOKEN_COSTS,
  TokenOperation,
  tokenService,
} from '../../../src/services/token.service';

describe('Token Service', () => {
  describe('TOKEN_LIMITS', () => {
    it('should define free tier limit', () => {
      expect(TOKEN_LIMITS.free).toBe(1000);
    });

    it('should define user tier limit', () => {
      expect(TOKEN_LIMITS.user).toBe(8000);
    });

    it('should define team tier limit', () => {
      expect(TOKEN_LIMITS.team).toBe(25000);
    });

    it('should define enterprise as unlimited', () => {
      expect(TOKEN_LIMITS.enterprise).toBe(-1);
    });

    it('should have all expected tiers', () => {
      expect(Object.keys(TOKEN_LIMITS)).toEqual(['free', 'user', 'team', 'enterprise']);
    });
  });

  describe('TOKEN_COSTS', () => {
    it('should define screenshot cost', () => {
      expect(TOKEN_COSTS.screenshot).toBe(10);
    });

    it('should define lighthouseAudit cost', () => {
      expect(TOKEN_COSTS.lighthouseAudit).toBe(50);
    });

    it('should define consoleLog cost', () => {
      expect(TOKEN_COSTS.consoleLog).toBe(1);
    });

    it('should define networkLog cost', () => {
      expect(TOKEN_COSTS.networkLog).toBe(1);
    });

    it('should define triageReport cost', () => {
      expect(TOKEN_COSTS.triageReport).toBe(100);
    });

    it('should define accessibilityAudit cost', () => {
      expect(TOKEN_COSTS.accessibilityAudit).toBe(30);
    });

    it('should define performanceAudit cost', () => {
      expect(TOKEN_COSTS.performanceAudit).toBe(30);
    });

    it('should define seoAudit cost', () => {
      expect(TOKEN_COSTS.seoAudit).toBe(30);
    });

    it('should define bestPracticesAudit cost', () => {
      expect(TOKEN_COSTS.bestPracticesAudit).toBe(30);
    });

    it('should define elementInspection cost', () => {
      expect(TOKEN_COSTS.elementInspection).toBe(5);
    });

    it('should define jsExecution cost', () => {
      expect(TOKEN_COSTS.jsExecution).toBe(20);
    });

    it('should have all costs as positive numbers', () => {
      Object.values(TOKEN_COSTS).forEach(cost => {
        expect(typeof cost).toBe('number');
        expect(cost).toBeGreaterThan(0);
      });
    });
  });

  describe('tokenService', () => {
    describe('getTokenLimit', () => {
      it('should return correct limit for free tier', () => {
        expect(tokenService.getTokenLimit('free')).toBe(1000);
      });

      it('should return correct limit for user tier', () => {
        expect(tokenService.getTokenLimit('user')).toBe(8000);
      });

      it('should return correct limit for team tier', () => {
        expect(tokenService.getTokenLimit('team')).toBe(25000);
      });

      it('should return -1 for enterprise tier', () => {
        expect(tokenService.getTokenLimit('enterprise')).toBe(-1);
      });

      it('should return free tier limit for unknown tier', () => {
        expect(tokenService.getTokenLimit('unknown')).toBe(1000);
      });
    });
  });

  describe('Token Calculations', () => {
    it('should calculate max screenshots for free tier', () => {
      const max = Math.floor(TOKEN_LIMITS.free / TOKEN_COSTS.screenshot);
      expect(max).toBe(100);
    });

    it('should calculate max screenshots for user tier', () => {
      const max = Math.floor(TOKEN_LIMITS.user / TOKEN_COSTS.screenshot);
      expect(max).toBe(800);
    });

    it('should calculate max triage reports for free tier', () => {
      const max = Math.floor(TOKEN_LIMITS.free / TOKEN_COSTS.triageReport);
      expect(max).toBe(10);
    });

    it('should calculate max lighthouse audits for user tier', () => {
      const max = Math.floor(TOKEN_LIMITS.user / TOKEN_COSTS.lighthouseAudit);
      expect(max).toBe(160);
    });
  });
});
