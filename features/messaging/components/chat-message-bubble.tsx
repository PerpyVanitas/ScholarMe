"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Message } from "@/lib/types";
import { CheckCheck, Download, FileIcon, MoreVertical, Pin, Reply, Maximize2 } from "lucide-react";

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
  const [imageLightboxOpen, setImageLightboxOpen] = useState(false);

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
          className={`flex flex-col gap-1.5 rounded-xl px-4 py-2.5 text-xs relative ${
            isMe ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
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

          {/* Attachment rendering */}
          {msg.file_url && (
            <div className="mb-1">
              {msg.file_type?.startsWith("image/") || (msg.file_url.startsWith("data:image/") || msg.file_url.match(/\.(jpg|jpeg|png|webp|gif)/i)) ? (
                <div className="relative group/img">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={msg.file_url}
                    alt={msg.file_name || "attachment"}
                    className="max-w-[240px] max-h-[220px] rounded-lg object-cover cursor-pointer border border-primary/20 hover:opacity-90 transition-opacity"
                    onClick={() => setImageLightboxOpen(true)}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="h-6 w-6 absolute bottom-2 right-2 opacity-0 group-hover/img:opacity-100 transition-opacity bg-black/60 text-white hover:bg-black/80"
                    onClick={() => setImageLightboxOpen(true)}
                  >
                    <Maximize2 className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <a
                  href={msg.file_url}
                  download={msg.file_name || "Attachment"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 p-2.5 bg-background/20 rounded-lg hover:bg-background/40 transition-colors border border-primary/10"
                >
                  <FileIcon className="h-4 w-4 shrink-0 text-primary" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-medium truncate max-w-[160px]">{msg.file_name || "Attachment File"}</span>
                    <span className="text-[10px] opacity-70">Click to download</span>
                  </div>
                  <Download className="h-3.5 w-3.5 shrink-0 ml-auto opacity-80" />
                </a>
              )}
            </div>
          )}

          {msg.content && msg.content.match(/https?:\/\/[^\s]+/) && (
            <a
              href={msg.content.match(/https?:\/\/[^\s]+/)?.[0]}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-blue-300 underline text-xs mb-1 truncate max-w-[220px]"
            >
              {msg.content.match(/https?:\/\/[^\s]+/)?.[0]}
            </a>
          )}
          {msg.content && <span className="leading-relaxed whitespace-pre-wrap">{msg.content}</span>}
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

      {/* Image Lightbox Modal */}
      {msg.file_url && (
        <Dialog open={imageLightboxOpen} onOpenChange={setImageLightboxOpen}>
          <DialogContent className="max-w-4xl p-2 bg-black/95 border-none text-white flex flex-col items-center justify-center">
            <DialogHeader className="w-full flex items-center justify-between p-2">
              <DialogTitle className="text-sm font-normal text-white/80">
                {msg.file_name || "Attached Photo"}
              </DialogTitle>
            </DialogHeader>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={msg.file_url}
              alt={msg.file_name || "Full Preview"}
              className="max-h-[80vh] w-auto object-contain rounded-md"
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
