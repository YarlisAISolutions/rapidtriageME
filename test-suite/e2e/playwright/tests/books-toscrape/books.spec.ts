/**
 * Books to Scrape - E2E Automation Tests
 *
 * URL: https://books.toscrape.com
 * Use Case: Pagination, product data extraction
 *
 * Tests various automation capabilities:
 * - Product listing extraction
 * - Pagination navigation
 * - Category filtering
 * - Product detail extraction
 * - Price parsing
 */

import { test, expect, Page } from '@playwright/test';
import { parsePrice, takeScreenshot, scrollToBottom, extractLinks } from '../../utils/helpers';
import { TEST_USERS, getTestUser, hasPermission } from '../../config/test-users';

const BASE_URL = 'https://books.toscrape.com';

// Product interface
interface Book {
  title: string;
  price: number;
  rating: number;
  availability: string;
  link: string;
}

// Page helpers
class BooksPage {
  constructor(private page: Page) {}

  async navigate(path: string = ''): Promise<void> {
    await this.page.goto(`${BASE_URL}${path}`);
    await this.page.waitForLoadState('networkidle');
  }

  async getBookCards(): Promise<Book[]> {
    const books: Book[] = [];
    const articles = this.page.locator('article.product_pod');
    const count = await articles.count();

    for (let i = 0; i < count; i++) {
      const article = articles.nth(i);
      const title = await article.locator('h3 a').getAttribute('title') || '';
      const priceText = await article.locator('.price_color').textContent() || '';
      const ratingClass = await article.locator('.star-rating').getAttribute('class') || '';
      const availability = await article.locator('.availability').textContent() || '';
      const link = await article.locator('h3 a').getAttribute('href') || '';

      books.push({
        title,
        price: parsePrice(priceText),
        rating: this.parseRating(ratingClass),
        availability: availability.trim(),
        link: link.startsWith('http') ? link : `${BASE_URL}/${link.replace(/^\.\.\//, '')}`,
      });
    }

    return books;
  }

  parseRating(ratingClass: string): number {
    const ratings: Record<string, number> = {
      'One': 1, 'Two': 2, 'Three': 3, 'Four': 4, 'Five': 5
    };
    for (const [word, num] of Object.entries(ratings)) {
      if (ratingClass.includes(word)) return num;
    }
    return 0;
  }

  async getCategories(): Promise<{ name: string; link: string }[]> {
    const categories: { name: string; link: string }[] = [];
    const links = this.page.locator('.side_categories ul li ul li a');
    const count = await links.count();

    for (let i = 0; i < count; i++) {
      const link = links.nth(i);
      const name = (await link.textContent() || '').trim();
      const href = await link.getAttribute('href') || '';
      categories.push({ name, link: `${BASE_URL}/${href}` });
    }

    return categories;
  }

  async getCurrentPage(): Promise<number> {
    const currentPage = this.page.locator('.current');
    const text = await currentPage.textContent() || 'Page 1';
    const match = text.match(/Page (\d+)/);
    return match ? parseInt(match[1]) : 1;
  }

  async getTotalPages(): Promise<number> {
    const currentPage = this.page.locator('.current');
    const text = await currentPage.textContent() || 'of 1';
    const match = text.match(/of (\d+)/);
    return match ? parseInt(match[1]) : 1;
  }

  async goToNextPage(): Promise<boolean> {
    const nextButton = this.page.locator('.next a');
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await this.page.waitForLoadState('networkidle');
      return true;
    }
    return false;
  }

  async goToPreviousPage(): Promise<boolean> {
    const prevButton = this.page.locator('.previous a');
    if (await prevButton.isVisible()) {
      await prevButton.click();
      await this.page.waitForLoadState('networkidle');
      return true;
    }
    return false;
  }

  async goToCategory(categoryName: string): Promise<void> {
    const categoryLink = this.page.locator(`.side_categories a:has-text("${categoryName}")`);
    await categoryLink.click();
    await this.page.waitForLoadState('networkidle');
  }

  async getBookDetails(bookUrl: string): Promise<{
    title: string;
    price: number;
    description: string;
    upc: string;
    productType: string;
    reviews: number;
  }> {
    await this.page.goto(bookUrl);
    await this.page.waitForLoadState('networkidle');

    const title = await this.page.locator('h1').textContent() || '';
    const priceText = await this.page.locator('.price_color').first().textContent() || '';
    const description = await this.page.locator('#product_description + p').textContent() || '';

    // Extract table data
    const upc = await this.page.locator('table tr:nth-child(1) td').textContent() || '';
    const productType = await this.page.locator('table tr:nth-child(2) td').textContent() || '';
    const reviewsText = await this.page.locator('table tr:nth-child(7) td').textContent() || '0';

    return {
      title,
      price: parsePrice(priceText),
      description,
      upc,
      productType,
      reviews: parseInt(reviewsText),
    };
  }
}

// ============================================
// TEST SUITE
// ============================================

test.describe('Books to Scrape - Pagination & Product Data', () => {
  let booksPage: BooksPage;

  test.beforeEach(async ({ page }) => {
    booksPage = new BooksPage(page);
  });

  // Test for each user role
  for (const [roleName, user] of Object.entries(TEST_USERS)) {
    test.describe(`Role: ${roleName}`, () => {

      test(`[${roleName}] TC-BOOKS-001: Extract product listings from homepage`, async ({ page }) => {
        await booksPage.navigate();

        // Take screenshot
        await takeScreenshot(page, `books-homepage-${roleName}`);

        // Extract books
        const books = await booksPage.getBookCards();

        // Assertions
        expect(books.length).toBeGreaterThan(0);
        expect(books.length).toBeLessThanOrEqual(20); // Max 20 per page

        // Verify book data structure
        for (const book of books) {
          expect(book.title).toBeTruthy();
          expect(book.price).toBeGreaterThan(0);
          expect(book.rating).toBeGreaterThanOrEqual(1);
          expect(book.rating).toBeLessThanOrEqual(5);
        }

        console.log(`[${roleName}] Extracted ${books.length} books from homepage`);
        console.log(`Sample book: ${books[0].title} - £${books[0].price}`);
      });

      test(`[${roleName}] TC-BOOKS-002: Navigate through pagination`, async ({ page }) => {
        await booksPage.navigate();

        const currentPage = await booksPage.getCurrentPage();
        const totalPages = await booksPage.getTotalPages();

        expect(currentPage).toBe(1);
        expect(totalPages).toBeGreaterThan(1);

        // Navigate to page 2
        const navigated = await booksPage.goToNextPage();
        expect(navigated).toBe(true);

        const newPage = await booksPage.getCurrentPage();
        expect(newPage).toBe(2);

        // Take screenshot
        await takeScreenshot(page, `books-page2-${roleName}`);

        // Navigate back
        await booksPage.goToPreviousPage();
        const backPage = await booksPage.getCurrentPage();
        expect(backPage).toBe(1);

        console.log(`[${roleName}] Successfully navigated through ${totalPages} pages`);
      });

      test(`[${roleName}] TC-BOOKS-003: Filter by category`, async ({ page }) => {
        await booksPage.navigate();

        // Get categories
        const categories = await booksPage.getCategories();
        expect(categories.length).toBeGreaterThan(0);

        // Navigate to first category
        const targetCategory = categories[0];
        await booksPage.goToCategory(targetCategory.name);

        // Take screenshot
        await takeScreenshot(page, `books-category-${roleName}`);

        // Verify we're on category page
        const url = page.url();
        expect(url).toContain('catalogue/category');

        // Extract books from category
        const books = await booksPage.getBookCards();
        expect(books.length).toBeGreaterThan(0);

        console.log(`[${roleName}] Category "${targetCategory.name}" has ${books.length} books`);
      });

      test(`[${roleName}] TC-BOOKS-004: Extract product details`, async ({ page }) => {
        await booksPage.navigate();

        // Get first book
        const books = await booksPage.getBookCards();
        const firstBook = books[0];

        // Navigate to detail page
        const details = await booksPage.getBookDetails(firstBook.link);

        // Take screenshot
        await takeScreenshot(page, `books-detail-${roleName}`);

        // Assertions
        expect(details.title).toBeTruthy();
        expect(details.price).toBeGreaterThan(0);
        expect(details.upc).toBeTruthy();
        expect(details.productType).toBe('Books');

        console.log(`[${roleName}] Book details extracted:`);
        console.log(`  Title: ${details.title}`);
        console.log(`  Price: £${details.price}`);
        console.log(`  UPC: ${details.upc}`);
      });

      test(`[${roleName}] TC-BOOKS-005: Collect all books across multiple pages`, async ({ page }) => {
        await booksPage.navigate();

        const allBooks: Book[] = [];
        const maxPages = 3; // Limit for test speed

        for (let i = 0; i < maxPages; i++) {
          const books = await booksPage.getBookCards();
          allBooks.push(...books);

          const hasNext = await booksPage.goToNextPage();
          if (!hasNext) break;
        }

        // Take screenshot of last page
        await takeScreenshot(page, `books-collection-${roleName}`);

        expect(allBooks.length).toBeGreaterThan(20); // More than one page

        // Calculate price statistics
        const prices = allBooks.map(b => b.price);
        const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);

        console.log(`[${roleName}] Collected ${allBooks.length} books across ${maxPages} pages`);
        console.log(`  Price range: £${minPrice.toFixed(2)} - £${maxPrice.toFixed(2)}`);
        console.log(`  Average price: £${avgPrice.toFixed(2)}`);
      });

    });
  }
});
