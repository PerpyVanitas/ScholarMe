"use client";

import * as React from "react";
import {
  Check,
  ChevronsUpDown,
  Loader2,
  Search,
  User as UserIcon,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebounce } from "use-debounce";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiClient } from "@/lib/api-client";

type UserProfile = {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  role: string;
};

export function UserSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentUserId = searchParams.get("userId");

  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [debouncedQuery] = useDebounce(query, 300);
  const [users, setUsers] = React.useState<UserProfile[]>([]);
  const [loading, setLoading] = React.useState(false);

  // To show the currently selected user if we have one
  const [selectedUser, setSelectedUser] = React.useState<UserProfile | null>(
    null,
  );

  React.useEffect(() => {
    if (!open) return;

    let isMounted = true;
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const res = await apiClient(
          `/api/messages/users?q=${encodeURIComponent(debouncedQuery)}`,
        );
        if (res.success && isMounted) {
          setUsers(res.data || []);
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
  }, [debouncedQuery, open]);

  // Fetch the selected user details on mount or if currentUserId changes
  React.useEffect(() => {
    if (!currentUserId) {
      setSelectedUser(null);
      return;
    }

    const fetchSelectedUser = async () => {
      try {
        // We can just search for them by id, wait we only have a general search.
        // But /api/messages/users returns top 20. A specific API for single user isn't guaranteed.
        // Actually, if we just want to show "Selected User", we can rely on the list if they just clicked it,
        // or just show "User Selected" as fallback.
        const cached = users.find((u) => u.id === currentUserId);
        if (cached) {
          setSelectedUser(cached);
        } else {
          // just a placeholder
          setSelectedUser({
            id: currentUserId,
            full_name: "Selected User",
            email: "",
            avatar_url: null,
            role: "",
          });
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchSelectedUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  const handleSelect = (user: UserProfile) => {
    setSelectedUser(user);
    setOpen(false);

    // Update URL
    const params = new URLSearchParams(searchParams.toString());
    params.set("userId", user.id);
    router.push(`?${params.toString()}`);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full max-w-md justify-between"
        >
          {selectedUser ? (
            <div className="flex items-center gap-2 truncate">
              <Avatar className="h-6 w-6">
                <AvatarImage src={selectedUser.avatar_url || ""} />
                <AvatarFallback>
                  {selectedUser.full_name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{selectedUser.full_name}</span>
            </div>
          ) : (
            <span className="text-muted-foreground flex items-center gap-2">
              <Search className="h-4 w-4" />
              Select a user to audit...
            </span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search users by name..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {loading && (
              <div className="p-4 flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}
            {!loading && users.length === 0 && (
              <CommandEmpty>No users found.</CommandEmpty>
            )}
            <CommandGroup>
              {!loading &&
                users.map((user) => (
                  <CommandItem
                    key={user.id}
                    value={user.id}
                    onSelect={() => handleSelect(user)}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar_url || ""} />
                      <AvatarFallback>
                        {user.full_name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium">{user.full_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {user.email}
                      </span>
                    </div>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        currentUserId === user.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
