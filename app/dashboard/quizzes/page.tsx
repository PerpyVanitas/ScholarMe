import { redirect } from "next/navigation";

export default function QuizzesPage() {
  redirect("/dashboard/study-sets?tab=quizzes");
}
