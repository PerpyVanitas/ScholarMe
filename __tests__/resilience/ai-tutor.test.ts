import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/v1/ai/chat/route';

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user' } } }),
    },
  }),
}));

// Mock Rate Limiter
vi.mock('@/lib/rate-limit', () => ({
  rateLimit: () => ({
    check: vi.fn().mockResolvedValue({ success: true }),
  }),
}));

// Mock the AI client
const mockGenerateContent = vi.fn();
vi.mock('@/lib/ai/gemini', () => ({
  getAIClient: vi.fn(() => ({
    models: {
      generateContent: mockGenerateContent,
    },
  })),
  GEMINI_MODEL: 'gemini-1.5-pro',
  GEMINI_TIMEOUT_MS: 30000,
  logAndSanitizeAIError: vi.fn().mockResolvedValue('Simulated AI Error Message'),
}));

describe('AI Tutor Resilience', () => {
  const mockRequest = () => {
    return new Request('http://localhost:3000/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Hello' }],
      }),
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Ensure API keys are set so it actually tries to hit the mocked gemini module
    process.env.GEMINI_API_KEY = 'test-key';
  });

  it('should return a sanitized error when upstream times out', async () => {
    // Simulate a timeout error
    mockGenerateContent.mockRejectedValueOnce(new Error('Timeout'));

    const response = await POST(mockRequest());
    expect(response.status).toBe(200); // Route handles errors and returns a sanitized chat response
    const json = await response.json();
    expect(json.choices[0].message.content).toBe('Simulated AI Error Message');
  });

  it('should return a sanitized error on 500 or malformed response', async () => {
    // Simulate a 500 error from upstream
    mockGenerateContent.mockRejectedValueOnce(new Error('500 Internal Server Error'));

    const response = await POST(mockRequest());
    const json = await response.json();
    expect(json.choices[0].message.content).toBe('Simulated AI Error Message');
  });

  it('should return a sanitized error on 429 rate limit', async () => {
    // Simulate a 429 from upstream
    mockGenerateContent.mockRejectedValueOnce(new Error('429 Too Many Requests'));

    const response = await POST(mockRequest());
    const json = await response.json();
    expect(json.choices[0].message.content).toBe('Simulated AI Error Message');
  });
});
