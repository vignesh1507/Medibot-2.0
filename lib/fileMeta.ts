import type { ChatFileMeta } from "./firestore";

/**
 * Best-effort PDF page count WITHOUT a heavy PDF library.
 * Parses the raw bytes for the page-tree /Count, falling back to counting
 * /Type /Page objects. Returns undefined if it can't determine it — callers
 * must treat page count as optional.
 */
async function getPdfPageCount(file: File): Promise<number | undefined> {
  try {
    const buf = await file.arrayBuffer();
    // latin1 keeps byte values intact for regex scanning of PDF structure
    const text = new TextDecoder("latin1").decode(buf);

    // Most PDFs declare the total in the page tree root: "/Type /Pages ... /Count N"
    const counts = [...text.matchAll(/\/Count\s+(\d+)/g)]
      .map((m) => parseInt(m[1], 10))
      .filter((n) => Number.isFinite(n) && n > 0);
    if (counts.length > 0) return Math.max(...counts);

    // Fallback: count individual "/Type /Page" objects (excluding "/Pages")
    const pageObjs = text.match(/\/Type\s*\/Page(?![sA-Za-z])/g);
    if (pageObjs && pageObjs.length > 0) return pageObjs.length;
  } catch {
    /* ignore — page count is optional */
  }
  return undefined;
}

/**
 * Build privacy-safe metadata for a chat file attachment.
 * We store ONLY { name, size, type, pageCount } — never the file bytes.
 */
export async function buildFileMeta(file: File): Promise<ChatFileMeta> {
  const meta: ChatFileMeta = {
    name: file.name || "attachment",
    size: file.size || 0,
    type: file.type || "application/octet-stream",
  };

  if (file.type === "application/pdf") {
    const pages = await getPdfPageCount(file);
    if (pages) meta.pageCount = pages;
  }

  return meta;
}

/** Human-readable file size, e.g. "6.6 MB". */
export function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}
