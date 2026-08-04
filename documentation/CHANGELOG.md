
### 2026-08-05
- Added comprehensive Web LLM / AI Configuration guide (web-llm-setup.md) to document Vertex AI troubleshooting, IAM roles, fallback logic, and global endpoints.
- Refactored Quiz and Flashcard generation to use block-based structured output.
- Added Candidate Models Fallback for Quiz/Flashcard generation endpoints (gemini-3.6-flash gracefully failing over to 3.5-flash).
- Updated Quiz and Flashcard Creation sheets to parse AI output directly to state instead of string parsing.
- Added "Randomize Choices" toggle to Quiz Study Page for advanced difficulty.
- Enhanced Quiz/Flashcard UI to render block properties directly (options via RadioGroup, explanations).
- Fixed TypeScript build type error in `create-quiz-sheet.tsx` by updating `StructuredQuizItem` interface to permit nullable `options`/`accepted_answers`/`responses` and sanitizing `options` property mapping.
