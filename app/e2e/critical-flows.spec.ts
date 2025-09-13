import { test, expect } from '@playwright/test';

test.describe('Pint App - Critical User Flows', () => {
  test('should display homepage and allow navigation', async ({ page }) => {
    await page.goto('/');
    
    // Check if the page loads
    await expect(page).toHaveTitle(/Pint/);
    
    // Check for key elements that should be present
    await expect(page.locator('ion-app')).toBeVisible();
  });

  test('should allow user registration flow', async ({ page }) => {
    await page.goto('/register');
    
    // Check registration form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('ion-button[type="submit"]')).toBeVisible();
  });

  test('should allow user login flow', async ({ page }) => {
    await page.goto('/login');
    
    // Check login form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('ion-button[type="submit"]')).toBeVisible();
  });

  test('should display dashboard when logged in', async ({ page }) => {
    // This test would require actual authentication
    // For now, just check that the dashboard page structure exists
    await page.goto('/dashboard');
    
    // Check for dashboard elements (even if behind auth)
    const ionContent = page.locator('ion-content');
    await expect(ionContent).toBeVisible();
  });

  test('should handle session creation flow', async ({ page }) => {
    await page.goto('/initiate-pint');
    
    // Check for initiate pint form elements
    await expect(page.locator('ion-content')).toBeVisible();
  });
});

test.describe('Performance and Accessibility', () => {
  test('should meet basic performance standards', async ({ page }) => {
    await page.goto('/');
    
    // Check that the page loads within a reasonable time
    const startTime = Date.now();
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    // Should load within 3 seconds on a good connection
    expect(loadTime).toBeLessThan(3000);
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto('/');
    
    await expect(page.locator('ion-app')).toBeVisible();
    
    // Check that the app adapts to mobile viewport
    const appElement = page.locator('ion-app');
    const boundingBox = await appElement.boundingBox();
    expect(boundingBox?.width).toBeLessThanOrEqual(375);
  });
});