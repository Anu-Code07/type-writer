import { jsPDF } from "jspdf";
import { htmlToPlainText, isRichHtml, sanitizeHtml } from "@/lib/richText";

interface PdfBlock {
  kind: "title" | "h1" | "h2" | "h3" | "body";
  text: string;
}

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN_X = 64;
const MARGIN_TOP = 68;
const MARGIN_BOTTOM = 64;
const LINE_WIDTH = PAGE_WIDTH - MARGIN_X * 2;

const toPdfText = (value: string) =>
  value
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2014/g, "--")
    .replace(/\u2013/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/[^\t\n\r\x20-\x7E]/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const headingKind = (tagName: string): PdfBlock["kind"] | null => {
  if (tagName === "H1") {
    return "h1";
  }

  if (tagName === "H2") {
    return "h2";
  }

  if (tagName === "H3") {
    return "h3";
  }

  return null;
};

const blocksFromHtml = (title: string, html: string): PdfBlock[] => {
  const blocks: PdfBlock[] = [{ kind: "title", text: toPdfText(title) || "Untitled" }];

  if (!html.trim()) {
    return blocks;
  }

  if (typeof window === "undefined" || !isRichHtml(html)) {
    const plainText = toPdfText(htmlToPlainText(html));

    if (plainText) {
      blocks.push({ kind: "body", text: plainText });
    }

    return blocks;
  }

  const documentNode = new DOMParser().parseFromString(sanitizeHtml(html), "text/html");

  [...documentNode.body.children].forEach((element) => {
    const heading = headingKind(element.tagName);
    const text = toPdfText(element.textContent ?? "");

    if (!text) {
      return;
    }

    blocks.push({ kind: heading ?? "body", text });
  });

  if (blocks.length === 1) {
    const plainText = toPdfText(htmlToPlainText(html));

    if (plainText) {
      blocks.push({ kind: "body", text: plainText });
    }
  }

  return blocks;
};

const fontSizeFor = (kind: PdfBlock["kind"]) => {
  if (kind === "title") {
    return 18;
  }

  if (kind === "h1") {
    return 16;
  }

  if (kind === "h2") {
    return 13;
  }

  if (kind === "h3") {
    return 12;
  }

  return 11;
};

export const createWritingPdf = (title: string, html: string) => {
  const pdf = new jsPDF({ unit: "pt", format: "letter" });
  const blocks = blocksFromHtml(title, html);
  let cursorY = MARGIN_TOP;

  const ensureSpace = (lineHeight: number) => {
    if (cursorY + lineHeight <= PAGE_HEIGHT - MARGIN_BOTTOM) {
      return;
    }

    pdf.addPage();
    cursorY = MARGIN_TOP;
  };

  blocks.forEach((block, index) => {
    const fontSize = fontSizeFor(block.kind);
    const lineHeight = fontSize * 1.45;
    const isHeading = block.kind !== "body";

    pdf.setFont("courier", isHeading ? "bold" : "normal");
    pdf.setFontSize(fontSize);
    pdf.setTextColor(41, 35, 31);

    if (index > 0) {
      cursorY += isHeading ? 18 : 10;
    }

    const lines = pdf.splitTextToSize(block.text, LINE_WIDTH) as string[];

    lines.forEach((line) => {
      ensureSpace(lineHeight);
      pdf.text(line, MARGIN_X, cursorY);
      cursorY += lineHeight;
    });
  });

  return pdf;
};
