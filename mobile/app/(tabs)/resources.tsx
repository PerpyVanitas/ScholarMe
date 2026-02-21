import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, RefreshControl, useColorScheme, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { colors, spacing, fontSize, borderRadius } from "@/lib/theme";
import { Card, Badge, EmptyState, ScreenContainer } from "@/components/ui";
import type { Repository } from "@/lib/types";

const accessLabels: Record<string, string> = { all: "Public", tutor: "Tutors", admin: "Admin" };

export default function ResourcesScreen() {
  const scheme = useColorScheme();
  const c = scheme === "dark" ? colors.dark : colors.light;
  const { role } = useAuth();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [expandedRepo, setExpandedRepo] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadRepositories(); }, [role]);

  async function loadRepositories() {
    setRefreshing(true);
    let query = supabase.from("repositories").select("*, profiles(*), resources(*)").order("created_at", { ascending: false });

    if (role === "learner") query = query.eq("access_role", "all");
    else if (role === "tutor") query = query.in("access_role", ["all", "tutor"]);

    const { data } = await query;
    setRepositories(data || []);
    setRefreshing(false);
  }

  return (
    <ScreenContainer>
      <View style={{ marginTop: spacing["3xl"], marginBottom: spacing.lg }}>
        <Text style={{ fontSize: fontSize["2xl"], fontWeight: "700", color: c.foreground }}>Resources</Text>
        <Text style={{ fontSize: fontSize.sm, color: c.mutedForeground, marginTop: spacing.xs }}>Study materials and learning resources</Text>
      </View>

      <FlatList
        data={repositories}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadRepositories} tintColor={c.primary} />}
        ListEmptyComponent={<EmptyState icon={<Ionicons name="folder-outline" size={24} color={c.mutedForeground} />} message="No resources available" />}
        renderItem={({ item: repo }) => (
          <View style={{ marginBottom: spacing.md }}>
            <TouchableOpacity activeOpacity={0.7} onPress={() => setExpandedRepo(expandedRepo === repo.id ? null : repo.id)}>
              <Card>
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
                  <View style={{ width: 40, height: 40, borderRadius: borderRadius.lg, backgroundColor: c.primary + "15", alignItems: "center", justifyContent: "center" }}>
                    <Ionicons name="folder" size={20} color={c.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: fontSize.base, fontWeight: "600", color: c.foreground }}>{repo.title}</Text>
                    {repo.description && <Text numberOfLines={1} style={{ fontSize: fontSize.xs, color: c.mutedForeground, marginTop: 2 }}>{repo.description}</Text>}
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                    <Badge label={accessLabels[repo.access_role] || repo.access_role} color={c.primary} bgColor={c.primary + "15"} />
                    <Ionicons name={expandedRepo === repo.id ? "chevron-up" : "chevron-down"} size={16} color={c.mutedForeground} />
                  </View>
                </View>

                {expandedRepo === repo.id && repo.resources && repo.resources.length > 0 && (
                  <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
                    {repo.resources.map((resource) => (
                      <TouchableOpacity
                        key={resource.id}
                        onPress={() => Linking.openURL(resource.url)}
                        style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: c.border }}
                      >
                        <Ionicons name="document-text-outline" size={18} color={c.mutedForeground} />
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: fontSize.sm, fontWeight: "500", color: c.foreground }}>{resource.title}</Text>
                          {resource.description && <Text numberOfLines={1} style={{ fontSize: fontSize.xs, color: c.mutedForeground }}>{resource.description}</Text>}
                        </View>
                        <Ionicons name="open-outline" size={16} color={c.primary} />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {expandedRepo === repo.id && (!repo.resources || repo.resources.length === 0) && (
                  <Text style={{ marginTop: spacing.md, fontSize: fontSize.sm, color: c.mutedForeground, textAlign: "center" }}>No resources in this repository</Text>
                )}
              </Card>
            </TouchableOpacity>
          </View>
        )}
      />
    </ScreenContainer>
  );
}
