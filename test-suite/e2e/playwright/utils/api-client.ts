/**
 * API Client for RapidTriage Integration
 *
 * Reusable HTTP client for API interactions during E2E tests
 */

import { APIRequestContext, request } from '@playwright/test';
import { API_CONFIG, getRapidTriageToken, ApiToken } from '../config/secrets';
import { UserRole } from '../config/test-users';

export interface ApiResponse<T = any> {
  status: number;
  data: T;
  headers: Record<string, string>;
  duration: number;
}

export interface ConsoleLog {
  level: 'log' | 'warn' | 'error' | 'info' | 'debug';
  message: string;
  timestamp: string;
  source?: string;
}

export interface NetworkLog {
  method: string;
  url: string;
  status: number;
  duration: number;
  size?: number;
  type?: string;
}

export interface ScreenshotResult {
  id: string;
  url: string;
  path: string;
  timestamp: string;
}

/**
 * RapidTriage API Client
 */
export class RapidTriageClient {
  private baseUrl: string;
  private token: ApiToken;
  private context?: APIRequestContext;

  constructor(role: UserRole = 'user') {
    this.baseUrl = API_CONFIG.rapidTriageUrl;
    this.token = getRapidTriageToken(role);
  }

  /**
   * Initialize the API context
   */
  async init(): Promise<void> {
    this.context = await request.newContext({
      baseURL: this.baseUrl,
      extraHTTPHeaders: {
        'Authorization': `Bearer ${this.token.token}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Dispose the API context
   */
  async dispose(): Promise<void> {
    if (this.context) {
      await this.context.dispose();
    }
  }

  /**
   * Make API request
   */
  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any
  ): Promise<ApiResponse<T>> {
    if (!this.context) {
      await this.init();
    }

    const startTime = Date.now();
    const options: any = {};

    if (data) {
      options.data = data;
    }

    const response = await this.context![method.toLowerCase() as 'get' | 'post' | 'put' | 'delete'](
      endpoint,
      options
    );

    const duration = Date.now() - startTime;
    const headers: Record<string, string> = {};
    response.headers()

    let responseData: T;
    try {
      responseData = await response.json();
    } catch {
      responseData = (await response.text()) as any;
    }

    return {
      status: response.status(),
      data: responseData,
      headers: Object.fromEntries(Object.entries(response.headers())),
      duration,
    };
  }

  // ============================================
  // Health & Status
  // ============================================

  async getHealth(): Promise<ApiResponse> {
    return this.request('GET', '/health');
  }

  async getStatus(): Promise<ApiResponse> {
    return this.request('GET', '/status');
  }

  async getMetrics(): Promise<ApiResponse> {
    return this.request('GET', '/metrics');
  }

  // ============================================
  // Console Logs
  // ============================================

  async getConsoleLogs(sessionId?: string): Promise<ApiResponse<{ logs: ConsoleLog[] }>> {
    const endpoint = sessionId
      ? `/api/console-logs?sessionId=${sessionId}`
      : '/api/console-logs';
    return this.request('GET', endpoint);
  }

  async getConsoleErrors(sessionId?: string): Promise<ApiResponse<{ logs: ConsoleLog[] }>> {
    const endpoint = sessionId
      ? `/api/console-errors?sessionId=${sessionId}`
      : '/api/console-errors';
    return this.request('GET', endpoint);
  }

  // ============================================
  // Network Logs
  // ============================================

  async getNetworkLogs(sessionId?: string): Promise<ApiResponse<{ logs: NetworkLog[] }>> {
    const endpoint = sessionId
      ? `/api/network-logs?sessionId=${sessionId}`
      : '/api/network-logs';
    return this.request('GET', endpoint);
  }

  async getNetworkErrors(sessionId?: string): Promise<ApiResponse<{ logs: NetworkLog[] }>> {
    const endpoint = sessionId
      ? `/api/network-errors?sessionId=${sessionId}`
      : '/api/network-errors';
    return this.request('GET', endpoint);
  }

  // ============================================
  // Screenshots
  // ============================================

  async captureScreenshot(url: string, options?: {
    width?: number;
    height?: number;
    fullPage?: boolean;
    format?: 'png' | 'jpeg';
  }): Promise<ApiResponse<ScreenshotResult>> {
    return this.request('POST', '/api/screenshot', {
      url,
      ...options,
    });
  }

  // ============================================
  // Lighthouse Audits
  // ============================================

  async runLighthouseAudit(url: string, categories?: string[]): Promise<ApiResponse> {
    return this.request('POST', '/api/lighthouse', {
      url,
      categories: categories || ['performance', 'accessibility', 'seo', 'best-practices'],
    });
  }

  async runAccessibilityAudit(url: string): Promise<ApiResponse> {
    return this.request('POST', '/api/lighthouse', {
      url,
      categories: ['accessibility'],
    });
  }

  async runPerformanceAudit(url: string): Promise<ApiResponse> {
    return this.request('POST', '/api/lighthouse', {
      url,
      categories: ['performance'],
    });
  }

  async runSeoAudit(url: string): Promise<ApiResponse> {
    return this.request('POST', '/api/lighthouse', {
      url,
      categories: ['seo'],
    });
  }

  // ============================================
  // Sessions
  // ============================================

  async createSession(origin: string): Promise<ApiResponse<{ sessionId: string }>> {
    return this.request('POST', '/api/sessions', { origin });
  }

  async getSession(sessionId: string): Promise<ApiResponse> {
    return this.request('GET', `/api/sessions/${sessionId}`);
  }

  async endSession(sessionId: string): Promise<ApiResponse> {
    return this.request('POST', `/api/sessions/${sessionId}/end`);
  }

  // ============================================
  // Dashboard
  // ============================================

  async getDashboardStats(): Promise<ApiResponse> {
    return this.request('GET', '/api/dashboard/stats');
  }

  async checkScanAllowed(): Promise<ApiResponse<{ allowed: boolean; remaining: number }>> {
    return this.request('GET', '/api/dashboard/check-scan');
  }

  // ============================================
  // Wipe Logs
  // ============================================

  async wipeLogs(): Promise<ApiResponse> {
    return this.request('POST', '/api/wipe-logs');
  }
}

/**
 * Create API client for a specific role
 */
export function createApiClient(role: UserRole = 'user'): RapidTriageClient {
  return new RapidTriageClient(role);
}

export default RapidTriageClient;
