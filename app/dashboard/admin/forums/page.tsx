import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Flag, EyeOff, ShieldAlert } from "lucide-react";

export default async function ForumsModerationPage() {
  const supabase = await createClient();
  
  // Fetch flagged or hidden posts for moderation
  const { data: posts, error } = await supabase
    .from("forum_posts")
    .select("*, author:author_id(full_name)")
    .or("is_flagged.eq.true,is_hidden.eq.true")
    .order("created_at", { ascending: false });

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Forum Moderation</h1>
          <p className="text-muted-foreground">Review flagged content and manage forum visibility.</p>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Post Title</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(!posts || posts.length === 0) && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No flagged posts requiring moderation.
                </TableCell>
              </TableRow>
            )}
            {posts?.map((post: any) => (
              <TableRow key={post.id}>
                <TableCell className="font-medium">{post.title}</TableCell>
                <TableCell>{post.author?.full_name || "Unknown User"}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {post.is_flagged && <span className="flex items-center text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded-full"><Flag className="h-3 w-3 mr-1" /> Flagged</span>}
                    {post.is_hidden && <span className="flex items-center text-xs text-red-600 bg-red-100 px-2 py-1 rounded-full"><EyeOff className="h-3 w-3 mr-1" /> Hidden</span>}
                  </div>
                </TableCell>
                <TableCell>{new Date(post.created_at).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm">Review</Button>
                    <Button variant="destructive" size="sm">Hide</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
