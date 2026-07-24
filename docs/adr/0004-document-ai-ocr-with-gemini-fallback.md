# 4. Document AI OCR with Gemini Fallback

Date: 2026-07-24

## Status
Accepted

## Context
We needed to accurately extract text and structured data from physical books, liquidations, and financial receipts. General vision models often hallucinated specific monetary amounts or structural details on complex tables.

## Decision
We decided to use Google Cloud Document AI as our primary OCR and structural extraction engine due to its superior performance on forms and receipts. If Document AI is unavailable or fails to parse a document due to service limits, we fall back to Gemini 1.5 Pro Vision as a secondary parser.

## Consequences
- **Pros:** Highly accurate structured data extraction from receipts and forms, reducing manual data entry for financial liquidations. The fallback ensures high availability.
- **Cons:** Two separate APIs to maintain and handle failures for.

