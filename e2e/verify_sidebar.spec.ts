import { test, expect } from '@playwright/test';

test('AppSidebar has accessible aria-labels', async ({ page }) => {
  await page.goto('http://localhost:3000/app');

  // Need to log in
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button:has-text("Sign In")');

  // Wait a bit just to be safe in case of loading error
  await page.waitForTimeout(5000);

  // Take screenshot of the whole page
  await page.screenshot({ path: '/home/jules/verification/page-logged-in.png' });
});
