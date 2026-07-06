-- 1. Drop the weak/broken policies allowing open access
DROP POLICY IF EXISTS "Allow read for authenticated" ON public.finance_budget_requests;
DROP POLICY IF EXISTS "Allow update for authenticated" ON public.finance_budget_requests;
DROP POLICY IF EXISTS "Anyone can view budget requests" ON public.finance_budget_requests;

DROP POLICY IF EXISTS "Allow read for authenticated" ON public.finance_petty_cash;
DROP POLICY IF EXISTS "Allow update for authenticated" ON public.finance_petty_cash;
DROP POLICY IF EXISTS "Anyone can view petty cash" ON public.finance_petty_cash;

DROP POLICY IF EXISTS "Allow read for authenticated" ON public.finance_liquidations;
DROP POLICY IF EXISTS "Anyone can view liquidations" ON public.finance_liquidations;

DROP POLICY IF EXISTS "Allow read for authenticated" ON public.finance_scards;
DROP POLICY IF EXISTS "Allow all mutations for authenticated" ON public.finance_scards;
DROP POLICY IF EXISTS "Anyone can view SCARDS" ON public.finance_scards;

DROP POLICY IF EXISTS "Anyone can view audit findings" ON public.finance_audit_findings;
DROP POLICY IF EXISTS "Anyone can view team schedules" ON public.team_schedules;

-- Ensure RLS is enabled for all tables
ALTER TABLE public.finance_budget_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_petty_cash ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_liquidations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_scards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_audit_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_schedules ENABLE ROW LEVEL SECURITY;

-- 2. Finance Budget Requests (Strict Policies)
CREATE POLICY "Finance managers and submitters can view budget requests" ON public.finance_budget_requests
FOR SELECT TO authenticated
USING (
  submitted_by = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.roles r ON p.role_id = r.id
    WHERE p.id = auth.uid() AND r.name IN ('finance_manager', 'treasurer', 'president', 'super_admin', 'auditor')
  )
);

CREATE POLICY "Authenticated users can insert their own budget requests" ON public.finance_budget_requests
FOR INSERT TO authenticated
WITH CHECK (submitted_by = auth.uid());

CREATE POLICY "Submitters can update their pending budget requests" ON public.finance_budget_requests
FOR UPDATE TO authenticated
USING (submitted_by = auth.uid() AND status = 'pending');

CREATE POLICY "Finance managers can update all budget requests" ON public.finance_budget_requests
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.roles r ON p.role_id = r.id
    WHERE p.id = auth.uid() AND r.name IN ('finance_manager', 'treasurer', 'president', 'super_admin')
  )
);

-- 3. Finance Petty Cash (Strict Policies)
CREATE POLICY "Finance managers and submitters can view petty cash" ON public.finance_petty_cash
FOR SELECT TO authenticated
USING (
  submitted_by = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.roles r ON p.role_id = r.id
    WHERE p.id = auth.uid() AND r.name IN ('finance_manager', 'treasurer', 'president', 'super_admin', 'auditor')
  )
);

CREATE POLICY "Authenticated users can insert their own petty cash requests" ON public.finance_petty_cash
FOR INSERT TO authenticated
WITH CHECK (submitted_by = auth.uid());

CREATE POLICY "Submitters can update their pending petty cash" ON public.finance_petty_cash
FOR UPDATE TO authenticated
USING (submitted_by = auth.uid() AND status = 'pending');

CREATE POLICY "Finance managers can update all petty cash" ON public.finance_petty_cash
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.roles r ON p.role_id = r.id
    WHERE p.id = auth.uid() AND r.name IN ('finance_manager', 'treasurer', 'president', 'super_admin')
  )
);

-- 4. Finance Liquidations (Strict Policies)
CREATE POLICY "Finance managers and submitters can view liquidations" ON public.finance_liquidations
FOR SELECT TO authenticated
USING (
  submitted_by = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.roles r ON p.role_id = r.id
    WHERE p.id = auth.uid() AND r.name IN ('finance_manager', 'treasurer', 'president', 'super_admin', 'auditor')
  )
);

CREATE POLICY "Authenticated users can insert their own liquidations" ON public.finance_liquidations
FOR INSERT TO authenticated
WITH CHECK (submitted_by = auth.uid());

-- 5. Finance SCARDS - Auditor Ledgers
CREATE POLICY "Finance managers and auditors can view SCARDS" ON public.finance_scards
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.roles r ON p.role_id = r.id
    WHERE p.id = auth.uid() AND r.name IN ('finance_manager', 'treasurer', 'president', 'super_admin', 'auditor')
  )
);

CREATE POLICY "Finance managers and auditors can manage SCARDS" ON public.finance_scards
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.roles r ON p.role_id = r.id
    WHERE p.id = auth.uid() AND r.name IN ('finance_manager', 'treasurer', 'president', 'super_admin', 'auditor')
  )
);

-- 6. Finance Audit Findings
CREATE POLICY "Finance managers and auditors can view audit findings" ON public.finance_audit_findings
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.roles r ON p.role_id = r.id
    WHERE p.id = auth.uid() AND r.name IN ('finance_manager', 'treasurer', 'president', 'super_admin', 'auditor')
  )
);

CREATE POLICY "Auditors can insert audit findings" ON public.finance_audit_findings
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.roles r ON p.role_id = r.id
    WHERE p.id = auth.uid() AND r.name IN ('auditor', 'super_admin')
  )
);

CREATE POLICY "Auditors can update audit findings" ON public.finance_audit_findings
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.roles r ON p.role_id = r.id
    WHERE p.id = auth.uid() AND r.name IN ('auditor', 'super_admin')
  )
);

-- 7. Team Schedules (BOLA Patch)
CREATE POLICY "Members can view their own schedules and officers can view all" ON public.team_schedules
FOR SELECT TO authenticated
USING (
  member_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.roles r ON p.role_id = r.id
    WHERE p.id = auth.uid() AND r.name IN ('officer', 'committee_head', 'president', 'super_admin')
  )
);
