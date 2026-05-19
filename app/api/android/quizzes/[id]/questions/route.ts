import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseForBearer } from "@/lib/supabase/bearer-client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: studySetId } = await params;

    // Verify the study set exists and is accessible (owned by user or is public)
    const { data: studySet, error: setError } = await supabase
      .from('study_sets')
      .select('id, title, type:generation_mode, is_public, owner_id')
      .eq('id', studySetId)
      .single();

    if (setError || !studySet) {
      return NextResponse.json({ success: false, error: { code: 'DB-001', message: 'Study set not found' } }, { status: 404 });
    }

    if (!studySet.is_public && studySet.owner_id !== user.id) {
      return NextResponse.json({ success: false, error: { code: 'AUTH-003', message: 'Access denied' } }, { status: 403 });
    }

    const { data: items, error: itemsError } = await supabase
      .from('study_set_items')
      .select('id, question, answer, item_type, options, correct_answer_index, display_order')
      .eq('study_set_id', studySetId)
      .order('display_order', { ascending: true });

    if (itemsError) {
      console.error('[Quizzes API] Failed to fetch items:', itemsError);
      return NextResponse.json({ success: false, error: { code: 'DB-001', message: 'Failed to fetch questions' } }, { status: 500 });
    }

    const questions = (items ?? []).map((item: any) => ({
      id: item.id,
      questionText: item.question,
      answer: item.answer,
      itemType: item.item_type,
      options: item.options ?? [],
      correctAnswerIndex: item.correct_answer_index ?? 0,
      displayOrder: item.display_order ?? 0,
    }));

    return NextResponse.json({
      success: true,
      data: {
        studySetId,
        title: studySet.title,
        type: studySet.type,
        questions,
      },
    });
  } catch (err) {
    console.error('[Quizzes Questions API] Unexpected error:', err);
    return NextResponse.json({ success: false, error: { code: 'SYSTEM-001', message: 'Internal server error' } }, { status: 500 });
  }
}
