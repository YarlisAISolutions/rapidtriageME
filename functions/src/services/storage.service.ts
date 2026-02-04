/**
 * Firebase Storage Service
 * Handles file storage operations (replaces Cloudflare R2)
 */

import * as admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import { getFirestore, getStorageBucket, Collections, StoragePaths } from '../config/firebase.config.js';

/**
 * File metadata structure
 */
export interface FileMetadata {
  id: string;
  path: string;
  bucket: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  uploadedBy?: string;
  expiresAt?: string;
  metadata?: Record<string, string>;
  isPublic: boolean;
  url?: string;
}

/**
 * Upload options
 */
export interface UploadOptions {
  path?: string;
  fileName?: string;
  mimeType?: string;
  metadata?: Record<string, string>;
  isPublic?: boolean;
  expiresIn?: number; // Hours until expiration
  userId?: string;
}

/**
 * Signed URL options
 */
export interface SignedUrlOptions {
  action: 'read' | 'write';
  expires: number; // Milliseconds from now
  contentType?: string;
}

/**
 * Storage Service Class
 */
export class StorageService {
  private storage: admin.storage.Storage;
  private db: admin.firestore.Firestore;
  private bucket: ReturnType<admin.storage.Storage['bucket']>;
  private bucketName: string;

  constructor() {
    this.storage = getStorageBucket();
    this.db = getFirestore();
    this.bucketName = 'rapidtriage-me.firebasestorage.app';
    this.bucket = this.storage.bucket(this.bucketName);
  }

  /**
   * Upload a file from buffer or base64
   */
  async uploadFile(
    data: Buffer | string,
    options: UploadOptions = {}
  ): Promise<FileMetadata> {
    const fileId = uuidv4();
    const fileName = options.fileName || `${fileId}`;
    const basePath = options.path || StoragePaths.SCREENSHOTS;
    const fullPath = `${basePath}/${fileName}`;

    // Convert base64 to buffer if needed
    const buffer = typeof data === 'string'
      ? Buffer.from(data, 'base64')
      : data;

    const mimeType = options.mimeType || 'application/octet-stream';

    // Upload to Firebase Storage
    const file = this.bucket.file(fullPath);
    await file.save(buffer, {
      metadata: {
        contentType: mimeType,
        metadata: {
          ...options.metadata,
          uploadedBy: options.userId || 'anonymous',
          fileId,
        },
      },
      public: options.isPublic || false,
    });

    // Get public URL if file is public
    let url: string | undefined;
    if (options.isPublic) {
      url = `https://storage.googleapis.com/${this.bucketName}/${fullPath}`;
    }

    // Create metadata record
    const fileMetadata: FileMetadata = {
      id: fileId,
      path: fullPath,
      bucket: this.bucketName,
      originalName: options.fileName || fileId,
      mimeType,
      size: buffer.length,
      uploadedAt: new Date().toISOString(),
      uploadedBy: options.userId,
      expiresAt: options.expiresIn
        ? new Date(Date.now() + options.expiresIn * 60 * 60 * 1000).toISOString()
        : undefined,
      metadata: options.metadata,
      isPublic: options.isPublic || false,
      url,
    };

    // Store metadata in Firestore
    await this.db.collection(Collections.SCREENSHOTS).doc(fileId).set(fileMetadata);

    return fileMetadata;
  }

  /**
   * Download a file
   */
  async downloadFile(path: string): Promise<Buffer | null> {
    try {
      const file = this.bucket.file(path);
      const [exists] = await file.exists();

      if (!exists) {
        return null;
      }

      const [buffer] = await file.download();
      return buffer;
    } catch (error) {
      console.error('Download file error:', error);
      return null;
    }
  }

  /**
   * Delete a file
   */
  async deleteFile(path: string): Promise<boolean> {
    try {
      const file = this.bucket.file(path);
      await file.delete();

      // Also delete metadata from Firestore
      const snapshot = await this.db
        .collection(Collections.SCREENSHOTS)
        .where('path', '==', path)
        .limit(1)
        .get();

      if (!snapshot.empty) {
        await snapshot.docs[0].ref.delete();
      }

      return true;
    } catch (error) {
      console.error('Delete file error:', error);
      return false;
    }
  }

  /**
   * Generate a signed URL for temporary access
   */
  async getSignedUrl(
    path: string,
    options: SignedUrlOptions = { action: 'read', expires: 3600000 }
  ): Promise<string> {
    const file = this.bucket.file(path);

    const [url] = await file.getSignedUrl({
      action: options.action,
      expires: Date.now() + options.expires,
      contentType: options.contentType,
    });

    return url;
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(fileId: string): Promise<FileMetadata | null> {
    const doc = await this.db.collection(Collections.SCREENSHOTS).doc(fileId).get();

    if (!doc.exists) {
      return null;
    }

    return doc.data() as FileMetadata;
  }

  /**
   * List files in a path
   */
  async listFiles(
    path: string = StoragePaths.SCREENSHOTS,
    options: { limit?: number; pageToken?: string } = {}
  ): Promise<{ files: FileMetadata[]; nextPageToken?: string }> {
    const [files, , apiResponse] = await this.bucket.getFiles({
      prefix: path,
      maxResults: options.limit || 100,
      pageToken: options.pageToken,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const metadata = apiResponse as any;

    const fileMetadataList: FileMetadata[] = [];

    for (const file of files) {
      const [fileMetadata] = await file.getMetadata();
      fileMetadataList.push({
        id: String(fileMetadata.metadata?.fileId || file.name),
        path: file.name,
        bucket: this.bucketName,
        originalName: file.name.split('/').pop() || file.name,
        mimeType: fileMetadata.contentType || 'application/octet-stream',
        size: parseInt(String(fileMetadata.size || '0'), 10),
        uploadedAt: fileMetadata.timeCreated || new Date().toISOString(),
        uploadedBy: String(fileMetadata.metadata?.uploadedBy || ''),
        metadata: fileMetadata.metadata as Record<string, string> | undefined,
        isPublic: false,
      });
    }

    return {
      files: fileMetadataList,
      nextPageToken: metadata?.pageToken,
    };
  }

  /**
   * Copy a file to a new location
   */
  async copyFile(sourcePath: string, destPath: string): Promise<boolean> {
    try {
      const sourceFile = this.bucket.file(sourcePath);
      const destFile = this.bucket.file(destPath);
      await sourceFile.copy(destFile);
      return true;
    } catch (error) {
      console.error('Copy file error:', error);
      return false;
    }
  }

  /**
   * Move a file to a new location
   */
  async moveFile(sourcePath: string, destPath: string): Promise<boolean> {
    try {
      await this.copyFile(sourcePath, destPath);
      await this.deleteFile(sourcePath);
      return true;
    } catch (error) {
      console.error('Move file error:', error);
      return false;
    }
  }

  /**
   * Check if a file exists
   */
  async fileExists(path: string): Promise<boolean> {
    try {
      const file = this.bucket.file(path);
      const [exists] = await file.exists();
      return exists;
    } catch {
      return false;
    }
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats(userId?: string): Promise<{
    totalFiles: number;
    totalSize: number;
    byMimeType: Record<string, { count: number; size: number }>;
  }> {
    let query = this.db.collection(Collections.SCREENSHOTS) as admin.firestore.Query;

    if (userId) {
      query = query.where('uploadedBy', '==', userId);
    }

    const snapshot = await query.get();

    const stats = {
      totalFiles: 0,
      totalSize: 0,
      byMimeType: {} as Record<string, { count: number; size: number }>,
    };

    snapshot.docs.forEach(doc => {
      const data = doc.data() as FileMetadata;
      stats.totalFiles++;
      stats.totalSize += data.size;

      if (!stats.byMimeType[data.mimeType]) {
        stats.byMimeType[data.mimeType] = { count: 0, size: 0 };
      }
      stats.byMimeType[data.mimeType].count++;
      stats.byMimeType[data.mimeType].size += data.size;
    });

    return stats;
  }
}

// Export singleton instance
export const storageService = new StorageService();
