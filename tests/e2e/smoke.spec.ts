import { expect, test } from '@playwright/test';

test.describe('Application entry', () => {
  test('root shows the landing page, whose sign-in link leads to the shared sign-in', async ({
    page,
  }) => {
    await page.goto('/');
    // Every signed-out call to action on the landing page links to /login.
    await page.locator('a[href="/login"]:visible').first().click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
  });

  test('admin routes redirect anonymous users to sign in', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
  });

  test('unknown routes return to the admin entry', async ({ page }) => {
    await page.goto('/removed-public-page');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
  });
});
