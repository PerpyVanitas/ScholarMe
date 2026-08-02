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

export interface ComplianceFlag {
  id: string;
  officer_id: string;
  flag_level: "yellow" | "orange" | "red";
  reason: string;
  status: "active" | "resolved" | "appealed";
  issued_by: string | null;
  resolution_notes: string | null;
  date_issued: string;
  date_cleared: string | null;
  profiles: Profile | null;
}

export interface WhistleblowerReport {
  id: string;
  report_number: string;
  is_anonymous: boolean;
  title: string;
  description: string;
  status: "submitted" | "under_review" | "referred" | "resolved";
  assigned_office: "auditor" | "president" | "finance_committee" | "adviser" | "investigation_committee";
  decision: string | null;
  evidence_urls: string[];
  created_at: string;
}

export interface RevenueCollection {
  id: string;
  collection_number: string;
  source: string;
  amount: number;
  officer_1_id: string;
  officer_2_id: string;
  deposited: boolean;
  deposit_reference: string | null;
  date_collected: string;
  officer1?: Profile | null;
  officer2?: Profile | null;
}

export interface InvestigationCase {
  id: string;
  case_number: string;
  flag_id: string | null;
  report_id: string | null;
  investigator_id: string | null;
  status: "ongoing" | "recommendation_submitted" | "closed";
  recommendation: string | null;
  evidence_urls: string[];
  meeting_notes: string | null;
  created_at: string;
}

export interface SupplementalRequest {
  id: string;
  parent_request_id: string;
  variance_amount: number;
  variance_percentage: number;
  justification: string;
  status: string;
  created_at: string;
  parent_request?: { activity_title: string; amount: number } | null;
  profiles?: Profile | null;
}

