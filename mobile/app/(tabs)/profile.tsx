import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, useColorScheme, Alert } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { colors, spacing, fontSize, borderRadius } from "@/lib/theme";
import { Card, Badge, Button, ScreenContainer } from "@/components/ui";
import type { Notification } from "@/lib/types";

export default function ProfileScreen() {
  const scheme = useColorScheme();
  const c = scheme === "dark" ? colors.dark : colors.light;
  const { profile, role, signOut } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => { loadNotifications(); }, []);

  async function loadNotifications() {
    if (!profile) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(10);
    setNotifications(data || []);
    setUnreadCount(data?.filter(n => !n.is_read).length || 0);
  }

  async function markAllRead() {
    if (!profile) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", profile.id).eq("is_read", false);
    loadNotifications();
  }

  async function handleSignOut() {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: async () => { await signOut(); router.replace("/(auth)/login"); } },
    ]);
  }

  const roleColors: Record<string, { bg: string; fg: string }> = {
    administrator: { bg: c.primary + "20", fg: c.primary },
    tutor: { bg: c.success + "20", fg: c.success },
    learner: { bg: c.warning + "20", fg: c.warning },
  };

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ marginTop: spacing["3xl"], marginBottom: spacing.xl }}>
          {/* Avatar & name */}
          <View style={{ alignItems: "center", paddingVertical: spacing.xl }}>
            <View style={{ width: 80, height: 80, borderRadius: borderRadius.full, backgroundColor: c.primary + "20", alignItems: "center", justifyContent: "center", marginBottom: spacing.md }}>
              <Ionicons name="person" size={40} color={c.primary} />
            </View>
            <Text style={{ fontSize: fontSize.xl, fontWeight: "700", color: c.foreground }}>{profile?.full_name || "User"}</Text>
            <Text style={{ fontSize: fontSize.sm, color: c.mutedForeground, marginTop: spacing.xs }}>{profile?.email}</Text>
            <Badge label={role} color={roleColors[role]?.fg || c.foreground} bgColor={roleColors[role]?.bg || c.muted} />
          </View>

          {/* Notifications */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <Text style={{ fontSize: fontSize.lg, fontWeight: "600", color: c.foreground }}>Notifications</Text>
              {unreadCount > 0 && (
                <View style={{ backgroundColor: c.destructive, borderRadius: borderRadius.full, paddingHorizontal: spacing.sm, paddingVertical: 1 }}>
                  <Text style={{ fontSize: fontSize.xs, color: c.destructiveForeground, fontWeight: "600" }}>{unreadCount}</Text>
                </View>
              )}
            </View>
            {unreadCount > 0 && (
              <TouchableOpacity onPress={markAllRead}>
                <Text style={{ fontSize: fontSize.sm, color: c.primary }}>Mark all read</Text>
              </TouchableOpacity>
            )}
          </View>

          {notifications.length === 0 ? (
            <Card style={{ alignItems: "center", paddingVertical: spacing["2xl"] }}>
              <Ionicons name="notifications-off-outline" size={24} color={c.mutedForeground} />
              <Text style={{ fontSize: fontSize.sm, color: c.mutedForeground, marginTop: spacing.sm }}>No notifications</Text>
            </Card>
          ) : (
            <View style={{ gap: spacing.sm }}>
              {notifications.map((notif) => (
                <Card key={notif.id} style={{ opacity: notif.is_read ? 0.6 : 1 }}>
                  <View style={{ flexDirection: "row", gap: spacing.md }}>
                    <Ionicons
                      name={notif.type === "session" ? "calendar" : notif.type === "resource" ? "folder" : "information-circle"}
                      size={20}
                      color={c.primary}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: fontSize.sm, fontWeight: "600", color: c.foreground }}>{notif.title}</Text>
                      <Text style={{ fontSize: fontSize.xs, color: c.mutedForeground, marginTop: 2 }}>{notif.message}</Text>
                      <Text style={{ fontSize: fontSize.xs, color: c.mutedForeground, marginTop: spacing.xs }}>
                        {new Date(notif.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                      </Text>
                    </View>
                    {!notif.is_read && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.primary }} />}
                  </View>
                </Card>
              ))}
            </View>
          )}

          {/* Menu items */}
          <View style={{ marginTop: spacing.xl, gap: spacing.sm }}>
            {role === "tutor" && (
              <TouchableOpacity onPress={() => router.push("/availability")} style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.lg, backgroundColor: c.card, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: c.cardBorder }}>
                <Ionicons name="time-outline" size={20} color={c.foreground} />
                <Text style={{ flex: 1, fontSize: fontSize.base, color: c.foreground }}>Manage Availability</Text>
                <Ionicons name="chevron-forward" size={16} color={c.mutedForeground} />
              </TouchableOpacity>
            )}
            {role === "administrator" && (
              <>
                <TouchableOpacity onPress={() => router.push("/admin/users")} style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.lg, backgroundColor: c.card, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: c.cardBorder }}>
                  <Ionicons name="people-outline" size={20} color={c.foreground} />
                  <Text style={{ flex: 1, fontSize: fontSize.base, color: c.foreground }}>User Management</Text>
                  <Ionicons name="chevron-forward" size={16} color={c.mutedForeground} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push("/admin/cards")} style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.lg, backgroundColor: c.card, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: c.cardBorder }}>
                  <Ionicons name="card-outline" size={20} color={c.foreground} />
                  <Text style={{ flex: 1, fontSize: fontSize.base, color: c.foreground }}>Card Management</Text>
                  <Ionicons name="chevron-forward" size={16} color={c.mutedForeground} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push("/admin/analytics")} style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.lg, backgroundColor: c.card, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: c.cardBorder }}>
                  <Ionicons name="bar-chart-outline" size={20} color={c.foreground} />
                  <Text style={{ flex: 1, fontSize: fontSize.base, color: c.foreground }}>Analytics</Text>
                  <Ionicons name="chevron-forward" size={16} color={c.mutedForeground} />
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Sign out */}
          <View style={{ marginTop: spacing["3xl"] }}>
            <Button title="Sign Out" variant="destructive" onPress={handleSignOut} fullWidth />
          </View>

          <View style={{ height: spacing["4xl"] }} />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
