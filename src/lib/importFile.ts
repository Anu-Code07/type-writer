import { markdownToHtml, plainTextToHtml, sanitizeHtml } from "@/lib/richText";

const MAX_IMPORT_BYTES = 2 * 1024 * 1024;

export interface ImportedWriting {
  title: string;
  content: string;
}

const titleFromFileName = (fileName: string) =>
  fileName
    .replace(/\.(md|markdown|txt)$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim() || "Imported";

export const parseWritingFile = async (file: File): Promise<ImportedWriting> => {
  if (file.size > MAX_IMPORT_BYTES) {
    throw new Error("That file is larger than 2 MB.");
  }

  const isMarkdown = /\.(md|markdown)$/i.test(file.name);
  const isPlainText = /\.txt$/i.test(file.name) || file.type.startsWith("text/");

  if (!isMarkdown && !isPlainText) {
    throw new Error("Import a .txt or .md file.");
  }

  const text = (await file.text()).replace(/^\uFEFF/, "");

  if (!text.trim()) {
    throw new Error("That file is empty.");
  }

  const headingMatch = text.match(/^#\s+(.+)$/m);
  const title = headingMatch?.[1]?.trim() || titleFromFileName(file.name);
  const body = headingMatch ? text.replace(headingMatch[0], "").trim() : text;
  const content = sanitizeHtml(isMarkdown ? markdownToHtml(body) : plainTextToHtml(body || text));

  return { title, content };
};
