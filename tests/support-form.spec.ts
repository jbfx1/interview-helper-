import { test, expect } from '@playwright/test';

const message = 'Help me prepare for system design interviews.';

test.describe('Support form', () => {
  test('allows a user to submit a support request', async ({ page }) => {
    await page.goto('/');

    await page.getByLabel('Name').fill('Ada Lovelace');
    await page.getByLabel('Email').fill('ada@example.com');
    await page.getByLabel('Topic').fill('Mock interview request');
    await page.getByLabel('How can we help?').fill(message);
    await page.getByLabel('Urgent').check();

    await page.getByRole('button', { name: /send message/i }).click();

    await expect(page.getByRole('status')).toContainText(/your request has been queued/i);
  });
});
