import { NextRequest, NextResponse } from 'next/server';

import { getAuthenticatedUser } from '@/lib/auth/server';
import { queueQueries } from '@/lib/db/queueQueries';
import { QueueStateTransitionSchema } from '@/lib/validation/queue';

function notFoundResponse() {
  return NextResponse.json({ error: 'Queue item not found' }, { status: 404 });
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, supabase, errorResponse } = await getAuthenticatedUser();
    if (errorResponse) return errorResponse;

    const parsed = QueueStateTransitionSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid queue state transition payload' },
        { status: 400 }
      );
    }

    const item = await queueQueries.getById(supabase, params.id);
    if (!item || item.user_id !== user.id) {
      return notFoundResponse();
    }

    const updatedItem = await queueQueries.updateState(
      supabase,
      params.id,
      item.state,
      parsed.data.state
    );

    return NextResponse.json({ item: updatedItem });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Invalid state transition:')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error('[queue] PATCH error:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, supabase, errorResponse } = await getAuthenticatedUser();
    if (errorResponse) return errorResponse;

    const item = await queueQueries.getById(supabase, params.id);
    if (!item || item.user_id !== user.id) {
      return notFoundResponse();
    }

    await queueQueries.deleteItem(supabase, params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[queue] DELETE error:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
