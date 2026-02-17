import { NextResponse } from 'next/server';
import { User, SupabaseClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/auth/supabase';
import { Database } from '@/types/database';

export type AuthResult =
  | { user: User; supabase: SupabaseClient<Database>; errorResponse: null }
  | { user: null; supabase: SupabaseClient<Database>; errorResponse: NextResponse };

export async function getAuthenticatedUser(): Promise<AuthResult> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      user: null,
      supabase: supabase as SupabaseClient<Database>,
      errorResponse: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  return { user, supabase: supabase as SupabaseClient<Database>, errorResponse: null };
}
