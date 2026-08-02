/**
 * Standardized Financial Document Numbering System (Policy Section XVI)
 * Format: [DocumentType]_[ProjectName]_[ProjectHead]_[Date]
 * Example: BUDGET_LeadershipSeminar_BugasYessuahLeihAnde_06-05-2026
 */

export type DocumentType =
  | "BUDGET"
  | "PETTYCASH"
  | "RELEASE"
  | "REIMBURSE"
  | "LIQUIDATION"
  | "SCARDS"
  | "AUDIT"
  | "COLLECTION";

export function generateDocumentNumber(
  docType: DocumentType,
  projectName: string,
  projectHeadName: string,
  date: Date = new Date()
): string {
  const sanitize = (str: string) => str.replace(/[^a-zA-Z0-9]/g, "");
  const cleanProject = sanitize(projectName) || "GeneralActivity";
  const cleanHead = sanitize(projectHeadName) || "Officer";

  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const yyyy = date.getFullYear();
  const dateStr = `${mm}-${dd}-${yyyy}`;

  return `${docType}_${cleanProject}_${cleanHead}_${dateStr}`;
}
