/**
 * Firebase Storage Provider
 * Implements IStorageProvider interface for Cloud Storage
 */

import {
  IStorageProvider,
  IUploadResult,
  IFileMetadata,
  IFileList,
  IListOptions,
  IFileInfo
} from '../interfaces';

import { FirebaseApp } from 'firebase/app';
import {
  Storage,
  getStorage,
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  getBlob,
  deleteObject,
  list,
  listAll,
  getMetadata,
  updateMetadata,
  UploadTask,
  StorageReference,
  FullMetadata
} from 'firebase/storage';

export class FirebaseStorageProvider implements IStorageProvider {
  private storage: Storage;

  constructor(app: FirebaseApp) {
    this.storage = getStorage(app);
  }

  /**
   * Upload a file to storage
   */
  async upload(path: string, file: File | Buffer | Blob, metadata?: IFileMetadata): Promise<IUploadResult> {
    try {
      const storageRef = ref(this.storage, path);

      // Convert metadata to Firebase format
      const firebaseMetadata: any = {};
      if (metadata) {
        if (metadata.contentType) firebaseMetadata.contentType = metadata.contentType;
        if (metadata.cacheControl) firebaseMetadata.cacheControl = metadata.cacheControl;
        if (metadata.contentDisposition) firebaseMetadata.contentDisposition = metadata.contentDisposition;
        if (metadata.contentEncoding) firebaseMetadata.contentEncoding = metadata.contentEncoding;
        if (metadata.customMetadata) firebaseMetadata.customMetadata = metadata.customMetadata;
      }

      // Handle different file types
      let uploadData: Blob | Uint8Array;
      if (file instanceof File || file instanceof Blob) {
        uploadData = file;
      } else if (Buffer.isBuffer(file)) {
        uploadData = new Uint8Array(file);
      } else {
        throw new Error('Invalid file type');
      }

      // Upload file
      const snapshot = await uploadBytes(storageRef, uploadData, firebaseMetadata);

      // Get download URL
      const url = await getDownloadURL(snapshot.ref);

      // Get metadata
      const fullMetadata = await getMetadata(snapshot.ref);

      return {
        path: snapshot.ref.fullPath,
        url,
        size: fullMetadata.size,
        contentType: fullMetadata.contentType || 'application/octet-stream',
        etag: fullMetadata.md5Hash,
        versionId: fullMetadata.generation
      };
    } catch (error: any) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  /**
   * Download a file from storage
   */
  async download(path: string): Promise<Blob> {
    try {
      const storageRef = ref(this.storage, path);
      return await getBlob(storageRef);
    } catch (error: any) {
      throw new Error(`Failed to download file: ${error.message}`);
    }
  }

  /**
   * Delete a file from storage
   */
  async delete(path: string): Promise<void> {
    try {
      const storageRef = ref(this.storage, path);
      await deleteObject(storageRef);
    } catch (error: any) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * Move a file to a new location
   */
  async move(sourcePath: string, destinationPath: string): Promise<void> {
    try {
      // Download file
      const blob = await this.download(sourcePath);
      const metadata = await this.getMetadata(sourcePath);

      // Upload to new location
      await this.upload(destinationPath, blob, metadata);

      // Delete original
      await this.delete(sourcePath);
    } catch (error: any) {
      throw new Error(`Failed to move file: ${error.message}`);
    }
  }

  /**
   * Copy a file to a new location
   */
  async copy(sourcePath: string, destinationPath: string): Promise<void> {
    try {
      // Download file
      const blob = await this.download(sourcePath);
      const metadata = await this.getMetadata(sourcePath);

      // Upload to new location
      await this.upload(destinationPath, blob, metadata);
    } catch (error: any) {
      throw new Error(`Failed to copy file: ${error.message}`);
    }
  }

  /**
   * Get a signed URL for temporary access
   */
  async getSignedUrl(path: string, expires?: number): Promise<string> {
    try {
      const storageRef = ref(this.storage, path);

      // Firebase Storage doesn't have built-in signed URLs like GCS
      // Instead, we use download URLs which are permanent but secure
      const url = await getDownloadURL(storageRef);

      // If expires is needed, you would need to use Firebase Admin SDK
      // and Google Cloud Storage directly for true signed URLs
      if (expires) {
        console.warn('Firebase Storage download URLs do not expire. Use Admin SDK for signed URLs.');
      }

      return url;
    } catch (error: any) {
      throw new Error(`Failed to get signed URL: ${error.message}`);
    }
  }

  /**
   * Get public URL for a file
   */
  getPublicUrl(path: string): string {
    // Construct the public URL format
    const bucket = this.storage.app.options.storageBucket;
    const encodedPath = encodeURIComponent(path);
    return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodedPath}?alt=media`;
  }

  /**
   * List files in a directory
   */
  async listFiles(prefix: string, options?: IListOptions): Promise<IFileList> {
    try {
      const storageRef = ref(this.storage, prefix);

      // Use list or listAll based on options
      const result = options?.maxResults
        ? await list(storageRef, {
            maxResults: options.maxResults,
            pageToken: options.pageToken
          })
        : await listAll(storageRef);

      // Process files
      const files: IFileInfo[] = [];
      for (const item of result.items) {
        if (options?.includeMetadata) {
          const metadata = await getMetadata(item);
          files.push({
            path: item.fullPath,
            size: metadata.size,
            contentType: metadata.contentType || 'application/octet-stream',
            createdAt: new Date(metadata.timeCreated),
            updatedAt: new Date(metadata.updated),
            metadata: this.mapFirebaseMetadata(metadata)
          });
        } else {
          // Basic info without additional metadata fetch
          files.push({
            path: item.fullPath,
            size: 0, // Size requires metadata fetch
            contentType: 'application/octet-stream',
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }

      // Process folders (prefixes)
      const folders = result.prefixes.map(prefix => prefix.fullPath);

      return {
        files,
        folders,
        nextPageToken: 'nextPageToken' in result ? result.nextPageToken : undefined
      };
    } catch (error: any) {
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }

  /**
   * Create a folder (not directly supported in Firebase Storage)
   */
  async createFolder(path: string): Promise<void> {
    // Firebase Storage doesn't have real folders
    // Folders are created automatically when files are uploaded
    // Create a placeholder file to establish the folder
    const placeholderPath = `${path}/.placeholder`;
    const placeholderContent = new Blob([''], { type: 'text/plain' });

    try {
      await this.upload(placeholderPath, placeholderContent, {
        size: 0,
        contentType: 'text/plain',
        createdAt: new Date(),
        updatedAt: new Date(),
        customMetadata: { placeholder: 'true' }
      });
    } catch (error: any) {
      throw new Error(`Failed to create folder: ${error.message}`);
    }
  }

  /**
   * Delete a folder and all its contents
   */
  async deleteFolder(path: string): Promise<void> {
    try {
      const storageRef = ref(this.storage, path);
      const result = await listAll(storageRef);

      // Delete all files
      const deletePromises: Promise<void>[] = [];

      for (const item of result.items) {
        deletePromises.push(deleteObject(item));
      }

      // Recursively delete subfolders
      for (const prefix of result.prefixes) {
        deletePromises.push(this.deleteFolder(prefix.fullPath));
      }

      await Promise.all(deletePromises);
    } catch (error: any) {
      throw new Error(`Failed to delete folder: ${error.message}`);
    }
  }

  /**
   * Get file metadata
   */
  async getMetadata(path: string): Promise<IFileMetadata> {
    try {
      const storageRef = ref(this.storage, path);
      const metadata = await getMetadata(storageRef);

      return this.mapFirebaseMetadata(metadata);
    } catch (error: any) {
      throw new Error(`Failed to get metadata: ${error.message}`);
    }
  }

  /**
   * Update file metadata
   */
  async updateMetadata(path: string, metadata: Partial<IFileMetadata>): Promise<void> {
    try {
      const storageRef = ref(this.storage, path);

      const firebaseMetadata: any = {};
      if (metadata.contentType !== undefined) firebaseMetadata.contentType = metadata.contentType;
      if (metadata.cacheControl !== undefined) firebaseMetadata.cacheControl = metadata.cacheControl;
      if (metadata.contentDisposition !== undefined) firebaseMetadata.contentDisposition = metadata.contentDisposition;
      if (metadata.contentEncoding !== undefined) firebaseMetadata.contentEncoding = metadata.contentEncoding;
      if (metadata.customMetadata !== undefined) firebaseMetadata.customMetadata = metadata.customMetadata;

      await updateMetadata(storageRef, firebaseMetadata);
    } catch (error: any) {
      throw new Error(`Failed to update metadata: ${error.message}`);
    }
  }

  /**
   * Batch upload multiple files
   */
  async batchUpload(files: { path: string; file: File | Buffer }[]): Promise<IUploadResult[]> {
    try {
      const uploadPromises = files.map(({ path, file }) => this.upload(path, file));
      return await Promise.all(uploadPromises);
    } catch (error: any) {
      throw new Error(`Failed to batch upload files: ${error.message}`);
    }
  }

  /**
   * Batch delete multiple files
   */
  async batchDelete(paths: string[]): Promise<void> {
    try {
      const deletePromises = paths.map(path => this.delete(path));
      await Promise.all(deletePromises);
    } catch (error: any) {
      throw new Error(`Failed to batch delete files: ${error.message}`);
    }
  }

  /**
   * Upload with progress tracking
   */
  uploadWithProgress(
    path: string,
    file: File | Blob,
    metadata?: IFileMetadata,
    onProgress?: (progress: number) => void
  ): UploadTask {
    const storageRef = ref(this.storage, path);

    // Convert metadata
    const firebaseMetadata: any = {};
    if (metadata) {
      if (metadata.contentType) firebaseMetadata.contentType = metadata.contentType;
      if (metadata.cacheControl) firebaseMetadata.cacheControl = metadata.cacheControl;
      if (metadata.customMetadata) firebaseMetadata.customMetadata = metadata.customMetadata;
    }

    // Create upload task
    const uploadTask = uploadBytesResumable(storageRef, file, firebaseMetadata);

    // Track progress
    if (onProgress) {
      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress(progress);
        },
        (error) => {
          console.error('Upload error:', error);
        }
      );
    }

    return uploadTask;
  }

  // Helper methods

  private mapFirebaseMetadata(metadata: FullMetadata): IFileMetadata {
    return {
      size: metadata.size,
      contentType: metadata.contentType || 'application/octet-stream',
      createdAt: new Date(metadata.timeCreated),
      updatedAt: new Date(metadata.updated),
      customMetadata: metadata.customMetadata,
      cacheControl: metadata.cacheControl,
      contentDisposition: metadata.contentDisposition,
      contentEncoding: metadata.contentEncoding
    };
  }

  /**
   * Generate a unique storage path
   */
  generateStoragePath(prefix: string, filename: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = filename.split('.').pop();
    return `${prefix}/${timestamp}_${random}.${extension}`;
  }

  /**
   * Validate file before upload
   */
  validateFile(file: File | Blob, options?: {
    maxSize?: number;
    allowedTypes?: string[];
  }): { valid: boolean; error?: string } {
    // Check file size
    if (options?.maxSize && file.size > options.maxSize) {
      return {
        valid: false,
        error: `File size exceeds maximum of ${options.maxSize} bytes`
      };
    }

    // Check file type
    if (options?.allowedTypes && !options.allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type ${file.type} is not allowed`
      };
    }

    return { valid: true };
  }

  /**
   * Get storage bucket URL
   */
  getBucketUrl(): string {
    return `gs://${this.storage.app.options.storageBucket}`;
  }

  /**
   * Check if file exists
   */
  async exists(path: string): Promise<boolean> {
    try {
      const storageRef = ref(this.storage, path);
      await getMetadata(storageRef);
      return true;
    } catch (error: any) {
      if (error.code === 'storage/object-not-found') {
        return false;
      }
      throw error;
    }
  }
}