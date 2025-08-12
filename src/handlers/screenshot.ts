/**
 * Screenshot API Handlers
 * Dedicated handlers for screenshot storage and retrieval
 */

import { ScreenshotStorageService } from '../services/screenshot-storage';
import { ScreenshotUploadRequest, ScreenshotListRequest } from '../types/storage';

export class ScreenshotHandler {
  private storageService: ScreenshotStorageService;
  
  constructor(r2: R2Bucket, kv: KVNamespace) {
    this.storageService = new ScreenshotStorageService(r2, kv);
  }
  
  /**
   * Handle POST /api/screenshot - Store a new screenshot
   */
  async handleUpload(request: Request): Promise<Response> {
    try {
      const body = await request.json() as ScreenshotUploadRequest;
      
      // Validate required fields
      if (!body.data || !body.url || !body.title) {
        return new Response(JSON.stringify({
          error: 'Missing required fields: data, url, title'
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      
      // Extract tenant info from headers if available
      const tenantHeader = request.headers.get('X-Tenant-Type');
      const identifierHeader = request.headers.get('X-Tenant-Id');
      const projectHeader = request.headers.get('X-Project');
      
      // Build complete request
      const uploadRequest: ScreenshotUploadRequest = {
        ...body,
        tenant: body.tenant || {
          type: (tenantHeader as any) || 'public',
          identifier: identifierHeader || 'anonymous'
        },
        project: body.project || projectHeader || 'goflyplan'
      };
      
      // Store screenshot
      const result = await this.storageService.storeScreenshot(uploadRequest);
      
      return new Response(JSON.stringify({
        success: true,
        ...result
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
      
    } catch (error) {
      console.error('Screenshot upload error:', error);
      
      return new Response(JSON.stringify({
        error: (error as Error).message || 'Failed to store screenshot'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
  
  /**
   * Handle GET /api/screenshots/:id - Retrieve a specific screenshot
   */
  async handleGet(_request: Request, id: string): Promise<Response> {
    try {
      const result = await this.storageService.getScreenshot(id);
      
      if (!result) {
        return new Response(JSON.stringify({
          error: 'Screenshot not found'
        }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      
      return new Response(JSON.stringify({
        success: true,
        ...result
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
      
    } catch (error) {
      console.error('Screenshot retrieval error:', error);
      
      return new Response(JSON.stringify({
        error: (error as Error).message || 'Failed to retrieve screenshot'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
  
  /**
   * Handle GET /api/screenshots/list - List screenshots with filtering
   */
  async handleList(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      
      // Parse query parameters
      const listRequest: ScreenshotListRequest = {
        tenant: url.searchParams.get('tenant') || undefined,
        identifier: url.searchParams.get('identifier') || undefined,
        project: url.searchParams.get('project') || undefined,
        domain: url.searchParams.get('domain') || undefined,
        session: url.searchParams.get('session') || undefined,
        from: url.searchParams.get('from') || undefined,
        to: url.searchParams.get('to') || undefined,
        cursor: url.searchParams.get('cursor') || undefined,
        limit: parseInt(url.searchParams.get('limit') || '20')
      };
      
      // Get screenshots
      const result = await this.storageService.listScreenshots(listRequest);
      
      return new Response(JSON.stringify({
        success: true,
        ...result
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
      
    } catch (error) {
      console.error('Screenshot list error:', error);
      
      return new Response(JSON.stringify({
        error: (error as Error).message || 'Failed to list screenshots'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
  
  /**
   * Handle DELETE /api/screenshots/:id - Delete a screenshot
   */
  async handleDelete(request: Request, id: string): Promise<Response> {
    try {
      // Check authorization
      const authHeader = request.headers.get('Authorization');
      if (!authHeader) {
        return new Response(JSON.stringify({
          error: 'Authorization required'
        }), {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      
      const success = await this.storageService.deleteScreenshot(id);
      
      if (!success) {
        return new Response(JSON.stringify({
          error: 'Screenshot not found'
        }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Screenshot deleted successfully'
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
      
    } catch (error) {
      console.error('Screenshot deletion error:', error);
      
      return new Response(JSON.stringify({
        error: (error as Error).message || 'Failed to delete screenshot'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
  
  /**
   * Handle GET /api/screenshots/stats - Get storage statistics
   */
  async handleStats(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      const tenant = url.searchParams.get('tenant');
      // const identifier = url.searchParams.get('identifier');
      
      // This would query KV for statistics
      // For now, return mock data
      const stats = {
        totalScreenshots: 0,
        totalSize: 0,
        screenshotsToday: 0,
        screenshotsThisWeek: 0,
        screenshotsThisMonth: 0,
        topDomains: [],
        topProjects: [],
        storageUsed: '0 MB',
        storageLimit: tenant === 'enterprise' ? 'Unlimited' : '1 GB'
      };
      
      return new Response(JSON.stringify({
        success: true,
        stats
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
      
    } catch (error) {
      console.error('Screenshot stats error:', error);
      
      return new Response(JSON.stringify({
        error: (error as Error).message || 'Failed to get statistics'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
}