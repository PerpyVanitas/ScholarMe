import { getUsers, assignFinanceManager } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminRolesPage() {
  let users = [];
  try {
    users = await getUsers();
  } catch (e) {
    return <div className="p-8">Error loading users. Are you an admin?</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Role Management</h1>
      <p className="text-muted-foreground">Assign specific administrative or managerial roles to users.</p>

      <Card>
        <CardHeader>
          <CardTitle>User Roles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((u: any) => {
              const currentRole = u.roles?.name || "learner";
              const isFinance = currentRole === "finance_manager";

              return (
                <div key={u.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">{u.full_name}</h3>
                    <p className="text-sm text-muted-foreground">{u.email}</p>
                    <p className="text-xs mt-1 bg-secondary inline-block px-2 py-1 rounded">Role: {currentRole}</p>
                  </div>
                  <div>
                    <form action={async () => {
                      "use server";
                      await assignFinanceManager(u.id, !isFinance);
                    }}>
                      <Button variant={isFinance ? "destructive" : "default"}>
                        {isFinance ? "Revoke Finance Manager" : "Make Finance Manager"}
                      </Button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
