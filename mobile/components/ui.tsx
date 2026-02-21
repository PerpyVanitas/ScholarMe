import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  useColorScheme,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from "react-native";
import { colors, spacing, fontSize, borderRadius } from "@/lib/theme";

function useThemeColors() {
  const scheme = useColorScheme();
  return scheme === "dark" ? colors.dark : colors.light;
}

// ---- Card ----
export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const c = useThemeColors();
  return (
    <View style={[{ backgroundColor: c.card, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: c.cardBorder, padding: spacing.lg }, style]}>
      {children}
    </View>
  );
}

// ---- Button ----
interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  fullWidth?: boolean;
}

export function Button({ title, onPress, variant = "primary", loading, disabled, icon, style, fullWidth }: ButtonProps) {
  const c = useThemeColors();
  const bgMap: Record<string, string> = {
    primary: c.primary,
    secondary: c.secondary,
    outline: "transparent",
    ghost: "transparent",
    destructive: c.destructive,
  };
  const textMap: Record<string, string> = {
    primary: c.primaryForeground,
    secondary: c.secondaryForeground,
    outline: c.foreground,
    ghost: c.foreground,
    destructive: c.destructiveForeground,
  };
  const borderMap: Record<string, string> = {
    primary: c.primary,
    secondary: c.secondary,
    outline: c.border,
    ghost: "transparent",
    destructive: c.destructive,
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        {
          backgroundColor: bgMap[variant],
          borderRadius: borderRadius.md,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.xl,
          borderWidth: 1,
          borderColor: borderMap[variant],
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: spacing.sm,
          opacity: disabled ? 0.5 : 1,
        },
        fullWidth && { width: "100%" },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textMap[variant]} />
      ) : (
        <>
          {icon}
          <Text style={{ color: textMap[variant], fontSize: fontSize.base, fontWeight: "600" }}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

// ---- Input ----
interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  keyboardType?: "default" | "email-address" | "numeric";
  error?: string;
}

export function Input({ label, placeholder, value, onChangeText, secureTextEntry, autoCapitalize, keyboardType, error }: InputProps) {
  const c = useThemeColors();
  return (
    <View style={{ gap: spacing.xs }}>
      {label && <Text style={{ fontSize: fontSize.sm, fontWeight: "500", color: c.foreground }}>{label}</Text>}
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={c.mutedForeground}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        style={{
          backgroundColor: c.card,
          borderWidth: 1,
          borderColor: error ? c.destructive : c.input,
          borderRadius: borderRadius.md,
          padding: spacing.md,
          fontSize: fontSize.base,
          color: c.foreground,
        }}
      />
      {error && <Text style={{ fontSize: fontSize.xs, color: c.destructive }}>{error}</Text>}
    </View>
  );
}

// ---- Badge ----
export function Badge({ label, color, bgColor }: { label: string; color: string; bgColor: string }) {
  return (
    <View style={{ backgroundColor: bgColor, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.full }}>
      <Text style={{ fontSize: fontSize.xs, fontWeight: "600", color }}>{label}</Text>
    </View>
  );
}

// ---- StatCard ----
export function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  const c = useThemeColors();
  return (
    <Card style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.lg }}>
      <View style={{ width: 40, height: 40, borderRadius: borderRadius.lg, backgroundColor: c.muted, alignItems: "center", justifyContent: "center" }}>
        {icon}
      </View>
      <View>
        <Text style={{ fontSize: fontSize["2xl"], fontWeight: "700", color: c.foreground }}>{value}</Text>
        <Text style={{ fontSize: fontSize.xs, color: c.mutedForeground }}>{label}</Text>
      </View>
    </Card>
  );
}

// ---- SectionHeader ----
export function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  const c = useThemeColors();
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
      <View>
        <Text style={{ fontSize: fontSize.xl, fontWeight: "700", color: c.foreground }}>{title}</Text>
        {subtitle && <Text style={{ fontSize: fontSize.sm, color: c.mutedForeground, marginTop: 2 }}>{subtitle}</Text>}
      </View>
      {action}
    </View>
  );
}

// ---- EmptyState ----
export function EmptyState({ icon, message, action }: { icon: React.ReactNode; message: string; action?: React.ReactNode }) {
  const c = useThemeColors();
  return (
    <View style={{ alignItems: "center", gap: spacing.md, paddingVertical: spacing["4xl"] }}>
      <View style={{ backgroundColor: c.muted, borderRadius: borderRadius.full, padding: spacing.lg }}>
        {icon}
      </View>
      <Text style={{ fontSize: fontSize.sm, color: c.mutedForeground }}>{message}</Text>
      {action}
    </View>
  );
}

// ---- ListItem ----
export function ListItem({ onPress, children, style }: { onPress?: () => void; children: React.ReactNode; style?: ViewStyle }) {
  const c = useThemeColors();
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper
      onPress={onPress}
      activeOpacity={0.7}
      style={[{ backgroundColor: c.card, borderWidth: 1, borderColor: c.cardBorder, borderRadius: borderRadius.lg, padding: spacing.md }, style]}
    >
      {children}
    </Wrapper>
  );
}

// ---- ScreenContainer ----
export function ScreenContainer({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const c = useThemeColors();
  return (
    <View style={[{ flex: 1, backgroundColor: c.background, padding: spacing.lg }, style]}>
      {children}
    </View>
  );
}
