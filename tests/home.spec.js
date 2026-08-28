const { test, expect } = require('@playwright/test');

test('homepage loads', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveTitle(/SmartMess/i);
  await expect(page.getByText(/Smart Campus Canteen System/i).first()).toBeVisible();
});

test('student inquiry page loads', async ({ page }) => {
  await page.goto('/student/inquiry', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: /submit an inquiry/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /submit inquiry/i })).toBeVisible();
});

test('admin dashboard page loads', async ({ page }) => {
  await page.goto('/admin/dashboard', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
});

test('admin analytics page loads', async ({ page }) => {
  await page.goto('/admin/analytics', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: /analytics/i })).toBeVisible();
});

test('queue token page requires an order', async ({ page }) => {
  await page.goto('/student/queue', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: /queue tokens/i })).toBeVisible();
  await expect(page.getByText(/place an order to receive a queue token automatically/i)).toBeVisible();
  await page.getByRole('button', { name: /generate token/i }).click();
  await expect(page.getByText(/place order to generate token/i)).toBeVisible();
});
