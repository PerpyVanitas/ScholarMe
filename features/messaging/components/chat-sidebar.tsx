import { Search, Plus, MessageSquare, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatDistanceToNow } from "date-fns";
import { getAvatarUrl } from "@/lib/utils";
import type { Conversation, Profile } from "@/lib/types";

interface ChatSidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  conversationSearch: string;
  setConversationSearch: (val: string) => void;
  showNewChatDialog: boolean;
  setShowNewChatDialog: (val: boolean) => void;
  userSearch: string;
  setUserSearch: (val: string) => void;
  users: Profile[];
  loadingUsers: boolean;
  startNewConversation: (id: string) => void;
  getConversationDisplayInfo: (conv: Conversation) => {
    title: string;
    avatarUrl: string;
    initial: string;
    isAudit: boolean;
  };
}

export function ChatSidebar({
  conversations,
  activeConversationId,
  setActiveConversationId,
  conversationSearch,
  setConversationSearch,
  showNewChatDialog,
  setShowNewChatDialog,
  userSearch,
  setUserSearch,
  users,
  loadingUsers,
  startNewConversation,
  getConversationDisplayInfo,
}: ChatSidebarProps) {
  return (
    <div
      className={`w-full md:w-80 flex-col bg-muted/20 ${activeConversationId ? "hidden md:flex" : "flex"}`}
    >
      <div className="p-4 border-b flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search conversations..."
            className="pl-9 bg-background"
            value={conversationSearch}
            onChange={(e) => setConversationSearch(e.target.value)}
          />
        </div>
        <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
          <DialogTrigger asChild>
            <Button
              size="icon"
              variant="outline"
              className="shrink-0"
              title="New Message"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>New Chat</DialogTitle>
              <DialogDescription>
                Select a user to start a conversation.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search users..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-9 bg-background"
                />
              </div>

              <ScrollArea className="h-[250px] pr-2">
                {loadingUsers ? (
                  <div className="flex items-center justify-center h-40">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground text-sm">
                    No users found
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    {users.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => startNewConversation(u.id)}
                        className="flex items-center gap-3 p-3 text-left rounded-md transition-colors hover:bg-muted"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={getAvatarUrl(u.avatar_url) || ""} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {u.full_name?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium truncate">
                              {u.full_name}
                            </p>
                            <Badge
                              variant="secondary"
                              className="text-[10px] font-normal shrink-0"
                            >
                              {Array.isArray(u.roles)
                                ? u.roles[0]?.name
                                : // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                  ((u.roles as Record<string, unknown> | null)?.name as string) || "user"}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {u.email}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <ScrollArea className="flex-1">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground p-4 text-center">
            <MessageSquare className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No conversations yet</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {conversations
              .filter((conv) => {
                if (!conversationSearch.trim()) return true;
                const info = getConversationDisplayInfo(conv);
                return info.title
                  .toLowerCase()
                  .includes(conversationSearch.toLowerCase());
              })
              .map((conv) => {
                const displayInfo = getConversationDisplayInfo(conv);
                const latestMessage = conv.messages?.[0];
                const isActive = conv.id === activeConversationId;

                return (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConversationId(conv.id)}
                    className={`flex items-start gap-3 p-4 text-left transition-colors hover:bg-muted/50 ${
                      isActive ? "bg-muted" : ""
                    }`}
                  >
                    <Avatar>
                      <AvatarImage
                        src={getAvatarUrl(displayInfo.avatarUrl) || ""}
                      />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {displayInfo.initial}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="font-medium text-sm truncate">
                          {displayInfo.title}
                        </span>
                        {latestMessage && (
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                            {formatDistanceToNow(
                              new Date(latestMessage.created_at),
                              { addSuffix: true },
                            )}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {latestMessage?.content ||
                          (latestMessage?.file_url
                            ? "Sent an attachment"
                            : "No messages yet")}
                      </p>
                    </div>
                  </button>
                );
              })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
