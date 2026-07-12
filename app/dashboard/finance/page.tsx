import { SyncTabs } from "@/components/sync-tabs";
import { TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/server";
import { Progress } from "@/components/ui/progress";
import {
  canAccessFinance,
  canApproveFinance,
  canReviewFinance,
  canSubmitFinance,
  canAuditFinance,
  getRoleName,
} from "@/lib/utils/roles";
import { redirect } from "next/navigation";

// Components
import { BudgetRequestsTab } from "./components/budget-requests-tab";
import { PettyCashTab } from "./components/petty-cash-tab";
import { LiquidationsTab } from "./components/liquidations-tab";
import { ScardsTab } from "./components/scards-tab";

// Types
import { BudgetRequest, PettyCash, Liquidation, Scard } from "./types";
import { FinanceVendor } from "@/lib/types";

export default async function FinanceDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("roles(name)")
    .eq("id", user.id)
    .single();

  const role = getRoleName(profile ?? { roles: [] });

  if (!canAccessFinance(role)) {
    redirect("/dashboard/home");
  }

  const canReview = canReviewFinance(role);
  const canApprove = canApproveFinance(role);
  const canSubmit = canSubmitFinance(role);
  const canAudit = canAuditFinance(role);

  // Optimized Supabase selects avoiding unnecessary fields
  const { data: budgetReqs } = await supabase
    .from("finance_budget_requests")
    .select(
      "id, activity_title, amount, status, created_at, attachment_url, profiles(full_name)",
    )
    .order("created_at", { ascending: false });

  const { data: pettyCash } = await supabase
    .from("finance_petty_cash")
    .select(
      "id, amount, justification, status, created_at, attachment_url, profiles(full_name)",
    )
    .order("created_at", { ascending: false });

  const { data: lateLiquidations } = await supabase
    .from("finance_liquidations")
    .select(
      "id, submitted_at, finance_budget_requests(activity_title, amount), profiles(full_name)",
    )
    .eq("is_late", true)
    .order("submitted_at", { ascending: true });

  const { data: approvedRequests } = await supabase
    .from("finance_budget_requests")
    .select("id, activity_title, amount")
    .eq("status", "president_approved")
    .order("created_at", { ascending: false });

  const { data: allLiquidations } = await supabase
    .from("finance_liquidations")
    .select(
      "id, submitted_at, is_late, receipt_urls, proof_of_payment_urls, finance_budget_requests(activity_title), profiles(full_name)",
    )
    .order("submitted_at", { ascending: false });

  const { data: scards } = await supabase
    .from("finance_scards")
    .select(
      "id, event_id, version, receipts_total, disbursements_total, balance, status, created_at, attachment_url, cosigned_by, cosigned_at, profiles(full_name)",
    )
    .order("created_at", { ascending: false });

  const { data: configs } = await supabase
    .from("finance_configs")
    .select("semester_budget")
    .limit(1)
    .maybeSingle();

  const semesterBudget = configs?.semester_budget || 100000;

  // Calculate total spent (from released/president_approved requests)
  const { data: spentReqs } = await supabase
    .from("finance_budget_requests")
    .select("amount")
    .in("status", ["president_approved", "released"]);

  const totalSpent =
    spentReqs?.reduce((sum, req) => sum + Number(req.amount), 0) || 0;
  const budgetPercentage = Math.min((totalSpent / semesterBudget) * 100, 100);

  const { data: vendorsData } = await supabase
    .from("finance_vendors")
    .select("*")
    .order("name", { ascending: true });

  const vendors = (vendorsData || []) as FinanceVendor[];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col items-start gap-2">
        <h1 className="text-3xl font-bold">Financial Management</h1>
        <div className="flex items-center gap-2">
          {canReview && (
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
              Finance Review Access
            </span>
          )}
        </div>
      </div>

      <div className="bg-card border rounded-lg p-6">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground">
            Semester Budget Utilization
          </span>
          <span className="text-sm font-bold">
            ₱{totalSpent.toLocaleString()} / ₱{semesterBudget.toLocaleString()}
          </span>
        </div>
        <Progress value={budgetPercentage} className="h-3" />
      </div>

      <SyncTabs defaultValue="requests" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="requests">Budget Requests</TabsTrigger>
          <TabsTrigger value="petty_cash">Petty Cash</TabsTrigger>
          <TabsTrigger value="liquidations">Liquidations</TabsTrigger>
          <TabsTrigger value="scards">SCARDS & Audit</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-6">
          <BudgetRequestsTab
            canSubmit={canSubmit}
            canReview={canReview}
            canApprove={canApprove}
            budgetReqs={budgetReqs as BudgetRequest[] | null}
            vendors={vendors}
          />
        </TabsContent>

        <TabsContent value="petty_cash" className="space-y-6">
          <PettyCashTab
            canSubmit={canSubmit}
            pettyCash={pettyCash as PettyCash[] | null}
            vendors={vendors}
          />
        </TabsContent>

        <TabsContent value="liquidations" className="space-y-6">
          <LiquidationsTab
            canSubmit={canSubmit}
            approvedRequests={approvedRequests as BudgetRequest[] | null}
            allLiquidations={allLiquidations as Liquidation[] | null}
            lateLiquidations={lateLiquidations as Liquidation[] | null}
          />
        </TabsContent>

        <TabsContent value="scards" className="space-y-6">
          <ScardsTab
            canSubmit={canReview}
            canAudit={canAudit}
            scards={scards as Scard[] | null}
          />
        </TabsContent>
      </SyncTabs>
    </div>
  );
}
