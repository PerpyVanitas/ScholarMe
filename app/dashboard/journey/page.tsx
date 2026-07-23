import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PortfolioTab } from "./components/portfolio-tab";
import { ReadinessSummaryTab } from "./components/readiness-summary-tab";
import { LearningAnalyticsTab } from "./components/learning-analytics-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Compass, Share2, FileText, Brain } from "lucide-react";

export default async function MyJourneyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/auth/onboarding");
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3 border-b pb-4">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <Compass className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Journey</h1>
          <p className="text-sm text-muted-foreground">
            Build your portfolio, track factual readiness, and view real subject mastery analytics.
          </p>
        </div>
      </div>

      <Tabs defaultValue="portfolio" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="portfolio" className="gap-2">
            <Share2 className="h-4 w-4" /> Portfolio
          </TabsTrigger>
          <TabsTrigger value="readiness" className="gap-2">
            <FileText className="h-4 w-4" /> Readiness
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <Brain className="h-4 w-4" /> Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="portfolio">
          <PortfolioTab profile={profile} />
        </TabsContent>

        <TabsContent value="readiness">
          <ReadinessSummaryTab profile={profile} />
        </TabsContent>

        <TabsContent value="analytics">
          <LearningAnalyticsTab profile={profile} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
