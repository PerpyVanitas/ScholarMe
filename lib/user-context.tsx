"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile, UserRole } from "@/lib/types";
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
      const { data: p } = await supabase
        .from("profiles")
        .select("id, email, full_name, first_name, last_name, avatar_url, phone_number, birthdate, date_of_birth, membership_number, degree_program, year_level, total_xp, current_level, role_id, created_at, roles(id, name)")
        .eq("id", user.id)
        .maybeSingle();

      if (p) {
        setProfile({
          ...p,
          roles: Array.isArray(p.roles) ? p.roles : p.roles ? [p.roles as any] : undefined,
        } as Profile);
        const roleName = Array.isArray(p.roles) ? (p.roles[0]?.name ?? "learner") : ((p.roles as any)?.name ?? "learner");
        setRole(roleName as UserRole);
      } else {
        // Profile not found in the database.
        // 1. Determine fallback role
        let fallbackRole: UserRole = "learner";
        if (user.email === "admin@scholarme.org" || user.user_metadata?.role_name === "administrator" || user.user_metadata?.role === "administrator") {
          fallbackRole = "administrator";
        } else if (user.user_metadata?.role_name === "tutor" || user.user_metadata?.role === "tutor") {
          fallbackRole = "tutor";
        }

        // 2. Fetch the matching role ID from the database
        let roleId: string | null = null;
        try {
          const { data: roleRow } = await supabase
            .from("roles")
            .select("id")
            .eq("name", fallbackRole)
            .maybeSingle();
          if (roleRow) {
            roleId = roleRow.id;
          }
        } catch (e) {
          console.error("Failed to fetch role ID for fallback role:", e);
        }

        // 3. Attempt to heal database by inserting the missing profile row
        const fullNameStr = user.user_metadata?.full_name || (fallbackRole === "administrator" ? "System Admin" : user.email?.split("@")[0] || "User");
        let derivedFirstName = user.user_metadata?.first_name || "";
        let derivedLastName = user.user_metadata?.last_name || "";
        if (!derivedFirstName && !derivedLastName) {
          const parts = fullNameStr.trim().split(/\s+/);
          derivedFirstName = parts[0] || "";
          derivedLastName = parts.slice(1).join(" ") || "";
        }

        const newProfileData = {
          id: user.id,
          full_name: fullNameStr,
          first_name: derivedFirstName || null,
          last_name: derivedLastName || null,
          email: user.email || "",
          role_id: roleId,
          profile_completed: false,
        };

        let healedProfile: Profile | null = null;
        try {
          const { data: insertedProfile } = await supabase
            .from("profiles")
            .insert(newProfileData)
            .select("id, email, full_name, first_name, last_name, avatar_url, phone_number, birthdate, date_of_birth, membership_number, degree_program, year_level, total_xp, current_level, role_id, created_at, roles(id, name)")
            .maybeSingle();

          if (insertedProfile) {
            healedProfile = {
              ...insertedProfile,
              roles: Array.isArray(insertedProfile.roles) ? insertedProfile.roles : insertedProfile.roles ? [insertedProfile.roles as any] : undefined,
            } as Profile;
          }
        } catch (e) {
          console.error("Failed to insert healed profile row:", e);
        }

        if (healedProfile) {
          setProfile(healedProfile);
          setRole(fallbackRole);
        } else {
          // In-memory fallback if insert fails
          setProfile({
            ...newProfileData,
            avatar_url: null,
            created_at: user.created_at || new Date().toISOString(),
            roles: [{ id: roleId || "fallback", name: fallbackRole }],
          } as unknown as Profile);
          setRole(fallbackRole);
        }
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
      const { data: demoProfile } = await supabase
        .from("profiles")
        .select("id, email, full_name, avatar_url, degree_program, year_level, total_xp, current_level, role_id, created_at, roles(id, name)")
        .eq("id", demoUserId)
        .maybeSingle();

      if (demoProfile) {
        setProfile({
          ...demoProfile,
          roles: Array.isArray(demoProfile.roles) ? demoProfile.roles : demoProfile.roles ? [demoProfile.roles as any] : undefined,
        } as Profile);
        const roleName = Array.isArray(demoProfile.roles) ? (demoProfile.roles[0]?.name ?? demoRole) : ((demoProfile.roles as any)?.name ?? demoRole);
        setRole(roleName as UserRole);
      } else {
        const demoInfo = DEMO_USERS[demoRole as keyof typeof DEMO_USERS] || DEMO_USERS.learner;
        setProfile({
          id: demoInfo.profileId,
          full_name: demoInfo.fullName,
          email: demoInfo.email,
          avatar_url: null,
          created_at: new Date().toISOString(),
          role_id: null,
          roles: [{ id: "demo-role", name: demoRole }],
        } as Profile);
        setRole(demoRole);
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

    // Listen for auth state changes
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
