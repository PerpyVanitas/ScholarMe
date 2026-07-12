CREATE TABLE IF NOT EXISTS public.finance_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    semester_budget NUMERIC NOT NULL DEFAULT 100000,
    academic_year TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.finance_vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.finance_budget_requests ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES public.finance_vendors(id) ON DELETE SET NULL;
ALTER TABLE public.finance_petty_cash ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES public.finance_vendors(id) ON DELETE SET NULL;
ALTER TABLE public.finance_liquidations ADD COLUMN IF NOT EXISTS returned_amount NUMERIC NOT NULL DEFAULT 0;

-- Seed configs
INSERT INTO public.finance_configs (academic_year, semester_budget) VALUES ('2026-2027', 100000);

-- Seed basic vendors
INSERT INTO public.finance_vendors (name, category) VALUES 
('National Bookstore', 'Supplies'),
('Jollibee', 'Food'),
('Mercury Drug', 'Medical'),
('SM Department Store', 'Miscellaneous');

-- Enable RLS
ALTER TABLE public.finance_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view finance configs" ON public.finance_configs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can view finance vendors" ON public.finance_vendors FOR SELECT TO authenticated USING (true);
