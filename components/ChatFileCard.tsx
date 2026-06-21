"use client";

import { FileText, Image as ImageIcon } from "lucide-react";
import { formatFileSize } from "@/lib/fileMeta";
import type { ChatFileMeta } from "@/lib/firestore";

/**
 * Renders a compact, privacy-safe card for a file the user attached.
 * Shows name, type, size, and (for PDFs) page count. The file itself is
 * never stored — this is metadata only.
 */
export function ChatFileCard({ file }: { file: ChatFileMeta }) {
  const isPdf = file.type === "application/pdf";
  const isImage = file.type?.startsWith("image/");

  const Icon = isImage ? ImageIcon : FileText;
  const kindLabel = isPdf ? "PDF" : isImage ? "Image" : (file.type?.split("/")[1]?.toUpperCase() || "File");

  const details = [
    file.pageCount ? `${file.pageCount} page${file.pageCount === 1 ? "" : "s"}` : null,
    formatFileSize(file.size),
    kindLabel,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2.5 max-w-[280px] shadow-sm">
      <div className={`flex-shrink-0 rounded-lg p-2 ${isPdf ? "bg-red-50 text-red-600" : "bg-teal-50 text-teal-600"}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
          {file.name}
        </p>
        <p className="text-xs text-gray-500">{details}</p>
      </div>
    </div>
  );
}
