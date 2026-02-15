import { test, expect } from '@playwright/test';
import { createTestUserAndLogin, makeCrystalDue } from './utils';

test('Core Loop: Chat -> Crystallize -> Graph -> Review', async ({ page }) => {
  test.setTimeout(40000);

  const { userId } = await createTestUserAndLogin(page);
  
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  
  const chatInput = page.locator('textarea[placeholder="Ask a question or explore an idea..."]');
  await expect(chatInput).toBeVisible();

  const message = "Explain the concept of 'Spaced Repetition' and why it is effective for memory.";
  await chatInput.fill(message);
  console.log('Sending message...');
  await page.keyboard.press('Enter');
  console.log('Message sent. Waiting for assistant...');

  try {
    await expect(page.locator('.message-assistant')).toBeVisible({ timeout: 10000 });
    console.log('Assistant message visible!');
  } catch (e) {
    console.log('Timeout waiting for message. Page content:');
    console.log(await page.content());
    throw e;
  }
  
  await page.waitForTimeout(2000);
  await chatInput.fill("That's great. Can you crystallize this concept of Spaced Repetition for me? Please create a node.");
  await page.keyboard.press('Enter');

  const suggestionCard = page.locator('.crystallization-suggestion');
  await expect(suggestionCard).toBeVisible({ timeout: 60000 });
  
  await expect(suggestionCard).toContainText('Spaced Repetition');

  await suggestionCard.locator('button:has-text("Crystallize")').click();

  const graphNode = page.locator('.react-flow__node').filter({ hasText: 'Spaced Repetition' });
  await expect(graphNode).toBeVisible({ timeout: 15000 });

  await chatInput.fill("Now explain 'Active Recall' and how it relates to Spaced Repetition.");
  await page.keyboard.press('Enter');
  
  await expect(page.locator('.message-assistant').last()).toBeVisible();
  
  await chatInput.fill("Crystallize 'Active Recall' as well.");
  await page.keyboard.press('Enter');

  const suggestionCard2 = page.locator('.crystallization-suggestion').last();
  await expect(suggestionCard2).toBeVisible({ timeout: 60000 });
  await suggestionCard2.locator('button:has-text("Crystallize")').click();

  const graphNode2 = page.locator('.react-flow__node').filter({ hasText: 'Active Recall' });
  await expect(graphNode2).toBeVisible({ timeout: 15000 });

  // Wait for layout to stabilize
  await page.waitForTimeout(2000);

  const edges = page.locator('.react-flow__edge');
  // Use a polling assertion to wait for the edge
  await expect(async () => {
    const count = await edges.count();
    expect(count).toBe(1);
  }).toPass({ timeout: 10000 });

  await makeCrystalDue(userId);

  await page.goto('/app/review');
  
  await expect(page.locator('text=Spaced Repetition')).toBeVisible();
  
  await page.locator('button:has-text("Show Answer")').click();
  await expect(page.locator('button:has-text("Good")')).toBeVisible();
  await page.locator('button:has-text("Good")').click();
});
