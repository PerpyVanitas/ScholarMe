"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Circle, Plus, Trash2, ListTodo } from "lucide-react";
import { toast } from "sonner";

interface TaskItem {
  id: string;
  title: string;
  assignee: string;
  completed: boolean;
}

interface CommitteeTaskBoardProps {
  committeeName?: string;
}

export function CommitteeTaskBoard({ committeeName = "Committee Workspace" }: CommitteeTaskBoardProps) {
  const [tasks, setTasks] = useState<TaskItem[]>([
    { id: "1", title: "Prepare meeting agenda for General Assembly", assignee: "Committee Head", completed: true },
    { id: "2", title: "Review member service hour submissions", assignee: "Assistant Head", completed: false },
    { id: "3", title: "Draft monthly committee activity report", assignee: "Committee Lead", completed: false },
  ]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [assignee, setAssignee] = useState("Unassigned");

  function handleAddTask() {
    if (!newTaskTitle.trim()) return;
    const newTask: TaskItem = {
      id: Math.random().toString(36).slice(2, 9),
      title: newTaskTitle.trim(),
      assignee: assignee || "Unassigned",
      completed: false,
    };
    setTasks((prev) => [...prev, newTask]);
    setNewTaskTitle("");
    toast.success("Committee task assigned");
  }

  function toggleTask(id: string) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  }

  function deleteTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    toast.info("Task removed");
  }

  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <ListTodo className="h-5 w-5 text-amber-500" />
          {committeeName} Task Delegation
        </CardTitle>
        <Badge variant="secondary" className="text-xs">
          {completedCount} / {tasks.length} Completed
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Add new committee duty or task..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            className="text-xs flex-1"
          />
          <Input
            placeholder="Assignee"
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            className="text-xs w-32"
          />
          <Button size="sm" onClick={handleAddTask} className="text-xs">
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>

        <div className="space-y-2">
          {tasks.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground py-4">
              No active tasks for this committee.
            </p>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-2.5 rounded-lg border border-border/50 bg-card hover:bg-accent/40 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => toggleTask(task.id)}
                    className="text-muted-foreground hover:text-emerald-500 transition-colors"
                  >
                    {task.completed ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Circle className="h-4 w-4" />
                    )}
                  </button>
                  <span
                    className={`text-xs font-medium truncate ${
                      task.completed ? "line-through text-muted-foreground" : "text-foreground"
                    }`}
                  >
                    {task.title}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] bg-muted/50">
                    {task.assignee}
                  </Badge>
                  <button
                    type="button"
                    onClick={() => deleteTask(task.id)}
                    className="text-muted-foreground hover:text-destructive p-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
