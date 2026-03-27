import { test, expect } from '@playwright/test';

const routes = [
  { path: '/', name: 'Homepage' },
  { path: '/charts', name: 'Scatter view' },
  { path: '/company/ramp', name: 'Company page' },
  { path: '/about', name: 'About page' },
  { path: '/calculator', name: 'Calculator' },
  { path: '/report', name: 'Report page' },
];

test.describe('Navigation — All routes resolve', () => {
  for (const route of routes) {
    test(`${route.name} (${route.path}) loads without error`, async ({ page }) => {
      await page.goto(route.path);
      // No crash — page should have content
      await expect(page.locator('body')).not.toBeEmpty();
      // No error overlay (React error boundary or blank page)
      await expect(page.locator('#root')).not.toBeEmpty();
    });
  }
});

test.describe('Navigation — Redirects', () => {
  test('SEO slug redirects to vertical page', async ({ page }) => {
    await page.goto('/best-healthcare-ai-companies');
    await expect(page).toHaveURL(/\/vertical\/healthcare/);
  });

  test('unknown route redirects to homepage', async ({ page }) => {
    await page.goto('/this-route-does-not-exist-xyz');
    // Should redirect to / or /vertical/... (SEO redirect might catch some)
    await page.waitForTimeout(500);
    const url = page.url();
    expect(url.endsWith('/') || url.includes('/vertical/')).toBeTruthy();
  });
});

test.describe('Navigation — Page transitions', () => {
  test('navigate from home to company and back', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.company-card').first()).toBeVisible();

    // Go to company page
    await page.goto('/company/ramp');
    await expect(page.locator('h1')).toContainText('Ramp');

    // Go back
    await page.locator('.cp-back-btn').click();
    await expect(page).toHaveURL('/');
    await expect(page.locator('.company-card').first()).toBeVisible();
  });

  test('navigate from home to calculator', async ({ page }) => {
    await page.goto('/');
    await page.locator('.random-btn-header', { hasText: 'Calculator' }).click();
    await expect(page).toHaveURL('/calculator');
    await expect(page.locator('h1')).toContainText('Efficiency Calculator');
  });
});
