import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, useColorScheme } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { colors, spacing, fontSize, borderRadius } from "@/lib/theme";
import { Card, StatCard, Badge, EmptyState, ScreenContainer } from "@/components/ui";
import type { Session } from "@/lib/types";

const statusColors: Record<string, { bg: string; fg: string }> = {
  pending: { bg: "#F59E0B22", fg: "#D97706" },
  confirmed: { bg: "#2563EB22", fg: "#2563EB" },
  completed: { bg: "#22C55E22", fg: "#22C55E" },
  cancelled: { bg: "#EF444422", fg: "#EF4444" },
};

export default function HomeScreen() {
  const scheme = useColorScheme();
  const c = scheme === "dark" ? colors.dark : colors.light;
  const { user, profile, role } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, upcoming: 0, activeTutors: 0, totalUsers: 0, pending: 0, rating: 0, totalRatings: 0 });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadData(); }, [user, role]);

  async function loadData() {
    if (!user) return;
    setRefreshing(true);

    if (role === "learner") {
      const [{ data: s }, { count: total }, { count: completed }, { count: upcoming }] = await Promise.all([
        supabase.from("sessions").select("*, tutors(*, profiles(*)), specializations(*)").eq("learner_id", user.id).in("status", ["pending", "confirmed"]).order("scheduled_date").limit(5),
        supabase.from("sessions").select("*", { count: "exact", head: true }).eq("learner_id", user.id),
        supabase.from("sessions").select("*", { count: "exact", head: true }).eq("learner_id", user.id).eq("status", "completed"),
        supabase.from("sessions").select("*", { count: "exact", head: true }).eq("learner_id", user.id).in("status", ["pending", "confirmed"]),
      ]);
      setSessions(s || []);
      setStats(prev => ({ ...prev, total: total || 0, completed: completed || 0, upcoming: upcoming || 0 }));
    } else if (role === "tutor") {
      const { data: tutor } = await supabase.from("tutors").select("*").eq("user_id", user.id).single();
      const tid = tutor?.id || "none";
      const [{ data: s }, { count: completed }, { count: upcoming }] = await Promise.all([
        supabase.from("sessions").select("*, specializations(*)").eq("tutor_id", tid).in("status", ["pending", "confirmed"]).order("scheduled_date").limit(5),
        supabase.from("sessions").select("*", { count: "exact", head: true }).eq("tutor_id", tid).eq("status", "completed"),
        supabase.from("sessions").select("*", { count: "exact", head: true }).eq("tutor_id", tid).in("status", ["pending", "confirmed"]),
      ]);
      setSessions(s || []);
      setStats(prev => ({ ...prev, completed: completed || 0, upcoming: upcoming || 0, rating: tutor?.rating || 0, totalRatings: tutor?.total_ratings || 0 }));
    } else {
      const [{ count: totalUsers }, { count: activeTutors }, { count: totalSessions }, { count: pending }, { data: s }] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("tutors").select("*", { count: "exact", head: true }),
        supabase.from("sessions").select("*", { count: "exact", head: true }),
        supabase.from("sessions").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("sessions").select("*, tutors(*, profiles(*))").order("created_at", { ascending: false }).limit(5),
      ]);
      setSessions(s || []);
      setStats(prev => ({ ...prev, totalUsers: totalUsers || 0, activeTutors: activeTutors || 0, total: totalSessions || 0, pending: pending || 0 }));
    }
    setRefreshing(false);
  }

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor={c.primary} />}>
        {/* Header */}
        <View style={{ marginBottom: spacing.xl, marginTop: spacing["3xl"] }}>
          <Text style={{ fontSize: fontSize["2xl"], fontWeight: "700", color: c.foreground }}>
            {role === "administrator" ? "Admin Dashboard" : `Welcome back, ${profile?.full_name || "User"}`}
          </Text>
          <Text style={{ fontSize: fontSize.sm, color: c.mutedForeground, marginTop: spacing.xs }}>
            {role === "learner" ? "Your tutoring journey" : role === "tutor" ? "Manage your sessions" : "Organization overview"}
          </Text>
        </View>

        {/* Stats */}
        <View style={{ gap: spacing.md, marginBottom: spacing.xl }}>
          {role === "learner" && (
            <View style={{ flexDirection: "row", gap: spacing.md }}>
              <View style={{ flex: 1 }}><StatCard icon={<Ionicons name="calendar" size={20} color={c.primary} />} label="Total" value={stats.total} /></View>
              <View style={{ flex: 1 }}><StatCard icon={<Ionicons name="checkmark-circle" size={20} color={c.success} />} label="Done" value={stats.completed} /></View>
              <View style={{ flex: 1 }}><StatCard icon={<Ionicons name="time" size={20} color={c.warning} />} label="Next" value={stats.upcoming} /></View>
            </View>
          )}
          {role === "tutor" && (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
              <View style={{ flex: 1, minWidth: "45%" }}><StatCard icon={<Ionicons name="time" size={20} color={c.primary} />} label="Upcoming" value={stats.upcoming} /></View>
              <View style={{ flex: 1, minWidth: "45%" }}><StatCard icon={<Ionicons name="checkmark-circle" size={20} color={c.success} />} label="Completed" value={stats.completed} /></View>
              <View style={{ flex: 1, minWidth: "45%" }}><StatCard icon={<Ionicons name="star" size={20} color="#F59E0B" />} label="Rating" value={stats.rating > 0 ? stats.rating.toFixed(1) : "N/A"} /></View>
              <View style={{ flex: 1, minWidth: "45%" }}><StatCard icon={<Ionicons name="chatbubble" size={20} color={c.mutedForeground} />} label="Reviews" value={stats.totalRatings} /></View>
            </View>
          )}
          {role === "administrator" && (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
              <View style={{ flex: 1, minWidth: "45%" }}><StatCard icon={<Ionicons name="people" size={20} color={c.primary} />} label="Users" value={stats.totalUsers} /></View>
              <View style={{ flex: 1, minWidth: "45%" }}><StatCard icon={<Ionicons name="school" size={20} color={c.success} />} label="Tutors" value={stats.activeTutors} /></View>
              <View style={{ flex: 1, minWidth: "45%" }}><StatCard icon={<Ionicons name="calendar" size={20} color={c.warning} />} label="Sessions" value={stats.total} /></View>
              <View style={{ flex: 1, minWidth: "45%" }}><StatCard icon={<Ionicons name="time" size={20} color={c.destructive} />} label="Pending" value={stats.pending} /></View>
            </View>
          )}
        </View>

        {/* Recent sessions */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md }}>
          <Text style={{ fontSize: fontSize.lg, fontWeight: "600", color: c.foreground }}>
            {role === "administrator" ? "Recent Sessions" : "Upcoming Sessions"}
          </Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/sessions")}>
            <Text style={{ fontSize: fontSize.sm, color: c.primary }}>View all</Text>
          </TouchableOpacity>
        </View>

        {sessions.length === 0 ? (
          <EmptyState icon={<Ionicons name="calendar-outline" size={24} color={c.mutedForeground} />} message="No sessions yet" />
        ) : (
          <View style={{ gap: spacing.sm }}>
            {sessions.map((s) => {
              const sc = statusColors[s.status] || statusColors.pending;
              return (
                <Card key={s.id} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: fontSize.sm, fontWeight: "600", color: c.foreground }}>
                      {s.tutors?.profiles?.full_name || "Session"}
                    </Text>
                    <Text style={{ fontSize: fontSize.xs, color: c.mutedForeground, marginTop: 2 }}>
                      {new Date(s.scheduled_date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                      {s.start_time ? ` at ${s.start_time.slice(0, 5)}` : ""}
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", gap: spacing.sm, alignItems: "center" }}>
                    {s.specializations && <Badge label={s.specializations.name} color={c.foreground} bgColor={c.muted} />}
                    <Badge label={s.status} color={sc.fg} bgColor={sc.bg} />
                  </View>
                </Card>
              );
            })}
          </View>
        )}

        <View style={{ height: spacing["4xl"] }} />
      </ScrollView>
    </ScreenContainer>
  );
}
