import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Message } from "@/lib/types";
import { FileIcon, Loader2, Paperclip, Send, Sparkles, X } from "lucide-react";
import React, { FormEvent } from "react";

interface ChatInputAreaProps {
  replyingTo: Message | null;
  setReplyingTo: (msg: Message | null) => void;
  attachment: File | null;
  setAttachment: (file: File | null) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  generatingReplies: boolean;
  smartReplies: string[];
  messages: Message[];
  currentUserId: string | undefined;
  handleSuggestReplies: () => void;
  repliesProgress: string;
  setNewMessage: (msg: string) => void;
  setSmartReplies: (replies: string[]) => void;
  handleSendMessage: (e: FormEvent) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isSending: boolean;
  newMessage: string;
  sendTypingEvent: () => void;
}

export function ChatInputArea({
  replyingTo,
  setReplyingTo,
  attachment,
  setAttachment,
  fileInputRef,
  generatingReplies,
  smartReplies,
  messages,
  currentUserId,
  handleSuggestReplies,
  repliesProgress,
  setNewMessage,
  setSmartReplies,
  handleSendMessage,
  handleFileChange,
  isSending,
  newMessage,
  sendTypingEvent,
}: ChatInputAreaProps) {
  return (
    <div className="p-4 bg-background border-t">
      {replyingTo && (
        <div className="mb-2 flex items-center justify-between p-2 text-sm bg-muted/30 border-l-2 border-primary rounded-r">
          <div className="truncate text-muted-foreground">
            Replying to{" "}
            <span className="font-medium text-foreground">
              {replyingTo.profiles?.full_name || "Someone"}
            </span>
            : {replyingTo.content}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4"
            onClick={() => setReplyingTo(null)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
      {attachment && (
        <div className="mb-3 flex items-center gap-3 p-2 border rounded-md bg-muted/50 w-fit max-w-[80%] relative pr-8">
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 absolute top-1 right-1 hover:bg-destructive/10 hover:text-destructive"
            onClick={() => {
              setAttachment(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
            aria-label="Remove attachment"
          >
            <X className="h-3 w-3" />
          </Button>
          {attachment.type.startsWith("image/") ? (
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-background border flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={URL.createObjectURL(attachment)}
                alt="preview"
                className="object-cover h-full w-full"
              />
            </div>
          ) : (
            <FileIcon className="h-8 w-8 text-muted-foreground shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-xs font-medium truncate">{attachment.name}</p>
            <p className="text-[10px] text-muted-foreground">
              {(attachment.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        </div>
      )}

      {/* Smart Replies Area */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {!generatingReplies &&
          smartReplies.length === 0 &&
          messages.length > 0 &&
          messages[messages.length - 1].sender_id !== currentUserId && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSuggestReplies}
              className="h-7 text-xs rounded-full border-primary/30 text-primary hover:bg-primary/10"
            >
              <Sparkles className="h-3 w-3 mr-1" /> Suggest Reply
            </Button>
          )}
        {generatingReplies && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground border px-3 py-1 rounded-full bg-muted/30">
            <Loader2 className="h-3 w-3 animate-spin" />
            {repliesProgress}
          </div>
        )}
        {!generatingReplies && smartReplies.length > 0 && (
          <>
            {smartReplies.map((reply, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                className="h-7 text-xs rounded-full"
                onClick={() => {
                  setNewMessage(reply);
                  setSmartReplies([]);
                }}
              >
                {reply}
              </Button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 rounded-full text-muted-foreground"
              onClick={() => setSmartReplies([])}
              aria-label="Clear smart replies"
            >
              <X className="h-3 w-3" />
            </Button>
          </>
        )}
      </div>

      <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0"
          onClick={() => fileInputRef.current?.click()}
          disabled={isSending}
          aria-label="Attach file"
        >
          <Paperclip className="h-4 w-4" />
        </Button>
        <Input
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);
            sendTypingEvent();
          }}
          className="flex-1"
          disabled={isSending}
        />
        <Button
          type="submit"
          disabled={(!newMessage.trim() && !attachment) || isSending}
          aria-label="Send message"
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  );
}
