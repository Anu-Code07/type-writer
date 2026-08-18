import type { WritingDocument } from "@/lib/indexeddb";

type ExportFormat = "txt" | "markdown";

const safeFileName = (title: string, extension: ExportFormat) => {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return `${slug || "untitled"}.${extension === "txt" ? "txt" : "md"}`;
};

const buildMarkdown = (document: WritingDocument) => {
  const title = document.title.trim() || "Untitled";
  return `# ${title}\n\n${document.content}`;
};

export const exportDocument = (document: WritingDocument, format: ExportFormat) => {
  const content = format === "markdown" ? buildMarkdown(document) : document.content;
  const mimeType = format === "markdown" ? "text/markdown;charset=utf-8" : "text/plain;charset=utf-8";
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = window.document.createElement("a");

  anchor.href = url;
  anchor.download = safeFileName(document.title, format);
  anchor.click();

  URL.revokeObjectURL(url);
};
