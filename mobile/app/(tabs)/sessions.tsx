import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, RefreshControl, useColorScheme, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { colors, spacing, fontSize, borderRadius } from "@/lib/theme";
import { Card, Badge, Button, EmptyState, ScreenContainer } from "@/components/ui";
import type { Session, SessionStatus } from "@/lib/types";

const statusColors: Record<string, { bg: string; fg: string }> = {
  pending: { bg: "#F59E0B22", fg: "#D97706" },
  confirmed: { bg: "#2563EB22", fg: "#2563EB" },
  completed: { bg: "#22C55E22", fg: "#22C55E" },
  cancelled: { bg: "#EF444422", fg: "#EF4444" },
};

const filters: SessionStatus[] = ["pending", "confirmed", "completed", "cancelled"];

export default function SessionsScreen() {
  const scheme = useColorScheme();
  const c = scheme === "dark" ? colors.dark : colors.light;
  const { user, role } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<SessionStatus | "all">("all");

  useEffect(() => { loadSessions(); }, [user, role]);

  async function loadSessions() {
    if (!user) return;
    setRefreshing(true);

    let query = supabase.from("sessions").select("*, tutors(*, profiles(*)), specializations(*)").order("scheduled_date", { ascending: false });

    if (role === "learner") query = query.eq("learner_id", user.id);
    else if (role === "tutor") {
      const { data: tutor } = await supabase.from("tutors").select("id").eq("user_id", user.id).single();
      if (tutor) query = query.eq("tutor_id", tutor.id);
    }

    const { data } = await query;
    setSessions(data || []);
    setRefreshing(false);
  }

  async function updateSessionStatus(sessionId: string, newStatus: SessionStatus) {
    const { error } = await supabase.from("sessions").update({ status: newStatus }).eq("id", sessionId);
    if (error) Alert.alert("Error", error.message);
    else loadSessions();
  }

  const filtered = activeFilter === "all" ? sessions : sessions.filter(s => s.status === activeFilter);

  return (
    <ScreenContainer>
      <View style={{ marginTop: spacing["3xl"], marginBottom: spacing.lg }}>
        <Text style={{ fontSize: fontSize["2xl"], fontWeight: "700", color: c.foreground }}>Sessions</Text>
        <Text style={{ fontSize: fontSize.sm, color: c.mutedForeground, marginTop: spacing.xs }}>Manage your tutoring sessions</Text>
      </View>

      {/* Filters */}
      <View style={{ flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg, flexWrap: "wrap" }}>
        <TouchableOpacity onPress={() => setActiveFilter("all")} style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, backgroundColor: activeFilter === "all" ? c.primary : c.muted }}>
          <Text style={{ fontSize: fontSize.xs, fontWeight: "500", color: activeFilter === "all" ? c.primaryForeground : c.mutedForeground }}>All</Text>
        </TouchableOpacity>
        {filters.map((f) => (
          <TouchableOpacity key={f} onPress={() => setActiveFilter(f)} style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, backgroundColor: activeFilter === f ? c.primary : c.muted }}>
            <Text style={{ fontSize: fontSize.xs, fontWeight: "500", color: activeFilter === f ? c.primaryForeground : c.mutedForeground, textTransform: "capitalize" }}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadSessions} tintColor={c.primary} />}
        ListEmptyComponent={<EmptyState icon={<Ionicons name="calendar-outline" size={24} color={c.mutedForeground} />} message="No sessions found" />}
        renderItem={({ item: session }) => {
          const sc = statusColors[session.status] || statusColors.pending;
          return (
            <View style={{ marginBottom: spacing.md }}>
              <Card>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <View style={{ flex: 1, gap: spacing.xs }}>
                    <Text style={{ fontSize: fontSize.base, fontWeight: "600", color: c.foreground }}>
                      {session.tutors?.profiles?.full_name || "Session"}
                    </Text>
                    <Text style={{ fontSize: fontSize.sm, color: c.mutedForeground }}>
                      {new Date(session.scheduled_date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                    </Text>
                    <Text style={{ fontSize: fontSize.xs, color: c.mutedForeground }}>
                      {session.start_time?.slice(0, 5)} - {session.end_time?.slice(0, 5)}
                    </Text>
                  </View>
                  <Badge label={session.status} color={sc.fg} bgColor={sc.bg} />
                </View>
                {session.specializations && (
                  <View style={{ marginTop: spacing.sm }}>
                    <Badge label={session.specializations.name} color={c.foreground} bgColor={c.muted} />
                  </View>
                )}
                {session.notes && (
                  <Text style={{ fontSize: fontSize.xs, color: c.mutedForeground, marginTop: spacing.sm }}>{session.notes}</Text>
                )}
                {/* Action buttons based on role */}
                {role === "tutor" && session.status === "pending" && (
                  <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.md }}>
                    <View style={{ flex: 1 }}><Button title="Confirm" variant="primary" onPress={() => updateSessionStatus(session.id, "confirmed")} /></View>
                    <View style={{ flex: 1 }}><Button title="Cancel" variant="outline" onPress={() => updateSessionStatus(session.id, "cancelled")} /></View>
                  </View>
                )}
                {role === "tutor" && session.status === "confirmed" && (
                  <View style={{ marginTop: spacing.md }}>
                    <Button title="Mark Complete" variant="secondary" onPress={() => updateSessionStatus(session.id, "completed")} fullWidth />
                  </View>
                )}
                {role === "learner" && session.status === "pending" && (
                  <View style={{ marginTop: spacing.md }}>
                    <Button title="Cancel Request" variant="outline" onPress={() => updateSessionStatus(session.id, "cancelled")} fullWidth />
                  </View>
                )}
              </Card>
            </View>
          );
        }}
      />
    </ScreenContainer>
  );
}
