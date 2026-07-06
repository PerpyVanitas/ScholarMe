export interface Profile {
  full_name: string;
}

export interface BudgetRequest {
  id: string;
  activity_title: string;
  amount: number;
  status: string;
  created_at: string;
  attachment_url: string | null;
  profiles: Profile | null;
}

export interface PettyCash {
  id: string;
  amount: number;
  justification: string;
  status: string;
  created_at: string;
  attachment_url: string | null;
  profiles: Profile | null;
}

export interface Liquidation {
  id: string;
  submitted_at: string;
  is_late: boolean;
  receipt_urls?: string[];
  proof_of_payment_urls?: string[];
  finance_budget_requests: { activity_title: string; amount?: number } | null;
  profiles: Profile | null;
}

export interface Scard {
  id: string;
  event_id: string;
  version: number;
  receipts_total: number;
  disbursements_total: number;
  balance: number;
  status: string;
  created_at: string;
  attachment_url: string | null;
  cosigned_by: string | null;
  cosigned_at: string | null;
  profiles: Profile | null;
}
