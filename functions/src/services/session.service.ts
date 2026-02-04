/**
 * Session Management Service
 * Handles browser sessions and connection state using Firestore
 */

import * as admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import { getFirestore, Collections } from '../config/firebase.config.js';

/**
 * Session types
 */
export type SessionType = 'browser' | 'mcp' | 'sse' | 'websocket' | 'api';
export type SessionStatus = 'active' | 'idle' | 'disconnected' | 'expired';

/**
 * Browser session structure
 */
export interface BrowserSession {
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
  connectionInfo?: {
    ipAddress: string;
    origin?: string;
    connectedAt: string;
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

/**
 * Session creation options
 */
export interface CreateSessionOptions {
  type: SessionType;
  userId?: string;
  extensionId?: string;
  browserInfo?: BrowserSession['browserInfo'];
  ipAddress?: string;
  origin?: string;
  ttlMinutes?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Session update options
 */
export interface UpdateSessionOptions {
  status?: SessionStatus;
  metadata?: Record<string, unknown>;
  incrementConsole?: number;
  incrementNetwork?: number;
  incrementScreenshot?: number;
}

/**
 * Session Service Class
 */
export class SessionService {
  private db: admin.firestore.Firestore;

  constructor() {
    this.db = getFirestore();
  }

  /**
   * Create a new session
   */
  async createSession(options: CreateSessionOptions): Promise<BrowserSession> {
    const sessionId = uuidv4();
    const now = new Date().toISOString();
    const ttlMinutes = options.ttlMinutes || 60; // Default 1 hour

    const session: BrowserSession = {
      id: sessionId,
      type: options.type,
      status: 'active',
      userId: options.userId,
      extensionId: options.extensionId,
      browserInfo: options.browserInfo,
      connectionInfo: options.ipAddress
        ? {
            ipAddress: options.ipAddress,
            origin: options.origin,
            connectedAt: now,
          }
        : undefined,
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

    await this.db.collection(Collections.SESSIONS).doc(sessionId).set(session);

    return session;
  }

  /**
   * Get a session by ID
   */
  async getSession(sessionId: string): Promise<BrowserSession | null> {
    const doc = await this.db.collection(Collections.SESSIONS).doc(sessionId).get();

    if (!doc.exists) {
      return null;
    }

    const session = doc.data() as BrowserSession;

    // Check if session has expired
    if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
      await this.updateSession(sessionId, { status: 'expired' });
      return { ...session, status: 'expired' };
    }

    return session;
  }

  /**
   * Update a session
   */
  async updateSession(
    sessionId: string,
    options: UpdateSessionOptions
  ): Promise<BrowserSession | null> {
    const docRef = this.db.collection(Collections.SESSIONS).doc(sessionId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return null;
    }

    const updates: Record<string, unknown> = {
      lastActivity: new Date().toISOString(),
    };

    if (options.status) {
      updates.status = options.status;
    }

    if (options.metadata) {
      updates.metadata = admin.firestore.FieldValue.arrayUnion(options.metadata);
    }

    if (options.incrementConsole) {
      updates['logs.consoleLogCount'] = admin.firestore.FieldValue.increment(
        options.incrementConsole
      );
    }

    if (options.incrementNetwork) {
      updates['logs.networkLogCount'] = admin.firestore.FieldValue.increment(
        options.incrementNetwork
      );
    }

    if (options.incrementScreenshot) {
      updates['logs.screenshotCount'] = admin.firestore.FieldValue.increment(
        options.incrementScreenshot
      );
    }

    await docRef.update(updates);

    const updatedDoc = await docRef.get();
    return updatedDoc.data() as BrowserSession;
  }

  /**
   * Touch session (update last activity)
   */
  async touchSession(sessionId: string): Promise<boolean> {
    try {
      await this.db.collection(Collections.SESSIONS).doc(sessionId).update({
        lastActivity: new Date().toISOString(),
        status: 'active',
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * End a session
   */
  async endSession(sessionId: string): Promise<boolean> {
    try {
      await this.db.collection(Collections.SESSIONS).doc(sessionId).update({
        status: 'disconnected',
        endedAt: new Date().toISOString(),
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      await this.db.collection(Collections.SESSIONS).doc(sessionId).delete();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get sessions for a user
   */
  async getUserSessions(
    userId: string,
    options: { activeOnly?: boolean; limit?: number } = {}
  ): Promise<BrowserSession[]> {
    let query = this.db
      .collection(Collections.SESSIONS)
      .where('userId', '==', userId) as admin.firestore.Query;

    if (options.activeOnly) {
      query = query.where('status', '==', 'active');
    }

    query = query.orderBy('lastActivity', 'desc');

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => doc.data() as BrowserSession);
  }

  /**
   * Get sessions by extension ID
   */
  async getExtensionSessions(
    extensionId: string,
    activeOnly = true
  ): Promise<BrowserSession[]> {
    let query = this.db
      .collection(Collections.SESSIONS)
      .where('extensionId', '==', extensionId) as admin.firestore.Query;

    if (activeOnly) {
      query = query.where('status', '==', 'active');
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => doc.data() as BrowserSession);
  }

  /**
   * Get active sessions count
   */
  async getActiveSessionsCount(): Promise<number> {
    const snapshot = await this.db
      .collection(Collections.SESSIONS)
      .where('status', '==', 'active')
      .count()
      .get();

    return snapshot.data().count;
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    const now = new Date().toISOString();

    const snapshot = await this.db
      .collection(Collections.SESSIONS)
      .where('expiresAt', '<', now)
      .where('status', '==', 'active')
      .limit(500)
      .get();

    if (snapshot.empty) {
      return 0;
    }

    const batch = this.db.batch();
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        status: 'expired',
        cleanedAt: now,
      });
    });

    await batch.commit();
    return snapshot.size;
  }

  /**
   * Get session statistics
   */
  async getSessionStats(): Promise<{
    total: number;
    active: number;
    idle: number;
    expired: number;
    byType: Record<SessionType, number>;
  }> {
    const stats = {
      total: 0,
      active: 0,
      idle: 0,
      expired: 0,
      byType: {} as Record<SessionType, number>,
    };

    const snapshot = await this.db.collection(Collections.SESSIONS).get();

    snapshot.docs.forEach(doc => {
      const session = doc.data() as BrowserSession;
      stats.total++;

      switch (session.status) {
        case 'active':
          stats.active++;
          break;
        case 'idle':
          stats.idle++;
          break;
        case 'expired':
          stats.expired++;
          break;
      }

      stats.byType[session.type] = (stats.byType[session.type] || 0) + 1;
    });

    return stats;
  }
}

// Export singleton instance
export const sessionService = new SessionService();
