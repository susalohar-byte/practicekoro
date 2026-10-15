import { expect, test } from '@playwright/test';

test.describe('Admin-only application entry', () => {
  test('root redirects guests to admin sign in', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: /admin sign in/i })).toBeVisible();
  });

  test('admin routes redirect anonymous users to sign in', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: /admin sign in/i })).toBeVisible();
  });

  test('unknown routes return to the admin entry', async ({ page }) => {
    await page.goto('/removed-public-page');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: /admin sign in/i })).toBeVisible();
  });
});
