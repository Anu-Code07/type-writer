"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import type { CSSProperties } from "react";
import { CoverInlineField } from "@/components/journal/CoverInlineField";
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
  onRenameKicker?: (kicker: string) => void;
  onRenameTitle?: (title: string) => void;
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
  onRenameKicker,
  onRenameTitle,
}: JournalCoverProps) {
  const [isOpening, setIsOpening] = useState(false);
  const soundEnabled = useSettingsStore((state) => state.soundEnabled);

  const openCover = () => {
    if (isOpening) {
      return;
    }

    void typewriterSounds.unlock();
    typewriterSounds.play("page", soundEnabled);
    onBeginOpen?.();
    setIsOpening(true);
  };

  return (
    <motion.div
      className={`journal-cover ${isOpening ? "is-opening" : ""}`}
      role="group"
      aria-label={`Closed journal for ${authorName}`}
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
      onClick={(event) => {
        const target = event.target as HTMLElement;

        if (target.closest("input, textarea")) {
          return;
        }

        openCover();
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
      {onRenameKicker ? (
        <CoverInlineField
          className="journal-cover-kicker"
          value={kicker}
          ariaLabel="Manuscript name"
          fallback="Manuscript"
          onSave={onRenameKicker}
        />
      ) : (
        <span className="journal-cover-kicker">{kicker}</span>
      )}
      <strong className="journal-cover-greeting">{authorName}</strong>
      <span className="journal-cover-rule" />
      {onRenameTitle ? (
        <CoverInlineField
          className="journal-cover-title"
          value={title}
          ariaLabel="Book name"
          fallback="Untitled"
          onSave={onRenameTitle}
        />
      ) : (
        <strong className="journal-cover-title">{title}</strong>
      )}
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
      {isOpening ? null : (
        <button
          type="button"
          className="journal-cover-open"
          onClick={(event) => {
            event.stopPropagation();
            openCover();
          }}
        >
          Open
        </button>
      )}
    </motion.div>
  );
}
