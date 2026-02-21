"use server";

import { cookies } from "next/headers";
import type { UserRole } from "@/lib/types";

export async function switchDevRole(role: UserRole) {
  const cookieStore = await cookies();
  cookieStore.set("dev_role", role, {
    path: "/",
    maxAge: 86400,
    httpOnly: false,
    sameSite: "lax",
  });
}
