"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpenText, Search, FileText, ShieldCheck, HelpCircle, ThumbsUp, ThumbsDown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

interface Citation {
  id: string;
  title: string;
  category: string;
  content: string;
}

export default function InstitutionalWikiPage() {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [voted, setVoted] = useState<"up" | "down" | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    try {
      setSearching(true);
      setAnswer(null);
      setCitations([]);
      setVoted(null);

      const res = await fetch("/api/wiki/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      if (!res.ok) {
        throw new Error("Failed to perform wiki search");
      }

      const data = await res.json();
      setAnswer(data.answer);
      setCitations(data.citations || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Search failed";
      toast.error(msg);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-b pb-4">
        <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
          <BookOpenText className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Institutional Knowledge Wiki</h1>
          <p className="text-sm text-muted-foreground">
            Search CIT-U Honor Society SOPs, governance guidelines, tutor manuals, and FAQs.
          </p>
        </div>
      </div>

      {/* Scope Disclaimer Banner */}
      <div className="p-3 rounded-lg border bg-muted/40 text-xs flex items-center gap-2 text-muted-foreground">
        <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
        <span>
          <strong>Institutional Search Only:</strong> This wiki answers questions about org policies, SOPs, and governance. For academic homework help, please use the <strong>AI Tutor</strong>.
        </span>
      </div>

      {/* Search Input */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search SOPs, shift rules, tutor guidelines, or handoff notes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit" disabled={searching}>
          {searching ? "Searching..." : "Search Wiki"}
        </Button>
      </form>

      {/* Loading Skeleton */}
      {searching && (
        <div className="space-y-4 pt-4">
          <Skeleton className="h-[150px] w-full rounded-xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Skeleton className="h-[80px] w-full rounded-md" />
            <Skeleton className="h-[80px] w-full rounded-md" />
          </div>
        </div>
      )}

      {/* Search Results / Answer */}
      {!searching && answer && (
        <Card className="border-2 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" /> Answer & Policy Citation
              </span>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className={`h-8 w-8 ${voted === 'up' ? 'text-green-500' : ''}`} onClick={() => { setVoted("up"); toast.success("Feedback recorded!"); }}>
                  <ThumbsUp className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className={`h-8 w-8 ${voted === 'down' ? 'text-destructive' : ''}`} onClick={() => { setVoted("down"); toast.success("Feedback recorded!"); }}>
                  <ThumbsDown className="h-4 w-4" />
                </Button>
              </div>
            </CardTitle>
            <CardDescription className="text-xs">
              Role-verified document retrieval
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm leading-relaxed text-foreground bg-muted/20 p-4 rounded-lg border prose dark:prose-invert max-w-none">
              <ReactMarkdown>{answer}</ReactMarkdown>
            </div>

            {/* Source Citations */}
            {citations.length > 0 && (
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Source Documents ({citations.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {citations.map((c) => (
                    <div key={c.id} className="p-3 rounded-md border bg-card text-xs space-y-1">
                      <div className="flex items-center justify-between font-semibold">
                        <span className="truncate text-foreground">{c.title}</span>
                        <Badge variant="outline" className="text-[10px]">{c.category}</Badge>
                      </div>
                      <p className="text-muted-foreground line-clamp-2">{c.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick FAQ / Topics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-4">
        <Card className="p-3 cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setQuery("PLC operating procedure clock in")}>
          <div className="font-semibold flex items-center gap-1.5 mb-1">
            <HelpCircle className="h-4 w-4 text-primary" /> PLC Clock-In Rules
          </div>
          <p className="text-muted-foreground text-[11px]">How physical attendance and 2-hour shifts are verified.</p>
        </Card>
        <Card className="p-3 cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setQuery("Code of ethics strikes")}>
          <div className="font-semibold flex items-center gap-1.5 mb-1">
            <HelpCircle className="h-4 w-4 text-primary" /> Honor Code & Strikes
          </div>
          <p className="text-muted-foreground text-[11px]">Academic integrity expectations and no-show policies.</p>
        </Card>
        <Card className="p-3 cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setQuery("Officer handoff notes transition")}>
          <div className="font-semibold flex items-center gap-1.5 mb-1">
            <HelpCircle className="h-4 w-4 text-primary" /> Officer Term Handoff
          </div>
          <p className="text-muted-foreground text-[11px]">SOP for outgoing committee heads leaving transition notes.</p>
        </Card>
      </div>
    </div>
  );
}
