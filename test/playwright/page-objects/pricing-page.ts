import { Page, Locator } from '@playwright/test';
import { BasePage } from './base-page';

/**
 * Pricing Page Object Model
 * Critical for monetization and billing validation
 */
export class PricingPage extends BasePage {
  // Pricing tiers
  readonly freeTierCard: Locator;
  readonly proPlanCard: Locator;
  readonly enterpriseCard: Locator;

  // Pricing elements
  readonly monthlyToggle: Locator;
  readonly annualToggle: Locator;
  readonly priceDisplays: Locator;
  readonly featuresLists: Locator;

  // CTA buttons for each tier
  readonly freeStartButton: Locator;
  readonly proUpgradeButton: Locator;
  readonly enterpriseContactButton: Locator;

  // Billing information
  readonly billingFrequency: Locator;
  readonly discountBadges: Locator;
  readonly moneyBackGuarantee: Locator;

  // FAQ and support
  readonly faqSection: Locator;
  readonly supportContact: Locator;

  constructor(page: Page) {
    super(page);

    // Using class selectors based on the actual pricing page HTML
    this.freeTierCard = page.locator('.pricing-card').filter({ hasText: 'Free' });
    this.proPlanCard = page.locator('.pricing-card').filter({ hasText: 'Professional' });
    this.enterpriseCard = page.locator('.pricing-card').filter({ hasText: 'Enterprise' });

    // Pricing controls
    this.monthlyToggle = page.locator('#monthly');
    this.annualToggle = page.locator('#annual');
    this.priceDisplays = page.locator('.price');
    this.featuresLists = page.locator('.feature-list');

    // CTA buttons
    this.freeStartButton = page.locator('button:has-text("Get Started")').first();
    this.proUpgradeButton = page.locator('button:has-text("Upgrade Now")');
    this.enterpriseContactButton = page.locator('button:has-text("Contact Sales")');

    // Billing elements
    this.billingFrequency = page.locator('.billing-toggle');
    this.discountBadges = page.locator('.discount');
    this.moneyBackGuarantee = page.locator('.guarantee');

    // Support elements
    this.faqSection = page.locator('.faq-section');
    this.supportContact = page.locator('.support-contact');
  }

  async load(): Promise<void> {
    await this.goto('/pricing');
    await this.page.waitForSelector('.pricing-card', { state: 'visible' });
  }

  // Billing toggle functionality
  async switchToAnnualBilling(): Promise<void> {
    await this.annualToggle.click();
    await this.page.waitForTimeout(500); // Animation completion

    // Verify price updates
    await this.page.waitForFunction(() => {
      const priceElements = document.querySelectorAll('.price');
      return Array.from(priceElements).some(el => el.textContent?.includes('year'));
    });
  }

  async switchToMonthlyBilling(): Promise<void> {
    await this.monthlyToggle.click();
    await this.page.waitForTimeout(500);

    await this.page.waitForFunction(() => {
      const priceElements = document.querySelectorAll('.price');
      return Array.from(priceElements).some(el => el.textContent?.includes('month'));
    });
  }

  // Conversion actions
  async selectProPlan(): Promise<void> {
    await this.proUpgradeButton.click();
    await this.page.waitForTimeout(1000);
  }

  async selectEnterprisePlan(): Promise<void> {
    await this.enterpriseContactButton.click();
    await this.page.waitForTimeout(1000);
  }

  // Pricing validation helpers
  async validatePricingDisplay(): Promise<Record<string, any>> {
    const prices = await this.priceDisplays.allTextContents();
    const features = await this.featuresLists.allTextContents();

    return {
      pricesDisplayed: prices.length > 0,
      featuresListed: features.length > 0,
      discountsVisible: await this.discountBadges.count() > 0,
      guaranteeShown: await this.moneyBackGuarantee.isVisible().catch(() => false)
    };
  }

  // Accessibility validation for pricing
  async validatePricingAccessibility(): Promise<boolean> {
    // Check for proper ARIA labels on pricing cards
    const cardLabels = await this.page.locator('.pricing-card[aria-label]').count();
    const buttonLabels = await this.page.locator('button[aria-label]').count();

    return cardLabels >= 3 || buttonLabels >= 3; // At least 3 pricing tiers
  }

  // Price comparison functionality
  async comparePricingPlans(): Promise<Record<string, any>> {
    const freeFeatures = await this.freeTierCard.locator('li').count();
    const proFeatures = await this.proPlanCard.locator('li').count();
    const enterpriseFeatures = await this.enterpriseCard.locator('li').count();

    return {
      freeFeaturesCount: freeFeatures,
      proFeaturesCount: proFeatures,
      enterpriseFeaturesCount: enterpriseFeatures,
      properHierarchy: freeFeatures < proFeatures && proFeatures <= enterpriseFeatures
    };
  }
}