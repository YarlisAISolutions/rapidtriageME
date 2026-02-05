/**
 * Stripe Service Unit Tests
 */

// Mock all dependencies before imports
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    customers: {
      create: jest.fn(() => Promise.resolve({ id: 'cus_mock123' })),
      retrieve: jest.fn(() => Promise.resolve({ id: 'cus_mock123', email: 'test@example.com' })),
    },
    subscriptions: {
      update: jest.fn(() => Promise.resolve({ id: 'sub_mock123', status: 'active' })),
      list: jest.fn(() => Promise.resolve({ data: [] })),
    },
    checkout: {
      sessions: {
        create: jest.fn(() => Promise.resolve({
          id: 'cs_mock123',
          url: 'https://checkout.stripe.com/mock',
        })),
      },
    },
    billingPortal: {
      sessions: {
        create: jest.fn(() => Promise.resolve({ url: 'https://billing.stripe.com/mock' })),
      },
    },
    invoices: {
      list: jest.fn(() => Promise.resolve({
        data: [
          {
            id: 'inv_mock123',
            number: 'INV-001',
            status: 'paid',
            amount_due: 1900,
            amount_paid: 1900,
            currency: 'usd',
            period_start: 1700000000,
            period_end: 1702678400,
            created: 1700000000,
            hosted_invoice_url: 'https://invoice.stripe.com/mock',
            invoice_pdf: 'https://invoice.stripe.com/mock.pdf',
          },
        ],
      })),
      createPreview: jest.fn(() => Promise.resolve({
        amount_due: 1900,
        currency: 'usd',
        period_start: 1702678400,
        period_end: 1705356800,
        lines: { data: [{ description: 'User Plan', amount: 1900 }] },
      })),
    },
    webhooks: {
      constructEvent: jest.fn((body, sig, secret) => JSON.parse(body)),
    },
  }));
});

jest.mock('firebase-admin', () => {
  const mockDoc = {
    get: jest.fn(() => Promise.resolve({
      exists: true,
      data: () => ({
        stripeCustomerId: 'cus_existing123',
        email: 'test@example.com',
      }),
    })),
    set: jest.fn(() => Promise.resolve()),
    update: jest.fn(() => Promise.resolve()),
  };

  const mockCollection = {
    doc: jest.fn(() => mockDoc),
  };

  const mockFirestore = jest.fn(() => ({
    collection: jest.fn(() => mockCollection),
  }));

  return {
    initializeApp: jest.fn(),
    apps: [],
    firestore: Object.assign(mockFirestore, {
      FieldValue: {
        serverTimestamp: jest.fn(() => 'timestamp'),
        increment: jest.fn((n) => n),
      },
      Timestamp: {
        now: jest.fn(() => ({ toDate: () => new Date() })),
        fromMillis: jest.fn((ms) => ({ toDate: () => new Date(ms) })),
      },
    }),
  };
});

jest.mock('firebase-functions', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

import {
  SubscriptionTier,
  SubscriptionStatus,
  UserSubscription,
  PricingPlan,
  PRICING_PLANS,
} from '../../../src/services/stripe.service';

describe('Stripe Service', () => {
  describe('SubscriptionTier Enum', () => {
    it('should define all subscription tiers', () => {
      expect(SubscriptionTier.FREE).toBe('free');
      expect(SubscriptionTier.USER).toBe('user');
      expect(SubscriptionTier.TEAM).toBe('team');
      expect(SubscriptionTier.ENTERPRISE).toBe('enterprise');
    });

    it('should have 4 tiers', () => {
      const tiers = Object.values(SubscriptionTier);
      expect(tiers).toHaveLength(4);
    });
  });

  describe('SubscriptionStatus Type', () => {
    it('should support all status values', () => {
      const statuses: SubscriptionStatus[] = [
        'active',
        'canceled',
        'past_due',
        'incomplete',
        'trialing',
        'unpaid',
      ];
      expect(statuses).toHaveLength(6);
    });
  });

  describe('PRICING_PLANS', () => {
    it('should have 4 pricing plans', () => {
      expect(PRICING_PLANS).toHaveLength(4);
    });

    describe('Free Plan', () => {
      const freePlan = PRICING_PLANS.find(p => p.tier === SubscriptionTier.FREE);

      it('should exist', () => {
        expect(freePlan).toBeDefined();
      });

      it('should have zero price', () => {
        expect(freePlan?.priceMonthly).toBe(0);
        expect(freePlan?.priceYearly).toBe(0);
      });

      it('should have limited scans', () => {
        expect(freePlan?.monthlyScans).toBe(10);
      });

      it('should have 1 max user', () => {
        expect(freePlan?.maxUsers).toBe(1);
      });

      it('should have features', () => {
        expect(freePlan?.features).toContain('10 scans per month');
        expect(freePlan?.features).toContain('Basic accessibility checks');
      });
    });

    describe('User Plan', () => {
      const userPlan = PRICING_PLANS.find(p => p.tier === SubscriptionTier.USER);

      it('should exist', () => {
        expect(userPlan).toBeDefined();
      });

      it('should have correct pricing', () => {
        expect(userPlan?.priceMonthly).toBe(1900); // $19/month in cents
        expect(userPlan?.priceYearly).toBe(19000); // $190/year in cents
      });

      it('should have 100 scans', () => {
        expect(userPlan?.monthlyScans).toBe(100);
      });

      it('should have 1 max user', () => {
        expect(userPlan?.maxUsers).toBe(1);
      });

      it('should have more features than free', () => {
        expect(userPlan?.features.length).toBeGreaterThan(
          PRICING_PLANS.find(p => p.tier === SubscriptionTier.FREE)?.features.length || 0
        );
      });
    });

    describe('Team Plan', () => {
      const teamPlan = PRICING_PLANS.find(p => p.tier === SubscriptionTier.TEAM);

      it('should exist', () => {
        expect(teamPlan).toBeDefined();
      });

      it('should have correct pricing', () => {
        expect(teamPlan?.priceMonthly).toBe(4900); // $49/month in cents
        expect(teamPlan?.priceYearly).toBe(49000); // $490/year in cents
      });

      it('should have 500 scans', () => {
        expect(teamPlan?.monthlyScans).toBe(500);
      });

      it('should support 5 users', () => {
        expect(teamPlan?.maxUsers).toBe(5);
      });

      it('should include API access', () => {
        expect(teamPlan?.features).toContain('API access');
      });
    });

    describe('Enterprise Plan', () => {
      const enterprisePlan = PRICING_PLANS.find(p => p.tier === SubscriptionTier.ENTERPRISE);

      it('should exist', () => {
        expect(enterprisePlan).toBeDefined();
      });

      it('should have custom pricing (zero)', () => {
        expect(enterprisePlan?.priceMonthly).toBe(0);
        expect(enterprisePlan?.priceYearly).toBe(0);
      });

      it('should have unlimited scans', () => {
        expect(enterprisePlan?.monthlyScans).toBeNull();
      });

      it('should have unlimited users', () => {
        expect(enterprisePlan?.maxUsers).toBe(-1);
      });

      it('should include SSO', () => {
        expect(enterprisePlan?.features).toContain('SSO integration');
      });

      it('should include SLA', () => {
        expect(enterprisePlan?.features).toContain('SLA guarantee');
      });
    });
  });

  describe('PricingPlan Interface', () => {
    it('should define complete plan structure', () => {
      const plan: PricingPlan = {
        id: 'test',
        tier: SubscriptionTier.USER,
        name: 'Test Plan',
        description: 'A test plan',
        priceMonthly: 1000,
        priceYearly: 10000,
        features: ['Feature 1', 'Feature 2'],
        monthlyScans: 50,
        maxUsers: 3,
        stripePriceIdMonthly: 'price_monthly_123',
        stripePriceIdYearly: 'price_yearly_123',
      };

      expect(plan.id).toBe('test');
      expect(plan.tier).toBe(SubscriptionTier.USER);
      expect(plan.features).toHaveLength(2);
    });

    it('should allow null monthly scans for unlimited', () => {
      const plan: PricingPlan = {
        id: 'unlimited',
        tier: SubscriptionTier.ENTERPRISE,
        name: 'Unlimited',
        description: 'Unlimited plan',
        priceMonthly: 0,
        priceYearly: 0,
        features: [],
        monthlyScans: null,
        maxUsers: -1,
      };

      expect(plan.monthlyScans).toBeNull();
    });
  });

  describe('UserSubscription Interface', () => {
    it('should define subscription structure', () => {
      const mockTimestamp = { toDate: () => new Date() } as any;

      const subscription: UserSubscription = {
        userId: 'user-123',
        tier: SubscriptionTier.USER,
        status: 'active',
        stripeCustomerId: 'cus_123',
        stripeSubscriptionId: 'sub_123',
        stripePriceId: 'price_123',
        currentPeriodStart: mockTimestamp,
        currentPeriodEnd: mockTimestamp,
        cancelAtPeriodEnd: false,
        trialEnd: null,
        createdAt: mockTimestamp,
        updatedAt: mockTimestamp,
      };

      expect(subscription.userId).toBe('user-123');
      expect(subscription.tier).toBe(SubscriptionTier.USER);
      expect(subscription.status).toBe('active');
    });

    it('should allow null stripe IDs for free tier', () => {
      const mockTimestamp = { toDate: () => new Date() } as any;

      const subscription: UserSubscription = {
        userId: 'user-123',
        tier: SubscriptionTier.FREE,
        status: 'active',
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        stripePriceId: null,
        currentPeriodStart: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        trialEnd: null,
        createdAt: mockTimestamp,
        updatedAt: mockTimestamp,
      };

      expect(subscription.stripeCustomerId).toBeNull();
      expect(subscription.stripeSubscriptionId).toBeNull();
    });
  });

  describe('Pricing Calculations', () => {
    it('should provide savings for yearly plans', () => {
      const userPlan = PRICING_PLANS.find(p => p.tier === SubscriptionTier.USER);
      if (userPlan) {
        const monthlyCostPerYear = userPlan.priceMonthly * 12;
        const yearlyCost = userPlan.priceYearly;
        const savings = monthlyCostPerYear - yearlyCost;
        const savingsPercent = (savings / monthlyCostPerYear) * 100;

        expect(savings).toBeGreaterThan(0);
        expect(savingsPercent).toBeCloseTo(16.67, 0);
      }
    });

    it('should calculate cost per scan for each tier', () => {
      const userPlan = PRICING_PLANS.find(p => p.tier === SubscriptionTier.USER);
      const teamPlan = PRICING_PLANS.find(p => p.tier === SubscriptionTier.TEAM);

      if (userPlan && teamPlan) {
        const userCostPerScan = userPlan.priceMonthly / (userPlan.monthlyScans || 1);
        const teamCostPerScan = teamPlan.priceMonthly / (teamPlan.monthlyScans || 1);

        // Team plan should be more cost-effective per scan
        expect(teamCostPerScan).toBeLessThan(userCostPerScan);
      }
    });

    it('should scale appropriately between tiers', () => {
      const userPlan = PRICING_PLANS.find(p => p.tier === SubscriptionTier.USER);
      const teamPlan = PRICING_PLANS.find(p => p.tier === SubscriptionTier.TEAM);

      if (userPlan && teamPlan) {
        // Team should have 5x the scans for ~2.6x the price
        const scanMultiple = (teamPlan.monthlyScans || 0) / (userPlan.monthlyScans || 1);
        const priceMultiple = teamPlan.priceMonthly / userPlan.priceMonthly;

        expect(scanMultiple).toBe(5);
        expect(priceMultiple).toBeCloseTo(2.58, 1);
      }
    });
  });

  describe('Plan Tiers Ordering', () => {
    it('should be ordered from lowest to highest', () => {
      const tiers = PRICING_PLANS.map(p => p.tier);
      expect(tiers).toEqual([
        SubscriptionTier.FREE,
        SubscriptionTier.USER,
        SubscriptionTier.TEAM,
        SubscriptionTier.ENTERPRISE,
      ]);
    });

    it('should have increasing scan limits', () => {
      const scansOrder = PRICING_PLANS
        .filter(p => p.monthlyScans !== null)
        .map(p => p.monthlyScans);

      for (let i = 1; i < scansOrder.length; i++) {
        expect(scansOrder[i]).toBeGreaterThan(scansOrder[i - 1]!);
      }
    });
  });
});
