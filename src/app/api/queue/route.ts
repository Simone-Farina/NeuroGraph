import { NextResponse } from 'next/server';

import { getAuthenticatedUser } from '@/lib/auth/server';
import { queueQueries } from '@/lib/db/queueQueries';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { user, supabase, errorResponse } = await getAuthenticatedUser();
    if (errorResponse) return errorResponse;

    const items = await queueQueries.getActiveByUserId(supabase, user.id);
    return NextResponse.json({ items });
  } catch (error) {
    console.error('[queue] GET error:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
