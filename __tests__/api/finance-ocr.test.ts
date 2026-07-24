import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/v1/finance/ocr/route";
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Mock Supabase
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "test-user" } }, error: null }),
    },
  })),
}));

// Mock Document AI
const { processDocumentMock } = vi.hoisted(() => ({
  processDocumentMock: vi.fn(),
}));

vi.mock("@google-cloud/documentai", () => ({
  DocumentProcessorServiceClient: class {
    processDocument = processDocumentMock;
  }
}));

// Mock Gemini
const generateContentMock = vi.fn();
vi.mock("@/lib/ai/gemini", () => ({
  getAIClient: vi.fn(() => ({
    models: {
      generateContent: generateContentMock,
    },
  })),
  GEMINI_MODEL: "gemini-1.5-pro",
}));

describe("Finance OCR API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GOOGLE_CLOUD_PROJECT_ID = "test-project";
    process.env.DOCUMENT_AI_PROCESSOR_ID = "test-processor";
  });

  it("should return 401 when unauthorized", async () => {
    // @ts-expect-error Mocking partial Supabase client
    vi.mocked(createClient).mockImplementationOnce(() => ({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) }
    }));
    
    const req = new NextRequest("http://localhost:3000/api/finance/ocr", {
      method: "POST",
    });
    
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("should parse successfully via Document AI", async () => {
    processDocumentMock.mockResolvedValueOnce([{
      document: {
        entities: [
          { type: "supplier_name", mentionText: "DocAI Store" },
          { type: "total_amount", normalizedValue: { text: "150.00" } }
        ]
      }
    }]);

    const formData = new FormData();
    formData.append("receipt", new File(["fake content"], "receipt.jpg", { type: "image/jpeg" }));

    const req = new NextRequest("http://localhost:3000/api/finance/ocr", {
      method: "POST",
    });
    req.formData = vi.fn().mockResolvedValue(formData);

    const res = await POST(req);
    const json = await res.json();
    
    expect(res.status).toBe(200);
    expect(json.vendorName).toBe("DocAI Store");
    expect(json.totalAmount).toBe(150);
    expect(processDocumentMock).toHaveBeenCalled();
    expect(generateContentMock).not.toHaveBeenCalled();
  });

  it("should fallback to Gemini when Document AI fails", async () => {
    // Document AI throws an error
    processDocumentMock.mockRejectedValueOnce(new Error("DocAI Timeout"));

    // Gemini succeeds
    generateContentMock.mockResolvedValueOnce({
      text: JSON.stringify({ vendorName: "Gemini Store", totalAmount: 75.50 })
    });

    const formData = new FormData();
    formData.append("receipt", new File(["fake content"], "receipt.jpg", { type: "image/jpeg" }));

    const req = new NextRequest("http://localhost:3000/api/finance/ocr", {
      method: "POST",
    });
    req.formData = vi.fn().mockResolvedValue(formData);

    const res = await POST(req);
    const json = await res.json();
    
    expect(res.status).toBe(200);
    expect(json.vendorName).toBe("Gemini Store");
    expect(json.totalAmount).toBe(75.5);
    
    // Ensure both were called, proving fallback happened
    expect(processDocumentMock).toHaveBeenCalled();
    expect(generateContentMock).toHaveBeenCalled();
  });
});
