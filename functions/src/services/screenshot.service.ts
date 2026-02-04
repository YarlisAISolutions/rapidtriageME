/**
 * Screenshot Storage Service
 * Handles screenshot capture, storage, and retrieval using Firebase Storage
 */

import * as admin from 'firebase-admin';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { getFirestore, Collections, StoragePaths } from '../config/firebase.config.js';
import { storageService, FileMetadata } from './storage.service.js';
import { sessionService } from './session.service.js';

/**
 * Tenant types for organization
 */
export type TenantType = 'enterprise' | 'team' | 'user' | 'public' | 'test';
export type Environment = 'production' | 'staging' | 'development' | 'test';

/**
 * Screenshot metadata structure
 */
export interface ScreenshotMetadata extends FileMetadata {
  pageUrl: string;
  pageTitle: string;
  viewport?: {
    width: number;
    height: number;
  };
  tenant: {
    type: TenantType;
    identifier: string;
    plan?: string;
  };
  project?: string;
  session?: {
    id: string;
    type: string;
  };
  environment?: Environment;
  tags?: string[];
  analytics?: {
    views: number;
    downloads: number;
    lastAccessed?: string;
  };
}

/**
 * Screenshot upload request
 */
export interface ScreenshotUploadRequest {
  data: string; // Base64 encoded image
  url: string;
  title: string;
  userId?: string;
  sessionId?: string;
  tenant?: {
    type?: TenantType;
    identifier?: string;
    plan?: string;
  };
  project?: string;
  tags?: string[];
  viewport?: {
    width: number;
    height: number;
  };
}

/**
 * Screenshot list request
 */
export interface ScreenshotListRequest {
  userId?: string;
  sessionId?: string;
  project?: string;
  tenant?: string;
  from?: string;
  to?: string;
  limit?: number;
  cursor?: string;
}

/**
 * Screenshot response
 */
export interface ScreenshotResponse {
  id: string;
  url: string;
  signedUrl?: string;
  expires: string;
  metadata: ScreenshotMetadata;
}

/**
 * Screenshot Service Class
 */
export class ScreenshotService {
  private db: admin.firestore.Firestore;

  constructor() {
    this.db = getFirestore();
  }

  /**
   * Generate file ID from content hash (for deduplication)
   */
  private generateFileId(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex').substring(0, 16);
  }

  /**
   * Detect environment from hostname
   */
  private detectEnvironment(hostname: string): Environment {
    if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
      return 'development';
    }
    if (hostname.includes('staging') || hostname.includes('stage')) {
      return 'staging';
    }
    if (hostname.includes('test')) {
      return 'test';
    }
    return 'production';
  }

  /**
   * Get retention days based on tenant type
   */
  private getRetentionDays(tenantType: TenantType): number {
    const retentionMap: Record<TenantType, number> = {
      enterprise: 365,
      team: 90,
      user: 30,
      public: 7,
      test: 1,
    };
    return retentionMap[tenantType] || 7;
  }

  /**
   * Store a screenshot
   */
  async storeScreenshot(request: ScreenshotUploadRequest): Promise<ScreenshotResponse> {
    // Decode base64 data
    const buffer = Buffer.from(request.data, 'base64');
    const fileId = this.generateFileId(buffer);

    // Check for duplicate
    const existingDoc = await this.db.collection(Collections.SCREENSHOTS).doc(fileId).get();
    if (existingDoc.exists) {
      const existing = existingDoc.data() as ScreenshotMetadata;
      return this.buildResponse(existing);
    }

    // Parse URL for metadata
    let hostname = 'unknown';
    try {
      const url = new URL(request.url);
      hostname = url.hostname;
    } catch {
      // Invalid URL, use default
    }

    // Determine tenant info
    const tenant = {
      type: request.tenant?.type || 'public' as TenantType,
      identifier: request.tenant?.identifier || 'anonymous',
      plan: request.tenant?.plan,
    };

    // Build storage path
    const timestamp = new Date();
    const datePath = `${timestamp.getFullYear()}/${(timestamp.getMonth() + 1)
      .toString()
      .padStart(2, '0')}/${timestamp.getDate().toString().padStart(2, '0')}`;
    const storagePath = `${StoragePaths.SCREENSHOTS}/${tenant.type}/${tenant.identifier}/${datePath}`;
    const fileName = `${fileId}.png`;

    // Calculate expiration
    const retentionDays = this.getRetentionDays(tenant.type);
    const expiresAt = new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000).toISOString();

    // Upload to storage
    const fileMetadata = await storageService.uploadFile(buffer, {
      path: storagePath,
      fileName,
      mimeType: 'image/png',
      userId: request.userId,
      expiresIn: retentionDays * 24,
      metadata: {
        pageUrl: request.url,
        pageTitle: request.title,
        tenantType: tenant.type,
        tenantId: tenant.identifier,
        project: request.project || '',
        sessionId: request.sessionId || '',
      },
    });

    // Create screenshot metadata
    const screenshotMetadata: ScreenshotMetadata = {
      ...fileMetadata,
      pageUrl: request.url,
      pageTitle: request.title,
      viewport: request.viewport,
      tenant,
      project: request.project,
      session: request.sessionId
        ? { id: request.sessionId, type: 'browser' }
        : undefined,
      environment: this.detectEnvironment(hostname),
      tags: request.tags,
      expiresAt,
      analytics: {
        views: 0,
        downloads: 0,
      },
    };

    // Store metadata in Firestore
    await this.db.collection(Collections.SCREENSHOTS).doc(fileId).set(screenshotMetadata);

    // Update session screenshot count if applicable
    if (request.sessionId) {
      await sessionService.updateSession(request.sessionId, {
        incrementScreenshot: 1,
      });
    }

    // Update user screenshot count
    if (request.userId) {
      await this.db.collection(Collections.USERS).doc(request.userId).update({
        screenshotCount: admin.firestore.FieldValue.increment(1),
      });
    }

    return this.buildResponse(screenshotMetadata);
  }

  /**
   * Get a screenshot by ID
   */
  async getScreenshot(id: string): Promise<ScreenshotResponse | null> {
    const doc = await this.db.collection(Collections.SCREENSHOTS).doc(id).get();

    if (!doc.exists) {
      return null;
    }

    const metadata = doc.data() as ScreenshotMetadata;

    // Update analytics
    await doc.ref.update({
      'analytics.views': admin.firestore.FieldValue.increment(1),
      'analytics.lastAccessed': new Date().toISOString(),
    });

    return this.buildResponse(metadata);
  }

  /**
   * List screenshots with filtering
   */
  async listScreenshots(
    request: ScreenshotListRequest
  ): Promise<{ screenshots: ScreenshotResponse[]; hasMore: boolean; cursor?: string }> {
    let query = this.db.collection(Collections.SCREENSHOTS) as admin.firestore.Query;

    // Apply filters
    if (request.userId) {
      query = query.where('uploadedBy', '==', request.userId);
    }

    if (request.sessionId) {
      query = query.where('session.id', '==', request.sessionId);
    }

    if (request.project) {
      query = query.where('project', '==', request.project);
    }

    if (request.tenant) {
      query = query.where('tenant.identifier', '==', request.tenant);
    }

    if (request.from) {
      query = query.where('uploadedAt', '>=', request.from);
    }

    if (request.to) {
      query = query.where('uploadedAt', '<=', request.to);
    }

    // Order and limit
    query = query.orderBy('uploadedAt', 'desc');

    const limit = Math.min(request.limit || 20, 100);
    query = query.limit(limit + 1); // Get one extra to check hasMore

    // Apply cursor if provided
    if (request.cursor) {
      const cursorDoc = await this.db.collection(Collections.SCREENSHOTS).doc(request.cursor).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    const snapshot = await query.get();
    const docs = snapshot.docs.slice(0, limit);
    const hasMore = snapshot.docs.length > limit;

    const screenshots = await Promise.all(
      docs.map(doc => this.buildResponse(doc.data() as ScreenshotMetadata))
    );

    return {
      screenshots,
      hasMore,
      cursor: hasMore ? docs[docs.length - 1].id : undefined,
    };
  }

  /**
   * Delete a screenshot
   */
  async deleteScreenshot(id: string, userId?: string): Promise<boolean> {
    const doc = await this.db.collection(Collections.SCREENSHOTS).doc(id).get();

    if (!doc.exists) {
      return false;
    }

    const metadata = doc.data() as ScreenshotMetadata;

    // Verify ownership if userId provided
    if (userId && metadata.uploadedBy !== userId) {
      throw new Error('Unauthorized to delete this screenshot');
    }

    // Delete from storage
    await storageService.deleteFile(metadata.path);

    // Delete from Firestore
    await doc.ref.delete();

    // Update user screenshot count
    if (metadata.uploadedBy) {
      await this.db.collection(Collections.USERS).doc(metadata.uploadedBy).update({
        screenshotCount: admin.firestore.FieldValue.increment(-1),
      });
    }

    return true;
  }

  /**
   * Clean up expired screenshots
   */
  async cleanupExpiredScreenshots(): Promise<number> {
    const now = new Date().toISOString();

    const snapshot = await this.db
      .collection(Collections.SCREENSHOTS)
      .where('expiresAt', '<', now)
      .limit(100)
      .get();

    if (snapshot.empty) {
      return 0;
    }

    let deletedCount = 0;

    for (const doc of snapshot.docs) {
      try {
        const metadata = doc.data() as ScreenshotMetadata;
        await storageService.deleteFile(metadata.path);
        await doc.ref.delete();
        deletedCount++;
      } catch (error) {
        console.error(`Failed to delete screenshot ${doc.id}:`, error);
      }
    }

    return deletedCount;
  }

  /**
   * Build response object
   */
  private async buildResponse(metadata: ScreenshotMetadata): Promise<ScreenshotResponse> {
    let signedUrl: string | undefined;

    try {
      signedUrl = await storageService.getSignedUrl(metadata.path, {
        action: 'read',
        expires: 3600000, // 1 hour
      });
    } catch (error) {
      console.error('Failed to generate signed URL:', error);
    }

    return {
      id: metadata.id,
      url: metadata.url || `https://storage.googleapis.com/${metadata.bucket}/${metadata.path}`,
      signedUrl,
      expires: new Date(Date.now() + 3600000).toISOString(),
      metadata,
    };
  }
}

// Export singleton instance
export const screenshotService = new ScreenshotService();
