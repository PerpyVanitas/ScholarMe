# Database Schema

This document is auto-generated from Supabase migrations.

## Table: analytics_logs

| Column Definition |
| --- |
| `id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz DEFAULT now()` |

## Table: announcements

| Column Definition |
| --- |
| `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    priority BOOLEAN DEFAULT false,
    author_id UUID REFERENCES public.profiles(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL` |

## Table: auth_cards

| Column Definition |
| --- |
| `id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  card_id text NOT NULL UNIQUE,
  pin text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  issued_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz` |

## Table: conversation_participants

| Column Definition |
| --- |
| `conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now() NOT NULL,
  last_read_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (conversation_id, profile_id)` |

## Table: conversations

| Column Definition |
| --- |
| `id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL` |

## Table: daily_quests

| Column Definition |
| --- |
| `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    quest_type TEXT NOT NULL,
    target INTEGER NOT NULL,
    progress INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT false,
    xp_reward INTEGER DEFAULT 50,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()` |

## Table: device_tokens

| Column Definition |
| --- |
| `id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  token text NOT NULL,
  platform text DEFAULT 'android',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()` |

## Table: election_candidates

| Column Definition |
| --- |
| `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    election_id UUID NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    position TEXT NOT NULL,
    manifesto TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()` |

## Table: election_votes

| Column Definition |
| --- |
| `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    election_id UUID NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
    voter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES election_candidates(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(election_id, voter_id) -- One vote per election per user` |

## Table: elections

| Column Definition |
| --- |
| `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()` |

## Table: event_rsvps

| Column Definition |
| --- |
| `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.facility_events(id) ON DELETE CASCADE NOT NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('going', 'maybe', 'not_going')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(event_id, profile_id)` |

## Table: facility_events

| Column Definition |
| --- |
| `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    color_code TEXT DEFAULT 'bg-blue-500',
    organizer_id UUID REFERENCES auth.users(id),
    is_mandatory BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL` |

## Table: finance_budget_requests

| Column Definition |
| --- |
| `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_title TEXT NOT NULL,
    objectives TEXT,
    breakdown JSONB NOT NULL DEFAULT '[]'::jsonb,
    amount NUMERIC NOT NULL DEFAULT 0,
    submitted_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, finance_review, president_approved, released, rejected
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()` |

## Table: finance_configs

| Column Definition |
| --- |
| `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    semester_budget NUMERIC NOT NULL DEFAULT 100000,
    academic_year TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()` |

## Table: finance_liquidations

| Column Definition |
| --- |
| `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES public.finance_budget_requests(id) ON DELETE CASCADE,
    receipt_urls TEXT[] NOT NULL DEFAULT '{}',
    proof_of_payment_urls TEXT[] NOT NULL DEFAULT '{}',
    submitted_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_late BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()` |

## Table: finance_petty_cash

| Column Definition |
| --- |
| `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    amount NUMERIC NOT NULL DEFAULT 0,
    justification TEXT NOT NULL,
    submitted_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    linked_request_id UUID REFERENCES public.finance_budget_requests(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()` |

## Table: finance_scards

| Column Definition |
| --- |
| `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.finance_budget_requests(id) ON DELETE CASCADE,
    receipts_total NUMERIC NOT NULL DEFAULT 0,
    disbursements_total NUMERIC NOT NULL DEFAULT 0,
    balance NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'draft', -- draft, auditor_review, cosigned
    cosigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    cosigned_at TIMESTAMPTZ,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()` |

## Table: finance_vendors

| Column Definition |
| --- |
| `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()` |

## Table: flashcard_attempts

| Column Definition |
| --- |
| `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    study_set_item_id UUID REFERENCES public.study_set_items(id) ON DELETE CASCADE,
    rating INTEGER,
    repetitions INTEGER NOT NULL DEFAULT 0,
    ease_factor NUMERIC NOT NULL DEFAULT 2.5,
    interval_days INTEGER NOT NULL DEFAULT 0,
    next_review_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, study_set_item_id)` |

## Table: forum_posts

| Column Definition |
| --- |
| `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'General',
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()` |

## Table: forum_replies

| Column Definition |
| --- |
| `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
    author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()` |

## Table: forum_reports

| Column Definition |
| --- |
| `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()` |

## Table: friends

| Column Definition |
| --- |
| `id uuid DEFAULT gen_random_uuid() PRIMARY KEY` |
| `user_id1 uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL` |
| `user_id2 uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL` |
| `status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked'))` |
| `created_at timestamp with time zone DEFAULT now() NOT NULL` |
| `updated_at timestamp with time zone DEFAULT now() NOT NULL` |

## Table: governance_documents

| Column Definition |
| --- |
| `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    document_type TEXT DEFAULT 'policy' CHECK (document_type IN ('policy', 'minutes', 'bylaws', 'other')),
    uploaded_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()` |

## Table: hs_designations

| Column Definition |
| --- |
| `id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  designation text NOT NULL CHECK (designation IN ('member', 'esas_scholar', 'officer', 'administrator')),
  position text,  -- e.g., 'President', 'Vice President' — only for 'officer' designation
  academic_year text NOT NULL,  -- e.g., '2024-2025'
  is_current boolean DEFAULT false,
  created_at timestamptz DEFAULT now()` |

## Table: institutional_wiki_docs

| Column Definition |
| --- |
| `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'SOP',
  content TEXT NOT NULL,
  access_role TEXT NOT NULL DEFAULT 'learner',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()` |

## Table: integration_configs

| Column Definition |
| --- |
| `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_name TEXT NOT NULL UNIQUE,
    webhook_url TEXT,
    api_key TEXT,
    is_active BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT NOW()` |

## Table: login_history

| Column Definition |
| --- |
| `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()` |

## Table: memberships

| Column Definition |
| --- |
| `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    classification TEXT DEFAULT 'regular' CHECK (classification IN ('regular', 'premium', 'alumni')),
    dues_paid_until TIMESTAMP WITH TIME ZONE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()` |

## Table: mentorship_preferences

| Column Definition |
| --- |
| `user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_type TEXT NOT NULL CHECK (role_type IN ('mentor', 'mentee', 'both')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  interests TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()` |

## Table: messages

| Column Definition |
| --- |
| `id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  is_edited boolean DEFAULT false` |

## Table: milestone_events

| Column Definition |
| --- |
| `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  milestone_key TEXT NOT NULL,
  achieved_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, milestone_key)` |

## Table: notifications

| Column Definition |
| --- |
| `id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'system',
  is_read boolean DEFAULT false,
  link text,
  created_at timestamptz DEFAULT now()` |

## Table: officer_handoff_notes

| Column Definition |
| --- |
| `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_key TEXT NOT NULL,
  term_id UUID REFERENCES public.org_terms(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  key_contacts TEXT,
  created_at TIMESTAMPTZ DEFAULT now()` |

## Table: org_assignments

| Column Definition |
| --- |
| `id           uuid PRIMARY KEY DEFAULT gen_random_uuid()` |
| `term_id      uuid NOT NULL REFERENCES org_terms(id) ON DELETE CASCADE` |
| `user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE` |
| `position     text NOT NULL` |
| `-- Executive positions: 'president','vice_president','secretary','treasurer','auditor'
  -- Committee positions: 'committee_head','assistant_committee_head'
  committee    text` |
| `-- For committee positions, which committee they lead (null for executives)
  -- e.g. 'Secretariat', 'COF', 'CIA', 'CMSS', 'CPR', 'CRAR', 'COD', 'CFMR', 'COR', 'CKA'
  --      'CHR', 'COM', 'CEP', 'CNL', 'CMP', 'CBAMM', 'COI'
  created_at   timestamptz DEFAULT now()` |
| `updated_at   timestamptz DEFAULT now()` |
| `-- Enforce one person per position/committee per term
  UNIQUE (term_id, position, committee)` |

## Table: org_terms

| Column Definition |
| --- |
| `id          uuid PRIMARY KEY DEFAULT gen_random_uuid()` |
| `label       text NOT NULL,           -- e.g. "A.Y. 2026-2027"
  term_start  date NOT NULL,           -- typically July 1
  term_end    date NOT NULL,           -- typically June 30
  is_current  boolean NOT NULL DEFAULT false` |
| `created_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL` |
| `created_at  timestamptz DEFAULT now()` |

## Table: organization_settings

| Column Definition |
| --- |
| `id uuid NOT NULL DEFAULT gen_random_uuid(),
    primary_color text NOT NULL DEFAULT '#0f172a',
    logo_url text,
    hero_title text NOT NULL DEFAULT 'Empowering Your Academic Journey',
    hero_subtitle text NOT NULL DEFAULT 'Join our platform to master your subjects with AI-driven tools.',
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    PRIMARY KEY (id)` |

## Table: physical_resources

| Column Definition |
| --- |
| `id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT,
  isbn TEXT,
  resource_type TEXT NOT NULL DEFAULT 'book', -- 'book', 'calculator', 'equipment'
  cover_image_url TEXT,
  total_quantity INTEGER NOT NULL DEFAULT 1,
  available_quantity INTEGER NOT NULL DEFAULT 1,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL` |

## Table: poll_options

| Column Definition |
| --- |
| `id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  option_text text NOT NULL,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()` |

## Table: polls

| Column Definition |
| --- |
| `id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active',
  start_date timestamptz NOT NULL DEFAULT now(),
  end_date timestamptz NOT NULL,
  allow_multiple_votes boolean DEFAULT false,
  is_anonymous boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()` |

## Table: portfolio_settings

| Column Definition |
| --- |
| `user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_public BOOLEAN NOT NULL DEFAULT false,
  share_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  custom_bio TEXT,
  github_url TEXT,
  resume_url TEXT,
  featured_badges TEXT[] DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()` |

## Table: profiles

| Column Definition |
| --- |
| `id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id uuid REFERENCES public.roles(id),
  full_name text NOT NULL DEFAULT '',
  first_name text,
  last_name text,
  email text NOT NULL DEFAULT '',
  avatar_url text,
  phone_number text,
  birthdate date,
  date_of_birth date,
  membership_number text,
  bio text,
  profile_completed boolean DEFAULT false,
  terms_accepted_at timestamptz,
  total_xp integer DEFAULT 0 NOT NULL,
  current_level integer DEFAULT 1 NOT NULL,
  profile_theme_color text DEFAULT 'default',
  degree_program text,
  year_level integer,
  created_at timestamptz NOT NULL DEFAULT now()` |

## Table: quiz_attempts

| Column Definition |
| --- |
| `id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  study_set_id uuid NOT NULL REFERENCES public.study_sets(id) ON DELETE CASCADE,
  score numeric,
  total_items integer NOT NULL DEFAULT 0,
  answers jsonb,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  total_questions integer NOT NULL DEFAULT 0,
  time_spent_seconds integer DEFAULT 0` |

## Table: quiz_question_flags

| Column Definition |
| --- |
| `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    study_set_item_id UUID NOT NULL REFERENCES public.study_set_items(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()` |

## Table: repositories

| Column Definition |
| --- |
| `id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  access_role text NOT NULL DEFAULT 'all',
  created_at timestamptz NOT NULL DEFAULT now()` |

## Table: resource_checkouts

| Column Definition |
| --- |
| `id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  resource_id UUID NOT NULL REFERENCES public.physical_resources(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  checkout_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  return_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'returned', 'overdue', 'lost'
  notes TEXT,
  checked_out_by UUID NOT NULL REFERENCES public.profiles(id), -- Admin/Officer who processed it
  checked_in_by UUID REFERENCES public.profiles(id) -- Admin/Officer who processed return` |

## Table: resource_embeddings

| Column Definition |
| --- |
| `id uuid PRIMARY KEY DEFAULT gen_random_uuid()` |
| `resource_id uuid NOT NULL REFERENCES library_resources(id) ON DELETE CASCADE` |
| `profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE` |
| `content text NOT NULL` |
| `embedding jsonb, -- Storing the array of floats as JSONB instead of pgvector to avoid extension permission issues
    created_at timestamp with time zone DEFAULT now() NOT NULL` |

## Table: resources

| Column Definition |
| --- |
| `id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id uuid NOT NULL REFERENCES public.repositories(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  url text NOT NULL,
  file_type text,
  uploaded_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()` |

## Table: roadmap_items

| Column Definition |
| --- |
| `id uuid NOT NULL DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in-progress', 'completed')),
    upvotes integer NOT NULL DEFAULT 0,
    created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY (id)` |

## Table: roadmap_upvotes

| Column Definition |
| --- |
| `id uuid NOT NULL DEFAULT gen_random_uuid(),
    roadmap_item_id uuid NOT NULL REFERENCES public.roadmap_items(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY (id),
    UNIQUE(roadmap_item_id, user_id)` |

## Table: roles

| Column Definition |
| --- |
| `id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE` |

## Table: semester_configs

| Column Definition |
| --- |
| `id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    is_active boolean DEFAULT false,
    created_at timestamptz DEFAULT now()` |

## Table: session_participants

| Column Definition |
| --- |
| `session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    learner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'attended', 'no_show', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (session_id, learner_id)` |

## Table: session_ratings

| Column Definition |
| --- |
| `id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL UNIQUE REFERENCES public.sessions(id) ON DELETE CASCADE,
  learner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback text,
  created_at timestamptz NOT NULL DEFAULT now()` |

## Table: session_waitlists

| Column Definition |
| --- |
| `id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tutor_id UUID NOT NULL REFERENCES public.tutors(id) ON DELETE CASCADE,
  learner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  requested_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting', -- 'waiting', 'notified', 'fulfilled', 'cancelled'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL` |

## Table: sessions

| Column Definition |
| --- |
| `id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id uuid REFERENCES public.tutors(id) ON DELETE CASCADE,
  learner_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  specialization_id uuid REFERENCES public.specializations(id) ON DELETE SET NULL,
  scheduled_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  cancellation_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()` |

## Table: specializations

| Column Definition |
| --- |
| `id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  category text` |

## Table: study_group_members

| Column Definition |
| --- |
| `group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (group_id, user_id)` |

## Table: study_group_messages

| Column Definition |
| --- |
| `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()` |

## Table: study_groups

| Column Definition |
| --- |
| `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()` |

## Table: study_set_items

| Column Definition |
| --- |
| `id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  study_set_id uuid NOT NULL REFERENCES public.study_sets(id) ON DELETE CASCADE,
  item_type text NOT NULL CHECK (item_type IN ('flashcard', 'multiple_choice', 'true_false', 'identification', 'matching')),
  prompt text NOT NULL,
  answer text,
  options jsonb,
  explanation text,
  order_index integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  question text NOT NULL DEFAULT '',
  correct_answer_index integer DEFAULT 0,
  display_order integer NOT NULL DEFAULT 0` |

## Table: study_sets

| Column Definition |
| --- |
| `id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  source_type text NOT NULL DEFAULT 'manual',
  source_id uuid,
  visibility text NOT NULL DEFAULT 'private',
  generation_mode text NOT NULL DEFAULT 'flashcard',
  difficulty text NOT NULL DEFAULT 'medium',
  question_count integer NOT NULL DEFAULT 10,
  tags text[] DEFAULT '{}',
  archived boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_public boolean DEFAULT false,
  source_resource_id uuid REFERENCES public.resources(id) ON DELETE SET NULL,
  is_archived boolean DEFAULT false` |

## Table: support_messages

| Column Definition |
| --- |
| `id uuid NOT NULL DEFAULT gen_random_uuid(),
    ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY (id)` |

## Table: support_tickets

| Column Definition |
| --- |
| `id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in-progress', 'resolved')),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY (id)` |

## Table: system_feedback

| Column Definition |
| --- |
| `id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending'` |

## Table: team_schedules

| Column Definition |
| --- |
| `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    activity TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()` |

## Table: team_tasks

| Column Definition |
| --- |
| `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    committee_id TEXT,
    deliverable TEXT NOT NULL,
    deadline TIMESTAMPTZ,
    assignee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'todo', -- todo, in_progress, review, done
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()` |

## Table: timesheet_periods

| Column Definition |
| --- |
| `id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()` |

## Table: timesheets

| Column Definition |
| --- |
| `id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id uuid NOT NULL REFERENCES public.tutors(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  clock_in timestamptz NOT NULL DEFAULT now(),
  clock_out timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()` |

## Table: tutor_availability

| Column Definition |
| --- |
| `id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id uuid REFERENCES public.tutors(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now()` |

## Table: tutor_endorsements

| Column Definition |
| --- |
| `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  learner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()` |

## Table: tutor_reviews

| Column Definition |
| --- |
| `id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id uuid NOT NULL REFERENCES public.tutors(id) ON DELETE CASCADE,
  tutor_id uuid NOT NULL REFERENCES public.tutors(id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.sessions(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback text NOT NULL,
  created_at timestamptz DEFAULT now()` |

## Table: tutor_specializations

| Column Definition |
| --- |
| `tutor_id uuid REFERENCES public.tutors(id) ON DELETE CASCADE,
  specialization_id uuid REFERENCES public.specializations(id) ON DELETE CASCADE,
  PRIMARY KEY (tutor_id, specialization_id)` |

## Table: tutors

| Column Definition |
| --- |
| `id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  bio text,
  rating numeric(3,2) DEFAULT 0,
  total_ratings integer DEFAULT 0,
  hourly_rate numeric(10,2),
  years_experience integer,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now()` |

## Table: user_badges

| Column Definition |
| --- |
| `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_name TEXT NOT NULL,
    badge_description TEXT,
    icon_name TEXT,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, badge_name)` |

## Table: user_streaks

| Column Definition |
| --- |
| `user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    current_streak INT DEFAULT 1,
    longest_streak INT DEFAULT 1,
    last_login_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()` |

## Table: user_votes

| Column Definition |
| --- |
| `id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  option_id uuid NOT NULL REFERENCES public.poll_options(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(poll_id, user_id, option_id)` |

## Table: weekly_challenges

| Column Definition |
| --- |
| `id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    description text NOT NULL,
    target_amount integer NOT NULL DEFAULT 0,
    current_progress integer NOT NULL DEFAULT 0,
    xp_reward_multiplier numeric(3,1) NOT NULL DEFAULT 1.0,
    end_date timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL` |

## Table: xp_logs

| Column Definition |
| --- |
| `id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  reason text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL` |

