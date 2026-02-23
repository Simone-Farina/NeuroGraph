import { createClient } from '@supabase/supabase-js';
import { Page } from '@playwright/test';

export async function createTestUserAndLogin(page: Page) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env variables');
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const email = `test-${Date.now()}@example.com`;
  const password = 'test-password-123';
  
  const { data: user, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError || !user.user) {
    throw new Error(`Failed to create test user: ${createError?.message}`);
  }

  await page.goto('/login');

  await page.evaluate(() => {
    localStorage.setItem('neurograph_tour_completed', 'true');
  });
  
  await page.locator('button:has-text("Password")').click();
  
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  
  await page.locator('button:has-text("Sign In")').click();
  
  await page.waitForURL('**/app', { timeout: 15000 });

  return { email, userId: user.user.id };
}

export async function makeCrystalDue(userId: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing env variables for makeCrystalDue');
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data, error } = await supabase
    .from('crystals')
    .update({ next_review_due: '2020-01-01T00:00:00.000Z' })
    .eq('user_id', userId)
    .select();

  if (error) {
    throw new Error(`Failed to update crystals: ${error.message}`);
  }
}
