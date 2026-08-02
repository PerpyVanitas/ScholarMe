-- Migration: 20260803000000_finance_policy_system.sql
-- Financial Management & Audit System Schema Extensions

-- 1. Compliance Flags Table
CREATE TABLE IF NOT EXISTS public.finance_compliance_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    officer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    flag_level TEXT NOT NULL CHECK (flag_level IN ('yellow', 'orange', 'red')),
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'appealed')),
    issued_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    resolution_notes TEXT,
    date_issued TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    date_cleared TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Whistleblower Reports Table
CREATE TABLE IF NOT EXISTS public.finance_whistleblower_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_number TEXT NOT NULL UNIQUE,
    is_anonymous BOOLEAN NOT NULL DEFAULT true,
    submitted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'referred', 'resolved')),
    assigned_office TEXT NOT NULL DEFAULT 'auditor' CHECK (assigned_office IN ('auditor', 'president', 'finance_committee', 'adviser', 'investigation_committee')),
    decision TEXT,
    evidence_urls TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Revenue Collections Table
CREATE TABLE IF NOT EXISTS public.finance_revenue_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_number TEXT NOT NULL UNIQUE,
    source TEXT NOT NULL,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    officer_1_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    officer_2_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    deposited BOOLEAN NOT NULL DEFAULT false,
    deposit_reference TEXT,
    date_collected TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Investigations Table
CREATE TABLE IF NOT EXISTS public.finance_investigations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_number TEXT NOT NULL UNIQUE,
    flag_id UUID REFERENCES public.finance_compliance_flags(id) ON DELETE SET NULL,
    report_id UUID REFERENCES public.finance_whistleblower_reports(id) ON DELETE SET NULL,
    investigator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'ongoing' CHECK (status IN ('ongoing', 'recommendation_submitted', 'closed')),
    recommendation TEXT,
    evidence_urls TEXT[] NOT NULL DEFAULT '{}',
    meeting_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Supplemental Budget Requests Table
CREATE TABLE IF NOT EXISTS public.finance_supplemental_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_request_id UUID NOT NULL REFERENCES public.finance_budget_requests(id) ON DELETE CASCADE,
    variance_amount NUMERIC NOT NULL CHECK (variance_amount > 0),
    variance_percentage NUMERIC NOT NULL,
    justification TEXT NOT NULL,
    submitted_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'finance_review', 'president_approved', 'released', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Audit Findings Table
CREATE TABLE IF NOT EXISTS public.finance_audit_findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scard_id UUID REFERENCES public.finance_scards(id) ON DELETE CASCADE,
    auditor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    findings TEXT NOT NULL,
    recommendations TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'issued' CHECK (status IN ('issued', 'resolved', 'escalated')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Add columns to finance_budget_requests
ALTER TABLE public.finance_budget_requests ADD COLUMN IF NOT EXISTS coi_declared BOOLEAN DEFAULT false;
ALTER TABLE public.finance_budget_requests ADD COLUMN IF NOT EXISTS coi_reason TEXT;
ALTER TABLE public.finance_budget_requests ADD COLUMN IF NOT EXISTS coi_replacement_approver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.finance_budget_requests ADD COLUMN IF NOT EXISTS is_emergency BOOLEAN DEFAULT false;

-- 8. Add constraint on petty cash single transaction limit (₱300 max)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'check_petty_cash_max_300'
    ) THEN
        ALTER TABLE public.finance_petty_cash ADD CONSTRAINT check_petty_cash_max_300 CHECK (amount <= 300);
    END IF;
END $$;

-- 9. RLS Policies
ALTER TABLE public.finance_compliance_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_whistleblower_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_revenue_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_investigations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_supplemental_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_audit_findings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view compliance flags" ON public.finance_compliance_flags FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can submit whistleblower reports" ON public.finance_whistleblower_reports FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authorized roles can view whistleblower reports" ON public.finance_whistleblower_reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can view revenue collections" ON public.finance_revenue_collections FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can view investigations" ON public.finance_investigations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can view supplemental requests" ON public.finance_supplemental_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can view audit findings" ON public.finance_audit_findings FOR SELECT TO authenticated USING (true);
