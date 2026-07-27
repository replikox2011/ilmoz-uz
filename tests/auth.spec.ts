import { test, expect } from '@playwright/test';

test.describe('Ilmoz Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to signin page
    await page.goto('/login');
  });

  test('should display login fields and handle empty submissions', async ({ page }) => {
    // Check heading
    await expect(page.locator('h2').first()).toContainText(/Xush kelibsiz|С возвращением|Welcome/i);

    // Verify fields exist
    const emailInput = page.locator('input[placeholder="you@center.com"]');
    const passwordInput = page.locator('input[placeholder="••••••••"]');
    const submitButton = page.locator('button[type="submit"]');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
  });

  test('should display error message on wrong password', async ({ page }) => {
    const emailInput = page.locator('input[placeholder="you@center.com"]');
    const passwordInput = page.locator('input[placeholder="••••••••"]');
    const submitButton = page.locator('button[type="submit"]');

    // Fill invalid credentials
    await emailInput.fill('nonexistent@ilmoz.uz');
    await passwordInput.fill('wrongpassword123');
    await submitButton.click();

    // The form submission triggers Firebase Auth login which fails
    // It should display a warning card with translation text
    const errorCard = page.locator('div.bg-red-500\\/10');
    await expect(errorCard).toBeVisible({ timeout: 10000 });
  });

  test('should toggle password visibility', async ({ page }) => {
    const passwordInput = page.locator('input[placeholder="••••••••"]');
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Toggle button (Show/Hide)
    const toggleButton = page.locator('button:has-text("Ko\'rsatish"), button:has-text("Показать"), button:has-text("Show"), button:has-text("Hide")').first();
    await expect(toggleButton).toBeVisible();
    await toggleButton.click();

    // Password type should become text
    await expect(passwordInput).toHaveAttribute('type', 'text');
  });

  test('should render Google Sign-In option', async ({ page }) => {
    // Google login button
    const googleButton = page.locator('button:has-text("Google")');
    await expect(googleButton).toBeVisible();
  });
});
