/**
 * Storage Types and Interfaces
 * Hierarchical organization for enterprise screenshot storage
 */

export type TenantType = 'enterprise' | 'team' | 'user' | 'public' | 'test';
export type SessionType = 'session' | 'debug' | 'audit' | 'test';
export type Environment = 'production' | 'staging' | 'development' | 'test';
export type TierPlan = 'free' | 'user' | 'team' | 'enterprise';

export interface TenantInfo {
  type: TenantType;
  identifier: string;
  plan?: TierPlan;
}

export interface ProjectInfo {
  name: string;
  version?: string;
  tags?: string[];
}

export interface DomainInfo {
  url: string;
  hostname: string;
  environment?: Environment;
}

export interface SessionInfo {
  id: string;
  type: SessionType;
  startTime: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface StorageConfig {
  tenant: TenantInfo;
  project: ProjectInfo;
  domain: DomainInfo;
  session: SessionInfo;
  retention: {
    days: number;
    archiveAfter?: number;
  };
}

export interface FileDetails {
  originalName: string;
  size: number;
  mimeType: string;
  dimensions?: {
    width: number;
    height: number;
  };
  formats: {
    full: string;
    webp?: string;
    thumb?: string;
  };
}

export interface PageInfo {
  title: string;
  url: string;
  viewport?: {
    width: number;
    height: number;
  };
}

export interface Permissions {
  public: boolean;
  sharedWith?: string[];
  requiresAuth: boolean;
}

export interface Analytics {
  views: number;
  downloads: number;
  lastAccessed?: string;
}

export interface ScreenshotMetadata {
  // Core identifiers
  id: string;
  path: string;
  
  // Hierarchical organization
  tenant: TenantInfo;
  project: ProjectInfo;
  domain: DomainInfo;
  session: SessionInfo;
  
  // File details
  file: FileDetails;
  
  // Page metadata
  page: PageInfo;
  
  // Timestamps
  capturedAt: string;
  expiresAt?: string;
  archivedAt?: string;
  
  // Access control
  permissions: Permissions;
  
  // Analytics
  analytics?: Analytics;
}

export interface ScreenshotUploadRequest {
  // Required fields
  data: string;  // Base64 encoded image
  url: string;
  title: string;
  
  // Optional fields with defaults
  tenant?: Partial<TenantInfo>;
  project?: string;
  session?: Partial<SessionInfo>;
  tags?: string[];
}

export interface ScreenshotListRequest {
  tenant?: string;
  identifier?: string;
  project?: string;
  domain?: string;
  session?: string;
  from?: string;
  to?: string;
  cursor?: string;
  limit?: number;
}

export interface ScreenshotListResponse {
  screenshots: ScreenshotMetadata[];
  cursor?: string;
  hasMore: boolean;
  total?: number;
}

export interface ScreenshotResponse {
  id: string;
  path: string;
  url: string;
  expires: string;
  metadata?: ScreenshotMetadata;
}

// Storage tier configurations
export const STORAGE_TIERS = {
  free: {
    maxScreenshots: 100,
    retentionDays: 7,
    maxProjects: 1,
    defaultProject: 'goflyplan',
    path: 'public/anonymous'
  },
  user: {
    maxScreenshots: 1000,
    retentionDays: 30,
    maxProjects: 3,
    defaultProject: 'goflyplan',
    path: 'user'
  },
  team: {
    maxScreenshots: 10000,
    retentionDays: 90,
    maxProjects: -1, // Unlimited
    defaultProject: 'goflyplan',
    path: 'team'
  },
  enterprise: {
    maxScreenshots: -1, // Unlimited
    retentionDays: 365,
    maxProjects: -1, // Unlimited
    defaultProject: 'goflyplan',
    path: 'enterprise',
    customRetention: true,
    auditLogging: true,
    compliance: true
  }
} as const;