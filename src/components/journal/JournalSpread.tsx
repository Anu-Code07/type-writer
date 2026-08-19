"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { CSSProperties } from "react";
import { JournalSheetView } from "@/components/journal/JournalSheetView";
import type { CoverPalette, JournalSheet } from "@/lib/journal";

interface JournalSpreadProps {
  left: JournalSheet | null;
  right: JournalSheet | null;
  spreadIndex: number;
  spreadCount: number;
  direction: 1 | -1;
  palette: CoverPalette;
  compact: boolean;
  writingDocumentId: string | null;
  onWrite: (documentId: string) => void;
  onOpenContents: (sheetIndex: number) => void;
  onTurnBack: () => void;
  onTurnForward: () => void;
}

const spreadVariants = {
  enter: (direction: number) => ({
    opacity: 0,
    rotateY: direction > 0 ? 22 : -22,
    x: direction > 0 ? 48 : -48,
  }),
  center: {
    opacity: 1,
    rotateY: 0,
    x: 0,
  },
  exit: (direction: number) => ({
    opacity: 0,
    rotateY: direction > 0 ? -18 : 18,
    x: direction > 0 ? -36 : 36,
  }),
};

export function JournalSpread({
  left,
  right,
  spreadIndex,
  spreadCount,
  direction,
  palette,
  compact,
  writingDocumentId,
  onWrite,
  onOpenContents,
  onTurnBack,
  onTurnForward,
}: JournalSpreadProps) {
  const leftPageNumber = compact ? spreadIndex + 1 : spreadIndex * 2 + 1;
  const rightPageNumber = compact ? spreadIndex + 1 : spreadIndex * 2 + 2;
  const canWriteLeft = left?.kind === "chapter" && writingDocumentId === left.documentId;
  const canWriteRight = right?.kind === "chapter" && writingDocumentId === right.documentId;

  return (
    <div
      className="journal-spread-frame"
      style={
        {
          "--leather": palette.leather,
          "--leather-light": palette.leatherLight,
          "--foil": palette.foil,
        } as CSSProperties
      }
    >
      <span className="journal-board journal-board-left" />
      <span className="journal-board journal-board-right" />
      <span className="journal-gutter" />
      <span className="journal-ribbon" />
      <span
        className="journal-stack journal-stack-left"
        style={{ width: `${8 + (spreadIndex / Math.max(spreadCount, 1)) * 18}px` }}
      />
      <span
        className="journal-stack journal-stack-right"
        style={{ width: `${8 + ((spreadCount - spreadIndex) / Math.max(spreadCount, 1)) * 18}px` }}
      />

      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={spreadIndex}
          className={`journal-spread ${compact ? "is-compact" : ""}`}
          custom={direction}
          variants={spreadVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
        >
          {compact ? null : (
            <JournalSheetView
              sheet={left}
              palette={palette}
              pageLabel={String(leftPageNumber)}
              isWriting={canWriteLeft && !canWriteRight}
              onWrite={left?.kind === "chapter" ? onWrite : undefined}
              onOpenContents={onOpenContents}
            />
          )}
          <JournalSheetView
            sheet={right}
            palette={palette}
            pageLabel={String(rightPageNumber)}
            isWriting={canWriteRight || (compact && canWriteLeft)}
            onWrite={right?.kind === "chapter" ? onWrite : undefined}
            onOpenContents={onOpenContents}
          />
        </motion.div>
      </AnimatePresence>

      <button type="button" className="journal-turn journal-turn-prev" aria-label="Previous page" onClick={onTurnBack}>
        ‹
      </button>
      <button type="button" className="journal-turn journal-turn-next" aria-label="Next page" onClick={onTurnForward}>
        ›
      </button>
    </div>
  );
}
