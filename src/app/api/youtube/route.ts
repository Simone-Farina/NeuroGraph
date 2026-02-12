import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createServerSupabaseClient } from '@/lib/auth/supabase';
import {
  extractVideoId,
  fetchTranscript,
  fetchVideoTitle,
  TranscriptFetchError,
} from '@/lib/youtube';

const youtubeSchema = z.object({
  url: z.string().trim().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = youtubeSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Missing or invalid YouTube URL' }, { status: 400 });
    }

    const { url } = parsed.data;
    const videoId = extractVideoId(url);
    if (!videoId) {
      return NextResponse.json({ error: 'Missing or invalid YouTube URL' }, { status: 400 });
    }

    const { transcript } = await fetchTranscript(url);
    const title = await fetchVideoTitle(videoId);

    return NextResponse.json({ transcript, title, videoId });
  } catch (error) {
    if (error instanceof TranscriptFetchError) {
      if (error.code === 'INVALID_URL') {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      if (error.code === 'NO_TRANSCRIPT') {
        return NextResponse.json({ error: error.message }, { status: 422 });
      }

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
