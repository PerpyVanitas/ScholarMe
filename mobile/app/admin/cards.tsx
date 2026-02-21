import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, RefreshControl, useColorScheme, Alert } from "react-native";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { colors, spacing, fontSize, borderRadius } from "@/lib/theme";
import { Card, Badge, Button, EmptyState, ScreenContainer } from "@/components/ui";
import type { AuthCard } from "@/lib/types";

export default function AdminCardsScreen() {
  const scheme = useColorScheme();
  const c = scheme === "dark" ? colors.dark : colors.light;
  const [cards, setCards] = useState<AuthCard[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadCards(); }, []);

  async function loadCards() {
    setRefreshing(true);
    const { data } = await supabase.from("auth_cards").select("*, profiles(*)").order("issued_at", { ascending: false });
    setCards(data || []);
    setRefreshing(false);
  }

  async function toggleStatus(card: AuthCard) {
    const newStatus = card.status === "active" ? "revoked" : "active";
    Alert.alert(
      `${newStatus === "revoked" ? "Revoke" : "Activate"} Card`,
      `Are you sure you want to ${newStatus === "revoked" ? "revoke" : "activate"} card ${card.card_id}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm", onPress: async () => {
            const { error } = await supabase.from("auth_cards").update({ status: newStatus }).eq("id", card.id);
            if (error) Alert.alert("Error", error.message);
            else loadCards();
          },
        },
      ]
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: "Card Management", headerTintColor: c.foreground, headerStyle: { backgroundColor: c.background } }} />
      <ScreenContainer>
        <FlatList
          data={cards}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadCards} tintColor={c.primary} />}
          ListEmptyComponent={<EmptyState icon={<Ionicons name="card-outline" size={24} color={c.mutedForeground} />} message="No cards issued" />}
          renderItem={({ item: card }) => (
            <View style={{ marginBottom: spacing.md }}>
              <Card>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ fontSize: fontSize.base, fontWeight: "600", fontFamily: "monospace", color: c.foreground }}>{card.card_id}</Text>
                  <Badge
                    label={card.status}
                    color={card.status === "active" ? c.success : c.destructive}
                    bgColor={card.status === "active" ? c.success + "20" : c.destructive + "20"}
                  />
                </View>
                <Text style={{ fontSize: fontSize.sm, color: c.mutedForeground, marginTop: spacing.xs }}>
                  {card.profiles?.full_name || card.profiles?.email || "Unknown user"}
                </Text>
                <Text style={{ fontSize: fontSize.xs, color: c.mutedForeground, marginTop: 2 }}>
                  Issued {new Date(card.issued_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </Text>
                <View style={{ marginTop: spacing.md }}>
                  <Button
                    title={card.status === "active" ? "Revoke Card" : "Activate Card"}
                    variant={card.status === "active" ? "destructive" : "primary"}
                    onPress={() => toggleStatus(card)}
                    fullWidth
                    icon={<Ionicons name={card.status === "active" ? "shield-outline" : "shield-checkmark-outline"} size={16} color={card.status === "active" ? c.destructiveForeground : c.primaryForeground} />}
                  />
                </View>
              </Card>
            </View>
          )}
        />
      </ScreenContainer>
    </>
  );
}
