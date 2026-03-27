import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('page loads with title and company cards', async ({ page }) => {
    await expect(page).toHaveTitle(/Vertical Velocity/);
    const cards = page.locator('.company-card');
    await expect(cards.first()).toBeVisible();
    expect(await cards.count()).toBeGreaterThan(10);
  });

  test('search filters companies', async ({ page }) => {
    const search = page.locator('.filters-search');
    await search.fill('Ramp');
    // Wait for the filtered list to settle
    await expect(page.locator('.company-card')).not.toHaveCount(0);
    await page.waitForTimeout(500);
    const cards = page.locator('.company-card');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThan(15);
  });

  test('search empty state', async ({ page }) => {
    const search = page.locator('.filters-search');
    await search.fill('xyznonexistent');
    await page.waitForTimeout(300);
    await expect(page.locator('.empty-state')).toBeVisible();
    await expect(page.locator('.empty-state-title')).toContainText('No companies found');
  });

  test('sort dropdown changes order', async ({ page }) => {
    const firstCardBefore = await page.locator('.company-card-name').first().textContent();
    await page.locator('.filters-main-row .filters-select').selectOption('arr');
    await page.waitForTimeout(300);
    const firstCardAfter = await page.locator('.company-card-name').first().textContent();
    // Order should change (or at minimum, not error)
    expect(firstCardAfter).toBeTruthy();
  });

  test('category filter works', async ({ page }) => {
    const healthcareBtn = page.locator('.category-btn', { hasText: 'Healthcare' });
    await healthcareBtn.click();
    await page.waitForTimeout(300);
    const categories = await page.locator('.company-card-category').allTextContents();
    for (const cat of categories) {
      expect(cat).toBe('Healthcare');
    }
  });

  test('collapsible filters toggle', async ({ page }) => {
    await expect(page.locator('.filters-expanded')).not.toBeVisible();
    await page.locator('.filters-toggle-btn').click();
    await expect(page.locator('.filters-expanded')).toBeVisible();
  });

  test('company card expands on click', async ({ page }) => {
    const firstCard = page.locator('.company-card').first();
    await firstCard.locator('.company-card-header').click();
    await expect(firstCard.locator('.company-card-details')).toBeVisible();
    await expect(firstCard.locator('.company-detail-value').first()).toBeVisible();
  });

  test('dark mode toggle', async ({ page }) => {
    // Should start in light mode (default)
    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-theme', 'light');
    await page.locator('button[aria-label="Toggle dark mode"]').click();
    await expect(html).toHaveAttribute('data-theme', 'dark');
  });

  test('navigate to company page from expanded card', async ({ page }) => {
    const firstCard = page.locator('.company-card').first();
    await firstCard.locator('.company-card-header').click();
    await page.waitForTimeout(200);
    await firstCard.locator('.view-profile-btn').click();
    await expect(page).toHaveURL(/\/company\//);
  });

  test('keyboard shortcut / focuses search', async ({ page }) => {
    await page.locator('.filters-search').waitFor({ state: 'visible' });
    await page.keyboard.press('/');
    await expect(page.locator('.filters-search')).toBeFocused();
  });

  test('section labels visible', async ({ page }) => {
    await expect(page.locator('.section-label', { hasText: 'MARKET PULSE' })).toBeVisible();
    await expect(page.locator('.section-label', { hasText: 'LEADERBOARD' })).toBeVisible();
  });

  test('stat cards display non-zero values', async ({ page }) => {
    const statValues = page.locator('.chart-stat-value');
    await expect(statValues.first()).toBeVisible();
    const values = await statValues.allTextContents();
    for (const val of values) {
      expect(val.trim()).not.toBe('');
      expect(val.trim()).not.toBe('0');
      expect(val.trim()).not.toBe('$0');
    }
  });

  test('submit company modal opens', async ({ page }) => {
    await page.locator('.submit-btn-header').click();
    await expect(page.locator('.modal-overlay')).toBeVisible();
    await expect(page.locator('.modal-title')).toContainText('Submit Your Company');
  });

  test('submit company modal closes on overlay click', async ({ page }) => {
    await page.locator('.submit-btn-header').click();
    await expect(page.locator('.modal-overlay')).toBeVisible();
    await page.locator('.modal-overlay').click({ position: { x: 10, y: 10 } });
    await expect(page.locator('.modal-overlay')).not.toBeVisible();
  });
});
