export interface RouteHelpInfo {
  title: string;
  purpose: string;
  actions: { name: string; description: string }[];
}

export const ROUTE_HELP_MAP: Record<string, RouteHelpInfo> = {
  "/dashboard/home": {
    title: "Dashboard Home",
    purpose: "Your central hub for daily study progress, upcoming sessions, XP level, and active streak.",
    actions: [
      { name: "Mode Toggle", description: "Switch between Learner mode and Tutor mode in the sidebar." },
      { name: "Weekly Digest", description: "Read your current week's narrative summary of sessions and XP." },
      { name: "Quick Actions", description: "Book a tutoring session or launch a practice study set." },
    ],
  },
  "/dashboard/journey": {
    title: "My Journey",
    purpose: "Manage your shareable Portfolio, Industry Readiness Summary PDF, and real Learning Analytics.",
    actions: [
      { name: "Portfolio Tab", description: "Toggle public link sharing and manage your verified achievements." },
      { name: "Readiness Tab", description: "View your factual activity record and export a verified PDF summary." },
      { name: "Analytics Tab", description: "Review subject-level quiz accuracy trends and weak topic recommendations." },
    ],
  },
  "/dashboard/wiki": {
    title: "Institutional Knowledge Wiki",
    purpose: "Search official CIT-U Honor Society SOPs, governance guidelines, tutor manuals, and FAQs.",
    actions: [
      { name: "Role-Gated Search", description: "Query official documents with automatic role access control." },
      { name: "Source Citations", description: "Click source citations to verify policy text." },
    ],
  },
  "/dashboard/study-sets": {
    title: "Study Sets Library",
    purpose: "Create, practice, and study flashcard decks and quizzes with SM2 Spaced Repetition.",
    actions: [
      { name: "Create Study Set", description: "Build study sets manually or generate them from PDF resources." },
      { name: "Spaced Repetition", description: "Grade your recall confidence (Again/Hard/Good/Easy) to train memory." },
    ],
  },
  "/dashboard/sessions": {
    title: "Tutoring Sessions",
    purpose: "Book, manage, reschedule, and attend 1-on-1 or group tutoring sessions.",
    actions: [
      { name: "Book Session", description: "Select an active tutor, pick a timeslot, and add prep notes." },
      { name: "Substitution / Transfer", description: "Tutors can request substitute tutors for upcoming sessions." },
    ],
  },
  "/dashboard/network/mentorship": {
    title: "Mentorship Matching",
    purpose: "Pair with senior members or guide junior members on navigating honor society committees and academics.",
    actions: [
      { name: "Mentorship Toggle", description: "Opt into or out of the tenure-based mentorship matching pool." },
      { name: "Start Conversation", description: "Message your matched mentor or mentee via direct messages." },
    ],
  },
  "/dashboard/admin/org-structure": {
    title: "Org Structure & Leadership",
    purpose: "Manage executive board assignments, committee leadership, and academic terms.",
    actions: [
      { name: "Handoff Notes", description: "Log and view institutional continuity notes for officer positions." },
      { name: "New Term", description: "Provision new academic terms and assign committee heads." },
    ],
  },
};

export function getHelpForRoute(pathname: string): RouteHelpInfo {
  if (ROUTE_HELP_MAP[pathname]) {
    return ROUTE_HELP_MAP[pathname];
  }

  // Fallback for dynamic routes (sort longest prefix first)
  const sortedKeys = Object.keys(ROUTE_HELP_MAP).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (pathname.startsWith(key)) {
      return ROUTE_HELP_MAP[key];
    }
  }

  return {
    title: "ScholarMe Page Help",
    purpose: "Welcome to ScholarMe! Use the navigation menu to access study tools, tutoring sessions, and community hubs.",
    actions: [
      { name: "Global Command Palette", description: "Press Cmd+K / Ctrl+K anytime to quickly navigate anywhere." },
      { name: "Help Button", description: "Click this help icon anytime for screen guidance." },
    ],
  };
}
