import { test, expect } from '@playwright/test';

test.describe('Ilmoz Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the root
    await page.goto('/');
  });

  test('should load the landing page with correct title and elements', async ({ page }) => {
    // Check main title
    await expect(page.locator('h1')).toContainText("O'quv markazingiz endi avtopilotda");
    
    // Check main call to actions
    await expect(page.locator('button:has-text("Bepul boshlash"), a:has-text("Bepul boshlash")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Kirish"), a:has-text("Kirish")').first()).toBeVisible();
  });

  test('should switch language correctly', async ({ page }) => {
    // Default language is Uzbek (uz)
    await expect(page.locator('h1')).toContainText("O'quv markazingiz endi avtopilotda");

    // Switch to Russian (RU)
    const ruButton = page.locator('button:has-text("RU")');
    await expect(ruButton).toBeVisible();
    await ruButton.click();

    // Verify title changed to Russian
    await expect(page.locator('h1')).toContainText('Управляйте учебным центром на автопилоте');

    // Switch back to Uzbek (UZ)
    const uzButton = page.locator('button:has-text("UZ")');
    await expect(uzButton).toBeVisible();
    await uzButton.click();

    // Verify title changed back to Uzbek
    await expect(page.locator('h1')).toContainText("O'quv markazingiz endi avtopilotda");
  });

  test('should navigate to login page', async ({ page }) => {
    const loginButton = page.locator('button:has-text("Kirish"), a:has-text("Kirish")').first();
    await expect(loginButton).toBeVisible();
    await loginButton.click();

    // Should navigate to /login
    await expect(page).toHaveURL(/\/login/);
  });
});
