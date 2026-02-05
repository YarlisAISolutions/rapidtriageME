/**
 * Session Service Tests
 * Tests for session management functionality
 */

import {
  initializeTestEnvironment,
  cleanupTestEnvironment,
  TestTimeouts,
  TestData,
} from '../setup';

// ============================================
// MOCK SESSION SERVICE
// ============================================

type SessionType = 'browser' | 'mcp' | 'sse' | 'websocket' | 'api';
type SessionStatus = 'active' | 'idle' | 'disconnected' | 'expired';

interface BrowserSession {
  id: string;
  type: SessionType;
  status: SessionStatus;
  userId?: string;
  extensionId?: string;
  browserInfo?: {
    name: string;
    version: string;
    platform: string;
    userAgent: string;
  };
  lastActivity: string;
  createdAt: string;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
  logs?: {
    consoleLogCount: number;
    networkLogCount: number;
    screenshotCount: number;
  };
}

interface CreateSessionOptions {
  type: SessionType;
  userId?: string;
  extensionId?: string;
  browserInfo?: BrowserSession['browserInfo'];
  ttlMinutes?: number;
  metadata?: Record<string, unknown>;
}

// Mock session storage
const sessions: Map<string, BrowserSession> = new Map();

/**
 * Mock Session Service
 */
class MockSessionService {
  async createSession(options: CreateSessionOptions): Promise<BrowserSession> {
    const sessionId = TestData.generateSessionId();
    const now = new Date().toISOString();
    const ttlMinutes = options.ttlMinutes || 60;

    const session: BrowserSession = {
      id: sessionId,
      type: options.type,
      status: 'active',
      userId: options.userId,
      extensionId: options.extensionId,
      browserInfo: options.browserInfo,
      lastActivity: now,
      createdAt: now,
      expiresAt: new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString(),
      metadata: options.metadata,
      logs: {
        consoleLogCount: 0,
        networkLogCount: 0,
        screenshotCount: 0,
      },
    };

    sessions.set(sessionId, session);
    return session;
  }

  async getSession(sessionId: string): Promise<BrowserSession | null> {
    const session = sessions.get(sessionId);
    if (!session) return null;

    // Check expiration
    if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
      session.status = 'expired';
    }

    return session;
  }

  async updateSession(
    sessionId: string,
    updates: Partial<BrowserSession>
  ): Promise<BrowserSession | null> {
    const session = sessions.get(sessionId);
    if (!session) return null;

    Object.assign(session, updates, { lastActivity: new Date().toISOString() });
    sessions.set(sessionId, session);
    return session;
  }

  async touchSession(sessionId: string): Promise<boolean> {
    const session = sessions.get(sessionId);
    if (!session) return false;

    session.lastActivity = new Date().toISOString();
    session.status = 'active';
    return true;
  }

  async endSession(sessionId: string): Promise<boolean> {
    const session = sessions.get(sessionId);
    if (!session) return false;

    session.status = 'disconnected';
    return true;
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    return sessions.delete(sessionId);
  }

  async getUserSessions(userId: string, options: { activeOnly?: boolean } = {}): Promise<BrowserSession[]> {
    const userSessions: BrowserSession[] = [];
    sessions.forEach(session => {
      if (session.userId === userId) {
        if (!options.activeOnly || session.status === 'active') {
          userSessions.push(session);
        }
      }
    });
    return userSessions;
  }

  async getActiveSessionsCount(): Promise<number> {
    let count = 0;
    sessions.forEach(session => {
      if (session.status === 'active') count++;
    });
    return count;
  }

  async cleanupExpiredSessions(): Promise<number> {
    const now = new Date();
    let cleaned = 0;
    sessions.forEach((session, id) => {
      if (session.expiresAt && new Date(session.expiresAt) < now && session.status === 'active') {
        session.status = 'expired';
        cleaned++;
      }
    });
    return cleaned;
  }
}

const sessionService = new MockSessionService();

// ============================================
// TEST SUITE
// ============================================

describe('Session Service', () => {
  beforeAll(() => {
    initializeTestEnvironment(false);
  });

  afterAll(() => {
    cleanupTestEnvironment();
  });

  beforeEach(() => {
    sessions.clear();
  });

  describe('Session Creation', () => {
    it('should create a browser session', async () => {
      const session = await sessionService.createSession({
        type: 'browser',
        userId: 'test-user-123',
      });

      expect(session.id).toBeDefined();
      expect(session.type).toBe('browser');
      expect(session.status).toBe('active');
      expect(session.userId).toBe('test-user-123');
    }, TestTimeouts.SHORT);

    it('should create session with browser info', async () => {
      const browserInfo = {
        name: 'Chrome',
        version: '120.0.0',
        platform: 'macOS',
        userAgent: 'Mozilla/5.0...',
      };

      const session = await sessionService.createSession({
        type: 'browser',
        browserInfo,
      });

      expect(session.browserInfo).toEqual(browserInfo);
    }, TestTimeouts.SHORT);

    it('should create session with custom TTL', async () => {
      const session = await sessionService.createSession({
        type: 'mcp',
        ttlMinutes: 120,
      });

      const expiresAt = new Date(session.expiresAt!);
      const expectedExpiry = new Date(Date.now() + 120 * 60 * 1000);

      // Allow 1 second tolerance
      expect(Math.abs(expiresAt.getTime() - expectedExpiry.getTime())).toBeLessThan(1000);
    }, TestTimeouts.SHORT);

    it('should create different session types', async () => {
      const types: SessionType[] = ['browser', 'mcp', 'sse', 'websocket', 'api'];

      for (const type of types) {
        const session = await sessionService.createSession({ type });
        expect(session.type).toBe(type);
      }
    }, TestTimeouts.SHORT);

    it('should initialize log counters to zero', async () => {
      const session = await sessionService.createSession({
        type: 'browser',
      });

      expect(session.logs).toEqual({
        consoleLogCount: 0,
        networkLogCount: 0,
        screenshotCount: 0,
      });
    }, TestTimeouts.SHORT);
  });

  describe('Session Retrieval', () => {
    it('should get session by ID', async () => {
      const created = await sessionService.createSession({
        type: 'browser',
        userId: 'test-user',
      });

      const retrieved = await sessionService.getSession(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
    }, TestTimeouts.SHORT);

    it('should return null for non-existent session', async () => {
      const session = await sessionService.getSession('non-existent-id');
      expect(session).toBeNull();
    }, TestTimeouts.SHORT);

    it('should mark expired sessions as expired', async () => {
      // Create session that expires immediately
      const session = await sessionService.createSession({
        type: 'browser',
        ttlMinutes: -1, // Already expired
      });

      // Force expiration
      sessions.get(session.id)!.expiresAt = new Date(Date.now() - 1000).toISOString();

      const retrieved = await sessionService.getSession(session.id);
      expect(retrieved?.status).toBe('expired');
    }, TestTimeouts.SHORT);
  });

  describe('Session Updates', () => {
    it('should update session status', async () => {
      const session = await sessionService.createSession({
        type: 'browser',
      });

      const updated = await sessionService.updateSession(session.id, {
        status: 'idle',
      });

      expect(updated?.status).toBe('idle');
    }, TestTimeouts.SHORT);

    it('should update lastActivity on any update', async () => {
      const session = await sessionService.createSession({
        type: 'browser',
      });

      const originalActivity = session.lastActivity;

      // Wait a bit to ensure time difference
      await new Promise(resolve => setTimeout(resolve, 10));

      const updated = await sessionService.updateSession(session.id, {
        status: 'idle',
      });

      expect(new Date(updated!.lastActivity).getTime())
        .toBeGreaterThan(new Date(originalActivity).getTime());
    }, TestTimeouts.SHORT);

    it('should return null when updating non-existent session', async () => {
      const result = await sessionService.updateSession('non-existent', {
        status: 'idle',
      });

      expect(result).toBeNull();
    }, TestTimeouts.SHORT);
  });

  describe('Touch Session', () => {
    it('should touch session and update lastActivity', async () => {
      const session = await sessionService.createSession({
        type: 'browser',
      });

      const result = await sessionService.touchSession(session.id);

      expect(result).toBe(true);
    }, TestTimeouts.SHORT);

    it('should return false for non-existent session', async () => {
      const result = await sessionService.touchSession('non-existent');
      expect(result).toBe(false);
    }, TestTimeouts.SHORT);

    it('should set status to active when touched', async () => {
      const session = await sessionService.createSession({
        type: 'browser',
      });

      // Set to idle first
      await sessionService.updateSession(session.id, { status: 'idle' });

      await sessionService.touchSession(session.id);

      const retrieved = await sessionService.getSession(session.id);
      expect(retrieved?.status).toBe('active');
    }, TestTimeouts.SHORT);
  });

  describe('End Session', () => {
    it('should end session and set status to disconnected', async () => {
      const session = await sessionService.createSession({
        type: 'browser',
      });

      const result = await sessionService.endSession(session.id);

      expect(result).toBe(true);

      const retrieved = await sessionService.getSession(session.id);
      expect(retrieved?.status).toBe('disconnected');
    }, TestTimeouts.SHORT);

    it('should return false for non-existent session', async () => {
      const result = await sessionService.endSession('non-existent');
      expect(result).toBe(false);
    }, TestTimeouts.SHORT);
  });

  describe('Delete Session', () => {
    it('should delete session', async () => {
      const session = await sessionService.createSession({
        type: 'browser',
      });

      const result = await sessionService.deleteSession(session.id);
      expect(result).toBe(true);

      const retrieved = await sessionService.getSession(session.id);
      expect(retrieved).toBeNull();
    }, TestTimeouts.SHORT);

    it('should return false when deleting non-existent session', async () => {
      const result = await sessionService.deleteSession('non-existent');
      expect(result).toBe(false);
    }, TestTimeouts.SHORT);
  });

  describe('User Sessions', () => {
    it('should get all sessions for a user', async () => {
      const userId = 'test-user-123';

      await sessionService.createSession({ type: 'browser', userId });
      await sessionService.createSession({ type: 'mcp', userId });
      await sessionService.createSession({ type: 'browser', userId: 'other-user' });

      const userSessions = await sessionService.getUserSessions(userId);

      expect(userSessions.length).toBe(2);
      userSessions.forEach(session => {
        expect(session.userId).toBe(userId);
      });
    }, TestTimeouts.SHORT);

    it('should filter to active sessions only', async () => {
      const userId = 'test-user-123';

      const session1 = await sessionService.createSession({ type: 'browser', userId });
      await sessionService.createSession({ type: 'mcp', userId });

      // End one session
      await sessionService.endSession(session1.id);

      const activeSessions = await sessionService.getUserSessions(userId, { activeOnly: true });

      expect(activeSessions.length).toBe(1);
      expect(activeSessions[0].status).toBe('active');
    }, TestTimeouts.SHORT);

    it('should return empty array for user with no sessions', async () => {
      const userSessions = await sessionService.getUserSessions('no-sessions-user');
      expect(userSessions).toEqual([]);
    }, TestTimeouts.SHORT);
  });

  describe('Active Sessions Count', () => {
    it('should count active sessions', async () => {
      await sessionService.createSession({ type: 'browser' });
      await sessionService.createSession({ type: 'mcp' });
      const session3 = await sessionService.createSession({ type: 'api' });

      // End one session
      await sessionService.endSession(session3.id);

      const count = await sessionService.getActiveSessionsCount();
      expect(count).toBe(2);
    }, TestTimeouts.SHORT);

    it('should return zero when no active sessions', async () => {
      const count = await sessionService.getActiveSessionsCount();
      expect(count).toBe(0);
    }, TestTimeouts.SHORT);
  });

  describe('Cleanup Expired Sessions', () => {
    it('should cleanup expired sessions', async () => {
      // Create sessions
      const session1 = await sessionService.createSession({
        type: 'browser',
        ttlMinutes: 60,
      });
      const session2 = await sessionService.createSession({
        type: 'mcp',
        ttlMinutes: 60,
      });

      // Force expiration
      sessions.get(session1.id)!.expiresAt = new Date(Date.now() - 1000).toISOString();
      sessions.get(session2.id)!.expiresAt = new Date(Date.now() - 1000).toISOString();

      const cleaned = await sessionService.cleanupExpiredSessions();

      expect(cleaned).toBe(2);
    }, TestTimeouts.SHORT);

    it('should not cleanup non-expired sessions', async () => {
      await sessionService.createSession({
        type: 'browser',
        ttlMinutes: 60,
      });

      const cleaned = await sessionService.cleanupExpiredSessions();
      expect(cleaned).toBe(0);
    }, TestTimeouts.SHORT);
  });
});
