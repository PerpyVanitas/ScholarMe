import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, RefreshControl, useColorScheme } from "react-native";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { colors, spacing, fontSize, borderRadius } from "@/lib/theme";
import { Card, StatCard, ScreenContainer } from "@/components/ui";

interface AnalyticsData {
  totalUsers: number;
  totalTutors: number;
  totalSessions: number;
  completedSessions: number;
  pendingSessions: number;
  cancelledSessions: number;
  totalRepositories: number;
  totalResources: number;
}

export default function AdminAnalyticsScreen() {
  const scheme = useColorScheme();
  const c = scheme === "dark" ? colors.dark : colors.light;
  const [data, setData] = useState<AnalyticsData>({
    totalUsers: 0, totalTutors: 0, totalSessions: 0, completedSessions: 0,
    pendingSessions: 0, cancelledSessions: 0, totalRepositories: 0, totalResources: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadAnalytics(); }, []);

  async function loadAnalytics() {
    setRefreshing(true);
    const [users, tutors, sessions, completed, pending, cancelled, repos, resources] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("tutors").select("*", { count: "exact", head: true }),
      supabase.from("sessions").select("*", { count: "exact", head: true }),
      supabase.from("sessions").select("*", { count: "exact", head: true }).eq("status", "completed"),
      supabase.from("sessions").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("sessions").select("*", { count: "exact", head: true }).eq("status", "cancelled"),
      supabase.from("repositories").select("*", { count: "exact", head: true }),
      supabase.from("resources").select("*", { count: "exact", head: true }),
    ]);

    setData({
      totalUsers: users.count || 0,
      totalTutors: tutors.count || 0,
      totalSessions: sessions.count || 0,
      completedSessions: completed.count || 0,
      pendingSessions: pending.count || 0,
      cancelledSessions: cancelled.count || 0,
      totalRepositories: repos.count || 0,
      totalResources: resources.count || 0,
    });
    setRefreshing(false);
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: "Analytics", headerTintColor: c.foreground, headerStyle: { backgroundColor: c.background } }} />
      <ScreenContainer>
        <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadAnalytics} tintColor={c.primary} />}>
          {/* Users section */}
          <Text style={{ fontSize: fontSize.lg, fontWeight: "600", color: c.foreground, marginBottom: spacing.md }}>Users</Text>
          <View style={{ flexDirection: "row", gap: spacing.md, marginBottom: spacing.xl }}>
            <View style={{ flex: 1 }}><StatCard icon={<Ionicons name="people" size={20} color={c.primary} />} label="Total Users" value={data.totalUsers} /></View>
            <View style={{ flex: 1 }}><StatCard icon={<Ionicons name="school" size={20} color={c.success} />} label="Tutors" value={data.totalTutors} /></View>
          </View>

          {/* Sessions section */}
          <Text style={{ fontSize: fontSize.lg, fontWeight: "600", color: c.foreground, marginBottom: spacing.md }}>Sessions</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginBottom: spacing.xl }}>
            <View style={{ flex: 1, minWidth: "45%" }}><StatCard icon={<Ionicons name="calendar" size={20} color={c.primary} />} label="Total" value={data.totalSessions} /></View>
            <View style={{ flex: 1, minWidth: "45%" }}><StatCard icon={<Ionicons name="checkmark-circle" size={20} color={c.success} />} label="Completed" value={data.completedSessions} /></View>
            <View style={{ flex: 1, minWidth: "45%" }}><StatCard icon={<Ionicons name="time" size={20} color="#F59E0B" />} label="Pending" value={data.pendingSessions} /></View>
            <View style={{ flex: 1, minWidth: "45%" }}><StatCard icon={<Ionicons name="close-circle" size={20} color={c.destructive} />} label="Cancelled" value={data.cancelledSessions} /></View>
          </View>

          {/* Session completion bar */}
          <Card style={{ marginBottom: spacing.xl }}>
            <Text style={{ fontSize: fontSize.sm, fontWeight: "600", color: c.foreground, marginBottom: spacing.md }}>Completion Rate</Text>
            <View style={{ height: 12, backgroundColor: c.muted, borderRadius: borderRadius.full, overflow: "hidden" }}>
              <View
                style={{
                  height: "100%",
                  width: data.totalSessions > 0 ? `${(data.completedSessions / data.totalSessions) * 100}%` : "0%",
                  backgroundColor: c.success,
                  borderRadius: borderRadius.full,
                }}
              />
            </View>
            <Text style={{ fontSize: fontSize.xs, color: c.mutedForeground, marginTop: spacing.sm }}>
              {data.totalSessions > 0 ? `${Math.round((data.completedSessions / data.totalSessions) * 100)}%` : "0%"} of sessions completed
            </Text>
          </Card>

          {/* Resources section */}
          <Text style={{ fontSize: fontSize.lg, fontWeight: "600", color: c.foreground, marginBottom: spacing.md }}>Resources</Text>
          <View style={{ flexDirection: "row", gap: spacing.md, marginBottom: spacing["4xl"] }}>
            <View style={{ flex: 1 }}><StatCard icon={<Ionicons name="folder" size={20} color={c.primary} />} label="Repositories" value={data.totalRepositories} /></View>
            <View style={{ flex: 1 }}><StatCard icon={<Ionicons name="document-text" size={20} color={c.success} />} label="Resources" value={data.totalResources} /></View>
          </View>
        </ScrollView>
      </ScreenContainer>
    </>
  );
}
