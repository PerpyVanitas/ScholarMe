SET statement_timeout = 0;
-- 1. Add finance_manager role
INSERT INTO public.roles (name) VALUES ('finance_manager') ON CONFLICT (name) DO NOTHING;

-- 2. Financial Management Tables
CREATE TABLE IF NOT EXISTS public.finance_budget_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_title TEXT NOT NULL,
    objectives TEXT,
    breakdown JSONB NOT NULL DEFAULT '[]'::jsonb,
    amount NUMERIC NOT NULL DEFAULT 0,
    submitted_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, finance_review, president_approved, released, rejected
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.finance_petty_cash (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    amount NUMERIC NOT NULL DEFAULT 0,
    justification TEXT NOT NULL,
    submitted_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    linked_request_id UUID REFERENCES public.finance_budget_requests(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.finance_liquidations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES public.finance_budget_requests(id) ON DELETE CASCADE,
    receipt_urls TEXT[] NOT NULL DEFAULT '{}',
    proof_of_payment_urls TEXT[] NOT NULL DEFAULT '{}',
    submitted_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_late BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.finance_scards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.finance_budget_requests(id) ON DELETE CASCADE,
    receipts_total NUMERIC NOT NULL DEFAULT 0,
    disbursements_total NUMERIC NOT NULL DEFAULT 0,
    balance NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'draft', -- draft, auditor_review, cosigned
    cosigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    cosigned_at TIMESTAMPTZ,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.finance_audit_findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scards_id UUID REFERENCES public.finance_scards(id) ON DELETE CASCADE,
    auditor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    issue_type TEXT NOT NULL,
    description TEXT NOT NULL,
    resolved BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Teamwork Tracker Tables
CREATE TABLE IF NOT EXISTS public.team_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    committee_id TEXT,
    deliverable TEXT NOT NULL,
    deadline TIMESTAMPTZ,
    assignee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'todo', -- todo, in_progress, review, done
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.team_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    activity TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.finance_budget_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_petty_cash ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_liquidations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_scards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_audit_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_schedules ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies

-- For budget requests
CREATE POLICY "Anyone can view budget requests" ON public.finance_budget_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Committee Heads can insert requests" ON public.finance_budget_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = submitted_by);
CREATE POLICY "Finance Managers and submitters can update requests" ON public.finance_budget_requests FOR UPDATE TO authenticated USING (
    auth.uid() = submitted_by OR public.has_role(auth.uid(), ARRAY['finance_manager', 'administrator'])
);

-- For petty cash
CREATE POLICY "Anyone can view petty cash" ON public.finance_petty_cash FOR SELECT TO authenticated USING (true);
CREATE POLICY "Members can insert petty cash" ON public.finance_petty_cash FOR INSERT TO authenticated WITH CHECK (auth.uid() = submitted_by);
CREATE POLICY "Finance Managers can update petty cash" ON public.finance_petty_cash FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(), ARRAY['finance_manager', 'administrator'])
);

-- For liquidations
CREATE POLICY "Anyone can view liquidations" ON public.finance_liquidations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Members can insert liquidations" ON public.finance_liquidations FOR INSERT TO authenticated WITH CHECK (auth.uid() = submitted_by);
CREATE POLICY "Finance Managers can update liquidations" ON public.finance_liquidations FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(), ARRAY['finance_manager', 'administrator'])
);

-- For SCARDS
CREATE POLICY "Anyone can view SCARDS" ON public.finance_scards FOR SELECT TO authenticated USING (true);
CREATE POLICY "Finance Managers can manage SCARDS" ON public.finance_scards FOR ALL TO authenticated USING (
    public.has_role(auth.uid(), ARRAY['finance_manager', 'administrator'])
);

-- For Audit Findings
CREATE POLICY "Anyone can view audit findings" ON public.finance_audit_findings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Finance Managers can manage audit findings" ON public.finance_audit_findings FOR ALL TO authenticated USING (
    public.has_role(auth.uid(), ARRAY['finance_manager', 'administrator'])
);

-- For Team Tasks
CREATE POLICY "Anyone can view team tasks" ON public.team_tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can manage team tasks" ON public.team_tasks FOR ALL TO authenticated USING (true);

-- For Team Schedules
CREATE POLICY "Anyone can view team schedules" ON public.team_schedules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Members can manage their own schedules" ON public.team_schedules FOR ALL TO authenticated USING (
    auth.uid() = member_id OR public.has_role(auth.uid(), ARRAY['finance_manager', 'administrator'])
);

-- 5. Storage Bucket for Receipts
INSERT INTO storage.buckets (id, name, public) VALUES ('finance_attachments', 'finance_attachments', false) ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Anyone can view finance attachments" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'finance_attachments');
CREATE POLICY "Authenticated users can upload finance attachments" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'finance_attachments');

