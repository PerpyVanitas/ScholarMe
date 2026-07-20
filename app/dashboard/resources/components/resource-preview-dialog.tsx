"use client";

import { Button } from "@/components/ui/button";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Download, X, File, FileText } from "lucide-react";
import { ResourceRow, getTypeInfo } from "../types";

interface ResourcePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource: ResourceRow | null;
}

export function ResourcePreviewDialog({
  open,
  onOpenChange,
  resource,
}: ResourcePreviewDialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[100] bg-black/98 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed inset-0 z-[100] flex flex-col text-white duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 outline-none">
          <DialogPrimitive.Title className="sr-only">
            Resource Preview
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Preview of the selected resource
          </DialogPrimitive.Description>
          {/* Top Bar */}
          <div className="h-16 border-b border-zinc-800 bg-zinc-950 px-4 md:px-6 flex items-center justify-between shrink-0 select-none">
            {/* Left side: Icon, title, uploader */}
            <div className="flex items-center gap-3 min-w-0 flex-1 mr-4">
              {resource && (
                <>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800">
                    {(() => {
                      const info = getTypeInfo(resource.file_type);
                      const Icon = info.icon;
                      return (
                        <Icon
                          className={`h-5 w-5 ${info.color.split(" ")[0]}`}
                        />
                      );
                    })()}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm font-semibold text-zinc-100 truncate">
                      {resource.title}
                    </h2>
                    <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                      Uploaded by{" "}
                      {(resource.profiles as { full_name: string } | null)
                        ?.full_name || "Unknown"}{" "}
                      on {new Date(resource.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Right side: Actions & Close */}
            <div className="flex items-center gap-2 shrink-0">
              {resource && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-9 text-zinc-300 hover:bg-zinc-900 hover:text-white"
                  asChild
                >
                  <a
                    href={`${resource.url}?download=`}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4 text-amber-500" />
                    <span className="hidden sm:inline">Download</span>
                  </a>
                </Button>
              )}

              <div className="w-px h-6 bg-zinc-800 mx-1 hidden sm:block"></div>

              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-white"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-5 w-5" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
          </div>

          {/* Viewer Container */}
          <div className="flex-1 w-full p-4 md:p-8 flex items-center justify-center overflow-hidden">
            {resource && <PreviewContent resource={resource} />}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function PreviewContent({ resource }: { resource: ResourceRow }) {
  const url = resource.url;
  const ext = "." + url.split(".").pop()?.toLowerCase().split("?")[0];

  if (resource.file_type === "image") {
    return (
      <div className="flex items-center justify-center w-full h-full max-h-[85vh] bg-zinc-950/20 overflow-auto rounded-lg border border-zinc-800/50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={resource.title}
          className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
        />
      </div>
    );
  }

  if (resource.file_type === "video") {
    return (
      <div className="flex items-center justify-center w-full h-full max-h-[85vh] bg-black rounded-lg overflow-hidden border border-zinc-800/50">
        <video
          src={url}
          controls
          className="w-full h-full max-h-[85vh] object-contain shadow-2xl"
        />
      </div>
    );
  }

  // Office documents
  const officeExtensions = [".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx"];
  if (
    officeExtensions.includes(ext) ||
    resource.file_type === "presentation" ||
    (resource.file_type === "spreadsheet" && ext !== ".csv")
  ) {
    const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
    return (
      <iframe
        src={officeViewerUrl}
        className="w-full h-full min-h-[75vh] md:min-h-[85vh] max-w-5xl mx-auto border border-zinc-800 rounded-lg bg-zinc-950 shadow-2xl"
        title={resource.title}
        frameBorder="0"
      />
    );
  }

  // PDF
  if (resource.file_type === "pdf" || ext === ".pdf") {
    return (
      <object
        data={`${url}#toolbar=1&navpanes=0&view=Fit`}
        type="application/pdf"
        className="w-full h-full min-h-[75vh] md:min-h-[85vh] max-w-5xl mx-auto border border-zinc-800 rounded-lg bg-zinc-950 shadow-2xl"
      >
        <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-zinc-900/50 rounded-lg border border-zinc-800">
          <FileText className="h-12 w-12 text-zinc-500 mb-4" />
          <h3 className="text-lg font-medium text-zinc-200 mb-2">Unable to display PDF preview</h3>
          <p className="text-sm text-zinc-400 mb-6 max-w-md">
            Your browser may not support inline PDF viewing, or a plugin is blocking it.
          </p>
          <Button asChild className="bg-amber-500 hover:bg-amber-600 text-black">
            <a href={`${url}?download=`} download target="_blank" rel="noopener noreferrer">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </a>
          </Button>
        </div>
      </object>
    );
  }

  // Plain text or CSV
  if (ext === ".txt" || ext === ".csv" || ext === ".rtf") {
    const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
    return (
      <iframe
        src={googleViewerUrl}
        className="w-full h-full min-h-[75vh] md:min-h-[85vh] max-w-5xl mx-auto border border-zinc-800 rounded-lg bg-zinc-950 shadow-2xl"
        title={resource.title}
        frameBorder="0"
      />
    );
  }

  // Fallback for other file types
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center border border-dashed border-zinc-800/80 rounded-lg h-[50vh] max-w-lg bg-zinc-900/40">
      <File className="h-12 w-12 text-zinc-500 mb-4" />
      <h3 className="text-sm font-semibold text-zinc-300 mb-2">
        No preview available for this file type
      </h3>
      <p className="text-xs text-zinc-500 mb-6 max-w-xs leading-relaxed">
        This file format ({ext}) cannot be previewed in the browser. You can
        download it directly to view its contents.
      </p>
      <Button
        asChild
        size="sm"
        className="bg-primary hover:bg-primary/90 text-black font-semibold"
      >
        <a
          href={`${url}?download=`}
          download
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Download File
        </a>
      </Button>
    </div>
  );
}
