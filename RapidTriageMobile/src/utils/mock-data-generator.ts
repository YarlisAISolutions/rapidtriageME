/**
 * Mock Data Generator
 * Provides realistic test data for all app components
 * Creates consistent and varied mock data for comprehensive testing
 */

import { User, TriageReport, SubscriptionInfo } from '../store/types';
import { UserProfile } from '../services/auth/auth.service';

/**
 * Website categories for generating realistic scan URLs
 */
const WEBSITE_CATEGORIES = {
  ecommerce: [
    'amazon.com',
    'shopify.com',
    'ebay.com',
    'etsy.com',
    'walmart.com'
  ],
  news: [
    'cnn.com',
    'bbc.com',
    'nytimes.com',
    'washingtonpost.com',
    'reuters.com'
  ],
  tech: [
    'github.com',
    'stackoverflow.com',
    'medium.com',
    'dev.to',
    'hackernews.com'
  ],
  social: [
    'facebook.com',
    'twitter.com',
    'linkedin.com',
    'instagram.com',
    'reddit.com'
  ],
  business: [
    'salesforce.com',
    'hubspot.com',
    'stripe.com',
    'zoom.us',
    'slack.com'
  ]
};

/**
 * Performance score ranges by website category
 * Provides realistic performance expectations for different site types
 */
const PERFORMANCE_RANGES = {
  ecommerce: { min: 45, max: 85 },
  news: { min: 35, max: 75 },
  tech: { min: 60, max: 95 },
  social: { min: 40, max: 80 },
  business: { min: 55, max: 90 },
  default: { min: 50, max: 85 }
};

/**
 * Mock Data Generator Class
 * Provides methods to generate realistic test data
 */
export class MockDataGenerator {
  private static userCounter = 1;
  private static reportCounter = 1;

  /**
   * Generate mock user profile
   * Creates realistic user data with customizable properties
   */
  static generateUser(overrides?: Partial<User>): User {
    const userId = 'user-' + this.userCounter++;
    const firstNames = ['John', 'Jane', 'Alex', 'Sarah', 'Mike', 'Lisa', 'David', 'Emma'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
    
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;

    return {
      id: userId,
      email,
      firstName,
      lastName,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
      subscription: this.generateSubscription(),
      createdAt: this.generatePastDate(365).toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides
    };
  }

  /**
   * Generate mock user profile for auth service
   * Creates UserProfile data compatible with auth service
   */
  static generateUserProfile(overrides?: Partial<UserProfile>): UserProfile {
    const user = this.generateUser();
    
    return {
      uid: user.id,
      email: user.email,
      displayName: `${user.firstName} ${user.lastName}`,
      photoURL: user.avatar,
      phoneNumber: Math.random() > 0.5 ? '+1-555-' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0') : undefined,
      emailVerified: Math.random() > 0.2, // 80% verified
      provider: 'email' as any,
      createdAt: new Date(user.createdAt),
      lastLoginAt: new Date(),
      customClaims: {
        role: Math.random() > 0.9 ? 'admin' : 'user'
      },
      ...overrides
    };
  }

  /**
   * Generate mock subscription info
   * Creates realistic subscription data with usage tracking
   */
  static generateSubscription(overrides?: Partial<SubscriptionInfo>): SubscriptionInfo {
    const tiers = ['free', 'pro', 'team', 'enterprise'] as const;
    const statuses = ['active', 'inactive', 'cancelled', 'past_due', 'trialing'] as const;
    
    const tierId = tiers[Math.floor(Math.random() * tiers.length)];
    const limits = { free: 10, pro: -1, team: -1, enterprise: -1 };
    const limit = limits[tierId];
    
    return {
      tierId,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      currentPeriodStart: this.generatePastDate(30).toISOString(),
      currentPeriodEnd: this.generateFutureDate(30).toISOString(),
      cancelAtPeriodEnd: Math.random() > 0.8,
      trial: Math.random() > 0.7 ? {
        isTrialing: true,
        startDate: this.generatePastDate(7).toISOString(),
        endDate: this.generateFutureDate(7).toISOString(),
        daysRemaining: Math.floor(Math.random() * 14) + 1,
        hasExtended: Math.random() > 0.8,
        extensionOffered: Math.random() > 0.6,
        originalTier: 'free'
      } : undefined,
      usage: {
        scansUsed: limit === -1 ? Math.floor(Math.random() * 100) : Math.floor(Math.random() * limit),
        scansLimit: limit
      },
      ...overrides
    };
  }

  /**
   * Generate mock triage report
   * Creates realistic scan results with proper scoring
   */
  static generateTriageReport(overrides?: Partial<TriageReport>): TriageReport {
    const reportId = 'report-' + this.reportCounter++;
    const url = this.generateRandomURL();
    const category = this.getURLCategory(url);
    const performanceRange = PERFORMANCE_RANGES[category] || PERFORMANCE_RANGES.default;

    const createdAt = this.generatePastDate(30);
    const completedAt = new Date(createdAt.getTime() + Math.random() * 300000 + 30000); // 30s to 5min later

    return {
      id: reportId,
      url,
      status: Math.random() > 0.1 ? 'completed' : (Math.random() > 0.5 ? 'pending' : 'failed'),
      results: this.generateScanResults(category, performanceRange),
      createdAt: createdAt.toISOString(),
      completedAt: completedAt.toISOString(),
      ...overrides
    };
  }

  /**
   * Generate multiple mock reports
   * Creates a collection of varied triage reports
   */
  static generateTriageReports(count: number = 10): TriageReport[] {
    return Array.from({ length: count }, () => this.generateTriageReport());
  }

  /**
   * Generate mock scan results
   * Creates realistic performance, accessibility, SEO, and best practices scores
   */
  static generateScanResults(category: string = 'default', performanceRange: { min: number; max: number }) {
    const performanceScore = Math.floor(Math.random() * (performanceRange.max - performanceRange.min) + performanceRange.min);
    
    return {
      performance: {
        score: performanceScore,
        metrics: {
          firstContentfulPaint: this.generateMetricValue(500, 3000, performanceScore),
          largestContentfulPaint: this.generateMetricValue(1000, 5000, performanceScore),
          cumulativeLayoutShift: this.generateCLSValue(performanceScore),
          totalBlockingTime: this.generateMetricValue(50, 1000, performanceScore, true),
          speedIndex: this.generateMetricValue(1000, 4000, performanceScore)
        },
        opportunities: this.generatePerformanceOpportunities(performanceScore)
      },
      accessibility: {
        score: Math.floor(Math.random() * 30) + 70, // 70-100
        violations: this.generateAccessibilityViolations()
      },
      seo: {
        score: Math.floor(Math.random() * 25) + 75, // 75-100
        audits: this.generateSEOAudits()
      },
      bestPractices: {
        score: Math.floor(Math.random() * 20) + 80, // 80-100
        audits: this.generateBestPracticesAudits()
      }
    };
  }

  /**
   * Generate realistic website URLs for testing
   */
  static generateRandomURL(): string {
    const categories = Object.keys(WEBSITE_CATEGORIES);
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    const websites = WEBSITE_CATEGORIES[randomCategory as keyof typeof WEBSITE_CATEGORIES];
    const randomWebsite = websites[Math.floor(Math.random() * websites.length)];
    
    const protocols = ['https://'];
    const subdomains = ['', 'www.', 'blog.', 'shop.', 'app.'];
    const paths = ['', '/home', '/about', '/products', '/blog', '/contact'];
    
    const protocol = protocols[Math.floor(Math.random() * protocols.length)];
    const subdomain = subdomains[Math.floor(Math.random() * subdomains.length)];
    const path = paths[Math.floor(Math.random() * paths.length)];
    
    return `${protocol}${subdomain}${randomWebsite}${path}`;
  }

  /**
   * Generate multiple random URLs
   */
  static generateRandomURLs(count: number = 5): string[] {
    return Array.from({ length: count }, () => this.generateRandomURL());
  }

  // Private helper methods

  private static generatePastDate(maxDaysAgo: number): Date {
    const daysAgo = Math.floor(Math.random() * maxDaysAgo);
    return new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  }

  private static generateFutureDate(maxDaysFromNow: number): Date {
    const daysFromNow = Math.floor(Math.random() * maxDaysFromNow);
    return new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
  }

  private static getURLCategory(url: string): string {
    for (const [category, websites] of Object.entries(WEBSITE_CATEGORIES)) {
      if (websites.some(site => url.includes(site))) {
        return category;
      }
    }
    return 'default';
  }

  private static generateMetricValue(min: number, max: number, score: number, inverse = false): number {
    // Higher scores should generally mean better (lower) metric values, except for inverse metrics
    const normalizedScore = score / 100;
    const range = max - min;
    
    let factor;
    if (inverse) {
      factor = normalizedScore; // Higher score = higher value for inverse metrics
    } else {
      factor = 1 - normalizedScore; // Higher score = lower value for normal metrics
    }
    
    return Math.floor(min + range * factor);
  }

  private static generateCLSValue(score: number): number {
    // Cumulative Layout Shift - lower is better
    const normalizedScore = score / 100;
    const maxCLS = 0.5;
    return +(maxCLS * (1 - normalizedScore)).toFixed(3);
  }

  private static generatePerformanceOpportunities(score: number): Array<{id: string; title: string; description: string; savings: number}> {
    if (score > 85) return [];
    
    const allOpportunities = [
      {
        id: 'render-blocking-resources',
        title: 'Eliminate render-blocking resources',
        description: 'Resources are blocking the first paint of your page',
        baseSavings: 800
      },
      {
        id: 'unused-css-rules',
        title: 'Remove unused CSS',
        description: 'Reduce unused CSS rules to improve load performance',
        baseSavings: 400
      },
      {
        id: 'unused-javascript',
        title: 'Remove unused JavaScript',
        description: 'Remove unused JavaScript to reduce bytes consumed by network activity',
        baseSavings: 600
      },
      {
        id: 'next-gen-formats',
        title: 'Serve images in next-gen formats',
        description: 'Image formats like WebP and AVIF often provide better compression',
        baseSavings: 300
      }
    ];

    const numOpportunities = Math.floor((100 - score) / 20) + 1;
    const selectedOpportunities = allOpportunities
      .sort(() => Math.random() - 0.5)
      .slice(0, numOpportunities);

    return selectedOpportunities.map(opp => ({
      id: opp.id,
      title: opp.title,
      description: opp.description,
      savings: Math.floor(opp.baseSavings * (1 - score / 100) + Math.random() * 200)
    }));
  }

  private static generateAccessibilityViolations(): Array<{id: string; impact: string; description: string; help: string; helpUrl: string; nodes: number}> {
    const violations = [
      {
        id: 'color-contrast',
        impact: 'serious',
        description: 'Elements must have sufficient color contrast',
        help: 'Ensure that text has sufficient color contrast',
        helpUrl: 'https://dequeuniversity.com/rules/axe/color-contrast'
      },
      {
        id: 'image-alt',
        impact: 'critical',
        description: 'Images must have alternate text',
        help: 'Provide alternative text for images',
        helpUrl: 'https://dequeuniversity.com/rules/axe/image-alt'
      },
      {
        id: 'button-name',
        impact: 'critical',
        description: 'Buttons must have discernible text',
        help: 'Ensure buttons have accessible names',
        helpUrl: 'https://dequeuniversity.com/rules/axe/button-name'
      }
    ];

    if (Math.random() > 0.6) return [];

    const numViolations = Math.floor(Math.random() * 2) + 1;
    return violations
      .sort(() => Math.random() - 0.5)
      .slice(0, numViolations)
      .map(v => ({
        ...v,
        nodes: Math.floor(Math.random() * 10) + 1
      }));
  }

  private static generateSEOAudits(): Array<{id: string; title: string; description: string; score: number}> {
    const audits = [
      {
        id: 'meta-description',
        title: 'Document has a meta description',
        description: 'Meta descriptions help search engines understand page content'
      },
      {
        id: 'document-title',
        title: 'Document has a title element',
        description: 'Title elements help search engines understand page topics'
      },
      {
        id: 'hreflang',
        title: 'Document has a valid hreflang',
        description: 'hreflang links tell search engines about localized versions'
      }
    ];

    return audits.map(audit => ({
      ...audit,
      score: Math.random() > 0.3 ? 1 : 0
    }));
  }

  private static generateBestPracticesAudits(): Array<{id: string; title: string; description: string; score: number}> {
    const audits = [
      {
        id: 'is-on-https',
        title: 'Uses HTTPS',
        description: 'All sites should be protected with HTTPS'
      },
      {
        id: 'external-anchors-use-rel-noopener',
        title: 'Links to cross-origin destinations are safe',
        description: 'Add rel="noopener" to external links'
      },
      {
        id: 'no-vulnerable-libraries',
        title: 'Avoids front-end JavaScript libraries with known vulnerabilities',
        description: 'Some third-party scripts contain known security vulnerabilities'
      }
    ];

    return audits.map(audit => ({
      ...audit,
      score: Math.random() > 0.2 ? 1 : 0
    }));
  }
}

// Export convenience functions
export const generateMockUser = MockDataGenerator.generateUser;
export const generateMockTriageReport = MockDataGenerator.generateTriageReport;
export const generateMockTriageReports = MockDataGenerator.generateTriageReports;
export const generateRandomURL = MockDataGenerator.generateRandomURL;