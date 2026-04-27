"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Tutor } from "../types";
import type { Specialization } from "@/lib/types";

export function useTutors() {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      try {
        const [tutorRes, specRes] = await Promise.all([
          supabase
            .from("tutors")
            .select("*, profiles(*), tutor_specializations(specializations(*))")
            .order("rating", { ascending: false }),
          supabase.from("specializations").select("*").order("name"),
        ]);

        if (tutorRes.error) throw tutorRes.error;
        if (specRes.error) throw specRes.error;

        setTutors(tutorRes.data || []);
        setSpecializations(specRes.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load tutors");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return { tutors, specializations, loading, error };
}

export function useFilteredTutors(
  tutors: Tutor[],
  search: string,
  selectedSpec: string
) {
  return tutors.filter((t) => {
    const nameMatch =
      !search || t.profiles?.full_name?.toLowerCase().includes(search.toLowerCase());
    const specMatch =
      selectedSpec === "all" ||
      t.tutor_specializations?.some(
        (ts) => ts.specializations?.name === selectedSpec
      );
    return nameMatch && specMatch;
  });
}
