import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseForBearer } from "@/lib/supabase/bearer-client";
import { calculateLevel } from '@/lib/gamification-utils';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const supabase = createSupabaseForBearer(token);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { xpAmount, reason } = await request.json();

    if (!xpAmount || typeof xpAmount !== 'number') {
      return NextResponse.json({ success: false, error: 'Invalid XP amount' }, { status: 400 });
    }

    // Get current XP
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('total_xp, current_level')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;

    const oldXp = profile.total_xp || 0;
    const newXp = oldXp + xpAmount;
    const oldLevel = profile.current_level || 1;
    const newLevel = calculateLevel(newXp);
    const leveledUp = newLevel > oldLevel;

    // Update profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        total_xp: newXp,
        current_level: newLevel
      })
      .eq('id', user.id);

    if (updateError) throw updateError;

    // Create notification if leveled up
    if (leveledUp) {
      await supabase.from('notifications').insert({
        user_id: user.id,
        title: "Level Up! 🎉",
        message: `Congratulations! You've reached Level ${newLevel}. Keep up the great work!`,
        type: "milestone",
        is_read: false
      });
    }

    // Log the event (optional but recommended)

    console.log(`[Gamification] User ${user.id} earned ${xpAmount} XP for: ${reason || 'activity'}`);

    return NextResponse.json({
      success: true,
      data: {
        newXp,
        newLevel,
        leveledUp,
        xpEarned: xpAmount
      }
    });

  } catch (err) {
    console.error('[Gamification API] XP Update failed:', err);
    return NextResponse.json({ success: false, error: 'System error' }, { status: 500 });
  }
}
