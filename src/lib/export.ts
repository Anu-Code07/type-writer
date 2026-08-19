import { htmlToMarkdown, htmlToPlainText } from "@/lib/richText";
import type { WritingBook, WritingDocument } from "@/lib/indexeddb";

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
  return `# ${title}\n\n${htmlToMarkdown(document.content)}`;
};

export const exportDocument = (document: WritingDocument, format: ExportFormat) => {
  const content = format === "markdown" ? buildMarkdown(document) : htmlToPlainText(document.content);
  const mimeType = format === "markdown" ? "text/markdown;charset=utf-8" : "text/plain;charset=utf-8";
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = window.document.createElement("a");

  anchor.href = url;
  anchor.download = safeFileName(document.title, format);
  anchor.click();

  URL.revokeObjectURL(url);
};

const buildBookContent = (book: WritingBook, documents: WritingDocument[], format: ExportFormat) => {
  const orderedDocuments = book.documentIds
    .map((documentId) => documents.find((document) => document.id === documentId))
    .filter((document): document is WritingDocument => Boolean(document));

  if (format === "markdown") {
    return [`# ${book.title}`, ...orderedDocuments.map((document) => `## ${document.title}\n\n${htmlToMarkdown(document.content)}`)].join(
      "\n\n---\n\n",
    );
  }

  return [`${book.title}`, ...orderedDocuments.map((document) => `${document.title}\n\n${htmlToPlainText(document.content)}`)].join(
    "\n\n------------------------------\n\n",
  );
};

export const exportBook = (book: WritingBook, documents: WritingDocument[], format: ExportFormat) => {
  const content = buildBookContent(book, documents, format);
  const mimeType = format === "markdown" ? "text/markdown;charset=utf-8" : "text/plain;charset=utf-8";
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = window.document.createElement("a");

  anchor.href = url;
  anchor.download = safeFileName(book.title, format);
  anchor.click();

  URL.revokeObjectURL(url);
};
