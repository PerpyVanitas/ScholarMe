import { describe, it, expect, vi } from "vitest";
import { POST } from "@/app/api/auth/register-card/route";
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";

const { mockInsert, mockSingle } = vi.hoisted(() => ({
  mockInsert: vi.fn().mockReturnThis(),
  mockSingle: vi.fn(),
}));

// Mock Supabase
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi
        .fn()
        .mockResolvedValue({ data: { user: { id: "admin-123" } } }),
    },
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: mockSingle,
    insert: mockInsert,
  }),
}));

describe("PIN Hashing and Logging", () => {
  it("P1-16: PIN is hashed using bcrypt before insertion", async () => {
    mockSingle
      .mockResolvedValueOnce({
        data: { roles: { name: "administrator" } },
        error: null,
      }) // profiles
      .mockResolvedValueOnce({ data: null, error: null }) // auth_cards duplicate check
      .mockResolvedValueOnce({
        data: { id: "new-card", status: "active" },
        error: null,
      }); // insert result

    vi.mocked(mockInsert).mockReturnThis();

    const rawPin = "123456";
    const req = new NextRequest("http://localhost/api/auth/register-card", {
      method: "POST",
      body: JSON.stringify({ card_id: "test-card-1", pin: rawPin }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);

    // Verify insert was called with a hashed PIN
    const insertArgs = mockInsert.mock.calls[0][0];
    expect(insertArgs.pin).not.toBe(rawPin);
    expect(insertArgs.pin).toMatch(/^\$2[aby]\$\d+\$[./A-Za-z0-9]{53}$/);

    // Verify it is a valid bcrypt hash
    const isValid = await bcrypt.compare(rawPin, insertArgs.pin);
    expect(isValid).toBe(true);
  });

  it("P1-17: No plaintext PIN is leaked in console output", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const rawPin = "9999";
    const req = new NextRequest("http://localhost/api/auth/register-card", {
      method: "POST",
      body: JSON.stringify({ card_id: "test-card-2", pin: rawPin }),
    });

    await POST(req);

    const checkNoPlaintext = (spy: any) => {
      spy.mock.calls.forEach((args: any[]) => {
        const output = args.join(" ");
        expect(output).not.toContain(rawPin);
      });
    };

    checkNoPlaintext(consoleSpy);
    checkNoPlaintext(errorSpy);

    consoleSpy.mockRestore();
    errorSpy.mockRestore();
  });
});
