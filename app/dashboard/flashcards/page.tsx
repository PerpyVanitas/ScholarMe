import { redirect } from "next/navigation";

export default function FlashcardsPage() {
  redirect("/dashboard/study-sets?tab=flashcards");
}
