# Web & AI / LLM Configuration Guide

This document serves as a troubleshooting and setup guide for the AI/LLM integration in the ScholarMe web application, particularly focusing on Google Cloud Vertex AI and Gemini models (like Gemini 3.5/3.6 Flash).

## 1. Authentication Strategies

The application (`lib/ai/gemini.ts`) supports two authentication methods, checked in this priority order:

1. **Vertex AI (Google Cloud Platform)** 
   - Uses `GOOGLE_CLOUD_PROJECT_ID` and `GOOGLE_APPLICATION_CREDENTIALS_JSON`.
   - The JSON must be the complete Service Account key JSON, **not** an API key string.
   - Recommended for production on Vercel.

2. **Google AI Studio (Fallback)**
   - Uses `GEMINI_API_KEY`.
   - Easy for local development.
   - **Note:** If both Vertex AI and AI Studio keys are present, the application will prioritize Vertex AI. To force AI Studio, you must delete the Vertex AI environment variables.

## 2. Common Errors and Solutions

### The "Silent 404" (Model Not Found) Error
**Symptom:** Vertex AI consistently returns `404 NOT_FOUND` for models like `gemini-1.5-flash` or `gemini-3.5-flash` despite having perfect credentials.

**Causes & Fixes:**
- **Wrong IAM Role:** The Service Account running the app must have the `Vertex AI User` or `Editor` role. Specialized roles like `Agent Platform Express User (Beta)` often lack access to standard publisher models.
- **API Not Enabled:** The `Vertex AI API` (`aiplatform.googleapis.com`) must be fully enabled in your Google Cloud Project.
- **Model Garden Terms of Service:** If you have never used Gemini in GCP, you must manually visit the Vertex AI Studio in the Google Cloud Console and accept the Terms of Service. Until accepted, the API returns a 404.

### The "Global Location" Requirement (Gemini 3.6)
**Symptom:** Models like `gemini-3.6-flash` fail to connect when requested.
**Cause:** Newer models like `gemini-3.6-flash` are hosted globally rather than regionally. If your SDK defaults to `us-central1`, Vertex AI won't find the model.
**Fix:** Ensure the `GOOGLE_CLOUD_LOCATION` environment variable is set to `global` in Vercel, or that the application explicitly initializes the Vertex AI client with `location: "global"`.

### Internal Server Errors (500) and Rate Limits (429)
The AI route (`app/api/v1/ai/chat/route.ts`) iterates through a list of candidate fallback models. If a model throws a 500 or 429 error, the application intercepts it, logs a warning, and attempts the next model in the fallback array. If all models fail, it degrades gracefully to a simulated response (returning a `200 OK` with `degraded: true`) instead of crashing the server.

## 3. Modifying Candidate Models
To update or swap primary models (e.g., from `3.5-flash` to `3.6-flash`):
1. Update the `GEMINI_MODEL` constant in `lib/ai/gemini.ts`.
2. Update the `candidateModels` array in `app/api/v1/ai/chat/route.ts` to include your new model and its fallbacks.
3. Update the mock `GEMINI_MODEL` in all `__tests__` files to prevent the CI pipeline from breaking on mismatched string assertions.
