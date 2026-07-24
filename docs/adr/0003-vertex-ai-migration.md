# 3. Vertex AI Migration

Date: 2026-07-24

## Status
Accepted

## Context
We previously relied exclusively on Gemini APIs for all generative AI tasks (tutoring, quiz generation, etc.). As usage scaled, we needed enterprise-level rate limits, data privacy guarantees (no training on our data), and more robust SLAs.

## Decision
We migrated our core AI generation workloads to Google Cloud Vertex AI, utilizing the @google/genai SDK and configuring it to use the Vertex AI backend instead of the public Gemini API.

## Consequences
- **Pros:** Enterprise SLAs, strict data privacy, unified billing within Google Cloud, and higher rate limits.
- **Cons:** Slightly more complex authentication (requires Google Cloud Service Account credentials instead of a simple API key).

