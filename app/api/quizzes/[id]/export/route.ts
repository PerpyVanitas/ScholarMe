import { createClient } from "@/lib/supabase/create-client";
import { NextResponse } from "next/server";
import { STUDY_SET_DETAIL_SELECT } from "@/features/quizzes/api/study-sets-db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: studySet, error } = await supabase
    .from("study_sets")
    .select(STUDY_SET_DETAIL_SELECT)
    .eq("id", id)
    .single();

  if (error || !studySet) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // Generate CSV (Term \t Definition)
  let csvContent = "";
  if (studySet.study_set_items && studySet.study_set_items.length > 0) {
    csvContent = studySet.study_set_items
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((item: unknown) => {
        const question = item.question.replace(/\n/g, " ").replace(/\t/g, " ");
        const answer = item.answer.replace(/\n/g, " ").replace(/\t/g, " ");
        return `${question}\t${answer}`;
      })
      .join("\n");
  }

  const response = new NextResponse(csvContent);
  response.headers.set("Content-Type", "text/csv");
  response.headers.set(
    "Content-Disposition",
    `attachment; filename="${studySet.title.replace(/[^a-zA-Z0-9]/g, "_")}.csv"`,
  );

  return response;
}
