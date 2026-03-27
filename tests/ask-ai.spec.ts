import { test, expect } from '@playwright/test';

test.describe('Ask AI Widget', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('widget button is visible on page load', async ({ page }) => {
    const btn = page.locator('.ask-ai-btn');
    await expect(btn).toBeVisible();
    await expect(btn).toContainText('Ask AI');
  });

  test('click opens popup, click again closes', async ({ page }) => {
    const btn = page.locator('.ask-ai-btn');
    await btn.click();
    await expect(page.locator('.ask-ai-popup')).toBeVisible();
    await btn.click();
    await expect(page.locator('.ask-ai-popup')).not.toBeVisible();
  });

  test('Escape key closes popup', async ({ page }) => {
    await page.locator('.ask-ai-btn').click();
    await expect(page.locator('.ask-ai-popup')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('.ask-ai-popup')).not.toBeVisible();
  });

  test('suggested questions visible when no messages', async ({ page }) => {
    await page.locator('.ask-ai-btn').click();
    const suggestions = page.locator('.ask-ai-chip');
    await expect(suggestions.first()).toBeVisible();
    expect(await suggestions.count()).toBe(4);
  });

  test('input accepts text and Enter submits', async ({ page }) => {
    // Mock the chat API
    await page.route('/api/chat', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ response: 'Test response from AI' }),
      });
    });

    await page.locator('.ask-ai-btn').click();
    const input = page.locator('.ask-ai-input');
    await input.fill('What is the top company?');
    await input.press('Enter');

    // User message should appear
    await expect(page.locator('.ask-ai-bubble-user')).toContainText('What is the top company?');
    // Assistant response should appear
    await expect(page.locator('.ask-ai-bubble-assistant')).toContainText('Test response from AI');
    // Suggestions should be gone
    await expect(page.locator('.ask-ai-chip').first()).not.toBeVisible();
  });

  test('loading state shows typing dots', async ({ page }) => {
    // Mock with a delayed response
    await page.route('/api/chat', async (route) => {
      await new Promise((r) => setTimeout(r, 2000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ response: 'Delayed response' }),
      });
    });

    await page.locator('.ask-ai-btn').click();
    const input = page.locator('.ask-ai-input');
    await input.fill('Test question');
    await input.press('Enter');

    // Typing dots should be visible while loading
    await expect(page.locator('.ask-ai-typing')).toBeVisible();
    // Input should be disabled
    await expect(input).toBeDisabled();
  });

  test('error state shows retry button', async ({ page }) => {
    // Mock a failing API
    await page.route('/api/chat', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error' }),
      });
    });

    await page.locator('.ask-ai-btn').click();
    const input = page.locator('.ask-ai-input');
    await input.fill('Trigger error');
    await input.press('Enter');

    await expect(page.locator('.ask-ai-error')).toBeVisible();
    await expect(page.locator('.ask-ai-retry')).toBeVisible();
  });

  test('mobile viewport: popup goes full-width', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.locator('.ask-ai-btn').click();
    const popup = page.locator('.ask-ai-popup');
    await expect(popup).toBeVisible();
    const box = await popup.boundingBox();
    expect(box).toBeTruthy();
    // On 375px viewport, popup should be close to full width (375 - 32 = 343)
    expect(box!.width).toBeGreaterThan(300);
  });
});
