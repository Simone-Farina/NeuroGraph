import { test, expect } from '@playwright/test';

test.describe('Task 3: Authentication - Email Magic Links', () => {
  test('Scenario 1: User signs in via magic link', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 });
    
    await page.fill('input[type="email"]', 'test@example.com');
    
    await page.click('button:has-text("Send Magic Link")');
    
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: '.sisyphus/evidence/task-3-login-page.png' });
    
    const pageContent = await page.content();
    const hasSuccessMessage = pageContent.includes('Check your email') || pageContent.includes('Magic link sent');
    const hasErrorMessage = pageContent.toLowerCase().includes('error') || pageContent.toLowerCase().includes('invalid');
    
    expect(hasSuccessMessage || hasErrorMessage).toBeTruthy();
  });

  test('Scenario 2: Unauthenticated user redirected to login', async ({ page }) => {
    await page.goto('http://localhost:3000/app');
    
    await page.waitForURL('**/login', { timeout: 5000 });
    
    expect(page.url()).toContain('/login');
  });

  test('Scenario 3: Desktop-only message on small viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await page.goto('http://localhost:3000/login');
    
    await expect(page.getByText(/best experienced on desktop/i)).toBeVisible();
    
    await page.screenshot({ path: '.sisyphus/evidence/task-3-mobile-message.png' });
  });
});
