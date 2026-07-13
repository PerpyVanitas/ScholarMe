export const EXECUTIVE_POSITIONS = [
  { key: "president", label: "President", committee: null },
  { key: "vice_president", label: "Vice President", committee: null },
  { key: "secretary", label: "Secretary", committee: null },
  { key: "treasurer", label: "Treasurer", committee: null },
  { key: "auditor", label: "Auditor", committee: null },
];

export const MAIN_COMMITTEES = [
  { key: "Secretariat", label: "Secretariat" },
  { key: "CSR", label: "Committee on Social Responsibility (CSR)" },
  { key: "COF", label: "Committee on Finance (COF)" },
  { key: "CIA", label: "Committee on Internal Affairs (CIA)" },
  { key: "CMSS", label: "Committee on Member Success & Scholarship (CMSS)" },
  { key: "CPR", label: "Committee on Public Relations (CPR)" },
  { key: "CRAR", label: "Committee on Rules & Regulations (CRAR)" },
  { key: "COD", label: "Committee on Documentations (COD)" },
  { key: "CFMR", label: "Committee on Facility Management & Reception (CFMR)" },
  { key: "COR", label: "Committee on Research (COR)" },
  { key: "CKA", label: "Committee on Knowledge & Archives (CKA)" },
];

export const ESAS_COMMITTEES = [
  { key: "CHR", label: "Committee on Human Resources (CHR)" },
  { key: "COM", label: "Committee on Mentorship (COM)" },
  { key: "CEP", label: "Committee on Events & Planning (CEP)" },
  { key: "CNL", label: "Committee on Networks & Linkages (CNL)" },
  { key: "CMP", label: "Committee on Marketing & Procurement (CMP)" },
  { key: "CBAMM", label: "Committee on Branding & Media Management (CBAMM)" },
  { key: "COI", label: "Committee on Investigation (COI)" },
];

export interface Member {
  id: string;
  full_name: string;
  email: string;
  esas_scholar: boolean;
  roles: { name: string } | { name: string }[];
}

export interface Assignment {
  id: string;
  position: string;
  committee: string | null;
  user_id: string;
  profiles: {
    id: string;
    full_name: string;
    email: string;
    esas_scholar: boolean;
  };
}

export interface OrgTerm {
  id: string;
  label: string;
  term_start: string;
  term_end: string;
  is_current: boolean;
}

export type AssignmentMap = Record<string, string | null>;

export function fmtDate(d: string) {
  const dt = new Date(d + "T00:00:00Z");
  return dt.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function assignKey(position: string, committee: string | null) {
  return `${position}__${committee ?? "exec"}`;
}
