# ScholarMe

ScholarMe is an educational platform and tutoring system designed to facilitate peer-to-peer learning, mentorship, and Honor Society administration. 

This repository contains the full stack of the ScholarMe application, including the web frontend, backend APIs, mobile application, and database schemas.

## Repository Structure

The codebase is organized into several top-level directories to separate concerns across different layers of the application stack.

### 🌐 Web Application (Frontend)
The web application is built with Next.js (App Router), React, and Tailwind CSS.
- **`app/`**: Next.js App Router root. Contains the main routing logic, pages, and layouts.
  - `admin/`: Admin dashboard pages and layouts.
  - `api/`: Next.js API routes (serverless functions).
  - `auth/`: Authentication pages (login, setup profile).
  - `dashboard/`: User dashboard pages (home, profile, resources, sessions).
- **`components/`**: Reusable React components.
  - `ui/`: Generic UI components (buttons, cards, dialogs) typically from shadcn/ui.
  - `dashboard/`, `landing/`: Context-specific components.
- **`features/`**: Feature-based modular code. Groups components, hooks, and logic by domain (e.g., `auth/`, `admin/`, `gamification/`, `messaging/`, `quizzes/`, `resources/`, `sessions/`, `tutors/`).
- **`hooks/`**: Custom React hooks used across the web app.
- **`styles/`**: Global CSS stylesheets (`globals.css`).
- **`public/`**: Static assets like images, icons, and fonts served directly to the browser.

### 📱 Mobile Application
- **`mobile/`**: React Native / Expo codebase for the mobile version of the ScholarMe app. Contains its own `app/`, `components/`, and `lib/` directories.
- **`android/`**: Native Android project configuration and source code for the mobile build.

### ⚙️ Backend Services & Utilities
- **`backend/`**: A Java Spring Boot backend service. Contains its own `src/` (Java code) and `target/` directories.
- **`lib/`**: Shared TypeScript utilities, API clients, database wrappers, and configurations.
  - `api/`: API client configurations.
  - `supabase/`: Supabase client initialization (client/server components).
  - `types/`: Shared TypeScript type definitions.
  - `utils/`: Common helper functions.
- **`types/`**: Global TypeScript ambient type declarations.

### 🗄️ Database & Infrastructure
- **`supabase/`**: Configuration and database schema definitions for Supabase (PostgreSQL).
  - `migrations/`: SQL migration files defining tables, triggers, policies, and seed data.
- **`.github/`**: GitHub Actions workflows for CI/CD pipelines.

### 🛠️ Documentation & Scripts
- **`docs/`**: Project documentation, architectural decisions, and guides.
- **`scripts/`**: Utility scripts (e.g., PowerShell or Node scripts) used for development, testing, or database tasks.

---

## Getting Started

1. **Install Dependencies**: 
   Ensure you have Node.js and `npm` or `pnpm` installed.
   ```bash
   npm install
   ```
2. **Environment Variables**:
   Copy `.env.example` to `.env.local` and populate the required variables (e.g., Supabase URL and Anon Key).
3. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Tech Stack
- **Framework**: [Next.js](https://nextjs.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/) & [shadcn/ui](https://ui.shadcn.com/)
- **Database / Auth**: [Supabase](https://supabase.com/)
- **Mobile**: [React Native](https://reactnative.dev/) & [Expo](https://expo.dev/)
- **Backend Service**: [Spring Boot (Java)](https://spring.io/projects/spring-boot)
