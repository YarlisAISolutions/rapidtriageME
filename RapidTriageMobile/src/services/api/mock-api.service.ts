/**
 * Mock API Service
 * Provides mock API responses for testing and development
 * Simulates all backend API calls with realistic data and delays
 */

import { TestUtils } from '../../utils/test-config';
import { TriageReport } from '../../store/types';

/**
 * Mock API response type
 * Standardizes the structure of all mock API responses
 */
interface MockApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

/**
 * Mock triage scan results database
 * Contains predefined scan results for different types of websites
 */
const MOCK_SCAN_RESULTS = {
  'google.com': {
    performance: {
      score: 95,
      metrics: {
        firstContentfulPaint: 800,
        largestContentfulPaint: 1200,
        cumulativeLayoutShift: 0.05,
        totalBlockingTime: 50,
        speedIndex: 900
      },
      opportunities: [
        {
          id: 'unused-css-rules',
          title: 'Remove unused CSS',
          description: 'Reduce unused CSS rules to improve load time',
          savings: 250
        }
      ]
    },
    accessibility: {
      score: 100,
      violations: []
    },
    seo: {
      score: 98,
      audits: [
        {
          id: 'meta-description',
          title: 'Document has a meta description',
          description: 'Meta descriptions are well defined',
          score: 1
        }
      ]
    },
    bestPractices: {
      score: 92,
      audits: [
        {
          id: 'is-on-https',
          title: 'Uses HTTPS',
          description: 'All resources are served over HTTPS',
          score: 1
        }
      ]
    }
  },
  'example.com': {
    performance: {
      score: 65,
      metrics: {
        firstContentfulPaint: 2100,
        largestContentfulPaint: 4200,
        cumulativeLayoutShift: 0.25,
        totalBlockingTime: 800,
        speedIndex: 3500
      },
      opportunities: [
        {
          id: 'render-blocking-resources',
          title: 'Eliminate render-blocking resources',
          description: 'Resources are blocking the first paint of your page',
          savings: 1200
        },
        {
          id: 'unused-javascript',
          title: 'Remove unused JavaScript',
          description: 'Remove unused JavaScript to reduce bytes consumed',
          savings: 850
        }
      ]
    },
    accessibility: {
      score: 78,
      violations: [
        {
          id: 'color-contrast',
          impact: 'serious' as const,
          description: 'Ensure text has sufficient color contrast',
          help: 'Elements must have sufficient color contrast',
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/color-contrast',
          nodes: 5
        }
      ]
    },
    seo: {
      score: 83,
      audits: [
        {
          id: 'meta-description',
          title: 'Document does not have a meta description',
          description: 'Meta descriptions help search engines understand your content',
          score: 0
        }
      ]
    },
    bestPractices: {
      score: 71,
      audits: [
        {
          id: 'uses-https',
          title: 'Does not use HTTPS',
          description: 'All sites should be protected with HTTPS',
          score: 0
        }
      ]
    }
  }
};

/**
 * Mock API Service Implementation
 * Provides all API functionality with mock data
 */
export class MockApiService {
  private baseURL: string;
  constructor() {
    this.baseURL = process.env.API_BASE_URL || 'https://api.test.rapidtriage.com';
    
    console.log('🧪 Mock API Service initialized:', this.baseURL);
  }

  /**
   * Simulate API request delay
   * Creates realistic response times for testing
   */
  private async simulateDelay(): Promise<void> {
    const delay = TestUtils.getDelay('api');
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Create successful API response
   */
  private createSuccessResponse<T>(data: T, message?: string): MockApiResponse<T> {
    return {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Create error API response
   */
  private createErrorResponse(error: string): MockApiResponse {
    return {
      success: false,
      error,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Mock GET request
   */
  async get<T>(endpoint: string): Promise<MockApiResponse<T>> {
    console.log('🧪 Mock API GET:', endpoint);
    await this.simulateDelay();

    try {
      // Handle different endpoints
      if (endpoint.includes('/user/profile')) {
        return this.createSuccessResponse(this.getMockUserProfile() as T);
      }
      
      if (endpoint.includes('/reports')) {
        return this.createSuccessResponse(this.getMockReports() as T);
      }
      
      if (endpoint.includes('/analytics')) {
        return this.createSuccessResponse(this.getMockAnalytics() as T);
      }
      
      // Default response
      return this.createSuccessResponse({} as T, 'Mock GET response');
    } catch (error) {
      return this.createErrorResponse(error instanceof Error ? error.message : 'Mock API error');
    }
  }

  /**
   * Mock POST request
   */
  async post<T>(endpoint: string, data?: any): Promise<MockApiResponse<T>> {
    console.log('🧪 Mock API POST:', endpoint, data);
    await this.simulateDelay();

    try {
      // Handle scan submission
      if (endpoint.includes('/scans')) {
        const scanResult = await this.createMockScanResult(data?.url || 'unknown.com');
        return this.createSuccessResponse(scanResult as T, 'Scan initiated successfully');
      }
      
      // Handle user sync
      if (endpoint.includes('/users/sync')) {
        return this.createSuccessResponse({} as T, 'User synced successfully');
      }
      
      // Handle subscription updates
      if (endpoint.includes('/subscription')) {
        return this.createSuccessResponse(this.getMockSubscription() as T);
      }
      
      // Default response
      return this.createSuccessResponse({} as T, 'Mock POST response');
    } catch (error) {
      return this.createErrorResponse(error instanceof Error ? error.message : 'Mock API error');
    }
  }

  /**
   * Mock PUT request
   */
  async put<T>(endpoint: string, data?: any): Promise<MockApiResponse<T>> {
    console.log('🧪 Mock API PUT:', endpoint, data);
    await this.simulateDelay();

    try {
      return this.createSuccessResponse({} as T, 'Mock PUT response');
    } catch (error) {
      return this.createErrorResponse(error instanceof Error ? error.message : 'Mock API error');
    }
  }

  /**
   * Mock DELETE request
   */
  async delete<T>(endpoint: string): Promise<MockApiResponse<T>> {
    console.log('🧪 Mock API DELETE:', endpoint);
    await this.simulateDelay();

    try {
      return this.createSuccessResponse({} as T, 'Mock DELETE response');
    } catch (error) {
      return this.createErrorResponse(error instanceof Error ? error.message : 'Mock API error');
    }
  }

  /**
   * Create mock scan result
   * Generates realistic scan data based on URL
   */
  private async createMockScanResult(url: string): Promise<TriageReport> {
    // Simulate scan processing time
    await TestUtils.createMockDelay('scan');

    // Extract domain for predefined results
    const domain = url.replace(/^https?:\/\//, '').split('/')[0];
    const mockResults = MOCK_SCAN_RESULTS[domain as keyof typeof MOCK_SCAN_RESULTS] || 
                       this.generateRandomScanResults();

    return {
      id: 'scan-' + Date.now(),
      url,
      status: 'completed',
      results: mockResults,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString()
    };
  }

  /**
   * Generate random scan results
   * Creates varied test data for different URLs
   */
  private generateRandomScanResults(): TriageReport['results'] {
    return {
      performance: {
        score: Math.floor(Math.random() * 40) + 60, // 60-100
        metrics: {
          firstContentfulPaint: Math.floor(Math.random() * 2000) + 500,
          largestContentfulPaint: Math.floor(Math.random() * 3000) + 1000,
          cumulativeLayoutShift: Math.random() * 0.4,
          totalBlockingTime: Math.floor(Math.random() * 800) + 100,
          speedIndex: Math.floor(Math.random() * 2500) + 1000
        },
        opportunities: [
          {
            id: 'render-blocking-resources',
            title: 'Eliminate render-blocking resources',
            description: 'Resources are blocking the first paint',
            savings: Math.floor(Math.random() * 1500) + 200
          }
        ]
      },
      accessibility: {
        score: Math.floor(Math.random() * 30) + 70,
        violations: Math.random() > 0.7 ? [
          {
            id: 'color-contrast',
            impact: 'moderate' as const,
            description: 'Elements must have sufficient color contrast',
            help: 'Ensure text has sufficient color contrast',
            helpUrl: 'https://dequeuniversity.com/rules/axe/color-contrast',
            nodes: Math.floor(Math.random() * 10) + 1
          }
        ] : []
      },
      seo: {
        score: Math.floor(Math.random() * 25) + 75,
        audits: [
          {
            id: 'meta-description',
            title: 'Document has a meta description',
            description: 'Meta descriptions help search engines',
            score: Math.random() > 0.5 ? 1 : 0
          }
        ]
      },
      bestPractices: {
        score: Math.floor(Math.random() * 20) + 80,
        audits: [
          {
            id: 'is-on-https',
            title: 'Uses HTTPS',
            description: 'All sites should use HTTPS',
            score: Math.random() > 0.3 ? 1 : 0
          }
        ]
      }
    };
  }

  /**
   * Get mock user profile data
   */
  private getMockUserProfile() {
    return {
      id: 'mock-user-' + Date.now(),
      email: 'test@rapidtriage.com',
      firstName: 'Test',
      lastName: 'User',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=testuser',
      subscription: {
        tierId: 'free',
        status: 'active',
        usage: {
          scansUsed: Math.floor(Math.random() * 8) + 1,
          scansLimit: 10
        }
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Get mock reports data
   */
  private getMockReports() {
    const reports = [];
    const domains = ['google.com', 'github.com', 'stackoverflow.com', 'example.com'];
    
    for (let i = 0; i < 5; i++) {
      const domain = domains[Math.floor(Math.random() * domains.length)];
      reports.push({
        id: 'report-' + (Date.now() - i * 3600000), // Stagger timestamps
        url: `https://${domain}`,
        status: 'completed',
        results: this.generateRandomScanResults(),
        createdAt: new Date(Date.now() - i * 3600000).toISOString(),
        completedAt: new Date(Date.now() - i * 3600000 + 30000).toISOString()
      });
    }
    
    return reports;
  }

  /**
   * Get mock analytics data
   */
  private getMockAnalytics() {
    return {
      totalScans: Math.floor(Math.random() * 100) + 25,
      averageScore: Math.floor(Math.random() * 20) + 75,
      trendsData: this.generateTrendsData(),
      topIssues: [
        { type: 'performance', count: Math.floor(Math.random() * 15) + 5 },
        { type: 'accessibility', count: Math.floor(Math.random() * 10) + 2 },
        { type: 'seo', count: Math.floor(Math.random() * 8) + 3 }
      ]
    };
  }

  /**
   * Get mock subscription data
   */
  private getMockSubscription() {
    return {
      tierId: 'free',
      status: 'active',
      usage: {
        scansUsed: Math.floor(Math.random() * 8) + 1,
        scansLimit: 10
      },
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };
  }

  /**
   * Generate mock trends data for charts
   */
  private generateTrendsData() {
    const data = [];
    const now = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      data.push({
        date: date.toISOString().split('T')[0],
        scans: Math.floor(Math.random() * 10) + 1,
        averageScore: Math.floor(Math.random() * 30) + 70
      });
    }
    
    return data;
  }

  /**
   * Mock file upload simulation
   */
  async uploadFile(file: any): Promise<MockApiResponse<{ url: string }>> {
    console.log('🧪 Mock File Upload:', file);
    await this.simulateDelay();
    
    return this.createSuccessResponse({
      url: `https://mock-cdn.rapidtriage.com/uploads/${Date.now()}-${file.name || 'file'}`
    });
  }

  /**
   * Mock real-time updates simulation
   */
  simulateRealTimeUpdate(callback: (data: any) => void): () => void {
    const interval = setInterval(() => {
      if (Math.random() > 0.8) { // 20% chance of update
        callback({
          type: 'scan_completed',
          data: {
            scanId: 'scan-' + Date.now(),
            status: 'completed',
            timestamp: new Date().toISOString()
          }
        });
      }
    }, 5000);

    // Return cleanup function
    return () => clearInterval(interval);
  }
}

// Export singleton instance
export const mockApiService = new MockApiService();