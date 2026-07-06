import { toast } from "sonner";

/**
 * A wrapper around the native fetch API that automatically handles:
 * 1. Throwing standard HTTP errors
 * 2. Parsing JSON responses
 * 3. Showing toast notifications on failure (by default)
 */
export async function apiClient<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit & { showErrorToast?: boolean },
): Promise<T> {
  const { showErrorToast = true, ...customInit } = init || {};

  try {
    const response = await fetch(input, customInit);

    // Attempt to parse JSON response
    let data;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    }

    if (!response.ok) {
      const errorMessage =
        data?.error ||
        data?.message ||
        `Error ${response.status}: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    return data as T;
  } catch (error: unknown) {
    if (showErrorToast) {
      toast.error(
        error instanceof Error ? error.message : "An unexpected error occurred",
      );
    }
    throw error;
  }
}
