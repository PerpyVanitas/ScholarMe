import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, useColorScheme, Alert } from "react-native";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { colors, spacing, fontSize, borderRadius } from "@/lib/theme";
import { Card, Button, EmptyState, ScreenContainer } from "@/components/ui";
import type { TutorAvailability } from "@/lib/types";
import { DAYS_OF_WEEK } from "@/lib/types";

const timeSlots = Array.from({ length: 28 }, (_, i) => {
  const hour = Math.floor(i / 2) + 7;
  const minute = i % 2 === 0 ? "00" : "30";
  return `${hour.toString().padStart(2, "0")}:${minute}`;
});

export default function AvailabilityScreen() {
  const scheme = useColorScheme();
  const c = scheme === "dark" ? colors.dark : colors.light;
  const { user } = useAuth();

  const [tutorId, setTutorId] = useState<string | null>(null);
  const [slots, setSlots] = useState<TutorAvailability[]>([]);
  const [loading, setLoading] = useState(true);

  // New slot form
  const [selectedDay, setSelectedDay] = useState(1);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");

  useEffect(() => { loadData(); }, [user]);

  async function loadData() {
    if (!user) return;
    const { data: tutor } = await supabase.from("tutors").select("id").eq("user_id", user.id).single();
    if (tutor) {
      setTutorId(tutor.id);
      const { data } = await supabase.from("tutor_availability").select("*").eq("tutor_id", tutor.id).order("day_of_week");
      setSlots(data || []);
    }
    setLoading(false);
  }

  async function addSlot() {
    if (!tutorId) { Alert.alert("Error", "Tutor profile not found"); return; }
    if (startTime >= endTime) { Alert.alert("Error", "End time must be after start time"); return; }

    const { error } = await supabase.from("tutor_availability").insert({
      tutor_id: tutorId,
      day_of_week: selectedDay,
      start_time: startTime,
      end_time: endTime,
    });

    if (error) Alert.alert("Error", error.message);
    else loadData();
  }

  async function deleteSlot(slotId: string) {
    Alert.alert("Delete Slot", "Remove this availability slot?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive", onPress: async () => {
          await supabase.from("tutor_availability").delete().eq("id", slotId);
          loadData();
        },
      },
    ]);
  }

  // Group slots by day
  const grouped = DAYS_OF_WEEK.map((day, idx) => ({
    day,
    dayIndex: idx,
    slots: slots.filter((s) => s.day_of_week === idx),
  })).filter((g) => g.slots.length > 0);

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: "Availability", headerTintColor: c.foreground, headerStyle: { backgroundColor: c.background } }} />
      <ScreenContainer>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Add slot */}
          <Card style={{ marginBottom: spacing.xl }}>
            <Text style={{ fontSize: fontSize.base, fontWeight: "600", color: c.foreground, marginBottom: spacing.md }}>Add Availability Slot</Text>

            {/* Day selector */}
            <Text style={{ fontSize: fontSize.sm, fontWeight: "500", color: c.foreground, marginBottom: spacing.sm }}>Day</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
              <View style={{ flexDirection: "row", gap: spacing.sm }}>
                {DAYS_OF_WEEK.map((day, idx) => (
                  <TouchableOpacity
                    key={day}
                    onPress={() => setSelectedDay(idx)}
                    style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.md, backgroundColor: selectedDay === idx ? c.primary : c.muted }}
                  >
                    <Text style={{ fontSize: fontSize.xs, fontWeight: "500", color: selectedDay === idx ? c.primaryForeground : c.mutedForeground }}>{day.slice(0, 3)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Time selectors */}
            <View style={{ flexDirection: "row", gap: spacing.md, marginBottom: spacing.lg }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: fontSize.sm, fontWeight: "500", color: c.foreground, marginBottom: spacing.sm }}>Start</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: "row", gap: spacing.xs }}>
                    {timeSlots.map((t) => (
                      <TouchableOpacity key={`s-${t}`} onPress={() => setStartTime(t)} style={{ paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.sm, backgroundColor: startTime === t ? c.primary : c.muted }}>
                        <Text style={{ fontSize: fontSize.xs, color: startTime === t ? c.primaryForeground : c.mutedForeground }}>{t}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: fontSize.sm, fontWeight: "500", color: c.foreground, marginBottom: spacing.sm }}>End</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: "row", gap: spacing.xs }}>
                    {timeSlots.map((t) => (
                      <TouchableOpacity key={`e-${t}`} onPress={() => setEndTime(t)} style={{ paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.sm, backgroundColor: endTime === t ? c.primary : c.muted }}>
                        <Text style={{ fontSize: fontSize.xs, color: endTime === t ? c.primaryForeground : c.mutedForeground }}>{t}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>

            <Button title="Add Slot" onPress={addSlot} fullWidth />
          </Card>

          {/* Current schedule */}
          <Text style={{ fontSize: fontSize.lg, fontWeight: "600", color: c.foreground, marginBottom: spacing.md }}>Current Schedule</Text>

          {grouped.length === 0 ? (
            <EmptyState icon={<Ionicons name="time-outline" size={24} color={c.mutedForeground} />} message="No availability set" />
          ) : (
            <View style={{ gap: spacing.md }}>
              {grouped.map(({ day, slots: daySlots }) => (
                <Card key={day}>
                  <Text style={{ fontSize: fontSize.sm, fontWeight: "600", color: c.foreground, marginBottom: spacing.sm }}>{day}</Text>
                  {daySlots.map((slot) => (
                    <View key={slot.id} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: spacing.xs }}>
                      <Text style={{ fontSize: fontSize.sm, color: c.mutedForeground }}>{slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}</Text>
                      <TouchableOpacity onPress={() => deleteSlot(slot.id)}>
                        <Ionicons name="trash-outline" size={18} color={c.destructive} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </Card>
              ))}
            </View>
          )}

          <View style={{ height: spacing["4xl"] }} />
        </ScrollView>
      </ScreenContainer>
    </>
  );
}
