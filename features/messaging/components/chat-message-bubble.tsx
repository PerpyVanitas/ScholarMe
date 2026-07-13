import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Message } from "@/lib/types";
import { CheckCheck, Download, FileIcon, MoreVertical, Pin, Reply } from "lucide-react";

interface ChatMessageBubbleProps {
  msg: Message;
  isMe: boolean;
  senderName: string;
  showSenderName: boolean;
  isAdmin: boolean;
  messages: Message[];
  setReplyingTo: (msg: Message) => void;
  pinMessage: (messageId: string, isPinned: boolean) => void;
}

export function ChatMessageBubble({
  msg,
  isMe,
  senderName,
  showSenderName,
  isAdmin,
  messages,
  setReplyingTo,
  pinMessage,
}: ChatMessageBubbleProps) {
  return (
    <div className={`group flex w-full gap-2 ${isMe ? "justify-end" : "justify-start"}`}>
      {!isMe && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity mt-auto"
              aria-label="Message options"
            >
              <MoreVertical className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setReplyingTo(msg)}>
              <Reply className="h-4 w-4 mr-2" /> Reply
            </DropdownMenuItem>
            {isAdmin && (
              <DropdownMenuItem onClick={() => pinMessage(msg.id, !msg.is_pinned)}>
                <Pin className="h-4 w-4 mr-2" /> {msg.is_pinned ? "Unpin" : "Pin"}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      <div className={`flex flex-col gap-1 max-w-[75%] ${isMe ? "items-end" : "items-start"}`}>
        {showSenderName && (
          <span className={`text-[10px] font-semibold text-muted-foreground px-1 ${isMe ? "text-right" : ""}`}>
            {senderName}
          </span>
        )}
        <div
          className={`flex flex-col gap-1 rounded-lg px-4 py-2 text-sm relative ${
            isMe ? "bg-primary text-primary-foreground" : "bg-muted"
          }`}
        >
          {msg.is_pinned && (
            <Pin className={`absolute -top-2 -right-2 h-4 w-4 rotate-45 ${isMe ? "text-primary-foreground" : "text-primary"} drop-shadow`} />
          )}
          {msg.reply_to_id && (
            <div className="text-xs bg-background/20 rounded p-1.5 mb-1 border-l-2 border-primary-foreground/50 opacity-80 truncate">
              {messages.find((m) => m.id === msg.reply_to_id)?.content || "Replied to a message"}
            </div>
          )}
          {msg.file_url && (
            <div className="mb-2">
              {msg.file_type?.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={msg.file_url}
                  alt={msg.file_name || "attachment"}
                  className="max-w-[200px] max-h-[200px] rounded-md object-contain cursor-pointer"
                  onClick={() => window.open(msg.file_url!, "_blank")}
                />
              ) : (
                <a
                  href={msg.file_url}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 bg-background/20 rounded-md hover:bg-background/40 transition-colors"
                >
                  <FileIcon className="h-4 w-4 shrink-0" />
                  <span className="text-xs truncate max-w-[150px]">{msg.file_name || "Attachment"}</span>
                  <Download className="h-3 w-3 shrink-0 ml-auto opacity-70" />
                </a>
              )}
            </div>
          )}
          {msg.content && msg.content.match(/https?:\/\/[^\s]+/) && (
            <a
              href={msg.content.match(/https?:\/\/[^\s]+/)?.[0]}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-blue-300 underline text-xs mb-1 truncate max-w-[200px]"
            >
              {msg.content.match(/https?:\/\/[^\s]+/)?.[0]}
            </a>
          )}
          {msg.content && <span>{msg.content}</span>}
          <div className={`flex items-center gap-1 justify-end mt-1 text-[9px] ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
            <span>
              {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
            {isMe && <CheckCheck className="h-3 w-3 ml-0.5" />}
          </div>
        </div>
      </div>
      {isMe && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity mt-auto"
            >
              <MoreVertical className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setReplyingTo(msg)}>
              <Reply className="h-4 w-4 mr-2" /> Reply
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => pinMessage(msg.id, !msg.is_pinned)}>
              <Pin className="h-4 w-4 mr-2" /> {msg.is_pinned ? "Unpin" : "Pin"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
