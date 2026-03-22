import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

import { getAuthenticatedUser } from '@/lib/auth/server';
import { generateApiKey, hashApiKey, getKeyPrefix } from '@/lib/auth/apiKeys';
import { apiKeyQueries } from '@/lib/db/apiKeyQueries';
import type { Database } from '@/types/database';

// Service role client for INSERT and UPDATE on user_api_keys.
// User-scoped clients have SELECT and DELETE RLS only; revoked_at/last_used_at updates
// must bypass RLS through the service role client.
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

/**
 * GET /api/keys
 * Returns the user's active API key info (never the hash).
 */
export async function GET() {
  try {
    const { user, supabase, errorResponse } = await getAuthenticatedUser();
    if (errorResponse) return errorResponse;

    const key = await apiKeyQueries.getActiveByUserId(supabase, user.id);
    return NextResponse.json({
      key: key
        ? {
            id: key.id,
            prefix: key.key_prefix,
            created_at: key.created_at,
            last_used_at: key.last_used_at,
          }
        : null,
    });
  } catch (error) {
    console.error('[keys] GET error:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/keys
 * Generates a new API key. Auto-revokes any existing active key.
 * Returns the raw key exactly once — never retrievable after this response.
 */
export async function POST() {
  try {
    const { user, supabase, errorResponse } = await getAuthenticatedUser();
    if (errorResponse) return errorResponse;

    // 1. Revoke any existing active key.
    const existing = await apiKeyQueries.getActiveByUserId(supabase, user.id);
    if (existing) {
      await apiKeyQueries.revoke(supabaseAdmin, existing.id);
    }

    // 2. Generate new key
    const rawKey = generateApiKey();
    const keyHash = hashApiKey(rawKey);
    const keyPrefix = getKeyPrefix(rawKey);

    // 3. Insert via service role (RLS blocks user INSERT)
    await apiKeyQueries.create(supabaseAdmin, {
      user_id: user.id,
      key_prefix: keyPrefix,
      key_hash: keyHash,
    });

    // 4. Return raw key ONCE — never stored, never retrievable again
    return NextResponse.json(
      {
        key: rawKey,
        prefix: keyPrefix,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[keys] POST error:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/keys
 * Revokes the user's active API key.
 */
export async function DELETE() {
  try {
    const { user, supabase, errorResponse } = await getAuthenticatedUser();
    if (errorResponse) return errorResponse;

    const key = await apiKeyQueries.getActiveByUserId(supabase, user.id);
    if (key) {
      await apiKeyQueries.revoke(supabaseAdmin, key.id);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[keys] DELETE error:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
