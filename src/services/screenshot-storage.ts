/**
 * Screenshot Storage Service
 * Handles storage, retrieval, and management of screenshots in R2
 */

import { 
  ScreenshotMetadata, 
  ScreenshotUploadRequest, 
  ScreenshotListRequest,
  ScreenshotListResponse,
  ScreenshotResponse,
  StorageConfig,
  TenantInfo,
  ProjectInfo,
  SessionInfo
} from '../types/storage';
import { StoragePathBuilder } from '../utils/storage-path';

export class ScreenshotStorageService {
  constructor(
    private r2: R2Bucket,
    private kv: KVNamespace
  ) {}

  /**
   * Store a screenshot with metadata
   */
  async storeScreenshot(request: ScreenshotUploadRequest): Promise<ScreenshotResponse> {
    // Convert base64 to ArrayBuffer
    const imageBuffer = StoragePathBuilder.base64ToArrayBuffer(request.data);
    
    // Generate unique ID from content hash
    const fileId = await StoragePathBuilder.generateFileId(imageBuffer);
    
    // Build storage configuration
    const config = this.buildStorageConfig(request);
    
    // Generate storage path
    const path = StoragePathBuilder.buildPath(config, fileId);
    
    // Check for duplicate (deduplication)
    const existingMetadata = await this.getMetadata(fileId);
    if (existingMetadata) {
      return this.buildResponse(existingMetadata);
    }
    
    // Store in R2
    await this.r2.put(path, imageBuffer, {
      customMetadata: {
        url: request.url,
        title: request.title,
        tenant: config.tenant.identifier,
        project: config.project.name,
        session: config.session.id
      }
    });
    
    // Create metadata
    const metadata: ScreenshotMetadata = {
      id: fileId,
      path,
      tenant: config.tenant,
      project: config.project,
      domain: config.domain,
      session: config.session,
      file: {
        originalName: `screenshot-${fileId}.png`,
        size: imageBuffer.byteLength,
        mimeType: 'image/png',
        formats: {
          full: path
        }
      },
      page: {
        title: request.title,
        url: request.url
      },
      capturedAt: new Date().toISOString(),
      expiresAt: StoragePathBuilder.getExpirationDate(config.tenant.type).toISOString(),
      permissions: {
        public: config.tenant.type === 'public',
        requiresAuth: config.tenant.type !== 'public'
      },
      analytics: {
        views: 0,
        downloads: 0
      }
    };
    
    // Store metadata in KV
    await this.storeMetadata(metadata);
    
    // Update indices
    await this.updateIndices(metadata);
    
    return this.buildResponse(metadata);
  }

  /**
   * Retrieve a screenshot by ID
   */
  async getScreenshot(id: string): Promise<ScreenshotResponse | null> {
    const metadata = await this.getMetadata(id);
    if (!metadata) {
      return null;
    }
    
    // Update analytics
    if (metadata.analytics) {
      metadata.analytics.views++;
      metadata.analytics.lastAccessed = new Date().toISOString();
      await this.storeMetadata(metadata);
    }
    
    return this.buildResponse(metadata);
  }

  /**
   * List screenshots with filtering
   */
  async listScreenshots(request: ScreenshotListRequest): Promise<ScreenshotListResponse> {
    const limit = Math.min(request.limit || 20, 100);
    let prefix = 'screenshot:';
    
    // Build prefix based on filters
    if (request.tenant && request.identifier) {
      const indexKey = StoragePathBuilder.getTenantIndexKey(
        request.tenant as any,
        request.identifier
      );
      // Get screenshot IDs for this tenant
      const tenantData = await this.kv.get(indexKey, 'json') as string[] || [];
      
      // Fetch metadata for each screenshot
      const screenshots: ScreenshotMetadata[] = [];
      for (const id of tenantData.slice(0, limit)) {
        const metadata = await this.getMetadata(id);
        if (metadata) {
          screenshots.push(metadata);
        }
      }
      
      return {
        screenshots,
        hasMore: tenantData.length > limit,
        total: tenantData.length
      };
    }
    
    // Default list from KV
    const list = await this.kv.list({
      prefix,
      cursor: request.cursor,
      limit
    });
    
    const screenshots: ScreenshotMetadata[] = [];
    for (const key of list.keys) {
      const metadata = await this.kv.get(key.name, 'json') as ScreenshotMetadata;
      if (metadata) {
        // Apply additional filters
        if (request.domain && !metadata.domain.hostname.includes(request.domain)) {
          continue;
        }
        if (request.project && metadata.project.name !== request.project) {
          continue;
        }
        if (request.session && metadata.session.id !== request.session) {
          continue;
        }
        
        screenshots.push(metadata);
      }
    }
    
    return {
      screenshots,
      cursor: list.list_complete ? undefined : list.keys[list.keys.length - 1]?.name,
      hasMore: !list.list_complete
    };
  }

  /**
   * Delete a screenshot
   */
  async deleteScreenshot(id: string): Promise<boolean> {
    const metadata = await this.getMetadata(id);
    if (!metadata) {
      return false;
    }
    
    // Delete from R2
    await this.r2.delete(metadata.path);
    
    // Delete metadata from KV
    await this.kv.delete(StoragePathBuilder.getMetadataKey(id));
    
    // Update indices
    await this.removeFromIndices(metadata);
    
    return true;
  }

  /**
   * Generate a signed URL for screenshot access
   */
  async generateSignedUrl(path: string, expiresIn = 3600): Promise<string> {
    // In production, this would generate a proper signed URL
    // For now, return a direct URL pattern
    const baseUrl = 'https://screenshots.rapidtriage.me';
    const timestamp = Date.now();
    const expires = timestamp + (expiresIn * 1000);
    
    // Simple signed URL format (would use proper signing in production)
    return `${baseUrl}/${path}?expires=${expires}&signature=${this.generateSignature(path, expires)}`;
  }

  /**
   * Build storage configuration from request
   */
  private buildStorageConfig(request: ScreenshotUploadRequest): StorageConfig {
    // Parse URL to get domain info
    const url = new URL(request.url);
    
    // Determine tenant info
    const tenant: TenantInfo = request.tenant ? {
      type: request.tenant.type || 'public',
      identifier: request.tenant.identifier || 'anonymous',
      plan: request.tenant.plan
    } : {
      type: 'public',
      identifier: 'anonymous',
      plan: 'free'
    };
    
    // Determine project info
    const project: ProjectInfo = {
      name: request.project || 'goflyplan',
      tags: request.tags
    };
    
    // Generate session info
    const session: SessionInfo = request.session ? {
      id: request.session.id || this.generateSessionId(),
      type: request.session.type || 'session',
      startTime: request.session.startTime || new Date().toISOString(),
      userId: request.session.userId,
      metadata: request.session.metadata
    } : {
      id: this.generateSessionId(),
      type: 'session',
      startTime: new Date().toISOString()
    };
    
    return {
      tenant,
      project,
      domain: {
        url: request.url,
        hostname: url.hostname,
        environment: this.detectEnvironment(url.hostname)
      },
      session,
      retention: {
        days: StoragePathBuilder.getRetentionDays(tenant.type)
      }
    };
  }

  /**
   * Store metadata in KV
   */
  private async storeMetadata(metadata: ScreenshotMetadata): Promise<void> {
    const key = StoragePathBuilder.getMetadataKey(metadata.id);
    const ttl = metadata.expiresAt ? 
      Math.floor((new Date(metadata.expiresAt).getTime() - Date.now()) / 1000) : 
      undefined;
    
    await this.kv.put(key, JSON.stringify(metadata), {
      expirationTtl: ttl
    });
  }

  /**
   * Get metadata from KV
   */
  private async getMetadata(id: string): Promise<ScreenshotMetadata | null> {
    const key = StoragePathBuilder.getMetadataKey(id);
    return await this.kv.get(key, 'json');
  }

  /**
   * Update various indices for quick lookups
   */
  private async updateIndices(metadata: ScreenshotMetadata): Promise<void> {
    // Update tenant index
    const tenantKey = StoragePathBuilder.getTenantIndexKey(
      metadata.tenant.type,
      metadata.tenant.identifier
    );
    const tenantScreenshots = await this.kv.get(tenantKey, 'json') as string[] || [];
    tenantScreenshots.unshift(metadata.id);
    await this.kv.put(tenantKey, JSON.stringify(tenantScreenshots.slice(0, 1000)));
    
    // Update project index
    const projectKey = StoragePathBuilder.getProjectIndexKey(
      metadata.tenant.identifier,
      metadata.project.name
    );
    const projectScreenshots = await this.kv.get(projectKey, 'json') as string[] || [];
    projectScreenshots.unshift(metadata.id);
    await this.kv.put(projectKey, JSON.stringify(projectScreenshots.slice(0, 1000)));
    
    // Update session index
    const sessionKey = StoragePathBuilder.getSessionKey(metadata.session.id);
    const sessionScreenshots = await this.kv.get(sessionKey, 'json') as string[] || [];
    sessionScreenshots.push(metadata.id);
    await this.kv.put(sessionKey, JSON.stringify(sessionScreenshots));
    
    // Update date index
    const dateKey = StoragePathBuilder.getDateIndexKey(new Date(metadata.capturedAt));
    const dateScreenshots = await this.kv.get(dateKey, 'json') as string[] || [];
    dateScreenshots.push(metadata.id);
    await this.kv.put(dateKey, JSON.stringify(dateScreenshots));
  }

  /**
   * Remove from indices when deleting
   */
  private async removeFromIndices(metadata: ScreenshotMetadata): Promise<void> {
    // Remove from tenant index
    const tenantKey = StoragePathBuilder.getTenantIndexKey(
      metadata.tenant.type,
      metadata.tenant.identifier
    );
    const tenantScreenshots = await this.kv.get(tenantKey, 'json') as string[] || [];
    const filteredTenant = tenantScreenshots.filter(id => id !== metadata.id);
    await this.kv.put(tenantKey, JSON.stringify(filteredTenant));
    
    // Remove from other indices similarly...
  }

  /**
   * Build response object
   */
  private buildResponse(metadata: ScreenshotMetadata): ScreenshotResponse {
    return {
      id: metadata.id,
      path: metadata.path,
      url: `https://screenshots.rapidtriage.me/${metadata.path}`,
      expires: new Date(Date.now() + 3600000).toISOString(),
      metadata
    };
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Detect environment from hostname
   */
  private detectEnvironment(hostname: string): 'production' | 'staging' | 'development' | 'test' {
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
   * Generate a simple signature for URL (would use proper HMAC in production)
   */
  private generateSignature(path: string, expires: number): string {
    const data = `${path}:${expires}`;
    // In production, use proper HMAC with secret key
    return btoa(data).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
  }
}