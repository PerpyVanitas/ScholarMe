"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreditCard, Plus, Loader2, ShieldOff, Shield } from "lucide-react";
import { toast } from "sonner";
import type { AuthCard, Profile } from "@/lib/types";

export default function AdminCardsPage() {
  const [cards, setCards] = useState<AuthCard[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  // Issue card dialog
  const [issueOpen, setIssueOpen] = useState(false);
  const [issueLoading, setIssueLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState("");
  const [cardIdInput, setCardIdInput] = useState("");
  const [pinInput, setPinInput] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const [cardsRes, profilesRes] = await Promise.all([
        supabase.from("auth_cards").select("*, profiles(full_name, email)").order("issued_at", { ascending: false }),
        supabase.from("profiles").select("id, full_name, email").order("full_name"),
      ]);
      setCards(cardsRes.data || []);
      setProfiles(profilesRes.data || []);
      setLoading(false);
    }
    load();
  }, []);

  async function issueCard() {
    if (!selectedUser || !cardIdInput || !pinInput) {
      toast.error("Please fill all fields");
      return;
    }
    setIssueLoading(true);

    const res = await fetch("/api/admin/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: selectedUser,
        card_id: cardIdInput,
        pin: pinInput,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const profile = profiles.find((p) => p.id === selectedUser);
      setCards((prev) => [{ ...data, profiles: profile }, ...prev]);
      setIssueOpen(false);
      setSelectedUser("");
      setCardIdInput("");
      setPinInput("");
      toast.success("Card issued successfully");
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to issue card");
    }
    setIssueLoading(false);
  }

  async function toggleCardStatus(card: AuthCard) {
    const newStatus = card.status === "active" ? "revoked" : "active";

    const res = await fetch("/api/admin/cards", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: card.id, status: newStatus }),
    });

    if (res.ok) {
      setCards((prev) =>
        prev.map((c) => (c.id === card.id ? { ...c, status: newStatus as "active" | "revoked" } : c))
      );
      toast.success(`Card ${newStatus}`);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Card Management</h1>
          <p className="text-muted-foreground">Issue and manage authentication cards.</p>
        </div>
        <Dialog open={issueOpen} onOpenChange={setIssueOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Issue Card
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Issue Authentication Card</DialogTitle>
              <DialogDescription>
                Issue a new card ID and PIN to a user for card-based login.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-2">
                <Label>User</Label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.full_name || "Unnamed"} ({p.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Card ID</Label>
                <Input
                  value={cardIdInput}
                  onChange={(e) => setCardIdInput(e.target.value)}
                  placeholder="e.g., CARD-001"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>PIN</Label>
                <Input
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  type="password"
                  placeholder="4-6 digit PIN"
                  maxLength={6}
                  inputMode="numeric"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIssueOpen(false)}>Cancel</Button>
              <Button onClick={issueCard} disabled={issueLoading}>
                {issueLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Issue Card
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border/60">
        <CardContent className="p-0">
          {cards.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <div className="rounded-full bg-muted p-4">
                <CreditCard className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No cards issued yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Card ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Issued</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cards.map((card) => (
                  <TableRow key={card.id}>
                    <TableCell className="font-mono font-medium text-foreground">
                      {card.card_id}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {card.profiles?.full_name || card.profiles?.email || "Unknown"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          card.status === "active"
                            ? "bg-success/10 text-success border-success/30"
                            : "bg-destructive/10 text-destructive border-destructive/30"
                        }
                      >
                        {card.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(card.issued_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleCardStatus(card)}
                      >
                        {card.status === "active" ? (
                          <>
                            <ShieldOff className="mr-1 h-3.5 w-3.5" />
                            Revoke
                          </>
                        ) : (
                          <>
                            <Shield className="mr-1 h-3.5 w-3.5" />
                            Activate
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
