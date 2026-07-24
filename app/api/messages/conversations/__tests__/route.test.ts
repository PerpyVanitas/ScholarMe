import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../route";

const mockAdminSupabase = {
  from: vi.fn(),
  select: vi.fn(),
  in: vi.fn(),
  eq: vi.fn(),
  single: vi.fn(),
  insert: vi.fn(),
  delete: vi.fn(),
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "test-user-id" } }, error: null }),
    },
  })),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => mockAdminSupabase),
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn(() => ({
    check: vi.fn().mockResolvedValue({ success: true }),
  })),
}));

describe("POST /api/messages/conversations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Clear mock queues manually to prevent leaks if a test fails
    Object.values(mockAdminSupabase).forEach(fn => fn.mockReset());
    
    // Default chain for mockAdminSupabase
    mockAdminSupabase.from.mockReturnValue(mockAdminSupabase);
    mockAdminSupabase.select.mockReturnValue(mockAdminSupabase);
    mockAdminSupabase.in.mockReturnValue(mockAdminSupabase);
    mockAdminSupabase.eq.mockReturnValue(mockAdminSupabase);
    mockAdminSupabase.single.mockReturnValue(mockAdminSupabase);
    mockAdminSupabase.insert.mockReturnValue(mockAdminSupabase);
    mockAdminSupabase.delete.mockReturnValue(mockAdminSupabase);
  });

  it("handles creating a new conversation", async () => {
    // Check existing convs
    mockAdminSupabase.in.mockResolvedValueOnce({ data: [], error: null });
    
    // Insert conv
    mockAdminSupabase.single.mockResolvedValueOnce({ data: { id: "new-conv" }, error: null });
    
    // Insert participants (no .single() called, just await .insert())
    mockAdminSupabase.insert
      .mockReturnValueOnce(mockAdminSupabase) // For the conversation insert which chains .select()
      .mockResolvedValueOnce({ error: null }); // For the participants insert which is awaited directly
    
    // Fetch final conv
    mockAdminSupabase.single.mockResolvedValueOnce({ 
      data: { id: "new-conv", messages: [] }, 
      error: null 
    });

    const req = new Request("http://localhost/api/messages/conversations", {
      method: "POST",
      body: JSON.stringify({
        participantId: "123e4567-e89b-12d3-a456-426614174000",
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.existing).toBe(false);
    expect(json.conversation.id).toBe("new-conv");
  });

  it("returns existing conversation if found", async () => {
    mockAdminSupabase.in.mockResolvedValueOnce({ 
      data: [
        { conversation_id: "conv-1", profile_id: "test-user-id" },
        { conversation_id: "conv-1", profile_id: "123e4567-e89b-12d3-a456-426614174000" }
      ], 
      error: null 
    });
    mockAdminSupabase.in.mockResolvedValueOnce({ 
      data: [
        { conversation_id: "conv-1" },
        { conversation_id: "conv-1" }
      ], 
      error: null 
    });
    
    // Fetch final conv
    mockAdminSupabase.single.mockResolvedValueOnce({ 
      data: { id: "conv-1", messages: [] }, 
      error: null 
    });

    const req = new Request("http://localhost/api/messages/conversations", {
      method: "POST",
      body: JSON.stringify({
        participantId: "123e4567-e89b-12d3-a456-426614174000",
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.existing).toBe(true);
    expect(json.conversation.id).toBe("conv-1");
  });

  it("returns 400 for invalid participant ID", async () => {
    const req = new Request("http://localhost/api/messages/conversations", {
      method: "POST",
      body: JSON.stringify({
        participantId: "not-a-uuid",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
