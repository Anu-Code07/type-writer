"use client";

import { Editor } from "@/components/typewriter/Editor";
import type { CoverPalette, JournalSheet } from "@/lib/journal";
import { formatJournalDate } from "@/lib/journal";

interface JournalSheetViewProps {
  sheet: JournalSheet | null;
  palette: CoverPalette;
  pageLabel: string;
  isWriting: boolean;
  onWrite?: (documentId: string) => void;
  onOpenContents?: (sheetIndex: number) => void;
}

export function JournalSheetView({
  sheet,
  palette,
  pageLabel,
  isWriting,
  onWrite,
  onOpenContents,
}: JournalSheetViewProps) {
  if (!sheet) {
    return (
      <article className="journal-sheet journal-sheet-blank">
        <span className="journal-sheet-number">{pageLabel}</span>
      </article>
    );
  }

  if (sheet.kind === "endpaper") {
    return (
      <article
        className={`journal-sheet journal-endpaper journal-endpaper-${sheet.side}`}
        style={{ backgroundColor: palette.endpaper }}
      >
        <span className="journal-endpaper-pattern" />
        <span className="journal-sheet-number">{pageLabel}</span>
      </article>
    );
  }

  if (sheet.kind === "contents") {
    return (
      <article className="journal-sheet journal-contents">
        <p className="journal-page-kicker">Contents</p>
        <h2>The entries</h2>
        <ol>
          {sheet.chapters.length === 0 ? (
            <li className="journal-empty-contents">This journal is still waiting for its first page.</li>
          ) : (
            sheet.chapters.map((chapter, index) => (
              <li key={chapter.documentId}>
                <button type="button" onClick={() => onOpenContents?.(chapter.sheetIndex)}>
                  <em>{String(index + 1).padStart(2, "0")}</em>
                  <strong>{chapter.title}</strong>
                </button>
              </li>
            ))
          )}
        </ol>
        <span className="journal-sheet-number">{pageLabel}</span>
      </article>
    );
  }

  if (sheet.kind === "cover") {
    return (
      <article className="journal-sheet">
        <span className="journal-sheet-number">{pageLabel}</span>
      </article>
    );
  }

  return (
    <article className={`journal-sheet journal-chapter ${isWriting ? "is-writing" : ""}`}>
      <header className="journal-sheet-header">
        <p className="journal-page-kicker">
          Entry {String(sheet.chapterNumber).padStart(2, "0")}
          {sheet.pageCountInChapter > 1 ? ` · leaf ${sheet.pageInChapter}` : ""}
        </p>
        <h2>{sheet.title}</h2>
        <time dateTime={new Date(sheet.createdAt).toISOString()}>{formatJournalDate(sheet.createdAt)}</time>
      </header>

      {isWriting ? (
        <div className="journal-writing-surface">
          <Editor variant="journal" />
        </div>
      ) : (
        <>
          <p className="journal-sheet-body">{sheet.body || "A blank leaf, ready for ink."}</p>
          {onWrite ? (
            <button type="button" className="journal-write-button" onClick={() => onWrite(sheet.documentId)}>
              Write on this page
            </button>
          ) : null}
        </>
      )}

      <span className="journal-sheet-number">{pageLabel}</span>
    </article>
  );
}
