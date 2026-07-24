import { describe, it, expect, vi } from "vitest";
import { handleApiError } from "@/lib/utils/api-error";
import * as Sentry from "@sentry/nextjs";
import { logger } from "@/lib/logger";

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
  },
}));

describe("handleApiError", () => {
  it("returns generic 500 message by default", async () => {
    const error = new Error("Something broke");
    const res = handleApiError(error);
    
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("An unexpected error occurred. Please try again.");
    
    expect(Sentry.captureException).toHaveBeenCalledWith(error);
    expect(logger.error).toHaveBeenCalled();
  });

  it("returns 404 message when status is 404", async () => {
    const error = new Error("Not found");
    const res = handleApiError(error, 404);
    
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("Resource not found");
  });
});
