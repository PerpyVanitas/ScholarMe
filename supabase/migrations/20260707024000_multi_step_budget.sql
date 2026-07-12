SET statement_timeout = 0;
-- Add Multi-Step Approval Workflows to Budget Requests
ALTER TABLE public.finance_budget_requests
ADD COLUMN IF NOT EXISTS secondary_status TEXT CHECK (secondary_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS secondary_approved_by UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS secondary_approved_at TIMESTAMP WITH TIME ZONE;

