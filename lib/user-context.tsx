"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { type RealtimeChannel } from "@supabase/supabase-js";
import type { Profile, UserRole } from "@/lib/types";
import { DEMO_USERS, getDemoUserFromCookie } from "@/scripts/demo";
import { resolveRoleId, roleNameFromUser } from "@/features/profiles/api/db";
import { toast } from "sonner";

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
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      setIsAuthenticated(true);
      const { data: p } = await supabase
        .from("profiles")
        .select(
          "id, email, full_name, first_name, last_name, avatar_url, phone_number, birthdate, date_of_birth, membership_number, degree_program, year_level, total_xp, current_level, role_id, created_at, roles(id, name)",
        )
        .eq("id", user.id)
        .maybeSingle();

      if (p) {
        setProfile({
          ...p,
          roles: Array.isArray(p.roles)
            ? p.roles
            : p.roles
              ? [p.roles as { name: string; id: string }]
              : undefined,
        } as Profile);
        const roleName = Array.isArray(p.roles)
          ? (p.roles[0]?.name ?? "learner")
          : ((p.roles as { name: string })?.name ?? "learner");
        setRole(roleName as UserRole);
      } else {
        // Profile not found in the database.
        // 1. Determine fallback role
        const fallbackRole: UserRole = roleNameFromUser(user);

        let roleId: string;
        try {
          roleId = await resolveRoleId(supabase, fallbackRole);
        } catch (e) {
          toast.error(
            e instanceof Error
              ? e.message
              : "Failed to fetch role ID for fallback role",
          );
          roleId = "";
        }

        // 3. Attempt to heal database by inserting the missing profile row
        const fullNameStr =
          user.user_metadata?.full_name ||
          (fallbackRole === "administrator"
            ? "System Admin"
            : user.email?.split("@")[0] || "User");
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
          role_id: roleId || undefined,
          profile_completed: false,
        };

        let healedProfile: Profile | null = null;
        try {
          if (!roleId) throw new Error("Missing role_id for profile heal");
          const { data: insertedProfile } = await supabase
            .from("profiles")
            .insert(newProfileData)
            .select(
              "id, email, full_name, first_name, last_name, avatar_url, phone_number, birthdate, date_of_birth, membership_number, degree_program, year_level, total_xp, current_level, role_id, created_at, roles(id, name)",
            )
            .maybeSingle();

          if (insertedProfile) {
            healedProfile = {
              ...insertedProfile,
              roles: Array.isArray(insertedProfile.roles)
                ? insertedProfile.roles
                : insertedProfile.roles
                  ? [insertedProfile.roles as { name: string; id: string }]
                  : undefined,
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
      const { role: demoRole, userId: demoUserId } =
        getDemoUserFromCookie("learner");
      const { data: demoProfile } = await supabase
        .from("profiles")
        .select(
          "id, email, full_name, avatar_url, degree_program, year_level, total_xp, current_level, role_id, created_at, roles(id, name)",
        )
        .eq("id", demoUserId)
        .maybeSingle();

      if (demoProfile) {
        setProfile({
          ...demoProfile,
          roles: Array.isArray(demoProfile.roles)
            ? demoProfile.roles
            : demoProfile.roles
              ? [demoProfile.roles as { name: string; id: string }]
              : undefined,
        } as Profile);
        const roleName = Array.isArray(demoProfile.roles)
          ? (demoProfile.roles[0]?.name ?? demoRole)
          : ((demoProfile.roles as { name: string })?.name ?? demoRole);
        setRole(roleName as UserRole);
      } else {
        const demoInfo =
          DEMO_USERS[demoRole as keyof typeof DEMO_USERS] || DEMO_USERS.learner;
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
  }, [profile]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadUserData();

    const supabase = createClient();

    // Listen for auth state changes
    const {
      data: { subscription: authSubscription },
    } = supabase.auth.onAuthStateChange((event: string) => {
      if (
        event === "SIGNED_IN" ||
        event === "SIGNED_OUT" ||
        event === "TOKEN_REFRESHED"
      ) {
        loadUserData();
      }
    });

    // Listen for real-time role updates
    let roleSubscription: RealtimeChannel | null = null;

    const setupRealtime = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        roleSubscription = supabase
          .channel(
            `user-roles-${user.id}-${Math.random().toString(36).substring(7)}`,
          )
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "profiles",
              filter: `id=eq.${user.id}`,
            },
            (payload) => {
              console.log("Role updated in real-time", payload);
              loadUserData();
            },
          )
          .subscribe();
      }
    };

    setupRealtime();

    return () => {
      authSubscription.unsubscribe();
      if (roleSubscription) {
        supabase.removeChannel(roleSubscription);
      }
    };
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
