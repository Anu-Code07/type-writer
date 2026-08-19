"use client";

import { sanitizeHtml } from "@/lib/richText";

interface ManuscriptHtmlProps {
  html: string;
  emptyLabel?: string;
}

export function ManuscriptHtml({ html, emptyLabel = "A blank leaf, ready for ink." }: ManuscriptHtmlProps) {
  const safeHtml = sanitizeHtml(html);

  if (!safeHtml.trim()) {
    return <p className="journal-sheet-body">{emptyLabel}</p>;
  }

  return <div className="manuscript-html" dangerouslySetInnerHTML={{ __html: safeHtml }} />;
}
