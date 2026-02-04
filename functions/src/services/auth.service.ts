/**
 * Authentication Service for Firebase Functions
 * Handles user authentication, token generation, and session management
 */

import * as admin from 'firebase-admin';
import * as jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getFirestore, getAuth, Collections } from '../config/firebase.config.js';
import { getSecretValues } from '../config/secrets.js';
import { ApiKey } from '../middleware/auth.middleware.js';

/**
 * User profile structure
 */
export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: string;
  lastLoginAt: string;
  plan: 'free' | 'user' | 'team' | 'enterprise';
  apiKeyCount: number;
  screenshotCount: number;
  settings: UserSettings;
}

/**
 * User settings
 */
export interface UserSettings {
  notifications: boolean;
  darkMode: boolean;
  timezone: string;
  defaultProject?: string;
}

/**
 * API Key creation request
 */
export interface CreateApiKeyRequest {
  userId: string;
  name: string;
  permissions?: string[];
  expiresIn?: number; // Days until expiration
  rateLimit?: number;
  ipWhitelist?: string[];
}

/**
 * JWT payload structure
 */
export interface JwtPayload {
  sub: string;
  email?: string;
  iat: number;
  exp: number;
  type: 'access' | 'refresh';
}

/**
 * Authentication Service Class
 */
export class AuthService {
  private db: admin.firestore.Firestore;
  private auth: admin.auth.Auth;

  constructor() {
    this.db = getFirestore();
    this.auth = getAuth();
  }

  /**
   * Generate JWT token for a user
   */
  generateToken(userId: string, email?: string, expiresIn = '24h'): string {
    const secrets = getSecretValues();

    if (!secrets.jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const payload: Partial<JwtPayload> = {
      sub: userId,
      email,
      type: 'access',
    };

    return jwt.sign(payload, secrets.jwtSecret, {
      expiresIn: expiresIn as jwt.SignOptions['expiresIn'],
      issuer: 'rapidtriage.me',
      audience: 'rapidtriage-api',
    });
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(userId: string): string {
    const secrets = getSecretValues();

    if (!secrets.jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const payload: Partial<JwtPayload> = {
      sub: userId,
      type: 'refresh',
    };

    return jwt.sign(payload, secrets.jwtSecret, {
      expiresIn: '30d',
      issuer: 'rapidtriage.me',
      audience: 'rapidtriage-refresh',
    });
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): JwtPayload | null {
    try {
      const secrets = getSecretValues();

      if (!secrets.jwtSecret) {
        return null;
      }

      return jwt.verify(token, secrets.jwtSecret) as JwtPayload;
    } catch {
      return null;
    }
  }

  /**
   * Create a new API key for a user
   */
  async createApiKey(request: CreateApiKeyRequest): Promise<ApiKey> {
    // Generate unique API key with rtm_ prefix
    const keyValue = `rtm_${uuidv4().replace(/-/g, '')}`;
    const keyId = uuidv4();

    const apiKey: ApiKey = {
      id: keyId,
      userId: request.userId,
      name: request.name,
      key: keyValue,
      prefix: keyValue.substring(0, 12) + '...',
      createdAt: new Date().toISOString(),
      lastUsedAt: null,
      expiresAt: request.expiresIn
        ? new Date(Date.now() + request.expiresIn * 24 * 60 * 60 * 1000).toISOString()
        : null,
      requestCount: 0,
      rateLimit: request.rateLimit || 1000,
      permissions: request.permissions || ['read', 'write'],
      ipWhitelist: request.ipWhitelist || [],
      isActive: true,
    };

    // Store in Firestore
    await this.db.collection(Collections.API_KEYS).doc(keyId).set(apiKey);

    // Update user's API key count
    await this.db.collection(Collections.USERS).doc(request.userId).update({
      apiKeyCount: admin.firestore.FieldValue.increment(1),
    });

    return apiKey;
  }

  /**
   * Revoke an API key
   */
  async revokeApiKey(keyId: string, userId: string): Promise<boolean> {
    const docRef = this.db.collection(Collections.API_KEYS).doc(keyId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return false;
    }

    const apiKey = doc.data() as ApiKey;

    // Verify ownership
    if (apiKey.userId !== userId) {
      throw new Error('Unauthorized to revoke this API key');
    }

    // Mark as inactive
    await docRef.update({
      isActive: false,
      revokedAt: new Date().toISOString(),
    });

    // Update user's API key count
    await this.db.collection(Collections.USERS).doc(userId).update({
      apiKeyCount: admin.firestore.FieldValue.increment(-1),
    });

    return true;
  }

  /**
   * Get all API keys for a user
   */
  async getUserApiKeys(userId: string): Promise<ApiKey[]> {
    const snapshot = await this.db
      .collection(Collections.API_KEYS)
      .where('userId', '==', userId)
      .where('isActive', '==', true)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      ...doc.data(),
      // Mask the full key value
      key: doc.data().prefix,
    })) as ApiKey[];
  }

  /**
   * Get or create user profile
   */
  async getOrCreateUser(uid: string, email: string, displayName?: string): Promise<UserProfile> {
    const docRef = this.db.collection(Collections.USERS).doc(uid);
    const doc = await docRef.get();

    if (doc.exists) {
      // Update last login
      await docRef.update({
        lastLoginAt: new Date().toISOString(),
      });
      return doc.data() as UserProfile;
    }

    // Create new user profile
    const userProfile: UserProfile = {
      uid,
      email,
      displayName,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      plan: 'free',
      apiKeyCount: 0,
      screenshotCount: 0,
      settings: {
        notifications: true,
        darkMode: false,
        timezone: 'UTC',
      },
    };

    await docRef.set(userProfile);
    return userProfile;
  }

  /**
   * Update user profile
   */
  async updateUser(uid: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const docRef = this.db.collection(Collections.USERS).doc(uid);

    // Remove fields that shouldn't be updated directly
    const { uid: _uid, createdAt: _created, ...safeUpdates } = updates;

    await docRef.update(safeUpdates);

    const doc = await docRef.get();
    return doc.data() as UserProfile;
  }

  /**
   * Delete user and all associated data
   */
  async deleteUser(uid: string): Promise<void> {
    const batch = this.db.batch();

    // Delete API keys
    const apiKeysSnapshot = await this.db
      .collection(Collections.API_KEYS)
      .where('userId', '==', uid)
      .get();

    apiKeysSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Delete sessions
    const sessionsSnapshot = await this.db
      .collection(Collections.SESSIONS)
      .where('userId', '==', uid)
      .get();

    sessionsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Delete user profile
    batch.delete(this.db.collection(Collections.USERS).doc(uid));

    await batch.commit();

    // Delete from Firebase Auth
    try {
      await this.auth.deleteUser(uid);
    } catch (error) {
      console.error('Failed to delete user from Firebase Auth:', error);
    }
  }

  /**
   * Create custom Firebase token for external auth providers
   */
  async createCustomToken(uid: string, claims?: Record<string, unknown>): Promise<string> {
    return this.auth.createCustomToken(uid, claims);
  }

  /**
   * Verify Firebase ID token
   */
  async verifyIdToken(token: string): Promise<admin.auth.DecodedIdToken | null> {
    try {
      return await this.auth.verifyIdToken(token);
    } catch {
      return null;
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
