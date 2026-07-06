import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/server";
import { createTeamTask, addSchedule, updateTaskStatus } from "@/app/actions/team";
import { redirect } from "next/navigation";

export default async function TeamDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: tasks } = await supabase.from("team_tasks").select("*, profiles(full_name)").order("created_at", { ascending: false });
  const { data: schedules } = await supabase.from("team_schedules").select("*, profiles(full_name)").order("date", { ascending: true });

  const columns = ["todo", "in_progress", "review", "done"];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Teamwork Tracker</h1>

      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="tasks">Tasks Matrix</TabsTrigger>
          <TabsTrigger value="schedule">Schedules</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create New Task</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={createTeamTask} className="flex gap-4 max-w-2xl">
                <Input name="deliverable" placeholder="Deliverable Name" required />
                <Input type="date" name="deadline" />
                <Button type="submit">Add Task</Button>
              </form>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {columns.map(col => (
              <div key={col} className="bg-secondary/20 p-4 rounded-lg min-h-[300px]">
                <h3 className="font-bold text-lg mb-4 capitalize">{col.replace("_", " ")}</h3>
                <div className="space-y-3">
                  {tasks?.filter((t: any) => t.status === col).map((t: any) => (
                    <Card key={t.id} className="p-3 shadow-sm border">
                      <p className="font-medium text-sm">{t.deliverable}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Due: {t.deadline ? new Date(t.deadline).toLocaleDateString() : "No deadline"}
                      </p>
                      <div className="flex gap-1 mt-3">
                        {col !== "done" && (
                          <form action={async () => { "use server"; await updateTaskStatus(t.id, "done"); }}>
                             <Button size="icon" variant="outline" className="h-6 w-6" title="Move to Done">✓</Button>
                          </form>
                        )}
                        {col === "todo" && (
                           <form action={async () => { "use server"; await updateTaskStatus(t.id, "in_progress"); }}>
                             <Button size="icon" variant="outline" className="h-6 w-6" title="Start">▶</Button>
                           </form>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6">
           <Card>
            <CardHeader>
              <CardTitle>Log Schedule Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={addSchedule} className="flex gap-4 max-w-2xl">
                <Input type="date" name="date" required />
                <Input name="activity" placeholder="Activity / Availability" required />
                <Button type="submit">Log</Button>
              </form>
            </CardContent>
          </Card>

          <h2 className="text-xl font-bold mt-8">Upcoming Schedules</h2>
          <div className="space-y-2">
            {schedules?.map((s: any) => (
              <div key={s.id} className="p-3 border rounded flex justify-between items-center bg-card">
                <div>
                  <p className="font-semibold">{s.profiles?.full_name}</p>
                  <p className="text-sm text-muted-foreground">{s.activity}</p>
                </div>
                <div className="text-sm font-medium">
                  {new Date(s.date).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
