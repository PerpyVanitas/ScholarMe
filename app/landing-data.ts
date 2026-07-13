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
} from "lucide-react";

export const GALLERY_IMAGES = [
  {
    url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/475194059_1086604756594795_793853421411451570_n-AZme6bacaABEhTFvYDoIjoOEOPxzOf.jpg",
    alt: "Collaborative Learning Session",
    title: "Learning Together",
    tag: "Peer Tutoring",
  },
  {
    url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/624842741_1371641018091166_602435888905857230_n-zmxJHx1nC7bk50pE1cVCtAcRUpzAeC.jpg",
    alt: "Honor Society Achievement",
    title: "Excellence",
    tag: "Awards",
  },
  {
    url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/474966194_1086604766594794_2924190371366556402_n-mYd1rzEIF11ueti67NUpRV750BHtFE.jpg",
    alt: "Certificate Awards",
    title: "Recognition",
    tag: "Ceremonies",
  },
];

export const STATS = [
  { value: "60+", label: "Elite Peer Tutors", icon: GraduationCap },
  { value: "1,200+", label: "Mentoring Hours", icon: Clock },
  { value: "500+", label: "Students Helped", icon: Users },
  { value: "98%", label: "Satisfaction Rate", icon: Star },
];

export const FEATURES = [
  {
    icon: BookOpen,
    title: "Smart Study Matching",
    desc: "Get instantly paired with Honor Society tutors who excel in your exact course subjects.",
    color: "from-amber-500/20 to-yellow-500/10",
    border: "border-amber-500/30",
  },
  {
    icon: Zap,
    title: "Live Session Tracking",
    desc: "Digital QR ID scanning confirms attendance. Every session is logged and verified automatically.",
    color: "from-blue-500/20 to-indigo-500/10",
    border: "border-blue-500/30",
  },
  {
    icon: Shield,
    title: "Verified Tutors Only",
    desc: "Every tutor is a vetted member of the CIT-U Honor Society — scholastic excellence is a prerequisite.",
    color: "from-green-500/20 to-emerald-500/10",
    border: "border-green-500/30",
  },
  {
    icon: BarChart3,
    title: "Progress Analytics",
    desc: "Track your tutoring history, session logs, and academic improvement over time on your dashboard.",
    color: "from-purple-500/20 to-violet-500/10",
    border: "border-purple-500/30",
  },
  {
    icon: Award,
    title: "Gamified Learning",
    desc: "Earn XP, level up, and compete on the scholastic leaderboard as you complete sessions.",
    color: "from-orange-500/20 to-red-500/10",
    border: "border-orange-500/30",
  },
  {
    icon: Target,
    title: "Goal-Oriented Paths",
    desc: "Set academic targets, get personalized tutor recommendations, and track milestones.",
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
    text: "Being a HonSoc tutor has been incredibly rewarding. The platform makes it easy to manage my schedule and students.",
    rating: 5,
    avatar: "A",
  },
];

export const STEPS = [
  {
    num: "01",
    icon: Users,
    title: "Create Your Profile",
    desc: "Sign up, set your course priorities, and choose your learning goals. It takes under 2 minutes.",
  },
  {
    num: "02",
    icon: GraduationCap,
    title: "Match With a Tutor",
    desc: "Browse verified Honor Society peer mentors filtered by subject, availability, and specialization.",
  },
  {
    num: "03",
    icon: TrendingUp,
    title: "Excel Academically",
    desc: "Book sessions, log progress via digital ID scan, earn XP, and rise through the leaderboard.",
  },
];
