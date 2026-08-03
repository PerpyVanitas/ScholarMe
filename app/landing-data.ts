import {
  Star,
  BookOpen,
  Clock,
  Users,
  Award,
  Zap,
  Shield,
  BarChart3,
  GraduationCap,
  Target,
  TrendingUp,
  Heart,
  Crown,
  Sparkles,
} from "lucide-react";

export const HONSOC_PHOTOS = [
  {
    url: "/images/honsoc/honsoc-group-formal.jpg",
    alt: "CIT-U Honor Society Leaders in Barong and Filipiniana",
    title: "Honor Society Leadership",
    category: "Leadership & Excellence",
    tag: "Formal Recognition",
    description: "Driven by Excellence in Academics, Leadership, and Social Responsibility.",
  },
  {
    url: "/images/honsoc/honsoc-group-hearts.jpg",
    alt: "HonSoc Members celebrating with heart gestures",
    title: "Collaborative Community",
    category: "Social Responsibility",
    tag: "Member Culture",
    description: "Outspoken, responsible individuals dedicated to making an impact.",
  },
  {
    url: "/images/honsoc/friyay-game-recap.jpg",
    alt: "Friyay Nights Game Night Community Gathering",
    title: "Friyay Nights Game Night",
    category: "Peer Learning Center",
    tag: "Community Events",
    description: "Unwinding and bonding together at the Peer Learning Center Hub.",
  },
  {
    url: "/images/honsoc/friyay-card-game.jpg",
    alt: "HonSoc Tutors playing card games during social night",
    title: "Tutor Team Bonding",
    category: "Campus Life",
    tag: "Peer Learning",
    description: "Building strong camaraderie inside and outside the classroom.",
  },
  {
    url: "/images/honsoc/friyay-board-game.jpg",
    alt: "Board game session at the Peer Learning Center",
    title: "Interactive Strategy Night",
    category: "Peer Learning Hub",
    tag: "Social Growth",
    description: "Fostering strategic thinking, leadership, and meaningful connections.",
  },
];

export const THREE_PILLARS = [
  {
    id: "academics",
    title: "Excellence in Academics",
    icon: GraduationCap,
    badge: "Academics",
    tagline: "Institutional Tutoring Facility",
    description:
      "HonSoc equips students to meet university standards by managing the campus institutional tutoring facility in the Peer Learning Center.",
    highlights: [
      "Peer Learning Center tutoring hub",
      "Over 400+ verified tutors trained",
      "Subject-tailored academic support",
      "High academic standard alignment",
    ],
    color: "from-amber-500/20 via-yellow-500/10 to-transparent",
    border: "border-amber-500/40 hover:border-amber-500",
    badgeColor: "bg-amber-500/10 text-amber-500 border-amber-500/30",
    glow: "shadow-amber-500/10",
  },
  {
    id: "leadership",
    title: "Excellence in Leadership",
    icon: Crown,
    badge: "Leadership",
    tagline: "Bridge to Administration",
    description:
      "Serving as a vital communication medium between the student body and the administration while cultivating talent beyond the classroom.",
    highlights: [
      "Student body & admin liaison",
      "Executive governance & committees",
      "Leadership talent development",
      "Outspoken, purpose-driven leaders",
    ],
    color: "from-purple-500/20 via-indigo-500/10 to-transparent",
    border: "border-purple-500/40 hover:border-purple-500",
    badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    glow: "shadow-purple-500/10",
  },
  {
    id: "social_responsibility",
    title: "Social Responsibility",
    icon: Heart,
    badge: "Outreach & Extension",
    tagline: "Community Impact",
    description:
      "Empowering members to lead and engage in campus events, community extensions, and impactful outreach programs.",
    highlights: [
      "Campus event leadership",
      "Community extension projects",
      "Outreach & volunteer initiatives",
      "Positive societal contribution",
    ],
    color: "from-emerald-500/20 via-teal-500/10 to-transparent",
    border: "border-emerald-500/40 hover:border-emerald-500",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    glow: "shadow-emerald-500/10",
  },
];

export const STATS = [
  { value: "400+", label: "Tutors (Past 4 Years)", icon: GraduationCap, detail: "Empowered over 4 years of academic excellence" },
  { value: "4", label: "Years of Sustained Impact", icon: Award, detail: "Consistent campus leadership & service" },
  { value: "1,200+", label: "Mentoring Hours", icon: Clock, detail: "Logged through the Peer Learning Center" },
  { value: "98%", label: "Student Satisfaction", icon: Star, detail: "Rated by CIT-U Technologians" },
];

export const FEATURES = [
  {
    icon: BookOpen,
    title: "Peer Learning Center",
    desc: "Managed directly by HonSoc to equip students with top-notch peer tutoring tailored to CIT-U subjects.",
    color: "from-amber-500/20 to-yellow-500/10",
    border: "border-amber-500/30",
  },
  {
    icon: Zap,
    title: "QR Session Verification",
    desc: "Digital QR ID scanning confirms attendance. Every tutoring session is logged and verified automatically.",
    color: "from-blue-500/20 to-indigo-500/10",
    border: "border-blue-500/30",
  },
  {
    icon: Shield,
    title: "Verified Honor Scholars",
    desc: "Every tutor is a vetted member of the CIT-U Honor Society — proven academic track record.",
    color: "from-green-500/20 to-emerald-500/10",
    border: "border-green-500/30",
  },
  {
    icon: Crown,
    title: "Student-Admin Bridge",
    desc: "A vital communication medium advocating for Technologians and cultivating talent beyond the classroom.",
    color: "from-purple-500/20 to-violet-500/10",
    border: "border-purple-500/30",
  },
  {
    icon: Heart,
    title: "Community Outreach",
    desc: "Empowering members through impactful community extension programs and active campus event leadership.",
    color: "from-orange-500/20 to-red-500/10",
    border: "border-orange-500/30",
  },
  {
    icon: Sparkles,
    title: "Friyay Game Nights",
    desc: "Building a vibrant community with interactive social events and collaborative student bonding.",
    color: "from-teal-500/20 to-cyan-500/10",
    border: "border-teal-500/30",
  },
];

export const TESTIMONIALS = [
  {
    name: "Maria Santos",
    program: "BS Computer Engineering",
    text: "ScholarMe helped me pass Calculus 2. My tutor from HonSoc explained concepts in ways my professors never did.",
    rating: 5,
    avatar: "M",
  },
  {
    name: "Jericho Lim",
    program: "BS Information Technology",
    text: "The session tracking and QR system is so smooth. I can see my learning progress clearly every week.",
    rating: 5,
    avatar: "J",
  },
  {
    name: "Alyssa Cruz",
    program: "BS Electronics Engineering",
    text: "Being a HonSoc tutor for 2 years has been incredibly rewarding. Managing sessions through the PLC is seamless.",
    rating: 5,
    avatar: "A",
  },
];

export const STEPS = [
  {
    num: "01",
    icon: Users,
    title: "Create Your Account",
    desc: "Sign up as a Technologian, set your course priorities, and choose your learning targets in under 2 minutes.",
  },
  {
    num: "02",
    icon: GraduationCap,
    title: "Match With a HonSoc Tutor",
    desc: "Browse verified Honor Society peer mentors filtered by subject, schedule, and specialization.",
  },
  {
    num: "03",
    icon: TrendingUp,
    title: "Excel & Level Up",
    desc: "Attend sessions at the Peer Learning Center, verify via QR scan, earn XP, and unlock academic excellence.",
  },
];
