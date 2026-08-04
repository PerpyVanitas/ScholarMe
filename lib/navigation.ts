import type { Profile, UserRole } from "@/lib/types";
import {
  AUDIT_ROLES,
  FINANCE_REVIEW_ROLES,
  FINANCE_VIEW_ROLES,
  TEAMWORK_ROLES,
  TUTOR_ROLES,
  EXECUTIVE_ROLES,
  COMMITTEE_LEADERSHIP,
  ADMIN_ROLES,
  hasAnyRole,
} from "@/lib/utils/roles";
import {
  Users,
  Calendar,
  CalendarDays,
  BookOpen,
  Bell,
  Settings,
  User,
  LayoutDashboard,
  Trophy,
  ShieldAlert,
  FileText,
  Bug,
  BarChart,
  QrCode,
  Bot,
  Globe,
  Network,
  Layers,
  MessageSquare,
  Mail,
  Vote,
  Clock,
  ShieldCheck,
  Receipt,
  FileSpreadsheet,
  Activity,
  Map,
  type LucideIcon
} from "lucide-react";

export interface SidebarNavItem {
  title: string;
  href?: string;
  icon: LucideIcon;
  id?: string;
  subItems?: { title: string; href: string; icon?: LucideIcon; id?: string }[];
}

export interface SidebarNavGroup {
  label: string;
  items: SidebarNavItem[];
}

export function getNavItems(role: UserRole, profile: Profile) {
  const homeItems = [
    { title: "Dashboard", href: "/dashboard/home", icon: LayoutDashboard },
    { title: "Profile", href: "/dashboard/profile", icon: User },
    { title: "Notifications", href: "/dashboard/notifications", icon: Bell },
  ];

  const learnItems = [
    { title: "Study Sets", href: "/dashboard/study-sets", icon: Layers },
    { title: "AI Tutor", href: "/dashboard/ai-tutor", icon: Bot },
    { title: "Library & Resources", href: "/dashboard/resources", icon: BookOpen },
    { title: "Institutional Wiki", href: "/dashboard/wiki", icon: FileText, id: "tour-nav-wiki" },
  ];

  const scheduleItems = [
    { title: "Tutoring Sessions", href: "/dashboard/sessions", icon: Calendar },
    { title: "Events Calendar", href: "/dashboard/calendar", icon: CalendarDays },
  ];

  const growItems = [
    { title: "My Journey", href: "/dashboard/journey", icon: Globe },
    { title: "Leaderboard", href: "/dashboard/leaderboard", icon: Trophy },
    { title: "Public Roadmap", href: "/dashboard/roadmap", icon: Map },
  ];

  const connectItems = [
    { title: "People & Network", href: "/dashboard/network", icon: Network },
    { title: "Mentorship Matching", href: "/dashboard/network/mentorship", icon: Users, id: "tour-nav-mentorship" },
    { title: "Community Hub", href: "/dashboard/forums", icon: MessageSquare },
    { title: "My Messages", href: "/dashboard/messages", icon: Mail },
  ];

  if (role !== "learner") {
    connectItems.push({ title: "Voting", href: "/dashboard/voting", icon: Vote });
  }

  const usersItems = [];
  const academicItems = [];
  const financeItems = [];
  const systemItems = [];

  if (hasAnyRole(role, EXECUTIVE_ROLES) || hasAnyRole(role, ADMIN_ROLES)) {
    usersItems.push({ title: "User Management", href: "/dashboard/admin/users", icon: Users });
  }
  if (role === "super_admin") {
    usersItems.push(
      { title: "Org Structure", href: "/dashboard/admin/org-structure", icon: Network },
      { title: "Message Audit", href: "/dashboard/admin/messages", icon: MessageSquare }
    );
  }

  if (hasAnyRole(role, TUTOR_ROLES)) {
    academicItems.push(
      { title: "My Timesheet", href: "/dashboard/timesheet", icon: Clock },
      { title: "Availability", href: "/dashboard/availability", icon: Clock },
      { title: "Peer Reviews", href: "/dashboard/tutors/reviews", icon: ShieldCheck }
    );
  }
  if (hasAnyRole(role, EXECUTIVE_ROLES) || hasAnyRole(role, ADMIN_ROLES)) {
    academicItems.push(
      { title: "Mastery Verifications", href: "/dashboard/admin/verifications", icon: ShieldCheck },
      { title: "Tutor Analytics", href: "/dashboard/admin/tutor-stats", icon: BarChart }
    );
  }

  if (hasAnyRole(role, FINANCE_VIEW_ROLES)) {
    financeItems.push(
      { title: "Finance Dashboard", href: "/dashboard/finance", icon: FileText },
      { title: "Cash Register", href: "/dashboard/finance/register", icon: Receipt }
    );
    if (hasAnyRole(role, AUDIT_ROLES) || hasAnyRole(role, FINANCE_REVIEW_ROLES)) {
      financeItems.push({ title: "Reports Hub", href: "/dashboard/admin/reports", icon: FileText });
    }
  }
  if (hasAnyRole(role, EXECUTIVE_ROLES) || hasAnyRole(role, ADMIN_ROLES)) {
    financeItems.push({ title: "Payroll & Timesheets", href: "/dashboard/admin/timesheets", icon: Clock });
  }
  if (hasAnyRole(role, COMMITTEE_LEADERSHIP) || hasAnyRole(role, EXECUTIVE_ROLES) || hasAnyRole(role, ADMIN_ROLES)) {
    financeItems.push(
      { title: "QR Scanner", href: "/dashboard/admin/scanner", icon: QrCode },
      { title: "Data Export", href: "/dashboard/admin/export", icon: FileSpreadsheet }
    );
  }

  if (hasAnyRole(role, EXECUTIVE_ROLES) || hasAnyRole(role, ADMIN_ROLES)) {
    systemItems.push({ title: "Admin Dashboard", href: "/dashboard/admin", icon: LayoutDashboard });
  }
  if (hasAnyRole(role, TEAMWORK_ROLES)) {
    systemItems.push({ title: "Team Workspace", href: "/dashboard/team", icon: Users });
  }
  if (hasAnyRole(role, ADMIN_ROLES)) {
    systemItems.push(
      { title: "System Logs", href: "/dashboard/admin/logs", icon: ShieldAlert },
      { title: "Integrations", href: "/dashboard/admin/integrations", icon: Settings },
      { title: "System Health", href: "/dashboard/admin/health", icon: Activity }
    );
    if (role === "super_admin") {
      systemItems.push({ title: "User Feedback", href: "/dashboard/admin/feedback", icon: Bug });
    }
  }

  const managementGroups: SidebarNavGroup[] = [];
  const adminCategories = [];
  if (usersItems.length > 0) adminCategories.push({ title: "Users & Access", icon: Users, subItems: usersItems });
  if (academicItems.length > 0) adminCategories.push({ title: "Academic & Tutoring", icon: BookOpen, subItems: academicItems });
  if (financeItems.length > 0) adminCategories.push({ title: "Operations & Reporting", icon: Receipt, subItems: financeItems });
  if (systemItems.length > 0) adminCategories.push({ title: "System Settings", icon: Settings, subItems: systemItems });

  if (adminCategories.length > 0) {
    managementGroups.push({ label: "Workspace Management", items: adminCategories });
  }

  const learnerGroups: SidebarNavGroup[] = [
    { label: "Home", items: homeItems },
    { label: "Learn", items: learnItems },
    { label: "Schedule", items: scheduleItems },
    { label: "Grow", items: growItems },
    { label: "Connect", items: connectItems },
  ];

  return { learnerGroups, managementGroups, hasManagement: managementGroups.length > 0, hasTutorTools: hasAnyRole(role, TUTOR_ROLES) };
}

