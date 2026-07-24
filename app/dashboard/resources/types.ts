import {
  FileText,
  FileImage,
  FileVideo,
  FileSpreadsheet,
  File,
  Presentation,
} from "lucide-react";

export const MAX_FILE_SIZE = 50 * 1024 * 1024;

export const ACCEPTED_MIME_TYPES = [
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".txt",
  ".csv",
  ".rtf",
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".svg",
  ".mp4",
  ".webm",
  ".mov",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "video/mp4",
  "video/webm",
  "video/quicktime",
].join(",");

export const FILE_TYPES: Record<
  string,
  { label: string; icon: typeof FileText; color: string; extensions: string[] }
> = {
  pdf: {
    label: "PDF",
    icon: FileText,
    color: "text-amber-500 bg-amber-500/10",
    extensions: [".pdf"],
  },
  document: {
    label: "Document",
    icon: FileText,
    color: "text-slate-400 bg-slate-400/10",
    extensions: [".doc", ".docx", ".txt", ".rtf"],
  },
  spreadsheet: {
    label: "Spreadsheet",
    icon: FileSpreadsheet,
    color: "text-green-500 bg-green-500/10",
    extensions: [".xls", ".xlsx", ".csv"],
  },
  presentation: {
    label: "Presentation",
    icon: Presentation,
    color: "text-orange-500 bg-orange-500/10",
    extensions: [".ppt", ".pptx"],
  },
  image: {
    label: "Image",
    icon: FileImage,
    color: "text-purple-500 bg-purple-500/10",
    extensions: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"],
  },
  video: {
    label: "Video",
    icon: FileVideo,
    color: "text-pink-500 bg-pink-500/10",
    extensions: [".mp4", ".webm", ".mov"],
  },
  link: {
    label: "Link",
    icon: File,
    color: "text-muted-foreground bg-muted",
    extensions: [],
  },
  other: {
    label: "File",
    icon: File,
    color: "text-muted-foreground bg-muted",
    extensions: [],
  },
};

export function detectFileType(fileName: string): string {
  const ext = "." + fileName.split(".").pop()?.toLowerCase();
  for (const [key, config] of Object.entries(FILE_TYPES)) {
    if (config.extensions.includes(ext)) return key;
  }
  return "other";
}

export function getTypeInfo(fileType: string) {
  return FILE_TYPES[fileType] || FILE_TYPES.other;
}

export interface ResourceRow {
  id: string;
  repository_id: string;
  title: string;
  description: string | null;
  url: string;
  file_type: string;
  uploaded_by: string;
  created_at: string;
  profiles?: unknown;
}

export interface RepoRow {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  access_role: string;
  created_at: string;
  profiles?: unknown;
}
