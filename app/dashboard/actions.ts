/**
 * ==========================================================================
 * DASHBOARD ACTIONS - Server Actions for Dashboard Operations
 * ==========================================================================
 *
 * PURPOSE: Server-side actions called by dashboard client components.
 * Currently contains the dev role switching action used by DevRoleSwitcher.
 *
 * WHY A SERVER ACTION:
 * Setting cookies server-side via cookies().set() is more reliable than
 * document.cookie in iframe environments (like the v0 preview).
 * ==========================================================================
 */
"use server";

import { cookies } from "next/headers";
import type { UserRole } from "@/lib/types";

/**
 * Sets the "dev_role" cookie to switch the demo dashboard view.
 * Called by DevRoleSwitcher when clicking Learner/Tutor/Admin buttons.
 *
 * Cookie settings:
 * - path: "/" -- available on all routes
 * - maxAge: 86400 -- expires after 24 hours
 * - httpOnly: false -- needs to be readable by client JS (profile page)
 * - sameSite: "lax" -- standard security setting
 */
export async function switchDevRole(role: UserRole) {
  const cookieStore = await cookies();
  cookieStore.set("dev_role", role, {
    path: "/",
    maxAge: 86400,       // 24 hours
    httpOnly: false,      // Readable by document.cookie (needed by profile page)
    sameSite: "lax",
  });
}
