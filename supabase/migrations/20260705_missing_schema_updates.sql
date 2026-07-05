-- 1. Insert missing roles (ignore if they already exist)
INSERT INTO public.roles (name)
VALUES 
  ('auditor'),
  ('president'),
  ('treasurer'),
  ('committee_head'),
  ('faculty_adviser'),
  ('finance_manager')
ON CONFLICT (name) DO NOTHING;

-- 2. Create finance tables

CREATE TABLE IF NOT EXISTS public.finance_budget_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  activity_title text NOT NULL,
  objectives text,
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT finance_budget_requests_pkey PRIMARY KEY (id),
  CONSTRAINT finance_budget_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

CREATE TABLE IF NOT EXISTS public.finance_petty_cash (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  justification text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT finance_petty_cash_pkey PRIMARY KEY (id),
  CONSTRAINT finance_petty_cash_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

CREATE TABLE IF NOT EXISTS public.finance_liquidations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  budget_request_id uuid,
  petty_cash_id uuid,
  receipt_urls text[] DEFAULT '{}'::text[],
  proof_of_payment_urls text[] DEFAULT '{}'::text[],
  is_late boolean NOT NULL DEFAULT false,
  submitted_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT finance_liquidations_pkey PRIMARY KEY (id),
  CONSTRAINT finance_liquidations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT finance_liquidations_budget_request_id_fkey FOREIGN KEY (budget_request_id) REFERENCES public.finance_budget_requests(id),
  CONSTRAINT finance_liquidations_petty_cash_id_fkey FOREIGN KEY (petty_cash_id) REFERENCES public.finance_petty_cash(id)
);

CREATE TABLE IF NOT EXISTS public.finance_scards (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_id text NOT NULL,
  receipts_total numeric NOT NULL DEFAULT 0,
  disbursements_total numeric NOT NULL DEFAULT 0,
  balance numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  version integer NOT NULL DEFAULT 1,
  cosigned_by uuid,
  cosigned_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT finance_scards_pkey PRIMARY KEY (id),
  CONSTRAINT finance_scards_cosigned_by_fkey FOREIGN KEY (cosigned_by) REFERENCES public.profiles(id),
  CONSTRAINT finance_scards_event_version_key UNIQUE (event_id, version)
);

-- Enable RLS (Row Level Security) - optional but recommended
ALTER TABLE public.finance_budget_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_petty_cash ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_liquidations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_scards ENABLE ROW LEVEL SECURITY;

-- Temporary open policies for development (restrict to authenticated users)
CREATE POLICY "Allow read for authenticated" ON public.finance_budget_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert for authenticated" ON public.finance_budget_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow update for authenticated" ON public.finance_budget_requests FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow read for authenticated" ON public.finance_petty_cash FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert for authenticated" ON public.finance_petty_cash FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow update for authenticated" ON public.finance_petty_cash FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow read for authenticated" ON public.finance_liquidations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert for authenticated" ON public.finance_liquidations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow read for authenticated" ON public.finance_scards FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow all mutations for authenticated" ON public.finance_scards FOR ALL TO authenticated USING (true);
