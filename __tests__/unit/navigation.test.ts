import { describe, it, expect } from "vitest";
import { getNavItems } from "@/lib/navigation";
import {
  User,
  Settings,
  CalendarDays,
  Mail,
  Clock,
  QrCode,
  Calendar,
  MessageSquare,
  Globe,
  Trophy,
} from "lucide-react";
import type { Profile } from "@/lib/types";

const mockProfile: Profile = {
  id: "test-user-id",
  email: "test@example.com",
  full_name: "Test User",
  role_id: "learner-role-id",
  membership_number: "HS-2026-001",
  degree_program: "BS Computer Science",
  year_level: 3,
  avatar_url: null,
  bio: null,
  created_at: new Date().toISOString(),
};

describe("Navigation & Information Architecture Audit", () => {
  it("uses User icon for Profile and Settings icon for Settings route", () => {
    const { learnerGroups } = getNavItems("learner", mockProfile);
    const homeGroup = learnerGroups.find((g) => g.label === "Home");
    expect(homeGroup).toBeDefined();

    const profileItem = homeGroup?.items.find((i) => i.title === "Profile");
    expect(profileItem).toBeDefined();
    expect(profileItem?.icon).toBe(User);
    expect(profileItem?.href).toBe("/dashboard/profile");

    const settingsItem = homeGroup?.items.find((i) => i.title === "Settings");
    expect(settingsItem).toBeUndefined();
  });

  it("uses distinct icons for Events Calendar (CalendarDays) and Tutoring Sessions (Calendar)", () => {
    const { learnerGroups } = getNavItems("learner", mockProfile);
    const scheduleGroup = learnerGroups.find((g) => g.label === "Schedule");
    expect(scheduleGroup).toBeDefined();

    const sessions = scheduleGroup?.items.find((i) => i.title === "Tutoring Sessions");
    const calendar = scheduleGroup?.items.find((i) => i.title === "Events Calendar");

    expect(sessions?.icon).toBe(Calendar);
    expect(calendar?.icon).toBe(CalendarDays);
    expect(sessions?.icon).not.toBe(calendar?.icon);
  });

  it("uses distinct icons for My Messages (Mail) and Community Hub (MessageSquare)", () => {
    const { learnerGroups } = getNavItems("learner", mockProfile);
    const connectGroup = learnerGroups.find((g) => g.label === "Connect");
    expect(connectGroup).toBeDefined();

    const forums = connectGroup?.items.find((i) => i.title === "Community Hub");
    const messages = connectGroup?.items.find((i) => i.title === "My Messages");

    expect(forums?.icon).toBe(MessageSquare);
    expect(messages?.icon).toBe(Mail);
    expect(forums?.icon).not.toBe(messages?.icon);
  });

  it("merges My Journey into Grow section and eliminates single-item Journey section", () => {
    const { learnerGroups } = getNavItems("learner", mockProfile);
    const journeyGroup = learnerGroups.find((g) => g.label === "My Journey");
    expect(journeyGroup).toBeUndefined();

    const growGroup = learnerGroups.find((g) => g.label === "Grow");
    expect(growGroup).toBeDefined();

    const journeyItem = growGroup?.items.find((i) => i.title === "My Journey");
    const leaderboardItem = growGroup?.items.find((i) => i.title === "Leaderboard");

    expect(journeyItem?.href).toBe("/dashboard/journey");
    expect(journeyItem?.icon).toBe(Globe);
    expect(leaderboardItem?.href).toBe("/dashboard/leaderboard");
    expect(leaderboardItem?.icon).toBe(Trophy);
  });

  it("matches icon family for My Timesheet and Payroll & Timesheets (Clock)", () => {
    const tutorNav = getNavItems("tutor", mockProfile);
    const adminNav = getNavItems("super_admin", mockProfile);

    const tutorAcademicGroup = tutorNav.managementGroups[0]?.items.find((i) => i.title === "Academic & Tutoring");
    const myTimesheet = tutorAcademicGroup?.subItems?.find((i) => i.title === "My Timesheet");

    const adminOpsGroup = adminNav.managementGroups[0]?.items.find((i) => i.title === "Operations & Reporting");
    const payrollTimesheets = adminOpsGroup?.subItems?.find((i) => i.title === "Payroll & Timesheets");

    expect(myTimesheet?.icon).toBe(Clock);
    expect(payrollTimesheets?.icon).toBe(Clock);
  });

  it("groups QR Scanner and Reports Hub under Operations & Reporting with QrCode icon for QR Scanner", () => {
    const { managementGroups } = getNavItems("super_admin", mockProfile);
    const opsGroup = managementGroups[0]?.items.find((i) => i.title === "Operations & Reporting");
    expect(opsGroup).toBeDefined();

    const qrScanner = opsGroup?.subItems?.find((i) => i.title === "QR Scanner");
    const reportsHub = opsGroup?.subItems?.find((i) => i.title === "Reports Hub");

    expect(qrScanner).toBeDefined();
    expect(qrScanner?.icon).toBe(QrCode);
    expect(reportsHub).toBeDefined();
  });
});
