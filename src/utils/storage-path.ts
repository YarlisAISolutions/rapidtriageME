/**
 * Storage Path Builder Utility
 * Generates hierarchical paths for screenshot organization
 */

import { StorageConfig, TenantType, STORAGE_TIERS } from '../types/storage';

export class StoragePathBuilder {
  /**
   * Build complete storage path for a screenshot
   */
  static buildPath(config: StorageConfig, fileId: string, type = 'full', format = 'png'): string {
    const tenant = this.buildTenantPath(config.tenant.type, config.tenant.identifier);
    const project = this.sanitize(config.project.name || 'goflyplan');
    const domain = this.sanitizeDomain(config.domain.hostname);
    const date = this.getDatePath();
    const session = `${config.session.type}-${config.session.id}`;
    const filename = this.generateFilename(fileId, type, format);
    
    return `${tenant}/${project}/${domain}/${date}/${session}/${filename}`;
  }

  /**
   * Build tenant-specific path prefix
   */
  static buildTenantPath(type: TenantType, identifier: string): string {
    return `${type}/${this.sanitize(identifier)}`;
  }

  /**
   * Sanitize general string for use in path
   */
  static sanitize(input: string): string {
    if (!input) return 'unknown';
    
    return input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 63); // Max length for path component
  }

  /**
   * Sanitize domain/URL for use in path
   */
  static sanitizeDomain(domain: string): string {
    if (!domain) return 'unknown-domain';
    
    // Remove protocol
    let sanitized = domain.replace(/^https?:\/\//, '');
    
    // Remove port
    sanitized = sanitized.replace(/:\d+/, '');
    
    // Replace special characters
    sanitized = sanitized
      .replace(/[\/\.\:]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase();
    
    // Handle localhost specially
    if (sanitized.startsWith('localhost')) {
      sanitized = sanitized.replace('localhost', 'localhost');
    }
    
    return sanitized.substring(0, 63);
  }

  /**
   * Generate date-based path component (YYYY/MM/DD)
   */
  static getDatePath(date?: Date): string {
    const now = date || new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    return `${year}/${month}/${day}`;
  }

  /**
   * Generate unique filename with timestamp and hash
   */
  static generateFilename(fileId: string, type = 'full', format = 'png'): string {
    const timestamp = new Date().toISOString()
      .replace(/[:.]/g, '')
      .replace('T', '-')
      .replace('Z', '')
      .substring(0, 15);
    
    const hash = fileId.substring(0, 8);
    
    return `${timestamp}-${hash}-${type}.${format}`;
  }

  /**
   * Parse path back into components
   */
  static parsePath(path: string): {
    tenant: { type: string; identifier: string };
    project: string;
    domain: string;
    date: { year: string; month: string; day: string };
    session: { type: string; id: string };
    filename: string;
  } | null {
    const parts = path.split('/');
    
    if (parts.length < 8) {
      return null;
    }
    
    const [tenantType, tenantId, project, domain, year, month, day, sessionInfo, ...filenameParts] = parts;
    const filename = filenameParts.join('/');
    
    // Parse session info
    const sessionMatch = sessionInfo.match(/^(session|debug|audit|test)-(.+)$/);
    if (!sessionMatch) {
      return null;
    }
    
    return {
      tenant: {
        type: tenantType,
        identifier: tenantId
      },
      project,
      domain,
      date: { year, month, day },
      session: {
        type: sessionMatch[1],
        id: sessionMatch[2]
      },
      filename
    };
  }

  /**
   * Generate a unique file ID from content
   */
  static async generateFileId(data: ArrayBuffer): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex.substring(0, 16);
  }

  /**
   * Convert base64 to ArrayBuffer
   */
  static base64ToArrayBuffer(base64: string): ArrayBuffer {
    // Remove data URL prefix if present
    const base64Clean = base64.replace(/^data:image\/\w+;base64,/, '');
    const binaryString = atob(base64Clean);
    const bytes = new Uint8Array(binaryString.length);
    
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    return bytes.buffer;
  }

  /**
   * Get retention days based on tenant type
   */
  static getRetentionDays(tenantType: TenantType): number {
    const tierMap: Record<string, keyof typeof STORAGE_TIERS> = {
      'public': 'free',
      'user': 'user',
      'team': 'team',
      'enterprise': 'enterprise',
      'test': 'free'  // Map test to free tier
    };
    
    const tier = tierMap[tenantType] || 'free';  // Default to free tier if not found
    return STORAGE_TIERS[tier].retentionDays;
  }

  /**
   * Calculate expiration date
   */
  static getExpirationDate(tenantType: TenantType, customDays?: number): Date {
    const days = customDays || this.getRetentionDays(tenantType);
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + days);
    return expirationDate;
  }

  /**
   * Generate KV key for screenshot metadata
   */
  static getMetadataKey(id: string): string {
    return `screenshot:${id}`;
  }

  /**
   * Generate KV key for tenant index
   */
  static getTenantIndexKey(type: TenantType, identifier: string): string {
    return `tenant:${type}:${this.sanitize(identifier)}`;
  }

  /**
   * Generate KV key for project index
   */
  static getProjectIndexKey(tenantId: string, projectName: string): string {
    return `project:${this.sanitize(tenantId)}:${this.sanitize(projectName)}`;
  }

  /**
   * Generate KV key for domain index
   */
  static getDomainIndexKey(tenantId: string, projectName: string, domain: string): string {
    return `domain:${this.sanitize(tenantId)}:${this.sanitize(projectName)}:${this.sanitizeDomain(domain)}`;
  }

  /**
   * Generate KV key for session
   */
  static getSessionKey(sessionId: string): string {
    return `session:${sessionId}`;
  }

  /**
   * Generate KV key for date-based lookup
   */
  static getDateIndexKey(date: Date): string {
    const dateStr = date.toISOString().split('T')[0];
    return `lookup:date:${dateStr}`;
  }

  /**
   * Generate KV key for URL-based lookup
   */
  static getUrlIndexKey(url: string): string {
    const urlHash = this.sanitizeDomain(url);
    return `lookup:url:${urlHash}`;
  }
}