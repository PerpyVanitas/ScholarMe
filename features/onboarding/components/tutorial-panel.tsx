"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { HelpCircle, X, BookOpen, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

/** Per-route tutorial content. Add new entries as pages are built. */
const TUTORIAL_CONTENT: Record<
  string,
  { title: string; description: string; tips: string[] }
> = {
  "/dashboard/home": {
    title: "Dashboard Home",
    description:
      "Your personal hub. See upcoming sessions, your XP progress, and recent activity at a glance.",
    tips: [
      "Click on an upcoming session to view its details or cancel it.",
      "Your XP bar fills as you complete sessions and earn achievements.",
      "The quick-action buttons let you jump to common tasks immediately.",
    ],
  },
  "/dashboard/profile": {
    title: "Profile Settings",
    description:
      "Manage your personal information, avatar, tutor settings, and account security.",
    tips: [
      "Click your avatar to upload a new profile photo.",
      "Tutors: fill in your bio and specializations so learners can find you.",
      "ESAS Scholars: your 90-hour progress tracker is visible on this page.",
      "You can change your password under the Security section.",
    ],
  },
  "/dashboard/sessions": {
    title: "Sessions",
    description:
      "View all your upcoming and past tutoring sessions. Cancel, reschedule, or submit a peer review from here.",
    tips: [
      "Click a session card to see full details.",
      "Completed sessions are archived below your upcoming list.",
      "You must submit a peer review within 7 days of a completed session.",
    ],
  },
  "/dashboard/tutors": {
    title: "Find a Tutor",
    description:
      "Browse all available tutors and book a 1-on-1 or group session.",
    tips: [
      "Use the subject filter to find tutors who specialize in what you need.",
      "Check a tutor's availability before booking.",
      "Honor Society members may also book sessions from fellow members here.",
    ],
  },
  "/dashboard/quizzes": {
    title: "Quizzes & Flashcards",
    description:
      "Create study sets, generate AI flashcards, and test yourself with multiple study modes.",
    tips: [
      "Use 'AI Generate' to automatically create flashcards from any topic.",
      "Upload a PDF resource to extract flashcards from its content.",
      "Study Mode includes Flashcard, Multiple Choice, True/False, and Typing modes.",
      "Your SM-2 spaced repetition progress is saved automatically.",
    ],
  },
  "/dashboard/ai-tutor": {
    title: "AI Tutor",
    description:
      "Chat with an AI tutor powered by a local AI model. Your data stays entirely on your device.",
    tips: [
      "Download the model once — it is cached locally for offline use.",
      "Ask the AI to explain concepts, check your work, or generate practice questions.",
      "The AI does not have access to your personal session data.",
    ],
  },
  "/dashboard/resources": {
    title: "Digital Resources",
    description:
      "Browse, upload, preview, and download study materials shared by the community.",
    tips: [
      "Click the preview icon on any file to view it inline without downloading.",
      "Use the subject filter to narrow down resources by topic.",
      "Tutors and above can upload resources for all users to access.",
    ],
  },
  "/dashboard/resources/library": {
    title: "Physical Library",
    description:
      "Browse the PLC's physical book catalog. Admins can check out books to learners.",
    tips: [
      "Search by title, author, or ISBN.",
      "Admins: use the QR/ISBN scanner to quickly add or find books.",
      "Checkout status shows how many copies are currently available.",
    ],
  },
  "/dashboard/timesheet": {
    title: "My Timesheet",
    description:
      "Clock in and out of the Peer Learning Center to record your service hours.",
    tips: [
      "ESAS Scholars: you must clock in to accumulate your 90-hour requirement.",
      "Your current period's hours are shown at the top of the page.",
      "Hours outside the PLC require prior approval before they can be credited.",
    ],
  },
  "/dashboard/availability": {
    title: "Availability",
    description:
      "Set the days and times you are available to accept tutoring sessions.",
    tips: [
      "Learners can only book you during your listed availability windows.",
      "You can pause bookings entirely from your Profile Settings.",
      "Changes to availability take effect immediately.",
    ],
  },
  "/dashboard/tutors/reviews": {
    title: "Peer Reviews",
    description:
      "Lead tutors and admins can submit performance evaluations for junior tutors.",
    tips: [
      "Rate tutors on punctuality, knowledge, and communication.",
      "Reviews are visible to the tutor being reviewed and to administrators.",
      "Regular tutors can view the reviews written about them on this page.",
    ],
  },
  "/dashboard/finance": {
    title: "Finance Dashboard",
    description:
      "Submit budget requests, petty cash, and liquidations. View the organization's financial summary.",
    tips: [
      "Budget requests above a threshold require Presidential approval.",
      "Attach receipts to your liquidation to complete the reimbursement cycle.",
      "Use AI OCR to auto-extract receipt details.",
    ],
  },
  "/dashboard/forums": {
    title: "Community Hub (Forums)",
    description:
      "Post questions, share knowledge, and engage with the community.",
    tips: [
      "Browse by category to find relevant discussions.",
      "Upvote helpful posts to surface them for others.",
      "Tutors can pin important announcements to the top of a forum.",
    ],
  },
  "/dashboard/groups": {
    title: "Study Groups",
    description:
      "Join or create study groups and chat with peers in real-time.",
    tips: [
      "Public groups are open to all users.",
      "Group chats are live — messages appear instantly.",
      "Create a group for a specific subject and invite your classmates.",
    ],
  },
  "/dashboard/admin": {
    title: "Admin Dashboard",
    description:
      "Overview of system health, recent activity, and key metrics for administrators.",
    tips: [
      "Use the System Health page to monitor database and storage limits.",
      "Audit Logs record every significant action in the system.",
      "User Management allows you to edit roles, suspend accounts, and impersonate users.",
    ],
  },
  "/dashboard/admin/timesheets": {
    title: "Payroll & Timesheets",
    description:
      "Set and manage payroll periods, review tutor attendance logs, and export payroll data.",
    tips: [
      "Create a new period before tutors can start clocking in.",
      "Close a period to lock its records before exporting.",
      "Manually award hours to tutors for approved off-site activities.",
    ],
  },
};

/** Fallback for routes without specific content */
const DEFAULT_CONTENT = {
  title: "Page Help",
  description: "Welcome to this page. Explore the features available to you.",
  tips: [
    "Use the sidebar to navigate between sections.",
    "Pin your most-visited pages using the Pin icon next to each menu item.",
    "Contact support if you encounter any issues.",
  ],
};

export function TutorialPanel() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const content = TUTORIAL_CONTENT[pathname] ?? DEFAULT_CONTENT;

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-muted-foreground hover:text-foreground"
        onClick={() => setOpen(true)}
        title="Page Help"
        aria-label="Open page tutorial"
      >
        <HelpCircle className="h-4 w-4" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-80 sm:w-96">
          <SheetHeader className="mb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <BookOpen className="h-4 w-4 text-primary" />
              </div>
              <SheetTitle className="text-left">{content.title}</SheetTitle>
            </div>
          </SheetHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {content.description}
            </p>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Tips
              </p>
              <ul className="space-y-2">
                {content.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <ChevronRight className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span className="text-muted-foreground">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full mt-4"
              onClick={() => setOpen(false)}
            >
              Got it!
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
