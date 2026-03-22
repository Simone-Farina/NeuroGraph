// EXCEPTION: This route uses the Supabase service role client.
// Reason: iOS Shortcuts bearer token auth -- no cookie session available.
// Pattern: all other routes use createServerSupabaseClient() from @/lib/auth/supabase.
// Auth is validated IN this handler, NOT in middleware (CVE-2025-29927 mitigation).

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { hashApiKey } from '@/lib/auth/apiKeys';
import { apiKeyQueries } from '@/lib/db/apiKeyQueries';
import { queueQueries } from '@/lib/db/queueQueries';
import { RawApiKeySchema } from '@/lib/validation/apiKeys';
import { QueueItemInsertSchema } from '@/lib/validation/queue';
import { extractHeadMetadata, isSafeUrl } from '@/lib/capture/metadata';

const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: NextRequest) {
  try {
    // 1. Extract and validate bearer token format
    const authHeader = request.headers.get('Authorization');
    const rawKeyResult = RawApiKeySchema.safeParse(
      authHeader?.replace(/^Bearer\s+/i, '').trim()
    );
    if (!rawKeyResult.success) {
      return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 });
    }

    // 2. Hash and look up key (findByHash filters revoked_at IS NULL automatically)
    const keyHash = hashApiKey(rawKeyResult.data);
    const keyRow = await apiKeyQueries.findByHash(supabaseAdmin, keyHash);
    if (!keyRow) {
      return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 });
    }

    // 3. Update last_used_at (fire-and-forget, don't block response)
    apiKeyQueries.updateLastUsed(supabaseAdmin, keyRow.id).catch(() => {});

    // 4. Rate limit check (60 captures/hour per user)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabaseAdmin
      .from('knowledge_queue')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', keyRow.user_id)
      .gte('created_at', oneHourAgo);

    if ((count ?? 0) >= 60) {
      return NextResponse.json({ success: false, error: 'rate_limited' }, { status: 429 });
    }

    // 5. Parse and validate request body
    const body = await request.json();
    const parsed = QueueItemInsertSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'invalid_payload' }, { status: 400 });
    }

    // 6. Duplicate URL check (only if URL provided)
    if (parsed.data.url) {
      const existing = await queueQueries.findByUrl(supabaseAdmin, keyRow.user_id, parsed.data.url);
      if (existing) {
        return NextResponse.json({
          success: false,
          error: 'duplicate',
          existing_id: existing.id,
        }, { status: 409 });
      }
    }

    // 7. URL metadata extraction (only if URL provided and safe)
    let meta: {
      title: string | null;
      favicon_url: string | null;
      estimated_read_time: number | null;
      source_domain: string;
    } | null = null;

    if (parsed.data.url && isSafeUrl(parsed.data.url)) {
      meta = await extractHeadMetadata(parsed.data.url);
    } else if (parsed.data.url) {
      // Unsafe URL (non-HTTPS, private IP) -- still store but skip fetch
      try {
        meta = {
          title: null,
          favicon_url: null,
          estimated_read_time: null,
          source_domain: new URL(parsed.data.url).hostname,
        };
      } catch { /* invalid URL, meta stays null */ }
    }

    // 8. Title resolution (fallback chain)
    const title = parsed.data.title ?? meta?.title ?? meta?.source_domain ?? 'Untitled';

    // 9. Insert queue item
    const item = await queueQueries.create(supabaseAdmin, {
      user_id: keyRow.user_id,
      title,
      url: parsed.data.url ?? null,
      notes: parsed.data.notes ?? null,
      state: 'inbox',
      source_domain: meta?.source_domain ?? null,
      favicon_url: meta?.favicon_url ?? null,
      estimated_read_time: meta?.estimated_read_time ?? null,
    });

    // 10. Return success with item echo
    return NextResponse.json({
      success: true,
      item: {
        id: item.id,
        title: item.title,
        url: item.url,
        source_domain: item.source_domain,
        state: item.state,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('[capture] Unexpected error:', error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false, error: 'internal_error' }, { status: 500 });
  }
}
