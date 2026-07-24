"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { searchUsers } from "../actions";
import { Profile } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

interface UsersDirectoryProps {
  currentUserId: string;
  initialQuery?: string;
}

export function UsersDirectory({
  currentUserId,
  initialQuery = "",
}: UsersDirectoryProps) {
  const [query, setQuery] = useState(initialQuery);
  const debouncedQuery = useDebounce(query, 500);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const fetchUsers = async () => {
      try {
        const results = await searchUsers(debouncedQuery);
        if (isMounted && results.success && results.data) {
          // Filter out the current user
          setUsers(
            results.data.filter(
              // @ts-expect-error: Strict unknown type check
              (u: unknown) => u.id !== currentUserId,
            ) as Profile[],
          );
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchUsers();

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery, currentUserId]);

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2) || "U";
  };

  return (
    <div className="space-y-6">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, degree, or role..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 shadow-sm border-primary/20 focus-visible:ring-primary/50"
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-20 border rounded-xl bg-card/50 text-muted-foreground shadow-inner">
          <Search className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <h3 className="text-lg font-medium text-foreground mb-1">
            No users found
          </h3>
          <p>Try adjusting your search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((user) => (
            <Card
              key={user.id}
              className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer group border-primary/10"
              onClick={() => router.push(`/dashboard/users/${user.id}`)}
            >
              <CardHeader className="flex flex-row items-center gap-4 pb-2 bg-gradient-to-r from-muted/30 to-transparent">
                <Avatar className="h-14 w-14 border-2 border-background shadow-sm ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all">
                  <AvatarImage
                    src={
                      user.avatar_url?.startsWith("avatars/")
                        ? `/api/v1/avatar?pathname=${encodeURIComponent(user.avatar_url)}`
                        : user.avatar_url || ""
                    }
                  />
                  <AvatarFallback className="bg-primary/5 text-primary text-lg">
                    {getInitials(user.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <CardTitle className="truncate text-lg">
                    {user.full_name || "Unknown User"}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground truncate">
                    {user.membership_classification === "learner"
                      ? "Learner"
                      : user.membership_classification === "esas_scholar"
                        ? "ESAS Scholar"
                        : "Regular Member"}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div className="text-sm space-y-1">
                  {user.degree_program && (
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>Program:</span>
                      <span className="font-medium text-foreground truncate max-w-[150px]">
                        {user.degree_program}
                      </span>
                    </div>
                  )}
                  {user.status_message && (
                    <div className="mt-2 text-sm italic border-l-2 border-primary/30 pl-2 text-muted-foreground truncate">
                      &quot;{user.status_message}&quot;
                    </div>
                  )}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/dashboard/users/${user.id}`);
                    }}
                  >
                    View Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
