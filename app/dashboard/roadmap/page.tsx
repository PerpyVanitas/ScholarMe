import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpCircle, CheckCircle, Clock, Map, Loader2 } from "lucide-react";
import { RoadmapItem } from "@/lib/types";
import { revalidatePath } from "next/cache";

export default async function RoadmapPage() {
  const supabase = await createClient();
  
  const { data: items } = await supabase
    .from("roadmap_items")
    .select("*")
    .order("upvotes", { ascending: false });
    
  const { data: { user } } = await supabase.auth.getUser();

  const roadmapItems: RoadmapItem[] = items || [];

  const planned = roadmapItems.filter(i => i.status === "planned");
  const inProgress = roadmapItems.filter(i => i.status === "in-progress");
  const completed = roadmapItems.filter(i => i.status === "completed");

  async function upvote(formData: FormData) {
    "use server";
    const itemId = formData.get("itemId") as string;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Check if already upvoted
      const { data: existing } = await supabase
        .from("roadmap_upvotes")
        .select("id")
        .eq("roadmap_item_id", itemId)
        .eq("user_id", user.id)
        .single();
        
      if (!existing) {
        await supabase.from("roadmap_upvotes").insert({
          roadmap_item_id: itemId,
          user_id: user.id
        });
        
        await supabase.rpc("increment_roadmap_upvote", { item_id: itemId });
        revalidatePath("/dashboard/roadmap");
      }
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Map className="h-6 w-6" /> Public Roadmap
        </h1>
        <p className="text-muted-foreground">Vote on features you want to see built next.</p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6">
        
        {/* Planned */}
        <div className="flex flex-col gap-4">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" /> Planned
          </h2>
          {planned.length === 0 && <p className="text-sm text-muted-foreground italic">No planned features currently.</p>}
          {planned.map(item => (
            <Card key={item.id} className="border-border/60 shadow-sm">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base">{item.title}</CardTitle>
                <CardDescription className="text-xs">{item.description}</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-2 flex items-center justify-between">
                <Badge variant="outline" className="bg-muted/50 text-muted-foreground">Planned</Badge>
                <form action={upvote}>
                  <input type="hidden" name="itemId" value={item.id} />
                  <Button variant="ghost" size="sm" type="submit" className="gap-1 h-8 px-2 text-muted-foreground hover:text-primary">
                    <ArrowUpCircle className="h-4 w-4" /> {item.upvotes}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* In Progress */}
        <div className="flex flex-col gap-4">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <Loader2 className="h-5 w-5 text-blue-500 animate-spin" /> In Progress
          </h2>
          {inProgress.length === 0 && <p className="text-sm text-muted-foreground italic">Nothing in progress.</p>}
          {inProgress.map(item => (
            <Card key={item.id} className="border-border/60 shadow-sm border-blue-500/20">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base">{item.title}</CardTitle>
                <CardDescription className="text-xs">{item.description}</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-2 flex items-center justify-between">
                <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">In Progress</Badge>
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <ArrowUpCircle className="h-4 w-4" /> {item.upvotes}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Completed */}
        <div className="flex flex-col gap-4">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" /> Completed
          </h2>
          {completed.length === 0 && <p className="text-sm text-muted-foreground italic">No completed features yet.</p>}
          {completed.map(item => (
            <Card key={item.id} className="border-border/60 shadow-sm opacity-70">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base line-through">{item.title}</CardTitle>
                <CardDescription className="text-xs">{item.description}</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-2 flex items-center justify-between">
                <Badge variant="secondary" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">Completed</Badge>
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <ArrowUpCircle className="h-4 w-4" /> {item.upvotes}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

      </div>
    </div>
  );
}
