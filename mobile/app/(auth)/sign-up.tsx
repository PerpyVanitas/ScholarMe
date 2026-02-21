import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, useColorScheme, Alert } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/lib/auth-context";
import { colors, spacing, fontSize, borderRadius } from "@/lib/theme";
import { Button, Input, ScreenContainer } from "@/components/ui";
import { Ionicons } from "@expo/vector-icons";

export default function SignUpScreen() {
  const scheme = useColorScheme();
  const c = scheme === "dark" ? colors.dark : colors.light;
  const { signUp } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSignUp() {
    if (!fullName || !email || !password) { setError("Please fill in all fields"); return; }
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }

    setLoading(true);
    setError("");
    const result = await signUp(email, password, fullName);
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      Alert.alert("Account Created", "Please check your email to verify your account.", [
        { text: "OK", onPress: () => router.replace("/(auth)/login") },
      ]);
    }
  }

  return (
    <ScreenContainer>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingVertical: spacing["4xl"] }} keyboardShouldPersistTaps="handled">
          <View style={{ alignItems: "center", marginBottom: spacing["3xl"] }}>
            <View style={{ width: 64, height: 64, borderRadius: borderRadius.xl, backgroundColor: c.primary, alignItems: "center", justifyContent: "center", marginBottom: spacing.lg }}>
              <Ionicons name="school" size={32} color={c.primaryForeground} />
            </View>
            <Text style={{ fontSize: fontSize["2xl"], fontWeight: "700", color: c.foreground }}>Create Account</Text>
            <Text style={{ fontSize: fontSize.sm, color: c.mutedForeground, marginTop: spacing.xs }}>Join ScholarMe today</Text>
          </View>

          {error ? (
            <View style={{ backgroundColor: c.destructive + "15", borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.lg }}>
              <Text style={{ fontSize: fontSize.sm, color: c.destructive }}>{error}</Text>
            </View>
          ) : null}

          <View style={{ gap: spacing.lg }}>
            <Input label="Full Name" placeholder="Your full name" value={fullName} onChangeText={setFullName} />
            <Input label="Email" placeholder="you@example.com" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
            <Input label="Password" placeholder="At least 6 characters" value={password} onChangeText={setPassword} secureTextEntry />
            <Input label="Confirm Password" placeholder="Repeat your password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
            <Button title="Create Account" onPress={handleSignUp} loading={loading} fullWidth />
          </View>

          <View style={{ alignItems: "center", marginTop: spacing["2xl"] }}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={{ fontSize: fontSize.sm, color: c.mutedForeground }}>
                {"Already have an account? "}
                <Text style={{ color: c.primary, fontWeight: "600" }}>Sign in</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
