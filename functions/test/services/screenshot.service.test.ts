/**
 * Screenshot Service Tests
 * Tests for screenshot capture and storage functionality
 */

import {
  initializeTestEnvironment,
  cleanupTestEnvironment,
  TestTimeouts,
  TestData,
} from '../setup';

// ============================================
// MOCK TYPES
// ============================================

type TenantType = 'enterprise' | 'team' | 'user' | 'public' | 'test';
type Environment = 'production' | 'staging' | 'development' | 'test';

interface ScreenshotMetadata {
  id: string;
  path: string;
  pageUrl: string;
  pageTitle: string;
  size: number;
  uploadedAt: string;
  uploadedBy?: string;
  expiresAt?: string;
  tenant: {
    type: TenantType;
    identifier: string;
  };
  environment?: Environment;
  tags?: string[];
}

interface ScreenshotUploadRequest {
  data: string;
  url: string;
  title: string;
  userId?: string;
  tenant?: {
    type?: TenantType;
    identifier?: string;
  };
  tags?: string[];
}

interface ScreenshotResponse {
  id: string;
  url: string;
  signedUrl?: string;
  expires: string;
  metadata: ScreenshotMetadata;
}

// Mock storage
const screenshots: Map<string, ScreenshotMetadata> = new Map();

// ============================================
// MOCK SCREENSHOT SERVICE
// ============================================

class MockScreenshotService {
  private generateFileId(buffer: Buffer): string {
    // Simple hash for testing
    let hash = 0;
    for (let i = 0; i < Math.min(buffer.length, 100); i++) {
      hash = ((hash << 5) - hash) + buffer[i];
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(16, '0');
  }

  private detectEnvironment(hostname: string): Environment {
    if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
      return 'development';
    }
    if (hostname.includes('staging')) return 'staging';
    if (hostname.includes('test')) return 'test';
    return 'production';
  }

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

  async storeScreenshot(request: ScreenshotUploadRequest): Promise<ScreenshotResponse> {
    const buffer = Buffer.from(request.data, 'base64');
    const fileId = this.generateFileId(buffer);

    // Check duplicate
    if (screenshots.has(fileId)) {
      return this.buildResponse(screenshots.get(fileId)!);
    }

    let hostname = 'unknown';
    try {
      hostname = new URL(request.url).hostname;
    } catch {
      // Invalid URL
    }

    const tenantType = request.tenant?.type || 'public';
    const retentionDays = this.getRetentionDays(tenantType);

    const metadata: ScreenshotMetadata = {
      id: fileId,
      path: `screenshots/${tenantType}/${fileId}.png`,
      pageUrl: request.url,
      pageTitle: request.title,
      size: buffer.length,
      uploadedAt: new Date().toISOString(),
      uploadedBy: request.userId,
      expiresAt: new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000).toISOString(),
      tenant: {
        type: tenantType,
        identifier: request.tenant?.identifier || 'anonymous',
      },
      environment: this.detectEnvironment(hostname),
      tags: request.tags,
    };

    screenshots.set(fileId, metadata);
    return this.buildResponse(metadata);
  }

  async getScreenshot(id: string): Promise<ScreenshotResponse | null> {
    const metadata = screenshots.get(id);
    if (!metadata) return null;
    return this.buildResponse(metadata);
  }

  async listScreenshots(options: {
    userId?: string;
    tenant?: string;
    limit?: number;
  } = {}): Promise<{ screenshots: ScreenshotResponse[]; hasMore: boolean }> {
    let results: ScreenshotMetadata[] = Array.from(screenshots.values());

    if (options.userId) {
      results = results.filter(s => s.uploadedBy === options.userId);
    }

    if (options.tenant) {
      results = results.filter(s => s.tenant.identifier === options.tenant);
    }

    const limit = options.limit || 20;
    const hasMore = results.length > limit;
    results = results.slice(0, limit);

    return {
      screenshots: results.map(m => this.buildResponse(m)),
      hasMore,
    };
  }

  async deleteScreenshot(id: string, userId?: string): Promise<boolean> {
    const metadata = screenshots.get(id);
    if (!metadata) return false;

    if (userId && metadata.uploadedBy !== userId) {
      throw new Error('Unauthorized to delete this screenshot');
    }

    screenshots.delete(id);
    return true;
  }

  async cleanupExpiredScreenshots(): Promise<number> {
    const now = new Date();
    let cleaned = 0;

    screenshots.forEach((metadata, id) => {
      if (metadata.expiresAt && new Date(metadata.expiresAt) < now) {
        screenshots.delete(id);
        cleaned++;
      }
    });

    return cleaned;
  }

  private buildResponse(metadata: ScreenshotMetadata): ScreenshotResponse {
    return {
      id: metadata.id,
      url: `https://storage.example.com/${metadata.path}`,
      signedUrl: `https://storage.example.com/${metadata.path}?token=xxx`,
      expires: new Date(Date.now() + 3600000).toISOString(),
      metadata,
    };
  }
}

const screenshotService = new MockScreenshotService();

// ============================================
// TEST HELPERS
// ============================================

// Minimal PNG header (1x1 transparent pixel)
const MINIMAL_PNG = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
  0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41,
  0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00,
  0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
  0x42, 0x60, 0x82,
]);

function getTestImageBase64(): string {
  return MINIMAL_PNG.toString('base64');
}

// ============================================
// TEST SUITE
// ============================================

describe('Screenshot Service', () => {
  beforeAll(() => {
    initializeTestEnvironment(false);
  });

  afterAll(() => {
    cleanupTestEnvironment();
  });

  beforeEach(() => {
    screenshots.clear();
  });

  describe('Store Screenshot', () => {
    it('should store a screenshot successfully', async () => {
      const result = await screenshotService.storeScreenshot({
        data: getTestImageBase64(),
        url: 'https://example.com/page',
        title: 'Test Page',
      });

      expect(result.id).toBeDefined();
      expect(result.url).toBeDefined();
      expect(result.metadata.pageUrl).toBe('https://example.com/page');
      expect(result.metadata.pageTitle).toBe('Test Page');
    }, TestTimeouts.SHORT);

    it('should detect production environment from URL', async () => {
      const result = await screenshotService.storeScreenshot({
        data: getTestImageBase64(),
        url: 'https://rapidtriage.me/dashboard',
        title: 'Dashboard',
      });

      expect(result.metadata.environment).toBe('production');
    }, TestTimeouts.SHORT);

    it('should detect development environment from localhost', async () => {
      const result = await screenshotService.storeScreenshot({
        data: getTestImageBase64(),
        url: 'http://localhost:3000/test',
        title: 'Local Test',
      });

      expect(result.metadata.environment).toBe('development');
    }, TestTimeouts.SHORT);

    it('should detect staging environment', async () => {
      const result = await screenshotService.storeScreenshot({
        data: getTestImageBase64(),
        url: 'https://staging.rapidtriage.me/test',
        title: 'Staging Test',
      });

      expect(result.metadata.environment).toBe('staging');
    }, TestTimeouts.SHORT);

    it('should store screenshot with tenant info', async () => {
      const result = await screenshotService.storeScreenshot({
        data: getTestImageBase64(),
        url: 'https://example.com',
        title: 'Test',
        tenant: {
          type: 'enterprise',
          identifier: 'acme-corp',
        },
      });

      expect(result.metadata.tenant.type).toBe('enterprise');
      expect(result.metadata.tenant.identifier).toBe('acme-corp');
    }, TestTimeouts.SHORT);

    it('should default to public tenant', async () => {
      const result = await screenshotService.storeScreenshot({
        data: getTestImageBase64(),
        url: 'https://example.com',
        title: 'Test',
      });

      expect(result.metadata.tenant.type).toBe('public');
    }, TestTimeouts.SHORT);

    it('should store screenshot with tags', async () => {
      const tags = ['bug', 'ui', 'high-priority'];
      const result = await screenshotService.storeScreenshot({
        data: getTestImageBase64(),
        url: 'https://example.com',
        title: 'Bug Report',
        tags,
      });

      expect(result.metadata.tags).toEqual(tags);
    }, TestTimeouts.SHORT);

    it('should deduplicate identical screenshots', async () => {
      const imageData = getTestImageBase64();

      const result1 = await screenshotService.storeScreenshot({
        data: imageData,
        url: 'https://example.com/page1',
        title: 'Page 1',
      });

      const result2 = await screenshotService.storeScreenshot({
        data: imageData,
        url: 'https://example.com/page2',
        title: 'Page 2',
      });

      // Same image data should result in same ID
      expect(result1.id).toBe(result2.id);
    }, TestTimeouts.SHORT);

    it('should set correct retention based on tenant type', async () => {
      const testCases: Array<{ type: TenantType; expectedDays: number }> = [
        { type: 'enterprise', expectedDays: 365 },
        { type: 'team', expectedDays: 90 },
        { type: 'user', expectedDays: 30 },
        { type: 'public', expectedDays: 7 },
        { type: 'test', expectedDays: 1 },
      ];

      for (const { type, expectedDays } of testCases) {
        screenshots.clear();
        const result = await screenshotService.storeScreenshot({
          data: getTestImageBase64() + type, // Make unique
          url: 'https://example.com',
          title: 'Test',
          tenant: { type },
        });

        const expiresAt = new Date(result.metadata.expiresAt!);
        const expectedExpiry = new Date(Date.now() + expectedDays * 24 * 60 * 60 * 1000);
        
        // Allow 1 minute tolerance
        expect(Math.abs(expiresAt.getTime() - expectedExpiry.getTime())).toBeLessThan(60000);
      }
    }, TestTimeouts.SHORT);
  });

  describe('Get Screenshot', () => {
    it('should retrieve screenshot by ID', async () => {
      const stored = await screenshotService.storeScreenshot({
        data: getTestImageBase64(),
        url: 'https://example.com',
        title: 'Test',
      });

      const retrieved = await screenshotService.getScreenshot(stored.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(stored.id);
    }, TestTimeouts.SHORT);

    it('should return null for non-existent screenshot', async () => {
      const result = await screenshotService.getScreenshot('non-existent');
      expect(result).toBeNull();
    }, TestTimeouts.SHORT);
  });

  describe('List Screenshots', () => {
    it('should list all screenshots', async () => {
      // Use unique data to avoid deduplication
      await screenshotService.storeScreenshot({
        data: Buffer.from(MINIMAL_PNG.toString() + 'unique1').toString('base64'),
        url: 'https://example.com/1',
        title: 'Test 1',
      });
      await screenshotService.storeScreenshot({
        data: Buffer.from(MINIMAL_PNG.toString() + 'unique2').toString('base64'),
        url: 'https://example.com/2',
        title: 'Test 2',
      });

      const result = await screenshotService.listScreenshots();

      expect(result.screenshots.length).toBe(2);
    }, TestTimeouts.SHORT);

    it('should filter by user ID', async () => {
      await screenshotService.storeScreenshot({
        data: getTestImageBase64() + '1',
        url: 'https://example.com/1',
        title: 'Test 1',
        userId: 'user-1',
      });
      await screenshotService.storeScreenshot({
        data: getTestImageBase64() + '2',
        url: 'https://example.com/2',
        title: 'Test 2',
        userId: 'user-2',
      });

      const result = await screenshotService.listScreenshots({ userId: 'user-1' });

      expect(result.screenshots.length).toBe(1);
      expect(result.screenshots[0].metadata.uploadedBy).toBe('user-1');
    }, TestTimeouts.SHORT);

    it('should filter by tenant', async () => {
      await screenshotService.storeScreenshot({
        data: getTestImageBase64() + '1',
        url: 'https://example.com/1',
        title: 'Test 1',
        tenant: { type: 'enterprise', identifier: 'acme' },
      });
      await screenshotService.storeScreenshot({
        data: getTestImageBase64() + '2',
        url: 'https://example.com/2',
        title: 'Test 2',
        tenant: { type: 'team', identifier: 'beta' },
      });

      const result = await screenshotService.listScreenshots({ tenant: 'acme' });

      expect(result.screenshots.length).toBe(1);
    }, TestTimeouts.SHORT);

    it('should respect limit parameter', async () => {
      for (let i = 0; i < 5; i++) {
        // Use truly unique data for each screenshot
        await screenshotService.storeScreenshot({
          data: Buffer.from(MINIMAL_PNG.toString() + `uniquedata${i}${Date.now()}`).toString('base64'),
          url: `https://example.com/${i}`,
          title: `Test ${i}`,
        });
      }

      const result = await screenshotService.listScreenshots({ limit: 3 });

      expect(result.screenshots.length).toBe(3);
      expect(result.hasMore).toBe(true);
    }, TestTimeouts.SHORT);
  });

  describe('Delete Screenshot', () => {
    it('should delete screenshot', async () => {
      const stored = await screenshotService.storeScreenshot({
        data: getTestImageBase64(),
        url: 'https://example.com',
        title: 'Test',
      });

      const result = await screenshotService.deleteScreenshot(stored.id);
      expect(result).toBe(true);

      const retrieved = await screenshotService.getScreenshot(stored.id);
      expect(retrieved).toBeNull();
    }, TestTimeouts.SHORT);

    it('should return false for non-existent screenshot', async () => {
      const result = await screenshotService.deleteScreenshot('non-existent');
      expect(result).toBe(false);
    }, TestTimeouts.SHORT);

    it('should verify ownership when userId provided', async () => {
      const stored = await screenshotService.storeScreenshot({
        data: getTestImageBase64(),
        url: 'https://example.com',
        title: 'Test',
        userId: 'owner-user',
      });

      await expect(
        screenshotService.deleteScreenshot(stored.id, 'other-user')
      ).rejects.toThrow('Unauthorized');
    }, TestTimeouts.SHORT);

    it('should allow owner to delete', async () => {
      const stored = await screenshotService.storeScreenshot({
        data: getTestImageBase64(),
        url: 'https://example.com',
        title: 'Test',
        userId: 'owner-user',
      });

      const result = await screenshotService.deleteScreenshot(stored.id, 'owner-user');
      expect(result).toBe(true);
    }, TestTimeouts.SHORT);
  });

  describe('Cleanup Expired Screenshots', () => {
    it('should cleanup expired screenshots', async () => {
      const stored = await screenshotService.storeScreenshot({
        data: getTestImageBase64(),
        url: 'https://example.com',
        title: 'Test',
        tenant: { type: 'test' }, // 1 day retention
      });

      // Force expiration
      screenshots.get(stored.id)!.expiresAt = new Date(Date.now() - 1000).toISOString();

      const cleaned = await screenshotService.cleanupExpiredScreenshots();

      expect(cleaned).toBe(1);
    }, TestTimeouts.SHORT);

    it('should not cleanup non-expired screenshots', async () => {
      await screenshotService.storeScreenshot({
        data: getTestImageBase64(),
        url: 'https://example.com',
        title: 'Test',
        tenant: { type: 'enterprise' }, // 365 days retention
      });

      const cleaned = await screenshotService.cleanupExpiredScreenshots();

      expect(cleaned).toBe(0);
    }, TestTimeouts.SHORT);
  });
});
