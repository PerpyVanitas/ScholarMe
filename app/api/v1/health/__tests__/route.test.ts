import { describe, it, expect, vi } from "vitest";
import { GET } from "../route";

const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      limit: vi.fn(() => Promise.resolve({ data: [{ id: "1" }], error: null })),
    })),
  })),
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

describe("Health Check API Route", () => {
  it("returns 200 and healthy status when DB and ENV are ready", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("healthy");
    expect(body.checks.database.status).toBe("ok");
    expect(body.checks.environment.status).toBe("ok");
  });
});
