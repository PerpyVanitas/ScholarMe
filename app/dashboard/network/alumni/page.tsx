import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, GraduationCap } from "lucide-react";
import { getAvatarUrl } from "@/lib/utils";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Alumni Network - ScholarMe",
};

export default async function AlumniNetworkPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Get Alumni role id
  const { data: alumniRole } = await supabase
    .from("roles")
    .select("id")
    .eq("name", "Alumni")
    .single();

  let alumni: any[] = [];
  if (alumniRole) {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, degree_program, bio")
      .eq("role_id", alumniRole.id)
      .limit(50);
    
    if (data) {
      alumni = data;
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">Alumni Network</h2>
        <p className="text-muted-foreground">
          Connect with graduates who can mentor you and answer career questions.
        </p>
      </div>

      {alumni.length === 0 ? (
        <Card className="bg-muted/50">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <GraduationCap className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold">No Alumni Found</h3>
            <p className="text-muted-foreground mb-4 max-w-md">
              There are currently no users registered in the Alumni network. 
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {alumni.map((alumnus) => (
            <Card key={alumnus.id} className="overflow-hidden flex flex-col">
              <CardHeader className="pb-4 border-b bg-primary/5">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-background shadow-sm">
                    <AvatarImage src={getAvatarUrl(alumnus.avatar_url) || ""} />
                    <AvatarFallback className="bg-primary/20 text-primary font-bold text-lg">
                      {alumnus.full_name?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{alumnus.full_name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <Badge variant="outline" className="text-xs bg-background">Alumnus</Badge>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 pt-4">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Graduated From
                </div>
                <div className="text-sm mb-3">
                  {alumnus.degree_program || "Unknown Degree"}
                </div>
                
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Bio / Current Role
                </div>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {alumnus.bio || "No bio provided."}
                </p>
              </CardContent>
              <CardFooter className="pt-4 border-t bg-muted/20">
                <Link href={`/dashboard/messages?new=${alumnus.id}`} className="w-full">
                  <Button className="w-full gap-2" variant="outline">
                    <MessageSquare className="h-4 w-4" />
                    Reach Out
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
