# Contributing to ScholarMe

First off, thank you for considering contributing to ScholarMe!

## Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/ScholarMe.git
   cd ScholarMe
   ```

2. **Web Frontend (Next.js)**
   ```bash
   corepack enable
   corepack prepare pnpm@10.28.0 --activate
   pnpm install
   pnpm run dev
   ```

3. **Backend (Spring Boot)**
   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```

4. **Mobile (Android)**
   Open the `android/` directory in Android Studio. Sync project with Gradle files and run on an emulator or physical device.

## Testing

Ensure your changes pass existing tests before submitting a Pull Request:
- **Web**: `pnpm run lint` and `pnpm tsc --noEmit`
- **Backend**: `./mvnw test` inside `backend/`
- **Android**: `./gradlew test` inside `android/`

## Pull Request Guidelines

- We use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) for commit messages and PR titles (e.g., `feat(web): add login page`, `fix(android): resolve crash on startup`).
- Reference any relevant issues in your PR description.
- Ensure CI workflows pass successfully before requesting a review.
- Include necessary documentation or comments for significant logic changes.
