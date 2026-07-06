"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Calendar,
  Users,
  AlertTriangle,
  Download,
  ArrowRight,
  Activity,
} from "lucide-react";
import Link from "next/link";
import { useUser } from "@/lib/user-context";

export default function AdminReportsPage() {
  const { role } = useUser();

  const reports = [
    {
      title: "Semester Summary",
      description:
        "Total sessions, hours logged, unique learners served, top tutors.",
      icon: Calendar,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      href: "/dashboard/admin/analytics", // The charts are here
    },
    {
      title: "Tutor Compliance",
      description:
        "List of all tutors showing hours vs. required minimum, compliance %, and flags.",
      icon: Users,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      href: "/dashboard/admin/timesheets", // Detailed in timesheets page
    },
    {
      title: "Learner Engagement",
      description:
        "Identify disengaged users by booking frequency (0, 1-3, 4+ sessions).",
      icon: Activity,
      color: "text-green-500",
      bg: "bg-green-500/10",
      href: "/dashboard/admin/users", // Export available in users page
    },
    {
      title: "Finance & Liquidations",
      description:
        "Running balances, approved budgets vs actuals, and late liquidation flags.",
      icon: AlertTriangle,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      href: "/dashboard/finance", // Handled in Finance module
    },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Reports Hub
        </h1>
        <p className="text-muted-foreground">
          Access pre-configured reports, exports, and analytics.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <Card
              key={report.title}
              className="border-border/60 hover:bg-muted/30 transition-colors"
            >
              <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                <div className={`p-3 rounded-xl ${report.bg}`}>
                  <Icon className={`h-6 w-6 ${report.color}`} />
                </div>
                <div className="flex flex-col gap-1">
                  <CardTitle className="text-lg">{report.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="pt-2 pb-4 text-sm leading-relaxed">
                  {report.description}
                </CardDescription>
                <Button
                  asChild
                  variant="outline"
                  className="w-full justify-between group"
                >
                  <Link href={report.href}>
                    View Report Module
                    <ArrowRight className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
