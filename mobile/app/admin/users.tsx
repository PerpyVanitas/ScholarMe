import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, RefreshControl, useColorScheme, Alert } from "react-native";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { colors, spacing, fontSize, borderRadius } from "@/lib/theme";
import { Card, Badge, Button, EmptyState, ScreenContainer, Input } from "@/components/ui";
import type { Profile } from "@/lib/types";

export default function AdminUsersScreen() {
  const scheme = useColorScheme();
  const c = scheme === "dark" ? colors.dark : colors.light;
  const [users, setUsers] = useState<Profile[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
    setRefreshing(true);
    const { data } = await supabase.from("profiles").select("*, roles(*)").order("created_at", { ascending: false });
    setUsers(data || []);
    setRefreshing(false);
  }

  async function updateRole(userId: string, roleId: string) {
    const { error } = await supabase.from("profiles").update({ role_id: roleId }).eq("id", userId);
    if (error) Alert.alert("Error", error.message);
    else loadUsers();
  }

  const filtered = users.filter(u =>
    !search || u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const roleColors: Record<string, { bg: string; fg: string }> = {
    administrator: { bg: c.primary + "20", fg: c.primary },
    tutor: { bg: c.success + "20", fg: c.success },
    learner: { bg: c.warning + "20", fg: c.warning },
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: "User Management", headerTintColor: c.foreground, headerStyle: { backgroundColor: c.background } }} />
      <ScreenContainer>
        <View style={{ marginBottom: spacing.lg }}>
          <Input placeholder="Search users..." value={search} onChangeText={setSearch} />
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadUsers} tintColor={c.primary} />}
          ListEmptyComponent={<EmptyState icon={<Ionicons name="people-outline" size={24} color={c.mutedForeground} />} message="No users found" />}
          renderItem={({ item: user }) => {
            const roleName = user.roles?.name || "learner";
            const rc = roleColors[roleName] || roleColors.learner;
            return (
              <View style={{ marginBottom: spacing.md }}>
                <Card>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
                    <View style={{ width: 44, height: 44, borderRadius: borderRadius.full, backgroundColor: rc.bg, alignItems: "center", justifyContent: "center" }}>
                      <Ionicons name="person" size={22} color={rc.fg} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: fontSize.base, fontWeight: "600", color: c.foreground }}>{user.full_name || "No name"}</Text>
                      <Text style={{ fontSize: fontSize.xs, color: c.mutedForeground }}>{user.email}</Text>
                    </View>
                    <Badge label={roleName} color={rc.fg} bgColor={rc.bg} />
                  </View>
                  <Text style={{ fontSize: fontSize.xs, color: c.mutedForeground, marginTop: spacing.sm }}>
                    Joined {new Date(user.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </Text>
                </Card>
              </View>
            );
          }}
        />
      </ScreenContainer>
    </>
  );
}
