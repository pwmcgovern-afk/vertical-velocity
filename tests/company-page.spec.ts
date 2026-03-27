import { test, expect } from '@playwright/test';

test.describe('Company Page', () => {
  test('page loads with company name', async ({ page }) => {
    await page.goto('/company/ramp');
    await expect(page.locator('h1')).toContainText('Ramp');
  });

  test('metrics cards render', async ({ page }) => {
    await page.goto('/company/ramp');
    const metrics = page.locator('.cp-metric');
    await expect(metrics.first()).toBeVisible();
    expect(await metrics.count()).toBe(6);

    // Check labels exist
    const labels = await page.locator('.cp-metric-label').allTextContents();
    expect(labels).toContain('ARR / Employee');
    expect(labels).toContain('Employees');
    expect(labels).toContain('Stage');
  });

  test('copy link button works', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/company/ramp');
    const copyBtn = page.locator('.cp-share-btn', { hasText: 'Copy Link' });
    await copyBtn.click();
    await expect(page.locator('.cp-share-btn', { hasText: 'Copied!' })).toBeVisible();
  });

  test('copy stats button works', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/company/ramp');
    const copyBtn = page.locator('.cp-share-btn', { hasText: 'Copy Stats' });
    await copyBtn.click();
    await expect(page.locator('.cp-share-btn', { hasText: 'Copied!' })).toBeVisible();
  });

  test('claim form opens and has fields', async ({ page }) => {
    await page.goto('/company/ramp');
    await page.locator('.cp-claim-btn').click();
    await expect(page.locator('.cp-claim-form')).toBeVisible();
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="role"]')).toBeVisible();
    await expect(page.locator('.cp-claim-submit')).toBeVisible();
  });

  test('similar companies section exists', async ({ page }) => {
    await page.goto('/company/ramp');
    const similar = page.locator('.cp-similar');
    await expect(similar).toBeVisible();
    const cards = similar.locator('.cp-similar-card');
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test('back button navigates to homepage', async ({ page }) => {
    await page.goto('/company/ramp');
    await page.locator('.cp-back-btn').click();
    await expect(page).toHaveURL('/');
  });

  test('404 for nonexistent company', async ({ page }) => {
    await page.goto('/company/nonexistent-company-xyz');
    await expect(page.locator('.cp-not-found')).toBeVisible();
    await expect(page.locator('.cp-not-found')).toContainText('Company not found');
  });

  test('random company button changes page', async ({ page }) => {
    await page.goto('/company/ramp');
    const url1 = page.url();
    await page.locator('.cp-random-btn').first().click();
    await page.waitForTimeout(300);
    expect(page.url()).not.toBe(url1);
  });
});
