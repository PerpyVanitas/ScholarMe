# ScholarMe Architecture

This document provides a high-level overview of the ScholarMe architecture, including system design and core database relationships.

## System Architecture

ScholarMe is built on a modern serverless stack utilizing Next.js (App Router), Supabase (PostgreSQL), and Vercel.

```mermaid
graph TD
    Client[Web Client / Browser]
    Vercel[Vercel Serverless Platform]
    NextJS[Next.js App Router]
    Supabase[Supabase Platform]
    Auth[Supabase Auth]
    DB[(PostgreSQL Database)]
    Storage[Supabase Storage]
    AI[AI Services (Vertex / GCP)]

    Client -->|HTTP / React Server Components| Vercel
    Vercel --> NextJS
    NextJS -->|Direct DB Queries / ORM| DB
    NextJS -->|Supabase Client| Auth
    NextJS -->|File Uploads| Storage
    NextJS -->|API Calls| AI
    Supabase --- Auth
    Supabase --- DB
    Supabase --- Storage
```

## Core Database Schema (ER Diagram)

This diagram highlights the most critical entities in the system, focusing on users, tutoring, and study tools. Note that the full database contains over 80 tables; this is a simplified view of the core domain.

```mermaid
erDiagram
    profiles ||--o{ sessions : participates_as_learner
    profiles ||--o{ study_sets : creates
    tutors ||--o{ sessions : leads
    tutors ||--|| profiles : is_a
    study_sets ||--o{ study_set_items : contains
    study_sets ||--o{ quiz_attempts : taken_by_users
    profiles ||--o{ quiz_attempts : takes

    profiles {
        uuid id PK
        string full_name
        string email
        string role_id FK
        integer total_xp
    }

    tutors {
        uuid id PK
        uuid user_id FK
        text bio
        numeric hourly_rate
        boolean is_verified
    }

    sessions {
        uuid id PK
        uuid tutor_id FK
        uuid learner_id FK
        date scheduled_date
        time start_time
        string status
    }

    study_sets {
        uuid id PK
        uuid owner_id FK
        string title
        string difficulty
        boolean is_public
    }

    study_set_items {
        uuid id PK
        uuid study_set_id FK
        string item_type
        text prompt
        text answer
    }

    quiz_attempts {
        uuid id PK
        uuid user_id FK
        uuid study_set_id FK
        numeric score
        jsonb answers
    }
```
