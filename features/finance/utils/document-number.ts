/**
 * Utility for generating standardized policy document numbers per Section XVI:
 * Format: [DocumentType]_[ProjectName]_[ProjectHead]_[Date]
 * Example: BUDGET_LeadershipSeminar_BugasYessuahLeihAnde_06-05-2026
 */
export function generateDocumentNumber(
  documentType: "BUDGET" | "PETTYCASH" | "LIQUIDATION" | "SCARDS" | "REIMBURSEMENT",
  projectName: string,
  projectHead: string,
  date: Date = new Date(),
): string {
  const sanitize = (str: string) =>
    str
      .replace(/[^a-zA-Z0-9]/g, "")
      .trim() || "Gen";

  const cleanProject = sanitize(projectName);
  const cleanHead = sanitize(projectHead);

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();

  const formattedDate = `${month}-${day}-${year}`;

  return `${documentType}_${cleanProject}_${cleanHead}_${formattedDate}`;
}

export function isValidAmount(amount: number): boolean {
  return typeof amount === "number" && !isNaN(amount) && isFinite(amount) && amount > 0;
}
