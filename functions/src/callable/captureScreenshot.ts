/**
 * Capture Screenshot Callable Function
 * Allows clients to store screenshots via callable function
 */

import { onCall, CallableOptions, HttpsError } from 'firebase-functions/v2/https';
import { screenshotService } from '../services/screenshot.service.js';
import { JWT_SECRET } from '../config/secrets.js';

/**
 * Request interface for capturing screenshot
 */
interface CaptureScreenshotRequest {
  data: string; // Base64 encoded image
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
    plan?: string;
  };
}

/**
 * Response interface
 */
interface CaptureScreenshotResponse {
  success: boolean;
  data?: {
    id: string;
    url: string;
    signedUrl?: string;
    expires: string;
    path: string;
  };
  error?: string;
}

/**
 * Callable function options
 */
const options: CallableOptions = {
  region: 'us-central1',
  memory: '512MiB',
  timeoutSeconds: 60,
  secrets: [JWT_SECRET],
};

/**
 * Maximum allowed screenshot size (5MB)
 */
const MAX_SCREENSHOT_SIZE = 5 * 1024 * 1024;

/**
 * Capture Screenshot callable function
 */
export const captureScreenshot = onCall<CaptureScreenshotRequest, Promise<CaptureScreenshotResponse>>(
  options,
  async (request) => {
    const { data, url, title, sessionId, project, tags, viewport, tenant } = request.data;

    // Validate required fields
    if (!data || typeof data !== 'string') {
      throw new HttpsError('invalid-argument', 'Screenshot data is required');
    }

    if (!url || typeof url !== 'string') {
      throw new HttpsError('invalid-argument', 'URL is required');
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      throw new HttpsError('invalid-argument', 'Invalid URL format');
    }

    // Check screenshot size
    const dataSize = Buffer.from(data, 'base64').length;
    if (dataSize > MAX_SCREENSHOT_SIZE) {
      throw new HttpsError(
        'invalid-argument',
        `Screenshot size (${Math.round(dataSize / 1024 / 1024)}MB) exceeds maximum allowed (5MB)`
      );
    }

    // Validate data is valid base64
    try {
      const buffer = Buffer.from(data, 'base64');
      // Check for PNG or JPEG magic bytes
      const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
      const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;

      if (!isPng && !isJpeg) {
        throw new HttpsError('invalid-argument', 'Invalid image format. Only PNG and JPEG are supported.');
      }
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      throw new HttpsError('invalid-argument', 'Invalid base64 data');
    }

    // Validate optional fields
    if (title && (typeof title !== 'string' || title.length > 500)) {
      throw new HttpsError('invalid-argument', 'Title must be a string of 500 characters or less');
    }

    if (tags && (!Array.isArray(tags) || tags.length > 10)) {
      throw new HttpsError('invalid-argument', 'Tags must be an array of 10 items or less');
    }

    if (viewport) {
      if (typeof viewport.width !== 'number' || typeof viewport.height !== 'number') {
        throw new HttpsError('invalid-argument', 'Viewport must have numeric width and height');
      }
      if (viewport.width < 1 || viewport.width > 10000 || viewport.height < 1 || viewport.height > 10000) {
        throw new HttpsError('invalid-argument', 'Viewport dimensions must be between 1 and 10000');
      }
    }

    try {
      const result = await screenshotService.storeScreenshot({
        data,
        url,
        title: title || 'Untitled',
        userId: request.auth?.uid,
        sessionId,
        project,
        tags,
        viewport,
        tenant,
      });

      return {
        success: true,
        data: {
          id: result.id,
          url: result.url,
          signedUrl: result.signedUrl,
          expires: result.expires,
          path: result.metadata.path,
        },
      };
    } catch (error) {
      console.error('Capture screenshot error:', error);
      throw new HttpsError(
        'internal',
        'Failed to store screenshot',
        error instanceof Error ? error.message : undefined
      );
    }
  }
);
