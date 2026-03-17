import { generateText, Output } from 'ai';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import { z } from 'zod';

// Define schemas for different question types
const flashcardSchema = z.object({
  type: z.literal('flashcard'),
  prompt: z.string().describe('The question or prompt'),
  answer: z.string().describe('The answer or response'),
  explanation: z.string().nullable().describe('Optional explanation'),
});

const multipleChoiceSchema = z.object({
  type: z.literal('multiple_choice'),
  prompt: z.string().describe('The question'),
  answer: z.string().describe('The correct answer'),
  options: z.array(z.string()).describe('All answer options including correct one'),
  explanation: z.string().nullable().describe('Optional explanation'),
});

const trueFalseSchema = z.object({
  type: z.literal('true_false'),
  prompt: z.string().describe('The statement to evaluate'),
  answer: z.enum(['true', 'false']).describe('Whether the statement is true or false'),
  explanation: z.string().nullable().describe('Optional explanation'),
});

const identificationSchema = z.object({
  type: z.literal('identification'),
  prompt: z.string().describe('What to identify'),
  answer: z.string().describe('The identification answer'),
  explanation: z.string().nullable().describe('Optional explanation'),
});

const itemSchema = z.union([
  flashcardSchema,
  multipleChoiceSchema,
  trueFalseSchema,
  identificationSchema,
]);

const studySetSchema = z.object({
  items: z.array(itemSchema).describe('Array of study items'),
});

export async function POST(request: Request) {
  try {
    const { content, title, description, generationMode, difficulty, questionCount, visibility } = await request.json();
    const supabase = await createAdminClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate inputs
    if (!content || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const count = questionCount || 10;

    // Build generation prompt based on mode
    const generationInstruction = getGenerationInstruction(generationMode, difficulty);

    const systemPrompt = `You are an expert educator creating high-quality study materials.
Generate ${count} ${generationMode === 'mixed' ? 'varied' : generationMode} questions based on the provided content.
Difficulty level: ${difficulty || 'medium'}.
Ensure questions are clear, accurate, and help reinforce key concepts.
${generationInstruction}`;

    const prompt = `Content to create study questions from:\n\n${content}\n\n---\n\nCreate a JSON object with an "items" array containing exactly ${count} study items.`;

    // Generate using AI SDK 6
    const { object } = await generateText({
      model: 'openai/gpt-4o-mini',
      system: systemPrompt,
      prompt,
      output: Output.object({ schema: studySetSchema }),
      temperature: 0.7,
      maxOutputTokens: 4000,
    });

    if (!object || !object.items || object.items.length === 0) {
      return NextResponse.json({ error: 'Failed to generate study items' }, { status: 500 });
    }

    // Create study set
    const { data: studySet, error: createError } = await supabase
      .from('study_sets')
      .insert({
        owner_id: user.id,
        title,
        description,
        source_type: 'upload',
        visibility,
        generation_mode: generationMode,
        difficulty,
        question_count: object.items.length,
      })
      .select()
      .single();

    if (createError || !studySet) {
      console.error('Study set creation error:', createError);
      return NextResponse.json({ error: 'Failed to create study set' }, { status: 500 });
    }

    // Insert study set items
    const itemsToInsert = object.items.map((item, index) => ({
      study_set_id: studySet.id,
      item_type: item.type,
      prompt: item.prompt,
      answer: item.answer,
      options: item.type === 'multiple_choice' ? item.options : null,
      explanation: item.explanation,
      order_index: index,
    }));

    const { error: itemsError } = await supabase
      .from('study_set_items')
      .insert(itemsToInsert);

    if (itemsError) {
      console.error('Study set items creation error:', itemsError);
      // Rollback - delete the study set
      await supabase.from('study_sets').delete().eq('id', studySet.id);
      return NextResponse.json({ error: 'Failed to create study items' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      studySetId: studySet.id,
      itemCount: object.items.length,
      title: studySet.title,
    });
  } catch (error) {
    console.error('Error generating study set:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getGenerationInstruction(mode: string, difficulty: string): string {
  const difficultyGuide = {
    easy: 'Focus on basic concepts and definitions. Keep questions straightforward.',
    medium: 'Balance between recall and comprehension. Include some conceptual questions.',
    hard: 'Focus on analysis, synthesis, and application of concepts. Include challenging scenarios.',
  };

  const modeGuides = {
    flashcard: 'Create concise question-answer pairs. Keep prompts clear and answers brief.',
    multiple_choice: 'Create questions with 4 plausible options. Only one correct answer. Avoid obvious distractors.',
    true_false: 'Create clear statements that are definitively true or false. Avoid ambiguous statements.',
    identification: 'Create questions asking students to identify specific terms, concepts, or items from the content.',
    mixed: 'Mix different question types to provide varied assessment methods.',
  };

  return `${difficultyGuide[difficulty as keyof typeof difficultyGuide] || difficultyGuide.medium}
${modeGuides[mode as keyof typeof modeGuides] || ''}`;
}
