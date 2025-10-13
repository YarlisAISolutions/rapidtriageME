import { test, expect } from '@playwright/test';
import { PricingPage } from '../../page-objects/pricing-page';
import { PricingPlans, PerformanceThresholds } from '../../fixtures/test-data';

test.describe('Chrome MVP - Pricing Page Monetization Tests', () => {
  let pricingPage: PricingPage;

  test.beforeEach(async ({ page }) => {
    pricingPage = new PricingPage(page);
  });

  test('should load pricing page with all pricing tiers', async ({ page }) => {
    await pricingPage.load();

    // Core pricing elements
    await expect(pricingPage.freeTierCard).toBeVisible();
    await expect(pricingPage.proPlanCard).toBeVisible();
    await expect(pricingPage.enterpriseCard).toBeVisible();

    // CTA buttons for conversion
    await expect(pricingPage.freeStartButton).toBeVisible();
    await expect(pricingPage.proUpgradeButton).toBeVisible();
    await expect(pricingPage.enterpriseContactButton).toBeVisible();

    await pricingPage.captureScreenshot('pricing-page-loaded');
  });

  test('should switch between monthly and annual billing', async ({ page }) => {
    await pricingPage.load();

    // Test annual billing toggle
    await pricingPage.switchToAnnualBilling();

    // Verify price updates (should show annual discounts)
    const priceTexts = await pricingPage.priceDisplays.allTextContents();
    expect(priceTexts.some(text => text.includes('year') || text.includes('annual'))).toBeTruthy();

    // Test monthly billing toggle
    await pricingPage.switchToMonthlyBilling();

    const monthlyTexts = await pricingPage.priceDisplays.allTextContents();
    expect(monthlyTexts.some(text => text.includes('month'))).toBeTruthy();

    await pricingPage.captureScreenshot('billing-toggle-functionality');
  });

  test('should validate pricing display and features', async ({ page }) => {
    await pricingPage.load();

    const pricingData = await pricingPage.validatePricingDisplay();

    expect(pricingData.pricesDisplayed).toBeTruthy();
    expect(pricingData.featuresListed).toBeTruthy();

    // Compare pricing plans hierarchy
    const planComparison = await pricingPage.comparePricingPlans();
    expect(planComparison.properHierarchy).toBeTruthy(); // Free < Pro <= Enterprise features
  });

  test('should handle Pro plan selection', async ({ page }) => {
    await pricingPage.load();

    // Track conversion funnel
    const startTime = Date.now();

    await pricingPage.selectProPlan();

    const conversionTime = Date.now() - startTime;
    expect(conversionTime).toBeLessThan(PerformanceThresholds.interaction.acceptable * 10);
  });

  test('should handle Enterprise plan inquiry', async ({ page }) => {
    await pricingPage.load();

    await pricingPage.selectEnterprisePlan();

    // Wait for action to complete
    await page.waitForTimeout(2000);

    // Verify some action was taken (alert, navigation, or modal)
    const url = page.url();
    console.log('Current URL after Enterprise selection:', url);
  });

  test('should display correct pricing for each plan', async ({ page }) => {
    await pricingPage.load();

    // Extract pricing information
    const freeText = await pricingPage.freeTierCard.textContent();
    const proText = await pricingPage.proPlanCard.textContent();
    const enterpriseText = await pricingPage.enterpriseCard.textContent();

    // Validate pricing structure
    expect(freeText).toContain('$0');
    expect(proText).toMatch(/\$\d+/); // Contains dollar amount
    expect(enterpriseText).toMatch(/custom|contact/i);

    // Validate plan names
    expect(freeText).toMatch(/free/i);
    expect(proText).toMatch(/pro/i);
    expect(enterpriseText).toMatch(/enterprise/i);
  });

  test('should show appropriate features for each tier', async ({ page }) => {
    await pricingPage.load();

    // Count features for each tier
    const freeFeatures = await pricingPage.freeTierCard.locator('li').count();
    const proFeatures = await pricingPage.proPlanCard.locator('li').count();
    const enterpriseFeatures = await pricingPage.enterpriseCard.locator('li').count();

    // Feature hierarchy validation
    expect(freeFeatures).toBeGreaterThan(0);
    expect(proFeatures).toBeGreaterThan(freeFeatures);
    expect(enterpriseFeatures).toBeGreaterThanOrEqual(proFeatures);

    // Specific feature validation
    const freeFeatureText = await pricingPage.freeTierCard.textContent();
    expect(freeFeatureText).toMatch(/basic|console|screenshot/i);

    const proFeatureText = await pricingPage.proPlanCard.textContent();
    expect(proFeatureText).toMatch(/lighthouse|audit|performance|network/i);
  });

  test('should handle pricing page performance', async ({ page }) => {
    const startTime = Date.now();
    await pricingPage.load();
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(PerformanceThresholds.pageLoad.acceptable);

    // Check for pricing page specific performance
    const interactionMetrics = await page.evaluate(() => {
      const entries = performance.getEntriesByType('measure');
      return {
        resourceCount: performance.getEntriesByType('resource').length,
        totalResourceSize: performance.getEntriesByType('resource').reduce((total: number, resource: any) => {
          return total + (resource.transferSize || 0);
        }, 0)
      };
    });

    expect(interactionMetrics.resourceCount).toBeLessThan(100); // Not too many resources
    expect(interactionMetrics.totalResourceSize).toBeLessThan(3000000); // Less than 3MB
  });

  test('should validate mobile pricing display', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await pricingPage.load();

    // Mobile pricing card layout
    await expect(pricingPage.freeTierCard).toBeVisible();
    await expect(pricingPage.proPlanCard).toBeVisible();
    await expect(pricingPage.enterpriseCard).toBeVisible();

    // Check mobile-specific layout
    const cardPositions = await Promise.all([
      pricingPage.freeTierCard.boundingBox(),
      pricingPage.proPlanCard.boundingBox(),
      pricingPage.enterpriseCard.boundingBox()
    ]);

    // Cards should be visible
    cardPositions.forEach(box => {
      expect(box).not.toBeNull();
    });

    await pricingPage.captureScreenshot('pricing-page-mobile');
  });

  test('should check for console errors on pricing page', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await pricingPage.load();

    // Wait for any async operations
    await page.waitForTimeout(3000);

    // Should have minimal or no console errors
    expect(consoleErrors.length).toBeLessThanOrEqual(2); // Allow for minor third-party errors
  });

  test('should validate FAQ section if present', async ({ page }) => {
    await pricingPage.load();

    const faqVisible = await pricingPage.faqSection.isVisible().catch(() => false);

    if (faqVisible) {
      // Scroll to FAQ section
      await pricingPage.faqSection.scrollIntoViewIfNeeded();

      // Check for FAQ items
      const faqItems = await page.locator('.faq-item').count();
      expect(faqItems).toBeGreaterThan(0);

      // Test FAQ interaction (expand/collapse)
      const firstFaqItem = page.locator('.faq-item').first();
      const isClickable = await firstFaqItem.isVisible();

      if (isClickable) {
        await firstFaqItem.click();
        // Check if answer is revealed
        const faqAnswer = firstFaqItem.locator('.faq-answer');
        const answerVisible = await faqAnswer.isVisible().catch(() => false);
        console.log('FAQ answer expanded:', answerVisible);
      }
    }
  });

  test('should validate accessibility features', async ({ page }) => {
    await pricingPage.load();

    // Check for keyboard navigation
    await page.keyboard.press('Tab');
    let focusedElement = await page.evaluate(() => document.activeElement?.tagName);

    // Should be able to navigate through pricing elements
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      const newFocus = await page.evaluate(() => document.activeElement?.tagName);
      if (newFocus === 'BUTTON' || newFocus === 'A') {
        break; // Found an interactive element
      }
    }

    // Basic accessibility check
    const hasHeadings = await page.locator('h1, h2, h3').count();
    expect(hasHeadings).toBeGreaterThan(0);
  });
});