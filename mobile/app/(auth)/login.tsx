import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, useColorScheme, Alert } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/lib/auth-context";
import { colors, spacing, fontSize, borderRadius } from "@/lib/theme";
import { Button, Input, ScreenContainer } from "@/components/ui";
import { Ionicons } from "@expo/vector-icons";

export default function LoginScreen() {
  const scheme = useColorScheme();
  const c = scheme === "dark" ? colors.dark : colors.light;
  const { signInWithEmail, signInWithCard } = useAuth();

  const [tab, setTab] = useState<"email" | "card">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cardId, setCardId] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleEmailLogin() {
    if (!email || !password) { setError("Please fill in all fields"); return; }
    setLoading(true);
    setError("");
    const result = await signInWithEmail(email, password);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.replace("/(tabs)/home");
    }
  }

  async function handleCardLogin() {
    if (!cardId || !pin) { setError("Please fill in all fields"); return; }
    setLoading(true);
    setError("");
    const result = await signInWithCard(cardId, pin);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.replace("/(tabs)/home");
    }
  }

  return (
    <ScreenContainer>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingVertical: spacing["4xl"] }} keyboardShouldPersistTaps="handled">
          {/* Logo */}
          <View style={{ alignItems: "center", marginBottom: spacing["3xl"] }}>
            <View style={{ width: 64, height: 64, borderRadius: borderRadius.xl, backgroundColor: c.primary, alignItems: "center", justifyContent: "center", marginBottom: spacing.lg }}>
              <Ionicons name="school" size={32} color={c.primaryForeground} />
            </View>
            <Text style={{ fontSize: fontSize["2xl"], fontWeight: "700", color: c.foreground }}>ScholarMe</Text>
            <Text style={{ fontSize: fontSize.sm, color: c.mutedForeground, marginTop: spacing.xs }}>Sign in to your account</Text>
          </View>

          {/* Tabs */}
          <View style={{ flexDirection: "row", backgroundColor: c.muted, borderRadius: borderRadius.md, padding: 4, marginBottom: spacing.xl }}>
            <TouchableOpacity
              onPress={() => { setTab("email"); setError(""); }}
              style={{ flex: 1, paddingVertical: spacing.sm, borderRadius: borderRadius.md - 2, backgroundColor: tab === "email" ? c.card : "transparent", alignItems: "center" }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
                <Ionicons name="mail-outline" size={16} color={tab === "email" ? c.foreground : c.mutedForeground} />
                <Text style={{ fontSize: fontSize.sm, fontWeight: "500", color: tab === "email" ? c.foreground : c.mutedForeground }}>Email</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setTab("card"); setError(""); }}
              style={{ flex: 1, paddingVertical: spacing.sm, borderRadius: borderRadius.md - 2, backgroundColor: tab === "card" ? c.card : "transparent", alignItems: "center" }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
                <Ionicons name="card-outline" size={16} color={tab === "card" ? c.foreground : c.mutedForeground} />
                <Text style={{ fontSize: fontSize.sm, fontWeight: "500", color: tab === "card" ? c.foreground : c.mutedForeground }}>Card</Text>
              </View>
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={{ backgroundColor: c.destructive + "15", borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.lg }}>
              <Text style={{ fontSize: fontSize.sm, color: c.destructive }}>{error}</Text>
            </View>
          ) : null}

          {tab === "email" ? (
            <View style={{ gap: spacing.lg }}>
              <Input label="Email" placeholder="you@example.com" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
              <Input label="Password" placeholder="Your password" value={password} onChangeText={setPassword} secureTextEntry />
              <Button title="Sign In" onPress={handleEmailLogin} loading={loading} fullWidth />
            </View>
          ) : (
            <View style={{ gap: spacing.lg }}>
              <Input label="Card ID" placeholder="Scan or enter card ID" value={cardId} onChangeText={setCardId} autoCapitalize="none" />
              <Input label="PIN" placeholder="Enter your PIN" value={pin} onChangeText={setPin} secureTextEntry keyboardType="numeric" />
              <Button title="Sign In with Card" onPress={handleCardLogin} loading={loading} fullWidth />
            </View>
          )}

          {/* Sign up link */}
          <View style={{ alignItems: "center", marginTop: spacing["2xl"] }}>
            <TouchableOpacity onPress={() => router.push("/(auth)/sign-up")}>
              <Text style={{ fontSize: fontSize.sm, color: c.mutedForeground }}>
                {"Don't have an account? "}
                <Text style={{ color: c.primary, fontWeight: "600" }}>Sign up</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
