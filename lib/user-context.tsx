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
        .select("id, email, full_name, first_name, last_name, avatar_url, phone_number, birthdate, date_of_birth, membership_number, role_id, created_at, roles(id, name)")
        .eq("id", user.id)
        .maybeSingle();

      if (p) {
        setProfile({
          ...p,
          roles: Array.isArray(p.roles) ? p.roles : undefined,
        } as Profile);
        const roleName = Array.isArray(p.roles) && p.roles.length > 0 ? p.roles[0].name : "learner";
        setRole(roleName as UserRole);
      } else {
        // Profile not found, create a fallback
        setProfile({
          id: user.id,
          full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
          email: user.email || "",
          avatar_url: null,
          created_at: user.created_at || new Date().toISOString(),
          role_id: null,
          roles: { id: "fallback", name: "learner" },
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
      const { data: demoProfile } = await supabase
        .from("profiles")
        .select("id, email, full_name, avatar_url, role_id, created_at, roles(id, name)")
        .eq("id", demoUserId)
        .maybeSingle();

      if (demoProfile) {
        setProfile({
          ...demoProfile,
          roles: demoProfile.roles || undefined,
        } as Profile);
        const roleName = demoProfile.roles?.name || demoRole;
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
          roles: { id: "demo-role", name: demoRole },
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
