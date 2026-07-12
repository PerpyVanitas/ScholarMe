"use client";

import * as React from "react";
import {
  Check,
  ChevronsUpDown,
  Loader2,
  Search,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebounce } from "use-debounce";

import { cn, getAvatarUrl } from "@/lib/utils";
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

  const [selectedUser, setSelectedUser] = React.useState<UserProfile | null>(
    null,
  );
  const displayedSelectedUser = currentUserId ? selectedUser : null;

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
      return;
    }

    const fetchSelectedUser = async () => {
      try {
        const cached = users.find((u) => u.id === currentUserId);
        if (cached) {
          setSelectedUser(cached);
        } else {
          const res = await apiClient(
            `/api/messages/users?userId=${encodeURIComponent(currentUserId)}`,
          );
          if (res.success && res.data) {
            setSelectedUser(res.data);
          } else {
            setSelectedUser(null);
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchSelectedUser();
  }, [currentUserId, users]);

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
          {displayedSelectedUser ? (
            <div className="flex items-center gap-2 truncate">
              <Avatar className="h-6 w-6">
                <AvatarImage
                  src={getAvatarUrl(displayedSelectedUser.avatar_url) || ""}
                />
                <AvatarFallback>
                  {displayedSelectedUser.full_name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{displayedSelectedUser.full_name}</span>
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
                      <AvatarImage src={getAvatarUrl(user.avatar_url) || ""} />
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
