/**
 * Safely rounds a currency value to exactly 2 decimal places to avoid floating point precision issues.
 */
export function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Formats numeric currency amounts as Philippine Peso (₱ / PHP).
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return "₱0.00";
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}


/**
 * Validates file signature (magic numbers) to ensure the uploaded file
 * actually matches the expected content type, not just extension.
 * Supports PDF, JPEG, and PNG.
 */
export async function isValidFileType(file: File): Promise<boolean> {
  const arr = new Uint8Array(await file.slice(0, 4).arrayBuffer());
  let header = "";
  for (let i = 0; i < arr.length; i++) {
    header += arr[i].toString(16).toUpperCase().padStart(2, "0");
  }

  // Check magic numbers
  // PDF: 25 50 44 46 (%PDF)
  // JPEG: FF D8 FF E0, FF D8 FF E1, etc... FF D8 FF
  // PNG: 89 50 4E 47
  if (header.startsWith("25504446")) return true;
  if (header.startsWith("FFD8FF")) return true;
  if (header.startsWith("89504E47")) return true;

  return false;
}
