import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, useColorScheme, FlatList } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { colors, spacing, fontSize, borderRadius } from "@/lib/theme";
import { Card, Badge, EmptyState, ScreenContainer, Input } from "@/components/ui";
import type { Tutor, Specialization } from "@/lib/types";

export default function TutorsScreen() {
  const scheme = useColorScheme();
  const c = scheme === "dark" ? colors.dark : colors.light;
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [selectedSpec, setSelectedSpec] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
    supabase.from("specializations").select("*").then(({ data }) => setSpecializations(data || []));
  }, []);

  async function loadData() {
    setRefreshing(true);
    let query = supabase.from("tutors").select("*, profiles(*), tutor_specializations(specializations(*))");
    const { data } = await query;
    setTutors(data || []);
    setRefreshing(false);
  }

  const filtered = tutors.filter((t) => {
    const nameMatch = !search || t.profiles?.full_name?.toLowerCase().includes(search.toLowerCase());
    const specMatch = !selectedSpec || t.tutor_specializations?.some(ts => ts.specializations?.id === selectedSpec);
    return nameMatch && specMatch;
  });

  return (
    <ScreenContainer>
      <View style={{ marginTop: spacing["3xl"], marginBottom: spacing.lg }}>
        <Text style={{ fontSize: fontSize["2xl"], fontWeight: "700", color: c.foreground }}>Find a Tutor</Text>
        <Text style={{ fontSize: fontSize.sm, color: c.mutedForeground, marginTop: spacing.xs }}>Browse available tutors and book sessions</Text>
      </View>

      <Input placeholder="Search tutors..." value={search} onChangeText={setSearch} />

      {/* Specialization filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: spacing.md, marginBottom: spacing.lg, flexGrow: 0 }}>
        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <TouchableOpacity
            onPress={() => setSelectedSpec(null)}
            style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, backgroundColor: !selectedSpec ? c.primary : c.muted }}
          >
            <Text style={{ fontSize: fontSize.sm, color: !selectedSpec ? c.primaryForeground : c.mutedForeground, fontWeight: "500" }}>All</Text>
          </TouchableOpacity>
          {specializations.map((spec) => (
            <TouchableOpacity
              key={spec.id}
              onPress={() => setSelectedSpec(selectedSpec === spec.id ? null : spec.id)}
              style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, backgroundColor: selectedSpec === spec.id ? c.primary : c.muted }}
            >
              <Text style={{ fontSize: fontSize.sm, color: selectedSpec === spec.id ? c.primaryForeground : c.mutedForeground, fontWeight: "500" }}>{spec.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor={c.primary} />}
        ListEmptyComponent={<EmptyState icon={<Ionicons name="people-outline" size={24} color={c.mutedForeground} />} message="No tutors found" />}
        renderItem={({ item: tutor }) => (
          <TouchableOpacity activeOpacity={0.7} onPress={() => router.push(`/tutor/${tutor.id}`)} style={{ marginBottom: spacing.md }}>
            <Card>
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
                <View style={{ width: 48, height: 48, borderRadius: borderRadius.full, backgroundColor: c.primary + "20", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="person" size={24} color={c.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: fontSize.base, fontWeight: "600", color: c.foreground }}>{tutor.profiles?.full_name || "Tutor"}</Text>
                  {tutor.bio && <Text numberOfLines={1} style={{ fontSize: fontSize.xs, color: c.mutedForeground, marginTop: 2 }}>{tutor.bio}</Text>}
                  <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs, flexWrap: "wrap" }}>
                    {tutor.tutor_specializations?.map((ts) => (
                      <Badge key={ts.specializations?.id} label={ts.specializations?.name || ""} color={c.primary} bgColor={c.primary + "15"} />
                    ))}
                  </View>
                </View>
                <View style={{ alignItems: "center" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                    <Ionicons name="star" size={14} color="#F59E0B" />
                    <Text style={{ fontSize: fontSize.sm, fontWeight: "600", color: c.foreground }}>{tutor.rating > 0 ? tutor.rating.toFixed(1) : "N/A"}</Text>
                  </View>
                  <Text style={{ fontSize: fontSize.xs, color: c.mutedForeground }}>{tutor.total_ratings} reviews</Text>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        )}
      />
    </ScreenContainer>
  );
}
