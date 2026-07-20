# Scale Readiness & Load Testing Guide (Phase 14)

This guide documents the procedures for testing and preparing the ScholarMe platform for its target scale of 17,000 potential learners and 200+ daily operational officers.

## 1. Load Testing (P14-2)

At 17,000 users, realistic daily concurrency peaks are estimated at ~500 concurrent connections during heavy usage (e.g. pre-exam periods or large events).

### Recommended Tool: k6
Use `k6` to simulate concurrent API traffic and WebSocket connection limits for Realtime messaging.
1. Install k6: `choco install k6` (Windows) or `brew install k6` (Mac).
2. Run test script against staging: `k6 run tests/load/api-load.js`.

### DB Connection Pool Sizing
- **Serverless PostgreSQL (Supabase):** With Next.js serverless functions (Vercel), connections spike and close frequently.
- **PgBouncer Configuration:** Ensure Supabase PgBouncer is enabled in Transaction Mode. 
- **Pool Size:** Increase the default Supabase pool size from 15 to 60 for the transaction pool to handle the 500 CCU load, preventing timeout errors.

## 2. AI API Cost and Rate-Limit Review (P14-3)

With WebLLM implemented on the client, most AI inference (RAG, Chat) operates cost-free via the user's WebGPU. However, an estimated 20% of users will lack WebGPU capabilities and trigger the server-side fallback (Gemini/Groq).

### Rate Limits
- At 17,000 users, assuming 20% fallback, approximately 3,400 users will hit the API server-side.
- Ensure the rate-limit per user on AI routes (`/api/rag/search`, `/api/quizzes/generate`) is strictly capped (e.g., 5 requests per minute) to prevent malicious scraping or excessive cost.

### Cost Projections
- Assuming 1M input tokens / 200k output tokens per user per month.
- Server-side fallback (Gemini 1.5 Flash): ~$0.15 per 1M input, $0.60 per 1M output.
- Expected monthly cost: 3,400 users * (~$0.15 + ~$0.12) = ~$918/month worst case if heavily utilized. Monitor this via the Vercel Spend Dashboard and Supabase edge function logs.
