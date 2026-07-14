import { WebLLMChat } from "@/features/tutors/components/webllm-chat";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "AI Tutor | ScholarMe",
  description: "Your personal, private, on-device AI tutor.",
};

export default async function AITutorPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let initialContext = "";
  if (user) {
    const { data: flashcards } = await supabase
      .from("flashcards")
      .select("question, answer, subject")
      .eq("user_id", user.id)
      .limit(50);

    const { data: resources } = await supabase
      .from("resources")
      .select("title, description")
      .limit(20); // We limit to 20 to avoid exceeding context window length

    const contextBlocks = [];

    if (flashcards && flashcards.length > 0) {
      contextBlocks.push(
        "User's current study material (Flashcards):\n" +
          flashcards
            .map((f) => `Q: ${f.question} | A: ${f.answer} (${f.subject})`)
            .join("\n"),
      );
    }

    if (resources && resources.length > 0) {
      contextBlocks.push(
        "Available Library Resources (User has access to these):\n" +
          resources
            .map(
              (r) =>
                `- Title: ${r.title}\n  Description: ${r.description || "N/A"}`,
            )
            .join("\n"),
      );
    }

    initialContext = contextBlocks.join("\n\n");
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">AI Tutor</h2>
      </div>
      <div className="h-full w-full flex items-center justify-center p-4">
        <WebLLMChat initialContext={initialContext} profileId={user?.id} />
      </div>
    </div>
  );
}
