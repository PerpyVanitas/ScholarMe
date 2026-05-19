import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseForBearer } from "@/lib/supabase/bearer-client";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: { code: 'AUTH-001', message: 'Missing authorization token' } }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const supabase = createSupabaseForBearer(token);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ success: false, error: { code: 'AUTH-002', message: 'Invalid or expired token' } }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);

    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, total_xp, current_level, profile_theme_color')
      .order('total_xp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[Gamification API] Failed to fetch leaderboard:', error);
      return NextResponse.json({ success: false, error: { code: 'DB-001', message: 'Failed to fetch leaderboard' } }, { status: 500 });
    }

    const leaderboard = (profiles ?? []).map((p, index) => ({
      rank: index + 1,
      id: p.id,
      fullName: p.full_name ?? 'Unknown',
      avatarUrl: p.avatar_url ?? null,
      totalXp: p.total_xp ?? 0,
      currentLevel: p.current_level ?? 1,
      profileThemeColor: p.profile_theme_color ?? null,
      isCurrentUser: p.id === user.id,
    }));

    return NextResponse.json(
      { success: true, data: { leaderboard, currentUserId: user.id } },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60"
        }
      }
    );
  } catch (err) {
    console.error('[Gamification API] Unexpected error:', err);
    return NextResponse.json({ success: false, error: { code: 'SYSTEM-001', message: 'Internal server error' } }, { status: 500 });
  }
}
