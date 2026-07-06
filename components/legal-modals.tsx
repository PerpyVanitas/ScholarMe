"use client";

import { useState } from "react";
import { X, Shield, FileText, ChevronRight } from "lucide-react";

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
type ModalType = "tos" | "privacy" | null;

/* ─────────────────────────────────────────────
   Shared Modal Shell
───────────────────────────────────────────── */
function LegalModal({
  open,
  onClose,
  title,
  icon: Icon,
  lastUpdated,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  icon: React.ElementType;
  lastUpdated: string;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-border/60 bg-background shadow-2xl shadow-black/30 overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border/40 bg-secondary/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 dark:bg-[#FFD700]/15 border border-amber-500/30 dark:border-[#FFD700]/30 flex items-center justify-center">
              <Icon className="h-4.5 w-4.5 text-amber-600 dark:text-[#FFD700]" />
            </div>
            <div>
              <h2 className="font-bold text-base text-foreground">{title}</h2>
              <p className="text-[11px] text-muted-foreground">
                Last updated: {lastUpdated}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-secondary/60 transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Close modal"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 text-sm leading-relaxed text-muted-foreground space-y-5 scroll-smooth">
          {children}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-6 py-4 border-t border-border/40 bg-secondary/10 flex items-center justify-between gap-4">
          <p className="text-[11px] text-muted-foreground italic">
            This document is for informational purposes only and does not
            constitute formal legal advice.
          </p>
          <button
            onClick={onClose}
            className="shrink-0 px-4 py-2 rounded-xl bg-zinc-950 text-white dark:bg-[#FFD700] dark:text-black text-xs font-bold hover:opacity-90 transition-opacity"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Section / Heading helpers
───────────────────────────────────────────── */
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
        <ChevronRight className="h-3.5 w-3.5 text-amber-500 dark:text-[#FFD700] shrink-0" />
        {title}
      </h3>
      <div className="pl-5 space-y-2">{children}</div>
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2">
          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500/60 dark:bg-[#FFD700]/60 shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/* ─────────────────────────────────────────────
   Terms of Service content
───────────────────────────────────────────── */
function TermsContent() {
  return (
    <>
      <p>
        Welcome to <strong className="text-foreground">ScholarMe</strong> — the
        official peer tutoring and academic session management platform of the{" "}
        <strong className="text-foreground">
          Cebu Institute of Technology – University (CIT-U) Honor Society
        </strong>
        . By accessing or using ScholarMe, you agree to be bound by these Terms
        of Service (&ldquo;Terms&rdquo;). If you do not agree, do not use the
        platform.
      </p>

      <div className="p-3 rounded-xl bg-amber-500/8 dark:bg-[#FFD700]/8 border border-amber-500/20 dark:border-[#FFD700]/20 text-xs text-amber-700 dark:text-[#FFD700]/90 font-medium">
        These Terms are governed by the laws of the Republic of the Philippines,
        including RA 8792 (E-Commerce Act 2000) and RA 10175 (Cybercrime
        Prevention Act 2012).
      </div>

      <Section title="1. Eligibility">
        <p>
          ScholarMe is available exclusively to currently enrolled students,
          faculty, and recognized Honor Society members of Cebu Institute of
          Technology – University. By registering, you confirm that you are an
          active member of the CIT-U community.
        </p>
      </Section>

      <Section title="2. User Accounts">
        <BulletList
          items={[
            "You are responsible for maintaining the confidentiality of your login credentials.",
            "You are responsible for all activity that occurs under your account.",
            "You must notify the platform administrators immediately of any unauthorized access.",
            "One account per person. Creating duplicate or fraudulent accounts is prohibited.",
            "Accounts may be suspended or terminated for violations of these Terms.",
          ]}
        />
      </Section>

      <Section title="3. Acceptable Use">
        <p>You agree NOT to use ScholarMe to:</p>
        <BulletList
          items={[
            "Violate any applicable Philippine law or university regulation",
            "Upload or share content that is defamatory, harassing, or abusive",
            "Impersonate any individual, tutor, or Honor Society officer",
            "Submit fraudulent session logs, timesheets, or QR attendance records",
            "Access or attempt to access another user's account without authorization",
            "Introduce malware, viruses, or harmful scripts into the platform",
            "Scrape or harvest data from ScholarMe without written permission",
            "Engage in any activity that disrupts platform performance or availability",
          ]}
        />
      </Section>

      <Section title="4. Tutoring Sessions & Session Logs">
        <p>
          Sessions booked through ScholarMe are governed by the Honor Society's
          academic tutoring guidelines. Both tutors and learners agree that:
        </p>
        <BulletList
          items={[
            "Sessions must be conducted in good faith for legitimate academic purposes.",
            "QR-based attendance scanning must reflect actual physical presence.",
            "Falsifying session logs or timestamps constitutes a disciplinary violation.",
            "Tutors must log hours accurately; misrepresentation may result in suspension.",
            "The platform reserves the right to audit sessions upon request by Honor Society administrators.",
          ]}
        />
      </Section>

      <Section title="5. Intellectual Property">
        <p>
          All platform content — including design, code, logos, and ScholarMe
          branding — is owned by the CIT-U Honor Society and protected under
          applicable intellectual property laws. You may not copy, modify, or
          redistribute any platform assets without written consent.
        </p>
        <p>
          User-generated content (resources, quiz questions, notes) remains your
          intellectual property. By uploading content, you grant ScholarMe a
          non-exclusive, royalty-free license to store and display that content
          solely for platform operation.
        </p>
      </Section>

      <Section title="6. Gamification & Leaderboards">
        <p>
          XP points, levels, and leaderboard rankings are earned through
          legitimate platform activity. Exploiting bugs or automation to gain
          artificial XP is prohibited and may result in account termination and
          removal from ranking lists.
        </p>
      </Section>

      <Section title="7. Disclaimers">
        <p className="uppercase text-xs font-semibold text-foreground">
          The platform is provided &ldquo;as is&rdquo; and &ldquo;as
          available&rdquo; without warranties of any kind, express or implied.
          We do not warrant that the service will be uninterrupted, error-free,
          or free of harmful components.
        </p>
      </Section>

      <Section title="8. Limitation of Liability">
        <p>
          To the maximum extent permitted by Philippine law, the CIT-U Honor
          Society and ScholarMe operators shall not be liable for any indirect,
          incidental, or consequential damages arising from your use of the
          platform, including but not limited to loss of data, academic
          standing, or access to services.
        </p>
      </Section>

      <Section title="9. Termination">
        <p>
          The Honor Society reserves the right to suspend or terminate your
          access without prior notice if you violate these Terms, engage in
          academic dishonesty, or act in a manner harmful to other users or the
          platform.
        </p>
      </Section>

      <Section title="10. Changes to These Terms">
        <p>
          We may update these Terms periodically. Material changes will be
          communicated via platform notification or email at least 14 days
          before taking effect. Continued use constitutes acceptance of revised
          Terms.
        </p>
      </Section>

      <Section title="11. Contact">
        <p>
          For questions about these Terms, contact the CIT-U Honor Society
          through the Student Success Office or reach out via your ScholarMe
          administrator account.
        </p>
      </Section>
    </>
  );
}

/* ─────────────────────────────────────────────
   Privacy Policy content
───────────────────────────────────────────── */
function PrivacyContent() {
  return (
    <>
      <p>
        The <strong className="text-foreground">CIT-U Honor Society</strong>{" "}
        (&ldquo;we&rdquo;, &ldquo;us&rdquo;) operates ScholarMe and is committed
        to protecting your personal data. This Privacy Policy explains how we
        collect, use, and safeguard your information in accordance with the{" "}
        <strong className="text-foreground">
          Republic Act 10173 — Data Privacy Act of 2012
        </strong>{" "}
        (Philippines) and internationally recognized data protection standards.
      </p>

      <div className="p-3 rounded-xl bg-amber-500/8 dark:bg-[#FFD700]/8 border border-amber-500/20 dark:border-[#FFD700]/20 text-xs text-amber-700 dark:text-[#FFD700]/90 font-medium">
        Philippine jurisdiction applies. You have the right to file a complaint
        with the <strong>National Privacy Commission (NPC)</strong> if you
        believe your rights have been violated.
      </div>

      <Section title="1. Information We Collect">
        <p>
          <strong className="text-foreground">Information you provide:</strong>
        </p>
        <BulletList
          items={[
            "Account information: full name, email address, password (hashed, never stored in plain text)",
            "Profile information: student ID number, degree program, year level, avatar photo",
            "Academic information: specializations, tutor preferences, honor society designation",
            "Session records: tutoring session bookings, attendance logs, QR scan timestamps",
            "Content you upload: study resources, quiz questions, flashcards, messages",
          ]}
        />
        <p className="mt-2">
          <strong className="text-foreground">
            Information collected automatically:
          </strong>
        </p>
        <BulletList
          items={[
            "Usage data: pages visited, features used, session duration, button clicks",
            "Device data: browser type, operating system, screen resolution",
            "Authentication tokens and session cookies (required for login)",
            "IP address (used for security and fraud detection only)",
          ]}
        />
      </Section>

      <Section title="2. How We Use Your Information">
        <BulletList
          items={[
            "To authenticate you and provide access to your dashboard and sessions",
            "To match learners with appropriate tutors based on your stated subjects and preferences",
            "To generate session logs, timesheets, and attendance records for Honor Society compliance",
            "To calculate XP points, leaderboard rankings, and academic progress metrics",
            "To send platform notifications (session reminders, approvals, announcements)",
            "To detect and prevent fraudulent session submissions or unauthorized access",
            "To improve platform performance, fix bugs, and develop new features",
            "To comply with CIT-U institutional reporting requirements",
          ]}
        />
      </Section>

      <Section title="3. Legal Basis for Processing (RA 10173)">
        <BulletList
          items={[
            "Contract performance — necessary to provide the tutoring platform service",
            "Legitimate interests — security monitoring, fraud detection, platform analytics",
            "Consent — profile photo display, optional email notifications (withdrawable)",
            "Legal obligation — institutional compliance and academic record-keeping",
          ]}
        />
      </Section>

      <Section title="4. Data Sharing">
        <p>We do not sell your personal data. We share data only with:</p>
        <BulletList
          items={[
            "CIT-U Honor Society administrators — for session oversight and tutor hour verification",
            "Supabase (cloud database provider) — data processor under strict security controls",
            "Vercel (hosting provider) — for platform infrastructure only",
            "CIT-U Student Success Office — aggregated academic activity reports (no individual data without consent)",
            "Law enforcement or NPC — only when legally required by valid court order or agency directive",
          ]}
        />
      </Section>

      <Section title="5. Data Retention">
        <BulletList
          items={[
            "Active account data: retained while your account is active",
            "Session logs and timesheets: retained for 2 academic years for institutional compliance",
            "Deleted account data: purged within 30 days of account deletion request",
            "Anonymized analytics: retained indefinitely in aggregated, non-identifiable form",
          ]}
        />
      </Section>

      <Section title="6. Your Rights Under RA 10173">
        <BulletList
          items={[
            "Right to be informed — you have the right to know what data we hold about you",
            "Right to access — request a copy of your personal data at any time",
            "Right to correct — update inaccurate or outdated information via your profile settings",
            "Right to erasure — request deletion of your account and personal data",
            "Right to object — opt out of non-essential data processing",
            "Right to data portability — receive your data in a machine-readable format",
            "Right to file a complaint — with the National Privacy Commission (www.privacy.gov.ph)",
          ]}
        />
        <p className="mt-2">
          To exercise any right, contact your platform administrator. We respond
          within 30 days.
        </p>
      </Section>

      <Section title="7. Security">
        <BulletList
          items={[
            "All data is transmitted over encrypted TLS connections (HTTPS)",
            "Passwords are hashed using industry-standard bcrypt — never stored in plain text",
            "Access to the database is restricted by role-based Row Level Security (RLS)",
            "QR tokens and session IDs are short-lived and single-use",
            "Regular security reviews and dependency audits are performed",
          ]}
        />
        <p>
          No system is 100% secure. We cannot guarantee absolute security
          against all threats.
        </p>
      </Section>

      <Section title="8. Children's Privacy">
        <p>
          ScholarMe is intended for tertiary-level students aged 16 and above.
          We do not knowingly collect personal data from children under 16. If
          you believe a minor has registered, please contact administrators
          immediately for account removal.
        </p>
      </Section>

      <Section title="9. Cookies & Local Storage">
        <BulletList
          items={[
            "Authentication cookies — strictly necessary; required to maintain your login session",
            "Preference storage (e.g., dark mode) — functional; stored in localStorage",
            "No third-party advertising or tracking cookies are used",
          ]}
        />
      </Section>

      <Section title="10. Changes to This Policy">
        <p>
          We will notify you of material changes to this Privacy Policy via
          in-app notice or email at least 14 days before changes take effect.
          Continued use after that date constitutes acceptance of the updated
          policy.
        </p>
      </Section>

      <Section title="11. Contact / Data Controller">
        <p>
          <strong className="text-foreground">Data Controller:</strong> CIT-U
          Honor Society
          <br />
          <strong className="text-foreground">Institution:</strong> Cebu
          Institute of Technology – University
          <br />
          <strong className="text-foreground">Address:</strong> N. Bacalso Ave.,
          Cebu City, Philippines 6000
          <br />
          <strong className="text-foreground">Contact:</strong> Reach us via
          your ScholarMe administrator or the Student Success Office.
        </p>
      </Section>
    </>
  );
}

/* ─────────────────────────────────────────────
   Public export — trigger component
   Usage: <LegalModals />
   Links exposed via data attributes for footer
───────────────────────────────────────────── */
export function LegalModals() {
  const [open, setOpen] = useState<ModalType>(null);

  return (
    <>
      {/* Invisible triggers — controlled by footer buttons */}
      <span
        id="legal-tos-trigger"
        className="sr-only"
        onClick={() => setOpen("tos")}
      />
      <span
        id="legal-privacy-trigger"
        className="sr-only"
        onClick={() => setOpen("privacy")}
      />

      <LegalModal
        open={open === "tos"}
        onClose={() => setOpen(null)}
        title="Terms of Service"
        icon={FileText}
        lastUpdated="July 2026"
      >
        <TermsContent />
      </LegalModal>

      <LegalModal
        open={open === "privacy"}
        onClose={() => setOpen(null)}
        title="Privacy Policy"
        icon={Shield}
        lastUpdated="July 2026"
      >
        <PrivacyContent />
      </LegalModal>
    </>
  );
}

/* ─────────────────────────────────────────────
   Footer link helpers — import in landing page
───────────────────────────────────────────── */
export function TosLink({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className={className}>
        Terms of Service
      </button>
      <LegalModal
        open={open}
        onClose={() => setOpen(false)}
        title="Terms of Service"
        icon={FileText}
        lastUpdated="July 2026"
      >
        <TermsContent />
      </LegalModal>
    </>
  );
}

export function PrivacyLink({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className={className}>
        Privacy Policy
      </button>
      <LegalModal
        open={open}
        onClose={() => setOpen(false)}
        title="Privacy Policy"
        icon={Shield}
        lastUpdated="July 2026"
      >
        <PrivacyContent />
      </LegalModal>
    </>
  );
}
