const { test, expect } = require('@playwright/test');

test('homepage loads', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveTitle(/SmartMess/i);
  await expect(page.getByText(/Smart Campus Canteen System/i).first()).toBeVisible();
});
