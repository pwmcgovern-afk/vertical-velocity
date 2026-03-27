import { test, expect } from '@playwright/test';

test.describe('Scatter Chart', () => {
  test('scatter view loads with dots', async ({ page }) => {
    await page.goto('/');
    await page.locator('.view-toggle-btn', { hasText: 'Scatter' }).click();
    await page.waitForTimeout(500);

    const svg = page.locator('svg').first();
    await expect(svg).toBeVisible();

    const dots = page.locator('.scatter-dot');
    expect(await dots.count()).toBeGreaterThan(10);
  });

  test('tooltip appears on dot hover', async ({ page }) => {
    await page.goto('/');
    await page.locator('.view-toggle-btn', { hasText: 'Scatter' }).click();
    await page.waitForTimeout(1000); // wait for entry animations to settle

    // Use a larger dot (higher index = bigger bubble usually) and force hover
    const dots = page.locator('.scatter-dot');
    const count = await dots.count();
    // Pick a dot in the middle
    const dot = dots.nth(Math.min(5, count - 1));
    await dot.hover({ force: true });
    await page.waitForTimeout(300);

    await expect(page.locator('.scatter-tooltip')).toBeVisible();
  });

  test('category toggle filters dots', async ({ page }) => {
    await page.goto('/');
    await page.locator('.view-toggle-btn', { hasText: 'Scatter' }).click();
    await page.waitForTimeout(500);

    const dotsBefore = await page.locator('.scatter-dot').count();

    // Click a single category
    await page.locator('.scatter-cat-btn, .category-btn', { hasText: 'Healthcare' }).click();
    await page.waitForTimeout(300);

    const dotsAfter = await page.locator('.scatter-dot').count();
    expect(dotsAfter).toBeLessThan(dotsBefore);
  });
});
