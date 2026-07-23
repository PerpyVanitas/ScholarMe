import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Search } from "lucide-react";
import { getAvatarUrl } from "@/lib/utils";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Study Buddies - ScholarMe",
};

interface StudyBuddyMatch {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  degree_program: string | null;
  year_level: number | null;
  bio: string | null;
}

export default async function StudyBuddiesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: currentUser } = await supabase
    .from("profiles")
    .select("degree_program, year_level")
    .eq("id", user.id)
    .single();

  let matches: StudyBuddyMatch[] = [];
  if (currentUser?.degree_program && currentUser?.year_level) {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, degree_program, year_level, bio")
      .eq("degree_program", currentUser.degree_program)
      .eq("year_level", currentUser.year_level)
      .neq("id", user.id)
      .limit(20);
    
    if (data) {
      matches = data as StudyBuddyMatch[];
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">Study Buddy Matches</h2>
        <p className="text-muted-foreground">
          Connect with peers in your same degree program and year level.
        </p>
      </div>

      {!currentUser?.degree_program ? (
        <Card className="bg-muted/50">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold">Update Your Profile</h3>
            <p className="text-muted-foreground mb-4 max-w-md">
              We need to know your degree program and year level to find your study buddies!
            </p>
            <Link href="/dashboard/profile">
              <Button>Edit Profile</Button>
            </Link>
          </CardContent>
        </Card>
      ) : matches.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No matches found for {currentUser.degree_program} Year {currentUser.year_level} yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matches.map((match) => (
            <Card key={match.id} className="overflow-hidden flex flex-col">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <Avatar className="h-12 w-12 border-2 border-primary/10">
                    <AvatarImage src={getAvatarUrl(match.avatar_url) || ""} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {match.full_name?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <Badge variant="secondary">
                    Year {match.year_level || 1}
                  </Badge>
                </div>
                <CardTitle className="mt-4">{match.full_name || "Honor Scholar"}</CardTitle>
                <CardDescription className="truncate">{match.degree_program}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {match.bio || "No bio provided."}
                </p>
              </CardContent>
              <CardFooter className="pt-4 border-t bg-muted/20">
                <Link href={`/dashboard/messages?recipientId=${match.id}`} className="w-full">
                  <Button className="w-full gap-2" variant="default">
                    <MessageSquare className="h-4 w-4" />
                    Message
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
