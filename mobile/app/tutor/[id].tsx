import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, useColorScheme, Alert } from "react-native";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { colors, spacing, fontSize, borderRadius } from "@/lib/theme";
import { Card, Badge, Button, EmptyState, ScreenContainer } from "@/components/ui";
import type { Tutor, TutorAvailability } from "@/lib/types";
import { DAYS_OF_WEEK } from "@/lib/types";

export default function TutorDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme();
  const c = scheme === "dark" ? colors.dark : colors.light;
  const { user } = useAuth();

  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [availability, setAvailability] = useState<TutorAvailability[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadTutor(); }, [id]);

  async function loadTutor() {
    const { data: t } = await supabase
      .from("tutors")
      .select("*, profiles(*), tutor_specializations(specializations(*))")
      .eq("id", id)
      .single();
    setTutor(t);

    const { data: a } = await supabase
      .from("tutor_availability")
      .select("*")
      .eq("tutor_id", id)
      .order("day_of_week");
    setAvailability(a || []);
    setLoading(false);
  }

  async function handleBookSession() {
    if (!user || !tutor) return;
    // Create a pending session for today as a simple booking
    const today = new Date().toISOString().split("T")[0];
    const { error } = await supabase.from("sessions").insert({
      tutor_id: tutor.id,
      learner_id: user.id,
      scheduled_date: today,
      start_time: "09:00",
      end_time: "10:00",
      status: "pending",
    });

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      Alert.alert("Session Booked", "Your session request has been sent. The tutor will confirm shortly.", [
        { text: "OK", onPress: () => router.push("/(tabs)/sessions") },
      ]);
    }
  }

  if (loading || !tutor) {
    return <ScreenContainer><View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}><Text style={{ color: c.mutedForeground }}>Loading...</Text></View></ScreenContainer>;
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: tutor.profiles?.full_name || "Tutor", headerTintColor: c.foreground, headerStyle: { backgroundColor: c.background } }} />
      <ScreenContainer>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Profile header */}
          <View style={{ alignItems: "center", paddingVertical: spacing.xl }}>
            <View style={{ width: 80, height: 80, borderRadius: borderRadius.full, backgroundColor: c.primary + "20", alignItems: "center", justifyContent: "center", marginBottom: spacing.md }}>
              <Ionicons name="person" size={40} color={c.primary} />
            </View>
            <Text style={{ fontSize: fontSize.xl, fontWeight: "700", color: c.foreground }}>{tutor.profiles?.full_name}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs, marginTop: spacing.xs }}>
              <Ionicons name="star" size={16} color="#F59E0B" />
              <Text style={{ fontSize: fontSize.base, fontWeight: "600", color: c.foreground }}>{tutor.rating > 0 ? tutor.rating.toFixed(1) : "No ratings"}</Text>
              <Text style={{ fontSize: fontSize.sm, color: c.mutedForeground }}>({tutor.total_ratings} reviews)</Text>
            </View>
            <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.md, flexWrap: "wrap", justifyContent: "center" }}>
              {tutor.tutor_specializations?.map((ts) => (
                <Badge key={ts.specializations?.id} label={ts.specializations?.name || ""} color={c.primary} bgColor={c.primary + "15"} />
              ))}
            </View>
          </View>

          {/* Bio */}
          {tutor.bio && (
            <Card style={{ marginBottom: spacing.lg }}>
              <Text style={{ fontSize: fontSize.sm, fontWeight: "600", color: c.foreground, marginBottom: spacing.sm }}>About</Text>
              <Text style={{ fontSize: fontSize.sm, color: c.mutedForeground, lineHeight: 20 }}>{tutor.bio}</Text>
            </Card>
          )}

          {/* Availability */}
          <Card style={{ marginBottom: spacing.xl }}>
            <Text style={{ fontSize: fontSize.sm, fontWeight: "600", color: c.foreground, marginBottom: spacing.md }}>Weekly Availability</Text>
            {availability.length === 0 ? (
              <Text style={{ fontSize: fontSize.sm, color: c.mutedForeground }}>No availability set</Text>
            ) : (
              <View style={{ gap: spacing.sm }}>
                {availability.map((slot) => (
                  <View key={slot.id} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: spacing.xs }}>
                    <Text style={{ fontSize: fontSize.sm, fontWeight: "500", color: c.foreground }}>{DAYS_OF_WEEK[slot.day_of_week]}</Text>
                    <Text style={{ fontSize: fontSize.sm, color: c.mutedForeground }}>{slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}</Text>
                  </View>
                ))}
              </View>
            )}
          </Card>

          <Button title="Book a Session" onPress={handleBookSession} fullWidth />
          <View style={{ height: spacing["4xl"] }} />
        </ScrollView>
      </ScreenContainer>
    </>
  );
}
