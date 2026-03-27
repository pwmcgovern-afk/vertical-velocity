import { test, expect } from '@playwright/test';

test.describe('Calculator Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/calculator');
  });

  test('page loads with inputs', async ({ page }) => {
    await expect(page).toHaveTitle(/Calculator/);
    await expect(page.locator('input[type="number"]').first()).toBeVisible();
    await expect(page.locator('.calc-btn')).toBeVisible();
  });

  test('calculate button disabled with empty inputs', async ({ page }) => {
    await expect(page.locator('.calc-btn')).toBeDisabled();
  });

  test('calculate rank with valid inputs', async ({ page }) => {
    await page.locator('input[placeholder="e.g., 50"]').fill('50');
    await page.locator('input[placeholder="e.g., 200"]').fill('200');
    await expect(page.locator('.calc-btn')).toBeEnabled();
    await page.locator('.calc-btn').click();

    // Results should appear
    await expect(page.locator('.calc-results')).toBeVisible();
    await expect(page.locator('.calc-hero-value')).toBeVisible();
    await expect(page.locator('.calc-stat-value').first()).toBeVisible();
  });

  test('results show rank and percentile', async ({ page }) => {
    await page.locator('input[placeholder="e.g., 50"]').fill('50');
    await page.locator('input[placeholder="e.g., 200"]').fill('200');
    await page.locator('.calc-btn').click();

    const rankText = await page.locator('.calc-stat-value').first().textContent();
    expect(rankText).toMatch(/^#\d+$/);

    await expect(page.locator('.calc-stat-value', { hasText: 'Top' })).toBeVisible();
  });

  test('your company appears in nearby list', async ({ page }) => {
    await page.locator('input[placeholder="e.g., 50"]').fill('50');
    await page.locator('input[placeholder="e.g., 200"]').fill('200');
    await page.locator('.calc-btn').click();

    await expect(page.locator('.calc-nearby-you')).toBeVisible();
    await expect(page.locator('.calc-nearby-you')).toContainText('Your Company');
  });

  test('edge case: zero headcount keeps button disabled', async ({ page }) => {
    await page.locator('input[placeholder="e.g., 50"]').fill('50');
    await page.locator('input[placeholder="e.g., 200"]').fill('0');
    await expect(page.locator('.calc-btn')).toBeDisabled();
  });

  test('submit company CTA opens submit modal on homepage', async ({ page }) => {
    await page.locator('input[placeholder="e.g., 50"]').fill('50');
    await page.locator('input[placeholder="e.g., 200"]').fill('200');
    await page.locator('.calc-btn').click();
    await page.locator('.calc-cta-btn').click();
    // Navigates to homepage and auto-opens submit modal
    await expect(page).toHaveURL('/');
    await expect(page.locator('.modal-overlay')).toBeVisible();
    await expect(page.locator('.modal-title')).toContainText('Submit Your Company');
  });
});
