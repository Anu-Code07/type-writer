"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { JournalCover } from "@/components/journal/JournalCover";
import { JournalSpread } from "@/components/journal/JournalSpread";
import {
  buildJournalSheets,
  getCoverPalette,
  getSpreadCount,
  getSpreadSheets,
  spreadIndexForSheet,
} from "@/lib/journal";
import { typewriterSounds } from "@/lib/sounds";
import { getWriterCoverName } from "@/lib/writerName";
import { useAuthStore } from "@/store/authStore";
import { useDocumentStore } from "@/store/documentStore";
import { useJournalStore } from "@/store/journalStore";
import { useSettingsStore } from "@/store/settingsStore";

const useCompactJournal = () => {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 860px)");
    const update = () => setCompact(mediaQuery.matches);

    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  return compact;
};

export function BookJournal() {
  const compact = useCompactJournal();
  const touchStartXRef = useRef<number | null>(null);
  const books = useDocumentStore((state) => state.books);
  const documents = useDocumentStore((state) => state.documents);
  const addPageToBook = useDocumentStore((state) => state.addPageToBook);
  const switchDocument = useDocumentStore((state) => state.switchDocument);
  const openBookId = useJournalStore((state) => state.openBookId);
  const isCoverOpen = useJournalStore((state) => state.isCoverOpen);
  const spreadIndex = useJournalStore((state) => state.spreadIndex);
  const turnDirection = useJournalStore((state) => state.turnDirection);
  const writingDocumentId = useJournalStore((state) => state.writingDocumentId);
  const pendingLastSpread = useJournalStore((state) => state.pendingLastSpread);
  const closeJournal = useJournalStore((state) => state.closeJournal);
  const openCover = useJournalStore((state) => state.openCover);
  const closeCover = useJournalStore((state) => state.closeCover);
  const setSpreadIndex = useJournalStore((state) => state.setSpreadIndex);
  const beginWriting = useJournalStore((state) => state.beginWriting);
  const stopWriting = useJournalStore((state) => state.stopWriting);
  const requestLastSpread = useJournalStore((state) => state.requestLastSpread);
  const consumeLastSpreadRequest = useJournalStore((state) => state.consumeLastSpreadRequest);
  const user = useAuthStore((state) => state.user);
  const soundEnabled = useSettingsStore((state) => state.soundEnabled);
  const focusMode = useSettingsStore((state) => state.focusMode);
  const book = books.find((item) => item.id === openBookId);

  const sheets = useMemo(() => (book ? buildJournalSheets(book, documents) : []), [book, documents]);
  const spreadCount = getSpreadCount(sheets.length, compact);
  const { left, right } = getSpreadSheets(sheets, spreadIndex, compact);
  const palette = getCoverPalette(book?.id ?? "journal");
  const coverSheet = sheets[0]?.kind === "cover" ? sheets[0] : null;
  const authorName = getWriterCoverName(user);

  useEffect(() => {
    if (openBookId && !book) {
      closeJournal();
    }
  }, [book, closeJournal, openBookId]);

  useEffect(() => {
    if (!pendingLastSpread) {
      return;
    }

    setSpreadIndex(spreadCount - 1, 1);
    consumeLastSpreadRequest();
  }, [consumeLastSpreadRequest, pendingLastSpread, setSpreadIndex, spreadCount]);

  useEffect(() => {
    if (spreadIndex > spreadCount - 1) {
      setSpreadIndex(Math.max(0, spreadCount - 1), -1);
    }
  }, [setSpreadIndex, spreadCount, spreadIndex]);

  const playPageSound = useCallback(() => {
    void typewriterSounds.unlock();
    typewriterSounds.play("page", soundEnabled);
  }, [soundEnabled]);

  const turnForward = useCallback(() => {
    if (!isCoverOpen) {
      playPageSound();
      openCover();
      return;
    }

    if (spreadIndex >= spreadCount - 1) {
      return;
    }

    playPageSound();
    stopWriting();
    setSpreadIndex(spreadIndex + 1, 1);
  }, [isCoverOpen, openCover, playPageSound, setSpreadIndex, spreadCount, spreadIndex, stopWriting]);

  const turnBack = useCallback(() => {
    if (!isCoverOpen) {
      return;
    }

    playPageSound();
    stopWriting();

    if (spreadIndex <= 0) {
      closeCover();
      return;
    }

    setSpreadIndex(spreadIndex - 1, -1);
  }, [closeCover, isCoverOpen, playPageSound, setSpreadIndex, spreadIndex, stopWriting]);

  const handleWrite = (documentId: string) => {
    switchDocument(documentId);
    beginWriting(documentId);
  };

  const handleOpenContents = (sheetIndex: number) => {
    stopWriting();
    setSpreadIndex(spreadIndexForSheet(sheetIndex, compact), 1);
  };

  const handleAddPage = () => {
    if (!book) {
      return;
    }

    void addPageToBook(book.id).then((document) => {
      if (!document) {
        return;
      }

      switchDocument(document.id);
      beginWriting(document.id);
      requestLastSpread();
      playPageSound();
    });
  };

  useEffect(() => {
    if (!openBookId) {
      return undefined;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const inField = target?.tagName === "TEXTAREA" || target?.tagName === "INPUT";

      if (event.key === "Escape") {
        if (focusMode) {
          return;
        }

        if (writingDocumentId) {
          stopWriting();
          return;
        }

        if (isCoverOpen) {
          closeCover();
          return;
        }

        closeJournal();
        return;
      }

      if (inField) {
        return;
      }

      if (event.key === "ArrowRight" || event.key === "PageDown") {
        event.preventDefault();
        turnForward();
      }

      if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        turnBack();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    closeCover,
    closeJournal,
    focusMode,
    isCoverOpen,
    openBookId,
    stopWriting,
    turnBack,
    turnForward,
    writingDocumentId,
  ]);

  if (!book || !coverSheet) {
    return null;
  }

  return (
    <motion.div
      className={`journal-scene ${focusMode ? "is-focus" : ""}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onTouchStart={(event) => {
        touchStartXRef.current = event.changedTouches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        if (touchStartXRef.current === null) {
          return;
        }

        const delta = (event.changedTouches[0]?.clientX ?? 0) - touchStartXRef.current;
        touchStartXRef.current = null;

        if (delta < -56) {
          turnForward();
        }

        if (delta > 56) {
          turnBack();
        }
      }}
    >
      <div className="journal-lamp" />
      {focusMode ? null : (
        <div className="journal-toolbar">
          <button type="button" onClick={closeJournal}>
            Back to desk
          </button>
          <p>
            <strong>{book.title}</strong>
            <span>
              {isCoverOpen
                ? `Pages ${compact ? spreadIndex + 1 : spreadIndex * 2 + 1}–${compact ? spreadIndex + 1 : spreadIndex * 2 + 2}`
                : "Closed on the desk"}
            </span>
          </p>
          <button type="button" onClick={handleAddPage}>
            New leaf
          </button>
        </div>
      )}

      <div className={`journal-volume ${isCoverOpen ? "is-open" : ""}`}>
        <AnimatePresence mode="wait">
          {isCoverOpen ? (
            <motion.div
              key="spread"
              initial={{ opacity: 0, y: 24, rotateX: 8 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              exit={{ opacity: 0, y: 18 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <JournalSpread
                left={left}
                right={right}
                spreadIndex={spreadIndex}
                spreadCount={spreadCount}
                direction={turnDirection}
                palette={palette}
                compact={compact}
                writingDocumentId={writingDocumentId}
                onWrite={handleWrite}
                onOpenContents={handleOpenContents}
                onTurnBack={turnBack}
                onTurnForward={turnForward}
              />
            </motion.div>
          ) : (
            <JournalCover
              key="cover"
              title={coverSheet.title}
              authorName={authorName}
              createdAt={coverSheet.createdAt}
              chapterCount={coverSheet.chapterCount}
              wordCount={coverSheet.wordCount}
              palette={palette}
              onOpen={openCover}
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
