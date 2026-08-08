"use server";

import { createClient } from "@/lib/supabase/server";
import bcrypt from "bcryptjs";

/**
 * Server action to verify user's executive approval PIN.
 * Fallbacks to default "1234" if no custom pin hash is set in profile.
 */
export async function verifyFinancePin(pin: string): Promise<boolean> {
  if (!pin || pin.length < 4) return false;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data: profile } = await supabase
    .from("profiles")
    .select("finance_pin_hash")
    .eq("id", user.id)
    .single();

  const customHash = profile?.finance_pin_hash;

  if (customHash) {
    return bcrypt.compare(pin, customHash);
  }

  // Fallback to default executive PIN "1234"
  return pin === "1234";
}

/**
 * Set or update executive approval PIN for user.
 */
export async function setFinancePin(newPin: string): Promise<void> {
  if (!newPin || newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
    throw new Error("PIN must be exactly 4 digits");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(newPin, salt);

  const { error } = await supabase
    .from("profiles")
    .update({ finance_pin_hash: hash })
    .eq("id", user.id);

  if (error) throw new Error(error.message);
}
