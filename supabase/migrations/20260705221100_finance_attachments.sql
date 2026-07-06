-- Add attachment_url to finance tables
ALTER TABLE public.finance_budget_requests ADD COLUMN IF NOT EXISTS attachment_url TEXT;
ALTER TABLE public.finance_petty_cash ADD COLUMN IF NOT EXISTS attachment_url TEXT;
ALTER TABLE public.finance_scards ADD COLUMN IF NOT EXISTS attachment_url TEXT;
