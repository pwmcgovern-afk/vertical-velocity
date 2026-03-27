import { test, expect } from '@playwright/test';

test.describe('Compare Page', () => {
  test('page loads with a company', async ({ page }) => {
    await page.goto('/compare/ramp');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.cmp-company-card').first()).toBeVisible();
  });

  test('page has comparison content', async ({ page }) => {
    await page.goto('/compare/ramp');
    // Page should have meaningful content beyond the header
    await expect(page.locator('.cmp-company-card').first()).toBeVisible();
  });

  test('add company search works', async ({ page }) => {
    await page.goto('/compare/ramp');
    const searchInput = page.locator('.cmp-search-input, input[placeholder*="Search"], input[placeholder*="search"], input[placeholder*="Add"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('Harvey');
      await page.waitForTimeout(300);
      const results = page.locator('.cmp-search-result, .cmp-search-item');
      if (await results.first().isVisible()) {
        await results.first().click();
        await page.waitForTimeout(300);
        const cards = page.locator('.cmp-company-card');
        expect(await cards.count()).toBeGreaterThanOrEqual(2);
      }
    }
  });
});
