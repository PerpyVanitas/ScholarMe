import { SyncTabs } from "@/components/sync-tabs";
import { TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// Components
import { BudgetRequestsTab } from "./components/budget-requests-tab";
import { PettyCashTab } from "./components/petty-cash-tab";
import { LiquidationsTab } from "./components/liquidations-tab";
import { ScardsTab } from "./components/scards-tab";

// Types
import { BudgetRequest, PettyCash, Liquidation, Scard } from "./types";

export default async function FinanceDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: isManager } = await supabase.rpc("has_role", {
    user_id: user.id,
    allowed_roles: ["finance_manager", "administrator"],
  });

  const { data: canSubmit } = await supabase.rpc("has_role", {
    user_id: user.id,
    allowed_roles: [
      "finance_manager",
      "administrator",
      "committee_head",
      "president",
    ],
  });

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

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col items-start gap-2">
        <h1 className="text-3xl font-bold">Financial Management</h1>
        {isManager && (
          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
            Finance Manager Access
          </span>
        )}
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
            isManager={isManager}
            budgetReqs={budgetReqs as BudgetRequest[] | null}
          />
        </TabsContent>

        <TabsContent value="petty_cash" className="space-y-6">
          <PettyCashTab
            canSubmit={canSubmit}
            pettyCash={pettyCash as PettyCash[] | null}
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
            canSubmit={canSubmit}
            isManager={isManager}
            scards={scards as Scard[] | null}
          />
        </TabsContent>
      </SyncTabs>
    </div>
  );
}
