import { createClient } from '@supabase/supabase-js';

/**
 * E2E Test Helper for Authentication
 * 
 * This module provides utilities for automating authentication in E2E tests.
 * 
 * ## Approach 1: Supabase Admin API (Recommended for CI/CD)
 * 
 * Use the Supabase Admin API to generate magic links programmatically.
 * This approach works in any environment and doesn't require email interception.
 * 
 * ### Setup:
 * 1. Add SUPABASE_SERVICE_ROLE_KEY to .env.local (from Supabase Dashboard > Settings > API)
 * 2. Use the functions below in your Playwright tests
 * 
 * ### Example Usage:
 * ```typescript
 * import { test } from '@playwright/test';
 * import { createTestUser, generateMagicLink } from '@/lib/auth/test-helper';
 * 
 * test('user can login with magic link', async ({ page }) => {
 *   const email = `test-${Date.now()}@example.com`;
 *   
 *   // Create user and get magic link
 *   await createTestUser(email);
 *   const magicLink = await generateMagicLink(email);
 *   
 *   // Navigate directly to magic link
 *   await page.goto(magicLink);
 *   
 *   // Verify user is logged in
 *   await expect(page).toHaveURL('/app');
 * });
 * ```
 * 
 * ## Approach 2: Local Supabase Inbucket (Development Only)
 * 
 * If running Supabase locally via Docker, you can intercept emails using Inbucket.
 * 
 * ### Setup:
 * 1. Start local Supabase: `npx supabase start`
 * 2. Inbucket UI available at: http://localhost:54324
 * 3. API endpoint: http://localhost:54324/api/v1/mailbox/{email}
 * 
 * ### Example Usage:
 * ```typescript
 * import { test } from '@playwright/test';
 * import { getLatestMagicLinkFromInbucket } from '@/lib/auth/test-helper';
 * 
 * test('user can login via Inbucket', async ({ page }) => {
 *   const email = 'test@example.com';
 *   
 *   // Trigger magic link send
 *   await page.goto('/login');
 *   await page.fill('input[type="email"]', email);
 *   await page.click('button[type="submit"]');
 *   
 *   // Wait for email and extract link
 *   const magicLink = await getLatestMagicLinkFromInbucket(email);
 *   
 *   // Navigate to magic link
 *   await page.goto(magicLink);
 *   
 *   // Verify user is logged in
 *   await expect(page).toHaveURL('/app');
 * });
 * ```
 */

export async function createTestUser(email: string, password?: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: password || `test-password-${Date.now()}`,
    email_confirm: true,
  });

  if (error) throw error;
  return data.user;
}

export async function generateMagicLink(email: string): Promise<string> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email,
  });

  if (error) throw error;
  return data.properties.action_link;
}

export async function deleteTestUser(userId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) throw error;
}

export async function getLatestMagicLinkFromInbucket(email: string): Promise<string> {
  const inbucketUrl = 'http://localhost:54324';
  const mailboxName = email.split('@')[0];
  
  const response = await fetch(`${inbucketUrl}/api/v1/mailbox/${mailboxName}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch emails from Inbucket: ${response.statusText}`);
  }

  const emails = await response.json();
  if (emails.length === 0) {
    throw new Error('No emails found in Inbucket mailbox');
  }

  const latestEmail = emails[0];
  const emailResponse = await fetch(`${inbucketUrl}/api/v1/mailbox/${mailboxName}/${latestEmail.id}`);
  const emailData = await emailResponse.json();

  const magicLinkMatch = emailData.body.text.match(/https?:\/\/[^\s]+/);
  if (!magicLinkMatch) {
    throw new Error('No magic link found in email');
  }

  return magicLinkMatch[0];
}
