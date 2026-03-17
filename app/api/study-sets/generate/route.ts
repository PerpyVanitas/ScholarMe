import { createClient } from "@/lib/supabase/client";
import { NextResponse } from "next/server";

interface GenerateRequest {
  title: string;
  description?: string;
  content: string;
  generationMode: "flashcard" | "multiple_choice" | "true_false" | "identification" | "matching" | "mixed";
  difficulty: "easy" | "medium" | "hard";
  questionCount: number;
  sourceType: "resource" | "upload";
  sourceId?: string;
  visibility: "private" | "shared";
  tags?: string[];
}

interface StudySetItem {
  item_type: string;
  prompt: string;
  answer: string;
  options?: string[];
  explanation?: string;
  order_index: number;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: GenerateRequest = await request.json();

    // Validate required fields
    if (!body.title || !body.content || !body.generationMode) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Generate study set items based on content and generation mode
    const items = generateStudyItems(body.content, body.generationMode, body.difficulty, body.questionCount);

    // Create the study set
    const { data: studySet, error: createError } = await supabase
      .from("study_sets")
      .insert({
        owner_id: user.id,
        title: body.title,
        description: body.description,
        source_type: body.sourceType,
        source_id: body.sourceId,
        visibility: body.visibility,
        generation_mode: body.generationMode,
        difficulty: body.difficulty,
        question_count: items.length,
        tags: body.tags || [],
      })
      .select()
      .single();

    if (createError) {
      console.error("Study set creation error:", createError);
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    // Insert study set items
    const itemsToInsert = items.map((item, index) => ({
      ...item,
      study_set_id: studySet.id,
      order_index: index,
    }));

    const { error: itemsError } = await supabase
      .from("study_set_items")
      .insert(itemsToInsert);

    if (itemsError) {
      console.error("Study set items creation error:", itemsError);
      // Rollback study set creation
      await supabase.from("study_sets").delete().eq("id", studySet.id);
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      studySet: {
        id: studySet.id,
        title: studySet.title,
        questionCount: items.length,
        generationMode: studySet.generation_mode,
      },
    });
  } catch (error) {
    console.error("Generate study set error:", error);
    return NextResponse.json({ error: "Failed to generate study set" }, { status: 500 });
  }
}

function generateStudyItems(content: string, mode: string, difficulty: string, count: number): StudySetItem[] {
  const items: StudySetItem[] = [];
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim());

  let itemIndex = 0;

  // Parse content into sentences/key points
  const sentences = content
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 10)
    .slice(0, count * 2);

  switch (mode) {
    case "flashcard":
      items.push(...generateFlashcards(sentences, count));
      break;
    case "multiple_choice":
      items.push(...generateMultipleChoice(sentences, count, difficulty));
      break;
    case "true_false":
      items.push(...generateTrueFalse(sentences, count));
      break;
    case "identification":
      items.push(...generateIdentification(sentences, count));
      break;
    case "matching":
      items.push(...generateMatching(sentences, count));
      break;
    case "mixed":
      items.push(...generateMixedQuestions(sentences, count, difficulty));
      break;
  }

  return items.slice(0, count);
}

function generateFlashcards(sentences: string[], count: number): StudySetItem[] {
  return sentences.slice(0, count).map((sentence, index) => ({
    item_type: "flashcard",
    prompt: extractQuestion(sentence) || `Question ${index + 1}`,
    answer: sentence,
    explanation: `Based on the provided content`,
    order_index: index,
  }));
}

function generateMultipleChoice(sentences: string[], count: number, difficulty: string): StudySetItem[] {
  return sentences.slice(0, count).map((sentence, index) => {
    const question = extractQuestion(sentence) || `Question ${index + 1}`;
    const correctAnswer = extractKey(sentence);

    return {
      item_type: "multiple_choice",
      prompt: question,
      answer: correctAnswer,
      options: [correctAnswer, ...generateDistractors(3)],
      explanation: sentence,
      order_index: index,
    };
  });
}

function generateTrueFalse(sentences: string[], count: number): StudySetItem[] {
  return sentences.slice(0, count).map((sentence, index) => ({
    item_type: "true_false",
    prompt: sentence,
    answer: Math.random() > 0.3 ? "True" : "False",
    explanation: `This statement is ${Math.random() > 0.3 ? "true" : "false"} based on the provided content`,
    order_index: index,
  }));
}

function generateIdentification(sentences: string[], count: number): StudySetItem[] {
  return sentences.slice(0, count).map((sentence, index) => {
    const key = extractKey(sentence);
    return {
      item_type: "identification",
      prompt: `Identify: ${key}`,
      answer: sentence,
      explanation: sentence,
      order_index: index,
    };
  });
}

function generateMatching(sentences: string[], count: number): StudySetItem[] {
  return sentences.slice(0, Math.ceil(count / 2)).map((sentence, index) => ({
    item_type: "matching",
    prompt: extractKey(sentence),
    answer: extractDefinition(sentence),
    options: generateDistractors(3),
    explanation: sentence,
    order_index: index,
  }));
}

function generateMixedQuestions(sentences: string[], count: number, difficulty: string): StudySetItem[] {
  const types = ["flashcard", "multiple_choice", "true_false", "identification"];
  const items: StudySetItem[] = [];
  const itemsPerType = Math.ceil(count / types.length);

  types.forEach((type, typeIndex) => {
    const startIdx = typeIndex * itemsPerType;
    const endIdx = Math.min(startIdx + itemsPerType, sentences.length);
    const typeSentences = sentences.slice(startIdx, endIdx);

    switch (type) {
      case "flashcard":
        items.push(...generateFlashcards(typeSentences, itemsPerType));
        break;
      case "multiple_choice":
        items.push(...generateMultipleChoice(typeSentences, itemsPerType, difficulty));
        break;
      case "true_false":
        items.push(...generateTrueFalse(typeSentences, itemsPerType));
        break;
      case "identification":
        items.push(...generateIdentification(typeSentences, itemsPerType));
        break;
    }
  });

  return items.slice(0, count);
}

// Helper functions
function extractQuestion(text: string): string {
  const words = text.split(" ");
  return words.slice(0, Math.min(15, words.length)).join(" ") + "?";
}

function extractKey(text: string): string {
  const words = text.split(" ");
  return words.slice(0, Math.min(5, words.length)).join(" ");
}

function extractDefinition(text: string): string {
  return text.substring(0, 100) + "...";
}

function generateDistractors(count: number): string[] {
  const distractors = [
    "Option A",
    "Option B",
    "Option C",
    "Option D",
    "Option E",
  ];
  return distractors.slice(0, count);
}
