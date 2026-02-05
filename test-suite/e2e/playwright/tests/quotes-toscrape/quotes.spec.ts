/**
 * Quotes to Scrape - E2E Automation Tests
 *
 * URL: https://quotes.toscrape.com
 * Use Case: Infinite scroll, login, data extraction
 *
 * Tests various automation capabilities:
 * - Quote extraction
 * - Author data
 * - Tag filtering
 * - Login flow
 * - Infinite scroll handling
 */

import { test, expect, Page } from '@playwright/test';
import { takeScreenshot, scrollToBottom, scrollIncrementally } from '../../utils/helpers';
import { TEST_USERS } from '../../config/test-users';
import { getCredentials } from '../../config/secrets';

const BASE_URL = 'https://quotes.toscrape.com';
const SCROLL_URL = 'https://quotes.toscrape.com/scroll';

// Quote interface
interface Quote {
  text: string;
  author: string;
  tags: string[];
}

// Author interface
interface Author {
  name: string;
  birthDate?: string;
  birthLocation?: string;
  bio?: string;
}

// Page helper class
class QuotesPage {
  constructor(private page: Page) {}

  async navigate(path: string = ''): Promise<void> {
    await this.page.goto(`${BASE_URL}${path}`);
    await this.page.waitForLoadState('networkidle');
  }

  async navigateScroll(): Promise<void> {
    await this.page.goto(SCROLL_URL);
    await this.page.waitForLoadState('networkidle');
  }

  async getQuotes(): Promise<Quote[]> {
    const quotes: Quote[] = [];
    const quoteElements = this.page.locator('.quote');
    const count = await quoteElements.count();

    for (let i = 0; i < count; i++) {
      const element = quoteElements.nth(i);
      const text = await element.locator('.text').textContent() || '';
      const author = await element.locator('.author').textContent() || '';
      const tagElements = element.locator('.tags .tag');
      const tagCount = await tagElements.count();
      const tags: string[] = [];

      for (let j = 0; j < tagCount; j++) {
        const tag = await tagElements.nth(j).textContent() || '';
        tags.push(tag.trim());
      }

      quotes.push({
        text: text.replace(/[""]/g, '').trim(),
        author: author.trim(),
        tags,
      });
    }

    return quotes;
  }

  async getAllTags(): Promise<string[]> {
    const tags: string[] = [];
    const tagElements = this.page.locator('.tag-item a, .tags-box .tag');
    const count = await tagElements.count();

    for (let i = 0; i < count; i++) {
      const tag = await tagElements.nth(i).textContent() || '';
      tags.push(tag.trim());
    }

    return [...new Set(tags)]; // Remove duplicates
  }

  async filterByTag(tag: string): Promise<void> {
    const tagLink = this.page.locator(`.tag-item a:has-text("${tag}"), a.tag:has-text("${tag}")`).first();
    await tagLink.click();
    await this.page.waitForLoadState('networkidle');
  }

  async goToNextPage(): Promise<boolean> {
    const nextButton = this.page.locator('li.next a');
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await this.page.waitForLoadState('networkidle');
      return true;
    }
    return false;
  }

  async login(username: string, password: string): Promise<boolean> {
    await this.navigate('/login');
    await this.page.fill('#username', username);
    await this.page.fill('#password', password);
    await this.page.click('input[type="submit"]');
    await this.page.waitForLoadState('networkidle');

    // Check if logged in by looking for logout link
    const logoutLink = this.page.locator('a[href="/logout"]');
    return logoutLink.isVisible();
  }

  async logout(): Promise<void> {
    const logoutLink = this.page.locator('a[href="/logout"]');
    if (await logoutLink.isVisible()) {
      await logoutLink.click();
      await this.page.waitForLoadState('networkidle');
    }
  }

  async isLoggedIn(): Promise<boolean> {
    const logoutLink = this.page.locator('a[href="/logout"]');
    return logoutLink.isVisible();
  }

  async getAuthorDetails(authorName: string): Promise<Author | null> {
    const authorLink = this.page.locator(`.author + a:has-text("(about)")`).first();
    if (!(await authorLink.isVisible())) {
      return null;
    }

    await authorLink.click();
    await this.page.waitForLoadState('networkidle');

    const name = await this.page.locator('.author-title').textContent() || '';
    const birthDate = await this.page.locator('.author-born-date').textContent() || '';
    const birthLocation = await this.page.locator('.author-born-location').textContent() || '';
    const bio = await this.page.locator('.author-description').textContent() || '';

    return {
      name: name.trim(),
      birthDate: birthDate.trim(),
      birthLocation: birthLocation.trim(),
      bio: bio.trim(),
    };
  }

  // Infinite scroll handling
  async scrollAndCollectQuotes(maxScrolls: number = 5): Promise<Quote[]> {
    const allQuotes: Quote[] = [];
    let previousCount = 0;
    let scrollCount = 0;

    while (scrollCount < maxScrolls) {
      const quotes = await this.getQuotes();
      allQuotes.length = 0;
      allQuotes.push(...quotes);

      if (quotes.length === previousCount) {
        // No new content loaded
        break;
      }

      previousCount = quotes.length;
      await scrollToBottom(this.page);
      await this.page.waitForTimeout(1000); // Wait for content to load
      scrollCount++;
    }

    return allQuotes;
  }
}

// ============================================
// TEST SUITE
// ============================================

test.describe('Quotes to Scrape - Infinite Scroll & Login', () => {
  let quotesPage: QuotesPage;

  test.beforeEach(async ({ page }) => {
    quotesPage = new QuotesPage(page);
  });

  // Test for each user role
  for (const [roleName, user] of Object.entries(TEST_USERS)) {
    test.describe(`Role: ${roleName}`, () => {

      test(`[${roleName}] TC-QUOTE-001: Extract quotes from homepage`, async ({ page }) => {
        await quotesPage.navigate();

        const quotes = await quotesPage.getQuotes();

        // Take screenshot
        await takeScreenshot(page, `quotes-homepage-${roleName}`);

        expect(quotes.length).toBeGreaterThan(0);

        // Verify quote structure
        for (const quote of quotes) {
          expect(quote.text).toBeTruthy();
          expect(quote.author).toBeTruthy();
          expect(quote.tags.length).toBeGreaterThanOrEqual(0);
        }

        console.log(`[${roleName}] Extracted ${quotes.length} quotes from homepage`);
        console.log(`Sample: "${quotes[0].text.substring(0, 50)}..." - ${quotes[0].author}`);
      });

      test(`[${roleName}] TC-QUOTE-002: Pagination through quotes`, async ({ page }) => {
        await quotesPage.navigate();

        const allQuotes: Quote[] = [];
        const maxPages = 3;
        let pageNum = 1;

        while (pageNum <= maxPages) {
          const quotes = await quotesPage.getQuotes();
          allQuotes.push(...quotes);

          const hasNext = await quotesPage.goToNextPage();
          if (!hasNext) break;
          pageNum++;
        }

        await takeScreenshot(page, `quotes-pagination-${roleName}`);

        expect(allQuotes.length).toBeGreaterThan(10);
        expect(pageNum).toBeGreaterThan(1);

        console.log(`[${roleName}] Collected ${allQuotes.length} quotes across ${pageNum} pages`);
      });

      test(`[${roleName}] TC-QUOTE-003: Filter by tag`, async ({ page }) => {
        await quotesPage.navigate();

        // Get available tags
        const tags = await quotesPage.getAllTags();
        expect(tags.length).toBeGreaterThan(0);

        // Filter by first tag
        const selectedTag = tags[0];
        await quotesPage.filterByTag(selectedTag);

        await takeScreenshot(page, `quotes-tag-filter-${roleName}`);

        // Verify filtered quotes contain the tag
        const filteredQuotes = await quotesPage.getQuotes();
        for (const quote of filteredQuotes) {
          expect(quote.tags.map(t => t.toLowerCase())).toContain(selectedTag.toLowerCase());
        }

        console.log(`[${roleName}] Filtered by tag "${selectedTag}": ${filteredQuotes.length} quotes`);
      });

      test(`[${roleName}] TC-QUOTE-004: Login functionality`, async ({ page }) => {
        const creds = getCredentials('quotesToScrape');

        const loggedIn = await quotesPage.login(creds.username, creds.password);

        await takeScreenshot(page, `quotes-login-${roleName}`);

        expect(loggedIn).toBe(true);

        // Verify logged in state
        const isLoggedIn = await quotesPage.isLoggedIn();
        expect(isLoggedIn).toBe(true);

        // Logout
        await quotesPage.logout();
        const isLoggedOut = !(await quotesPage.isLoggedIn());
        expect(isLoggedOut).toBe(true);

        console.log(`[${roleName}] Login/logout flow completed successfully`);
      });

      test(`[${roleName}] TC-QUOTE-005: Extract author details`, async ({ page }) => {
        await quotesPage.navigate();

        const authorDetails = await quotesPage.getAuthorDetails('');

        if (authorDetails) {
          await takeScreenshot(page, `quotes-author-${roleName}`);

          expect(authorDetails.name).toBeTruthy();
          expect(authorDetails.birthDate).toBeTruthy();
          expect(authorDetails.bio).toBeTruthy();

          console.log(`[${roleName}] Author details:`);
          console.log(`  Name: ${authorDetails.name}`);
          console.log(`  Born: ${authorDetails.birthDate} ${authorDetails.birthLocation}`);
          console.log(`  Bio: ${authorDetails.bio.substring(0, 100)}...`);
        } else {
          console.log(`[${roleName}] Author details link not found on this page`);
        }
      });

      test(`[${roleName}] TC-QUOTE-006: Infinite scroll (scroll page)`, async ({ page }) => {
        await quotesPage.navigateScroll();

        // Initial quotes
        const initialQuotes = await quotesPage.getQuotes();
        const initialCount = initialQuotes.length;

        // Scroll and collect more
        const allQuotes = await quotesPage.scrollAndCollectQuotes(3);

        await takeScreenshot(page, `quotes-infinite-scroll-${roleName}`);

        expect(allQuotes.length).toBeGreaterThan(initialCount);

        console.log(`[${roleName}] Infinite scroll: ${initialCount} -> ${allQuotes.length} quotes`);
      });

      test(`[${roleName}] TC-QUOTE-007: Extract unique authors`, async ({ page }) => {
        await quotesPage.navigate();

        const allAuthors: string[] = [];
        let pageNum = 0;
        const maxPages = 3;

        while (pageNum < maxPages) {
          const quotes = await quotesPage.getQuotes();
          for (const quote of quotes) {
            if (!allAuthors.includes(quote.author)) {
              allAuthors.push(quote.author);
            }
          }

          const hasNext = await quotesPage.goToNextPage();
          if (!hasNext) break;
          pageNum++;
        }

        await takeScreenshot(page, `quotes-authors-${roleName}`);

        expect(allAuthors.length).toBeGreaterThan(0);

        console.log(`[${roleName}] Found ${allAuthors.length} unique authors:`);
        allAuthors.slice(0, 5).forEach(a => console.log(`  - ${a}`));
      });

      test(`[${roleName}] TC-QUOTE-008: Tag cloud analysis`, async ({ page }) => {
        await quotesPage.navigate();

        const tags = await quotesPage.getAllTags();

        await takeScreenshot(page, `quotes-tags-${roleName}`);

        expect(tags.length).toBeGreaterThan(0);

        // Get tag frequencies by filtering
        const tagCounts: Record<string, number> = {};
        for (const tag of tags.slice(0, 5)) {
          await quotesPage.filterByTag(tag);
          const quotes = await quotesPage.getQuotes();
          tagCounts[tag] = quotes.length;
          await quotesPage.navigate(); // Go back to homepage
        }

        console.log(`[${roleName}] Tag analysis:`);
        for (const [tag, count] of Object.entries(tagCounts)) {
          console.log(`  ${tag}: ${count} quotes`);
        }
      });

    });
  }
});
