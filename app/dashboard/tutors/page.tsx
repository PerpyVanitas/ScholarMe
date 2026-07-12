/** Tutors list -- browse, search, and filter tutors by name or specialization. */
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Star, Loader2, Users } from "lucide-react";
import { TutorDetailModal } from "@/features/tutors/components/tutor-detail-modal";
import { useDebounce } from "@/hooks/use-debounce";
import type { Tutor, Specialization } from "@/lib/types";

export default function TutorsPage() {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [selectedSpec, setSelectedSpec] = useState("all");
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const [tutorRes, specRes] = await Promise.all([
        supabase
          .from("tutors")
          .select(
            "*, profiles(*, roles(name)), tutor_specializations(specializations(*)), attendance_logs(clock_in, clock_out)",
          )
          .order("rating", { ascending: false }),
        supabase.from("specializations").select("*").order("name"),
      ]);
      setTutors(tutorRes.data || []);
      setSpecializations(specRes.data || []);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = tutors.filter((t) => {
    // Check if the role allows them to tutor
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const roles: any = t.profiles?.roles;
    const roleName = Array.isArray(roles) ? roles[0]?.name : roles?.name;
    if (
      roleName !== "tutor" &&
      roleName !== "officer" &&
      roleName !== "super_admin"
    )
      return false;

    // Must be clocked into the timesheet system
    const isClockedIn = t.attendance_logs?.some((log) => !log.clock_out);
    if (!isClockedIn) return false;

    const nameMatch =
      !debouncedSearch ||
      t.profiles?.full_name
        ?.toLowerCase()
        .includes(debouncedSearch.toLowerCase());
    const specMatch =
      selectedSpec === "all" ||
      t.tutor_specializations?.some(
        (ts: { specializations: Specialization }) =>
          ts.specializations?.name === selectedSpec,
      );
    return nameMatch && specMatch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Find a Tutor
        </h1>
        <p className="text-muted-foreground">
          Browse tutors by name or specialization.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tutors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={selectedSpec} onValueChange={setSelectedSpec}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Subjects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {specializations.map((s) => (
              <SelectItem key={s.id} value={s.name}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-border/60 bg-muted/20">
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="rounded-full bg-primary/10 p-5 ring-4 ring-primary/5">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">
                {tutors.length === 0
                  ? "No Tutors Available"
                  : "No Tutors Found"}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {tutors.length === 0
                  ? "We are currently onboarding new tutors. Please check back later!"
                  : "We couldn't find any tutors matching your current search criteria. Try adjusting your filters."}
              </p>
            </div>
            {tutors.length > 0 && (search || selectedSpec !== "all") && (
              <Button
                variant="outline"
                className="mt-2"
                onClick={() => {
                  setSearch("");
                  setSelectedSpec("all");
                }}
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((tutor) => {
            const name = tutor.profiles?.full_name || "Tutor";
            const initials = name
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);
            const specs =
              tutor.tutor_specializations?.map(
                (ts: { specializations: Specialization }) =>
                  ts.specializations?.name,
              ) || [];

            return (
              <Card
                key={tutor.id}
                className="border-border/60 hover:border-primary/30 transition-colors flex flex-col h-full"
              >
                <CardContent className="flex flex-col gap-4 p-5 flex-1">
                  {/* Header Section - Fixed Height */}
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground line-clamp-1">
                          {name}
                        </span>
                        {tutor.rating >= 4.5 && tutor.total_ratings >= 5 && (
                          <Badge
                            variant="default"
                            className="text-[10px] h-4 px-1.5 py-0 bg-yellow-500 hover:bg-yellow-600 text-white border-transparent"
                          >
                            Top Rated
                          </Badge>
                        )}
                        {(tutor.profiles as any)?.roles?.name === "officer" && (
                          <Badge
                            variant="default"
                            className="text-[10px] h-4 px-1.5 py-0 bg-blue-500 hover:bg-blue-600 text-white border-transparent"
                          >
                            Lead
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star className="h-3.5 w-3.5 fill-accent text-accent flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">
                          {tutor.rating > 0 ? tutor.rating.toFixed(1) : "New"}{" "}
                          {tutor.total_ratings > 0 &&
                            `(${tutor.total_ratings})`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bio Section - Fixed Height */}
                  <div className="h-10 flex items-start">
                    {tutor.bio ? (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {tutor.bio}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground/50 italic">
                        No bio available
                      </p>
                    )}
                  </div>

                  {/* Specializations Section - Flexible Height */}
                  <div className="flex-1 flex flex-col">
                    {specs.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {specs.map((s: string) => (
                          <Badge
                            key={s}
                            variant="secondary"
                            className="text-xs"
                          >
                            {s}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground/50">
                        No specializations listed
                      </p>
                    )}
                  </div>
                </CardContent>

                {/* Button Section - Fixed to Bottom */}
                <div className="px-5 pb-5">
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setSelectedTutor(tutor);
                      setModalOpen(true);
                    }}
                  >
                    View Profile
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Tutor Detail Modal */}
      {selectedTutor && (
        <TutorDetailModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          tutor={selectedTutor}
        />
      )}
    </div>
  );
}
