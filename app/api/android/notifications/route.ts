import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseForBearer } from "@/lib/supabase/bearer-client";

export async function GET(request: NextRequest) {
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

    // Fetch notifications from a 'notifications' table
    // If table doesn't exist, we'll return an empty list for now
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error && error.code !== 'PGRST116') { // Ignore if table missing for now
       return NextResponse.json({ success: true, data: [] });
    }

    const formattedNotifications = (notifications ?? []).map((n: any) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      time: n.created_at,
      read: n.is_read
    }));

    return NextResponse.json({ success: true, data: formattedNotifications });

  } catch (err) {
    console.error('[Notifications API] Failed:', err);
    return NextResponse.json({ success: false, error: 'System error' }, { status: 500 });
  }
}
