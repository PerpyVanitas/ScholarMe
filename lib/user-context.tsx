"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile, UserRole, Role } from "@/lib/types";
import { normalizeRole } from "@/lib/utils/roles";
import { DEMO_USERS, getDemoUserFromCookie } from "@/lib/demo";

interface UserContextType {
  profile: Profile | null;
  role: UserRole;
  loading: boolean;
  notificationCount: number;
  isAuthenticated: boolean;
  refreshProfile: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

/**
 * Resolve the UserRole for a given profile.
 *
 * Strategy (in order):
 * 1. Use the embedded `roles` join from the profile query (fastest, no extra round-trip)
 * 2. If join returned null (RLS block / missing FK), fetch the role directly via role_id
 * 3. Fall back to "learner" if both fail
 */
async function resolveRole(
  supabase: ReturnType<typeof createClient>,
  p: { roles?: unknown; role_id?: string | null },
  fallback: UserRole = "learner"
): Promise<UserRole> {
  // Attempt 1: embedded join
  const fromJoin = normalizeRole(p.roles as Role | Role[] | undefined | null);
  if (fromJoin?.name) {
    return fromJoin.name as UserRole;
  }

  // Attempt 2: direct lookup via role_id
  if (p.role_id) {
    const { data: roleRow } = await supabase
      .from("roles")
      .select("name")
      .eq("id", p.role_id)
      .maybeSingle();
    if (roleRow?.name) {
      return roleRow.name as UserRole;
    }
  }

  return fallback;
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<UserRole>("learner");
  const [notificationCount, setNotificationCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const loadUserData = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      setIsAuthenticated(true);

      // Use explicit FK hint `roles!role_id` to avoid PostgREST ambiguity
      const { data: p, error: profileError } = await supabase
        .from("profiles")
        .select("id, email, full_name, first_name, last_name, avatar_url, phone_number, birthdate, date_of_birth, membership_number, role_id, created_at, roles:roles!role_id(id, name)")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("[UserContext] profile fetch error:", profileError.message);
      }

      if (p) {
        const resolvedRole = await resolveRole(supabase, p);
        const roleObj = normalizeRole(p.roles as Role | Role[] | undefined);
        setProfile({ ...p, roles: roleObj ?? undefined } as Profile);
        setRole(resolvedRole);
      } else {
        // Profile not found — create a minimal fallback
        setProfile({
          id: user.id,
          full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
          email: user.email || "",
          avatar_url: null,
          created_at: user.created_at || new Date().toISOString(),
          role_id: null,
        } as Profile);
        setRole("learner");
      }

      // Load notification count
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
      setNotificationCount(count || 0);
    } else {
      // Demo mode fallback
      setIsAuthenticated(false);
      const { role: demoRole, userId: demoUserId } = getDemoUserFromCookie("learner");
      const supabase = createClient();

      const { data: demoProfile } = await supabase
        .from("profiles")
        .select("id, email, full_name, avatar_url, role_id, created_at, roles:roles!role_id(id, name)")
        .eq("id", demoUserId)
        .maybeSingle();

      if (demoProfile) {
        const resolvedRole = await resolveRole(supabase, demoProfile, demoRole as UserRole);
        const roleObj = normalizeRole(demoProfile.roles as Role | Role[] | undefined);
        setProfile({ ...demoProfile, roles: roleObj ?? undefined } as Profile);
        setRole(resolvedRole);
      } else {
        const demoInfo = DEMO_USERS[demoRole as keyof typeof DEMO_USERS] || DEMO_USERS.learner;
        setProfile({
          id: demoInfo.profileId,
          full_name: demoInfo.fullName,
          email: demoInfo.email,
          avatar_url: null,
          created_at: new Date().toISOString(),
          role_id: null,
        } as Profile);
        setRole(demoRole as UserRole);
      }
    }

    setLoading(false);
  }, []);

  const refreshNotifications = useCallback(async () => {
    if (!profile?.id) return;
    const supabase = createClient();
    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", profile.id)
      .eq("is_read", false);
    setNotificationCount(count || 0);
  }, [profile?.id]);

  useEffect(() => {
    loadUserData();

    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "TOKEN_REFRESHED") {
        loadUserData();
      }
    });

    return () => subscription.unsubscribe();
  }, [loadUserData]);

  return (
    <UserContext.Provider
      value={{
        profile,
        role,
        loading,
        notificationCount,
        isAuthenticated,
        refreshProfile: loadUserData,
        refreshNotifications,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}

/**
 * Hook for components that need user data but can handle loading states
 */
export function useOptionalUser() {
  return useContext(UserContext);
}
