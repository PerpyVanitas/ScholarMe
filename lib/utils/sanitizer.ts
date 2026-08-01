/**
 * Security HTML & Markdown Sanitizer Utility
 * 
 * Sanitizes user-generated markdown and HTML string inputs before rendering in the DOM or saving to DB.
 * Strips executable scripts, event handlers, and dangerous iframe/object tags.
 */

const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /on\w+\s*=\s*(["'])[\s\S]*?\1/gi,
  /on\w+\s*=\s*[^\s>]+/gi,
  /javascript\s*:/gi,
  /<iframe\b[^>]*>/gi,
  /<\/iframe>/gi,
  /<object\b[^>]*>/gi,
  /<\/object>/gi,
  /<embed\b[^>]*>/gi,
  /<\/embed>/gi,
];

/**
 * Sanitizes HTML string input by stripping dangerous tags and inline event handlers.
 */
export function sanitizeHtml(input: string | null | undefined): string {
  if (!input) return "";
  let clean = input;
  for (const pattern of DANGEROUS_PATTERNS) {
    clean = clean.replace(pattern, "");
  }
  return clean;
}

/**
 * Strips all HTML tags from string, returning plain text.
 */
export function stripHtml(input: string | null | undefined): string {
  if (!input) return "";
  return input.replace(/<[^>]*>?/gm, "").trim();
}

/**
 * Sanitizes user markdown text before parsing/rendering.
 */
export function sanitizeMarkdown(input: string | null | undefined): string {
  return sanitizeHtml(input);
}
