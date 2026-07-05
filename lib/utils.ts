import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getAvatarUrl(
  avatarUrl: string | null | undefined,
): string | undefined {
  if (!avatarUrl) return undefined;
  if (
    avatarUrl.startsWith("http://") ||
    avatarUrl.startsWith("https://") ||
    avatarUrl.startsWith("data:")
  ) {
    return avatarUrl;
  }
  if (avatarUrl.startsWith("avatars/")) {
    return `/api/avatar?pathname=${encodeURIComponent(avatarUrl)}`;
  }
  return avatarUrl;
}
