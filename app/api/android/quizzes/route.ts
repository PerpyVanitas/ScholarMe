import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: { code: 'AUTH-001', message: 'Missing authorization token' } }, { status: 401 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: { code: 'AUTH-002', message: 'Invalid or expired token' } }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tab = searchParams.get('tab') ?? 'my'; // 'my' or 'shared'

    let query = supabase
      .from('study_sets')
      .select(`
        id,
        title,
        description,
        type,
        is_public,
        created_at,
        study_set_items(count),
        profiles:owner_id(full_name, avatar_url)
      `);

    if (tab === 'shared') {
      query = query.eq('is_public', true).neq('owner_id', user.id);
    } else {
      query = query.eq('owner_id', user.id);
    }

    query = query.order('created_at', { ascending: false });

    const { data: studySets, error } = await query;

    if (error) {
      console.error('[Quizzes API] Failed to fetch study sets:', error);
      return NextResponse.json({ success: false, error: { code: 'DB-001', message: 'Failed to fetch study sets' } }, { status: 500 });
    }

    const sets = (studySets ?? []).map((s: any) => ({
      id: s.id,
      title: s.title,
      description: s.description ?? null,
      type: s.type,
      isPublic: s.is_public,
      questionCount: s.study_set_items?.[0]?.count ?? 0,
      createdAt: s.created_at,
      ownerName: s.profiles?.full_name ?? 'Unknown',
      ownerAvatarUrl: s.profiles?.avatar_url ?? null,
    }));

    return NextResponse.json({ success: true, data: { studySets: sets } });
  } catch (err) {
    console.error('[Quizzes API] Unexpected error:', err);
    return NextResponse.json({ success: false, error: { code: 'SYSTEM-001', message: 'Internal server error' } }, { status: 500 });
  }
}
