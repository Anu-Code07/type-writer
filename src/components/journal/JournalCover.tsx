"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import type { CSSProperties } from "react";
import type { CoverPalette } from "@/lib/journal";
import { formatJournalDate } from "@/lib/journal";
import { typewriterSounds } from "@/lib/sounds";
import { useSettingsStore } from "@/store/settingsStore";

interface JournalCoverProps {
  title: string;
  authorName: string;
  createdAt?: number;
  chapterCount?: number;
  wordCount?: number;
  kicker?: string;
  palette: CoverPalette;
  onBeginOpen?: () => void;
  onOpen: () => void;
}

export function JournalCover({
  title,
  authorName,
  createdAt,
  chapterCount,
  wordCount,
  kicker = "Private journal",
  palette,
  onBeginOpen,
  onOpen,
}: JournalCoverProps) {
  const [isOpening, setIsOpening] = useState(false);
  const soundEnabled = useSettingsStore((state) => state.soundEnabled);

  return (
    <motion.button
      type="button"
      className={`journal-cover ${isOpening ? "is-opening" : ""}`}
      aria-label={`Open journal for ${authorName}`}
      style={
        {
          "--leather": palette.leather,
          "--leather-light": palette.leatherLight,
          "--foil": palette.foil,
          "--stitch": palette.stitch,
        } as CSSProperties
      }
      initial={{ rotateY: 12, opacity: 0, scale: 0.96 }}
      animate={
        isOpening
          ? { rotateY: -118, opacity: 0, x: -36, scale: 0.98 }
          : { rotateY: 0, opacity: 1, x: 0, scale: 1 }
      }
      exit={{ opacity: 0, transition: { duration: 0 } }}
      transition={{ duration: isOpening ? 1.05 : 0.7, ease: [0.22, 1, 0.36, 1] }}
      onClick={() => {
        if (isOpening) {
          return;
        }

        void typewriterSounds.unlock();
        typewriterSounds.play("page", soundEnabled);
        onBeginOpen?.();
        setIsOpening(true);
      }}
      onAnimationComplete={() => {
        if (isOpening) {
          onOpen();
        }
      }}
    >
      <span className="journal-cover-grain" />
      <span className="journal-cover-frame" />
      <span className="journal-cover-corners" />
      <span className="journal-cover-kicker">{kicker}</span>
      <strong className="journal-cover-greeting">{authorName}</strong>
      <span className="journal-cover-rule" />
      <strong className="journal-cover-title">{title}</strong>
      {typeof createdAt === "number" &&
      typeof chapterCount === "number" &&
      typeof wordCount === "number" ? (
        <span className="journal-cover-meta">
          {formatJournalDate(createdAt)}
          <em>
            {chapterCount} {chapterCount === 1 ? "entry" : "entries"} · {wordCount} words
          </em>
        </span>
      ) : null}
      {isOpening ? null : <span className="journal-cover-open">Open</span>}
    </motion.button>
  );
}
