import { WebLLMChat } from "@/components/webllm-chat";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "AI Tutor | ScholarMe",
  description: "Your personal, private, on-device AI tutor.",
};

export default async function AITutorPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  let initialContext = "";
  if (session) {
    const { data: flashcards } = await supabase
      .from("flashcards")
      .select("question, answer, subject")
      .eq("user_id", session.user.id)
      .limit(50);

    if (flashcards && flashcards.length > 0) {
      initialContext =
        "User's current study material (Flashcards):\n" +
        flashcards
          .map((f) => `Q: ${f.question} | A: ${f.answer} (${f.subject})`)
          .join("\n");
    }
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">AI Tutor</h2>
      </div>
      <div className="h-full w-full flex items-center justify-center p-4">
        <WebLLMChat initialContext={initialContext} />
      </div>
    </div>
  );
}
