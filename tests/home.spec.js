const { test, expect } = require('@playwright/test');

test('homepage loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/SmartMess/i);
  await expect(page.getByText(/Smart Campus Canteen System/i).first()).toBeVisible();
});
