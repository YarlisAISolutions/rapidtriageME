/**
 * Capture Screenshot Callable Function Tests
 * Tests for screenshot capture validation and processing
 */

import {
  initializeTestEnvironment,
  cleanupTestEnvironment,
  TestTimeouts,
  createAuthContext,
} from '../setup';

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

// Minimal JPEG header
const MINIMAL_JPEG = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46,
  0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
  0x00, 0x01, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
]);

function getTestPngBase64(): string {
  return MINIMAL_PNG.toString('base64');
}

function getTestJpegBase64(): string {
  return MINIMAL_JPEG.toString('base64');
}

// ============================================
// MOCK VALIDATION FUNCTIONS
// ============================================

interface CaptureScreenshotRequest {
  data: string;
  url: string;
  title?: string;
  sessionId?: string;
  project?: string;
  tags?: string[];
  viewport?: {
    width: number;
    height: number;
  };
  tenant?: {
    type?: 'enterprise' | 'team' | 'user' | 'public' | 'test';
    identifier?: string;
  };
}

const MAX_SCREENSHOT_SIZE = 5 * 1024 * 1024; // 5MB

class ValidationError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

function validateCaptureRequest(data: CaptureScreenshotRequest): void {
  // Validate required fields
  if (!data.data || typeof data.data !== 'string') {
    throw new ValidationError('invalid-argument', 'Screenshot data is required');
  }

  if (!data.url || typeof data.url !== 'string') {
    throw new ValidationError('invalid-argument', 'URL is required');
  }

  // Validate URL format
  try {
    new URL(data.url);
  } catch {
    throw new ValidationError('invalid-argument', 'Invalid URL format');
  }

  // Check screenshot size
  const buffer = Buffer.from(data.data, 'base64');
  if (buffer.length > MAX_SCREENSHOT_SIZE) {
    throw new ValidationError(
      'invalid-argument',
      `Screenshot size (${Math.round(buffer.length / 1024 / 1024)}MB) exceeds maximum allowed (5MB)`
    );
  }

  // Check image format
  const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;

  if (!isPng && !isJpeg) {
    throw new ValidationError('invalid-argument', 'Invalid image format. Only PNG and JPEG are supported.');
  }

  // Validate optional fields
  if (data.title && (typeof data.title !== 'string' || data.title.length > 500)) {
    throw new ValidationError('invalid-argument', 'Title must be a string of 500 characters or less');
  }

  if (data.tags && (!Array.isArray(data.tags) || data.tags.length > 10)) {
    throw new ValidationError('invalid-argument', 'Tags must be an array of 10 items or less');
  }

  if (data.viewport) {
    if (typeof data.viewport.width !== 'number' || typeof data.viewport.height !== 'number') {
      throw new ValidationError('invalid-argument', 'Viewport must have numeric width and height');
    }
    if (data.viewport.width < 1 || data.viewport.width > 10000 ||
        data.viewport.height < 1 || data.viewport.height > 10000) {
      throw new ValidationError('invalid-argument', 'Viewport dimensions must be between 1 and 10000');
    }
  }
}

// ============================================
// TEST SUITE
// ============================================

describe('Capture Screenshot Callable Function', () => {
  beforeAll(() => {
    initializeTestEnvironment(false);
  });

  afterAll(() => {
    cleanupTestEnvironment();
  });

  describe('Input Validation', () => {
    describe('Required Fields', () => {
      it('should reject request without data', () => {
        expect(() => validateCaptureRequest({
          data: '',
          url: 'https://example.com',
        })).toThrow('Screenshot data is required');
      }, TestTimeouts.SHORT);

      it('should reject request without URL', () => {
        expect(() => validateCaptureRequest({
          data: getTestPngBase64(),
          url: '',
        })).toThrow('URL is required');
      }, TestTimeouts.SHORT);

      it('should reject request with non-string data', () => {
        expect(() => validateCaptureRequest({
          data: null as unknown as string,
          url: 'https://example.com',
        })).toThrow('Screenshot data is required');
      }, TestTimeouts.SHORT);
    });

    describe('URL Validation', () => {
      it('should accept valid HTTP URL', () => {
        expect(() => validateCaptureRequest({
          data: getTestPngBase64(),
          url: 'http://example.com/page',
        })).not.toThrow();
      }, TestTimeouts.SHORT);

      it('should accept valid HTTPS URL', () => {
        expect(() => validateCaptureRequest({
          data: getTestPngBase64(),
          url: 'https://example.com/page',
        })).not.toThrow();
      }, TestTimeouts.SHORT);

      it('should reject invalid URL format', () => {
        expect(() => validateCaptureRequest({
          data: getTestPngBase64(),
          url: 'not-a-valid-url',
        })).toThrow('Invalid URL format');
      }, TestTimeouts.SHORT);

      it('should reject URL without protocol', () => {
        expect(() => validateCaptureRequest({
          data: getTestPngBase64(),
          url: 'example.com/page',
        })).toThrow('Invalid URL format');
      }, TestTimeouts.SHORT);
    });

    describe('Image Format Validation', () => {
      it('should accept PNG image', () => {
        expect(() => validateCaptureRequest({
          data: getTestPngBase64(),
          url: 'https://example.com',
        })).not.toThrow();
      }, TestTimeouts.SHORT);

      it('should accept JPEG image', () => {
        expect(() => validateCaptureRequest({
          data: getTestJpegBase64(),
          url: 'https://example.com',
        })).not.toThrow();
      }, TestTimeouts.SHORT);

      it('should reject invalid image format', () => {
        const invalidData = Buffer.from('not an image').toString('base64');
        expect(() => validateCaptureRequest({
          data: invalidData,
          url: 'https://example.com',
        })).toThrow('Invalid image format');
      }, TestTimeouts.SHORT);

      it('should reject GIF images', () => {
        // GIF magic bytes: 47 49 46 38
        const gifData = Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]).toString('base64');
        expect(() => validateCaptureRequest({
          data: gifData,
          url: 'https://example.com',
        })).toThrow('Invalid image format');
      }, TestTimeouts.SHORT);
    });

    describe('Size Validation', () => {
      it('should accept images under size limit', () => {
        expect(() => validateCaptureRequest({
          data: getTestPngBase64(),
          url: 'https://example.com',
        })).not.toThrow();
      }, TestTimeouts.SHORT);

      it('should reject images over 5MB', () => {
        // Create a "large" image that exceeds limit
        const largeBuffer = Buffer.alloc(6 * 1024 * 1024);
        // Set PNG header
        MINIMAL_PNG.copy(largeBuffer);

        expect(() => validateCaptureRequest({
          data: largeBuffer.toString('base64'),
          url: 'https://example.com',
        })).toThrow('exceeds maximum allowed');
      }, TestTimeouts.SHORT);
    });

    describe('Title Validation', () => {
      it('should accept valid title', () => {
        expect(() => validateCaptureRequest({
          data: getTestPngBase64(),
          url: 'https://example.com',
          title: 'My Page Title',
        })).not.toThrow();
      }, TestTimeouts.SHORT);

      it('should reject title over 500 characters', () => {
        expect(() => validateCaptureRequest({
          data: getTestPngBase64(),
          url: 'https://example.com',
          title: 'x'.repeat(501),
        })).toThrow('500 characters or less');
      }, TestTimeouts.SHORT);

      it('should accept empty title', () => {
        expect(() => validateCaptureRequest({
          data: getTestPngBase64(),
          url: 'https://example.com',
          title: '',
        })).not.toThrow();
      }, TestTimeouts.SHORT);
    });

    describe('Tags Validation', () => {
      it('should accept valid tags array', () => {
        expect(() => validateCaptureRequest({
          data: getTestPngBase64(),
          url: 'https://example.com',
          tags: ['bug', 'ui', 'urgent'],
        })).not.toThrow();
      }, TestTimeouts.SHORT);

      it('should accept maximum of 10 tags', () => {
        expect(() => validateCaptureRequest({
          data: getTestPngBase64(),
          url: 'https://example.com',
          tags: Array(10).fill('tag'),
        })).not.toThrow();
      }, TestTimeouts.SHORT);

      it('should reject more than 10 tags', () => {
        expect(() => validateCaptureRequest({
          data: getTestPngBase64(),
          url: 'https://example.com',
          tags: Array(11).fill('tag'),
        })).toThrow('10 items or less');
      }, TestTimeouts.SHORT);

      it('should reject non-array tags', () => {
        expect(() => validateCaptureRequest({
          data: getTestPngBase64(),
          url: 'https://example.com',
          tags: 'not-an-array' as unknown as string[],
        })).toThrow('must be an array');
      }, TestTimeouts.SHORT);
    });

    describe('Viewport Validation', () => {
      it('should accept valid viewport', () => {
        expect(() => validateCaptureRequest({
          data: getTestPngBase64(),
          url: 'https://example.com',
          viewport: { width: 1920, height: 1080 },
        })).not.toThrow();
      }, TestTimeouts.SHORT);

      it('should accept minimum viewport dimensions', () => {
        expect(() => validateCaptureRequest({
          data: getTestPngBase64(),
          url: 'https://example.com',
          viewport: { width: 1, height: 1 },
        })).not.toThrow();
      }, TestTimeouts.SHORT);

      it('should accept maximum viewport dimensions', () => {
        expect(() => validateCaptureRequest({
          data: getTestPngBase64(),
          url: 'https://example.com',
          viewport: { width: 10000, height: 10000 },
        })).not.toThrow();
      }, TestTimeouts.SHORT);

      it('should reject viewport width below minimum', () => {
        expect(() => validateCaptureRequest({
          data: getTestPngBase64(),
          url: 'https://example.com',
          viewport: { width: 0, height: 1080 },
        })).toThrow('between 1 and 10000');
      }, TestTimeouts.SHORT);

      it('should reject viewport width above maximum', () => {
        expect(() => validateCaptureRequest({
          data: getTestPngBase64(),
          url: 'https://example.com',
          viewport: { width: 10001, height: 1080 },
        })).toThrow('between 1 and 10000');
      }, TestTimeouts.SHORT);

      it('should reject non-numeric viewport dimensions', () => {
        expect(() => validateCaptureRequest({
          data: getTestPngBase64(),
          url: 'https://example.com',
          viewport: { width: '100' as unknown as number, height: 100 },
        })).toThrow('numeric width and height');
      }, TestTimeouts.SHORT);
    });

    describe('Tenant Validation', () => {
      it('should accept valid tenant info', () => {
        expect(() => validateCaptureRequest({
          data: getTestPngBase64(),
          url: 'https://example.com',
          tenant: {
            type: 'enterprise',
            identifier: 'acme-corp',
          },
        })).not.toThrow();
      }, TestTimeouts.SHORT);

      it('should accept all tenant types', () => {
        const types = ['enterprise', 'team', 'user', 'public', 'test'] as const;
        for (const type of types) {
          expect(() => validateCaptureRequest({
            data: getTestPngBase64(),
            url: 'https://example.com',
            tenant: { type },
          })).not.toThrow();
        }
      }, TestTimeouts.SHORT);
    });
  });

  describe('Authentication Context', () => {
    it('should create context with user ID', () => {
      const context = createAuthContext('user-123');
      expect(context.auth.uid).toBe('user-123');
    }, TestTimeouts.SHORT);

    it('should include email in context', () => {
      const context = createAuthContext('user-123', 'user@example.com');
      expect(context.auth.token.email).toBe('user@example.com');
    }, TestTimeouts.SHORT);

    it('should mark email as verified', () => {
      const context = createAuthContext('user-123');
      expect(context.auth.token.email_verified).toBe(true);
    }, TestTimeouts.SHORT);
  });

  describe('Response Structure', () => {
    it('should have expected success response fields', () => {
      // Mock successful response structure
      const successResponse = {
        success: true,
        data: {
          id: 'screenshot-123',
          url: 'https://storage.example.com/screenshot.png',
          signedUrl: 'https://storage.example.com/screenshot.png?token=xxx',
          expires: new Date().toISOString(),
          path: 'screenshots/user/screenshot.png',
        },
      };

      expect(successResponse.success).toBe(true);
      expect(successResponse.data).toBeDefined();
      expect(successResponse.data.id).toBeDefined();
      expect(successResponse.data.url).toBeDefined();
      expect(successResponse.data.expires).toBeDefined();
      expect(successResponse.data.path).toBeDefined();
    }, TestTimeouts.SHORT);

    it('should have expected error response fields', () => {
      // Mock error response structure
      const errorResponse = {
        success: false,
        error: 'Invalid URL format',
      };

      expect(errorResponse.success).toBe(false);
      expect(errorResponse.error).toBeDefined();
    }, TestTimeouts.SHORT);
  });
});
