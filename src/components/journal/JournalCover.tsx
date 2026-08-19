"use client";

import { motion } from "framer-motion";
import type { CSSProperties } from "react";
import type { CoverPalette } from "@/lib/journal";
import { formatJournalDate } from "@/lib/journal";

interface JournalCoverProps {
  title: string;
  authorName: string;
  createdAt: number;
  chapterCount: number;
  wordCount: number;
  palette: CoverPalette;
  onOpen: () => void;
}

export function JournalCover({
  title,
  authorName,
  createdAt,
  chapterCount,
  wordCount,
  palette,
  onOpen,
}: JournalCoverProps) {
  return (
    <motion.button
      type="button"
      className="journal-cover"
      style={
        {
          "--leather": palette.leather,
          "--leather-light": palette.leatherLight,
          "--foil": palette.foil,
          "--stitch": palette.stitch,
        } as CSSProperties
      }
      initial={{ rotateY: 18, opacity: 0, scale: 0.94 }}
      animate={{ rotateY: 0, opacity: 1, scale: 1 }}
      exit={{ rotateY: -78, opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      onClick={onOpen}
    >
      <span className="journal-cover-grain" />
      <span className="journal-cover-frame" />
      <span className="journal-cover-corners" />
      <span className="journal-cover-kicker">Private journal</span>
      <strong className="journal-cover-title">{title}</strong>
      <span className="journal-cover-rule" />
      <span className="journal-cover-author">{authorName}</span>
      <span className="journal-cover-meta">
        {formatJournalDate(createdAt)}
        <em>
          {chapterCount} {chapterCount === 1 ? "entry" : "entries"} · {wordCount} words
        </em>
      </span>
      <span className="journal-cover-hint">Open the cover</span>
    </motion.button>
  );
}
