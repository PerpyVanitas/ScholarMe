import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/server";
import { createBudgetRequest, createPettyCash, updateBudgetRequestStatus } from "@/app/actions/finance";
import { redirect } from "next/navigation";

export default async function FinanceDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: isManager } = await supabase.rpc("has_role", {
    user_id: user.id,
    allowed_roles: ["finance_manager", "administrator"],
  });

  const { data: budgetReqs } = await supabase.from("finance_budget_requests").select("*, profiles(full_name)").order("created_at", { ascending: false });
  const { data: pettyCash } = await supabase.from("finance_petty_cash").select("*, profiles(full_name)").order("created_at", { ascending: false });

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Financial Management</h1>
        {isManager && <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">Finance Manager Access</span>}
      </div>

      <Tabs defaultValue="requests" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="requests">Budget Requests</TabsTrigger>
          <TabsTrigger value="petty_cash">Petty Cash</TabsTrigger>
          <TabsTrigger value="liquidations">Liquidations</TabsTrigger>
          <TabsTrigger value="scards">SCARDS & Audit</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Submit Budget Request</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={createBudgetRequest} className="space-y-4 max-w-xl">
                <Input name="activity_title" placeholder="Activity Title" required />
                <Textarea name="objectives" placeholder="Objectives" />
                <Input type="number" name="amount" placeholder="Total Amount (PHP)" required />
                <Button type="submit">Submit Request</Button>
              </form>
            </CardContent>
          </Card>

          <h2 className="text-xl font-bold mt-8">Recent Requests</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {budgetReqs?.map((req: any) => (
              <Card key={req.id}>
                <CardHeader>
                  <CardTitle>{req.activity_title}</CardTitle>
                  <CardDescription>By {req.profiles?.full_name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold text-lg">₱{req.amount}</p>
                  <p className="text-sm text-muted-foreground capitalize">Status: {req.status.replace("_", " ")}</p>
                  
                  {isManager && req.status === "pending" && (
                    <div className="flex gap-2 mt-4">
                      <form action={async () => { "use server"; await updateBudgetRequestStatus(req.id, "finance_review"); }}>
                         <Button size="sm" variant="outline">Start Review</Button>
                      </form>
                      <form action={async () => { "use server"; await updateBudgetRequestStatus(req.id, "president_approved"); }}>
                         <Button size="sm" variant="default">Approve</Button>
                      </form>
                      <form action={async () => { "use server"; await updateBudgetRequestStatus(req.id, "rejected"); }}>
                         <Button size="sm" variant="destructive">Reject</Button>
                      </form>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="petty_cash" className="space-y-6">
           <Card>
            <CardHeader>
              <CardTitle>Request Petty Cash</CardTitle>
              <CardDescription>Maximum ₱300 per transaction.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={createPettyCash} className="space-y-4 max-w-xl">
                <Input type="number" name="amount" placeholder="Amount (PHP)" max="300" required />
                <Textarea name="justification" placeholder="Justification" required />
                <Button type="submit">Submit Petty Cash</Button>
              </form>
            </CardContent>
          </Card>

          <h2 className="text-xl font-bold mt-8">Petty Cash Log</h2>
          <div className="space-y-4">
            {pettyCash?.map((req: any) => (
              <div key={req.id} className="p-4 border rounded flex justify-between items-center">
                <div>
                  <p className="font-medium">₱{req.amount} - {req.profiles?.full_name}</p>
                  <p className="text-sm text-muted-foreground">{req.justification}</p>
                </div>
                <div>
                  <span className={`px-2 py-1 rounded text-xs ${req.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : req.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {req.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="liquidations">
          <Card>
            <CardHeader>
              <CardTitle>Liquidations</CardTitle>
              <CardDescription>Submit liquidations for approved budget requests.</CardDescription>
            </CardHeader>
            <CardContent>
               <p className="text-muted-foreground">Liquidation module interface pending full rollout.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scards">
          <Card>
            <CardHeader>
              <CardTitle>SCARDS & Audit Findings</CardTitle>
            </CardHeader>
            <CardContent>
               <p className="text-muted-foreground">SCARDS data grid and auditor tools pending full rollout.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
