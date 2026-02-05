/**
 * Session Service Unit Tests
 */

// Mock dependencies before imports
jest.mock('firebase-admin', () => {
  const mockDoc = {
    get: jest.fn(() => Promise.resolve({
      exists: true,
      data: () => ({
        id: 'session-123',
        type: 'browser',
        status: 'active',
      }),
    })),
    set: jest.fn(() => Promise.resolve()),
    update: jest.fn(() => Promise.resolve()),
    delete: jest.fn(() => Promise.resolve()),
  };

  const mockQuery = {
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    get: jest.fn(() => Promise.resolve({
      docs: [],
      empty: true,
      size: 0,
    })),
    count: jest.fn(() => ({
      get: jest.fn(() => Promise.resolve({ data: () => ({ count: 0 }) })),
    })),
  };

  const mockCollection = {
    doc: jest.fn(() => mockDoc),
    where: jest.fn(() => mockQuery),
    get: jest.fn(() => Promise.resolve({ docs: [], size: 0 })),
    count: jest.fn(() => mockQuery.count()),
  };

  const mockBatch = {
    update: jest.fn(),
    commit: jest.fn(() => Promise.resolve()),
  };

  const mockFirestore = jest.fn(() => ({
    collection: jest.fn(() => mockCollection),
    batch: jest.fn(() => mockBatch),
  }));

  return {
    initializeApp: jest.fn(),
    apps: [],
    firestore: Object.assign(mockFirestore, {
      FieldValue: {
        serverTimestamp: jest.fn(() => 'timestamp'),
        increment: jest.fn((n) => n),
        arrayUnion: jest.fn((v) => v),
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

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-session-123'),
}));

jest.mock('../../../src/config/firebase.config', () => ({
  getFirestore: jest.fn(),
  Collections: {
    SESSIONS: 'sessions',
  },
}));

import {
  SessionType,
  SessionStatus,
  BrowserSession,
  CreateSessionOptions,
  UpdateSessionOptions,
  SessionService,
} from '../../../src/services/session.service';

describe('Session Service', () => {
  describe('SessionType Type', () => {
    it('should support all session types', () => {
      const types: SessionType[] = ['browser', 'mcp', 'sse', 'websocket', 'api'];
      expect(types).toHaveLength(5);
      expect(types).toContain('browser');
      expect(types).toContain('mcp');
      expect(types).toContain('sse');
    });
  });

  describe('SessionStatus Type', () => {
    it('should support all status values', () => {
      const statuses: SessionStatus[] = ['active', 'idle', 'disconnected', 'expired'];
      expect(statuses).toHaveLength(4);
      expect(statuses).toContain('active');
      expect(statuses).toContain('expired');
    });
  });

  describe('BrowserSession Interface', () => {
    it('should define session structure', () => {
      const session: BrowserSession = {
        id: 'session-123',
        type: 'browser',
        status: 'active',
        userId: 'user-123',
        extensionId: 'ext-123',
        browserInfo: {
          name: 'Chrome',
          version: '120.0',
          platform: 'macOS',
          userAgent: 'Mozilla/5.0...',
        },
        connectionInfo: {
          ipAddress: '192.168.1.1',
          origin: 'https://example.com',
          connectedAt: new Date().toISOString(),
        },
        lastActivity: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        metadata: { customField: 'value' },
        logs: {
          consoleLogCount: 10,
          networkLogCount: 25,
          screenshotCount: 5,
        },
      };

      expect(session.id).toBe('session-123');
      expect(session.type).toBe('browser');
      expect(session.status).toBe('active');
      expect(session.browserInfo?.name).toBe('Chrome');
      expect(session.logs?.consoleLogCount).toBe(10);
    });

    it('should allow minimal session', () => {
      const session: BrowserSession = {
        id: 'session-123',
        type: 'api',
        status: 'active',
        lastActivity: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      expect(session.userId).toBeUndefined();
      expect(session.browserInfo).toBeUndefined();
    });
  });

  describe('CreateSessionOptions Interface', () => {
    it('should define creation options', () => {
      const options: CreateSessionOptions = {
        type: 'browser',
        userId: 'user-123',
        extensionId: 'ext-123',
        browserInfo: {
          name: 'Chrome',
          version: '120.0',
          platform: 'macOS',
          userAgent: 'Mozilla/5.0...',
        },
        ipAddress: '192.168.1.1',
        origin: 'https://example.com',
        ttlMinutes: 120,
        metadata: { source: 'extension' },
      };

      expect(options.type).toBe('browser');
      expect(options.ttlMinutes).toBe(120);
    });

    it('should require only type', () => {
      const options: CreateSessionOptions = {
        type: 'mcp',
      };

      expect(options.type).toBe('mcp');
      expect(options.userId).toBeUndefined();
    });
  });

  describe('UpdateSessionOptions Interface', () => {
    it('should define update options', () => {
      const options: UpdateSessionOptions = {
        status: 'idle',
        metadata: { updated: true },
        incrementConsole: 5,
        incrementNetwork: 10,
        incrementScreenshot: 1,
      };

      expect(options.status).toBe('idle');
      expect(options.incrementConsole).toBe(5);
    });

    it('should allow partial updates', () => {
      const options: UpdateSessionOptions = {
        incrementScreenshot: 1,
      };

      expect(options.status).toBeUndefined();
    });
  });

  describe('SessionService Class', () => {
    let sessionService: SessionService;
    let mockFirestore: any;

    beforeEach(() => {
      jest.clearAllMocks();

      // Setup mock Firestore
      const mockDoc = {
        get: jest.fn(() => Promise.resolve({
          exists: true,
          data: () => ({
            id: 'session-123',
            type: 'browser',
            status: 'active',
            lastActivity: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          }),
        })),
        set: jest.fn(() => Promise.resolve()),
        update: jest.fn(() => Promise.resolve()),
        delete: jest.fn(() => Promise.resolve()),
      };

      const mockQuery = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        get: jest.fn(() => Promise.resolve({
          docs: [{ data: () => ({ id: 'session-1', type: 'browser', status: 'active' }) }],
          empty: false,
          size: 1,
        })),
        count: jest.fn(() => ({
          get: jest.fn(() => Promise.resolve({ data: () => ({ count: 5 }) })),
        })),
      };

      const mockCollection = {
        doc: jest.fn(() => mockDoc),
        where: jest.fn(() => mockQuery),
        get: jest.fn(() => Promise.resolve({
          docs: [
            { data: () => ({ id: 'session-1', type: 'browser', status: 'active' }) },
            { data: () => ({ id: 'session-2', type: 'mcp', status: 'idle' }) },
          ],
          size: 2,
        })),
      };

      const mockBatch = {
        update: jest.fn(),
        commit: jest.fn(() => Promise.resolve()),
      };

      mockFirestore = {
        collection: jest.fn(() => mockCollection),
        batch: jest.fn(() => mockBatch),
      };

      const firebaseConfig = jest.requireMock('../../../src/config/firebase.config');
      firebaseConfig.getFirestore.mockReturnValue(mockFirestore);

      sessionService = new SessionService();
    });

    describe('createSession', () => {
      it('should create a new session with required fields', async () => {
        const session = await sessionService.createSession({
          type: 'browser',
        });

        expect(session).toBeDefined();
        expect(session.id).toBe('mock-uuid-session-123');
        expect(session.type).toBe('browser');
        expect(session.status).toBe('active');
      });

      it('should create session with all options', async () => {
        const session = await sessionService.createSession({
          type: 'browser',
          userId: 'user-123',
          extensionId: 'ext-123',
          browserInfo: {
            name: 'Chrome',
            version: '120.0',
            platform: 'macOS',
            userAgent: 'Mozilla/5.0...',
          },
          ipAddress: '192.168.1.1',
          origin: 'https://example.com',
          ttlMinutes: 60,
          metadata: { source: 'test' },
        });

        expect(session.userId).toBe('user-123');
        expect(session.extensionId).toBe('ext-123');
        expect(session.browserInfo?.name).toBe('Chrome');
      });

      it('should set default TTL of 60 minutes', async () => {
        const session = await sessionService.createSession({
          type: 'api',
        });

        expect(session.expiresAt).toBeDefined();
        const expiresAt = new Date(session.expiresAt!);
        const now = new Date();
        const diffMinutes = (expiresAt.getTime() - now.getTime()) / (1000 * 60);
        expect(Math.round(diffMinutes)).toBeCloseTo(60, -1);
      });

      it('should initialize log counts to zero', async () => {
        const session = await sessionService.createSession({
          type: 'browser',
        });

        expect(session.logs).toEqual({
          consoleLogCount: 0,
          networkLogCount: 0,
          screenshotCount: 0,
        });
      });
    });

    describe('getSession', () => {
      it('should return session by ID', async () => {
        const session = await sessionService.getSession('session-123');
        expect(session).toBeDefined();
        expect(session?.id).toBe('session-123');
      });

      it('should return null for non-existent session', async () => {
        const mockDoc = {
          get: jest.fn(() => Promise.resolve({ exists: false })),
        };
        mockFirestore.collection.mockReturnValueOnce({
          doc: jest.fn(() => mockDoc),
        });

        const session = await sessionService.getSession('non-existent');
        expect(session).toBeNull();
      });

      it('should mark expired sessions', async () => {
        const expiredDate = new Date(Date.now() - 3600000).toISOString();
        const mockDoc = {
          get: jest.fn(() => Promise.resolve({
            exists: true,
            data: () => ({
              id: 'expired-session',
              type: 'browser',
              status: 'active',
              expiresAt: expiredDate,
              lastActivity: new Date().toISOString(),
              createdAt: new Date().toISOString(),
            }),
          })),
          update: jest.fn(() => Promise.resolve()),
        };
        mockFirestore.collection.mockReturnValueOnce({
          doc: jest.fn(() => mockDoc),
        });

        const session = await sessionService.getSession('expired-session');
        expect(session?.status).toBe('expired');
      });
    });

    describe('updateSession', () => {
      it('should update session status', async () => {
        const mockDoc = {
          get: jest.fn(() => Promise.resolve({
            exists: true,
            data: () => ({
              id: 'session-123',
              type: 'browser',
              status: 'idle',
              lastActivity: new Date().toISOString(),
              createdAt: new Date().toISOString(),
            }),
          })),
          update: jest.fn(() => Promise.resolve()),
        };
        mockFirestore.collection.mockReturnValue({
          doc: jest.fn(() => mockDoc),
        });

        const session = await sessionService.updateSession('session-123', {
          status: 'idle',
        });

        expect(mockDoc.update).toHaveBeenCalled();
        expect(session?.status).toBe('idle');
      });

      it('should return null for non-existent session', async () => {
        const mockDoc = {
          get: jest.fn(() => Promise.resolve({ exists: false })),
        };
        mockFirestore.collection.mockReturnValueOnce({
          doc: jest.fn(() => mockDoc),
        });

        const session = await sessionService.updateSession('non-existent', {
          status: 'idle',
        });
        expect(session).toBeNull();
      });
    });

    describe('touchSession', () => {
      it('should update last activity', async () => {
        const mockDoc = {
          update: jest.fn(() => Promise.resolve()),
        };
        mockFirestore.collection.mockReturnValueOnce({
          doc: jest.fn(() => mockDoc),
        });

        const result = await sessionService.touchSession('session-123');
        expect(result).toBe(true);
        expect(mockDoc.update).toHaveBeenCalled();
      });

      it('should return false on error', async () => {
        const mockDoc = {
          update: jest.fn(() => Promise.reject(new Error('Update failed'))),
        };
        mockFirestore.collection.mockReturnValueOnce({
          doc: jest.fn(() => mockDoc),
        });

        const result = await sessionService.touchSession('session-123');
        expect(result).toBe(false);
      });
    });

    describe('endSession', () => {
      it('should mark session as disconnected', async () => {
        const mockDoc = {
          update: jest.fn(() => Promise.resolve()),
        };
        mockFirestore.collection.mockReturnValueOnce({
          doc: jest.fn(() => mockDoc),
        });

        const result = await sessionService.endSession('session-123');
        expect(result).toBe(true);
        expect(mockDoc.update).toHaveBeenCalledWith(expect.objectContaining({
          status: 'disconnected',
        }));
      });
    });

    describe('deleteSession', () => {
      it('should delete session', async () => {
        const mockDoc = {
          delete: jest.fn(() => Promise.resolve()),
        };
        mockFirestore.collection.mockReturnValueOnce({
          doc: jest.fn(() => mockDoc),
        });

        const result = await sessionService.deleteSession('session-123');
        expect(result).toBe(true);
        expect(mockDoc.delete).toHaveBeenCalled();
      });

      it('should return false on error', async () => {
        const mockDoc = {
          delete: jest.fn(() => Promise.reject(new Error('Delete failed'))),
        };
        mockFirestore.collection.mockReturnValueOnce({
          doc: jest.fn(() => mockDoc),
        });

        const result = await sessionService.deleteSession('session-123');
        expect(result).toBe(false);
      });
    });

    describe('getActiveSessionsCount', () => {
      it('should return count of active sessions', async () => {
        const count = await sessionService.getActiveSessionsCount();
        expect(count).toBe(5);
      });
    });
  });
});
