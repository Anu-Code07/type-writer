"use client";

import { AnimatePresence } from "framer-motion";
import { AuthPanel } from "@/components/auth/AuthPanel";
import { BookJournal } from "@/components/journal/BookJournal";
import { DocumentSidebar } from "@/components/navigation/DocumentSidebar";
import { Header } from "@/components/navigation/Header";
import { OptionsPanel } from "@/components/settings/OptionsPanel";
import { Typewriter } from "@/components/typewriter/Typewriter";
import { useAutosave } from "@/hooks/useAutosave";
import { useKeyboard } from "@/hooks/useKeyboard";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useTypewriter } from "@/hooks/useTypewriter";
import { useAuthStore } from "@/store/authStore";
import { useDocumentStore } from "@/store/documentStore";
import { useJournalStore } from "@/store/journalStore";

export function AppShell() {
  const lastSavedAt = useDocumentStore((state) => state.lastSavedAt);
  const isCloudSyncing = useDocumentStore((state) => state.isCloudSyncing);
  const cloudSyncError = useDocumentStore((state) => state.cloudSyncError);
  const user = useAuthStore((state) => state.user);
  const openBookId = useJournalStore((state) => state.openBookId);
  const writingDocumentId = useJournalStore((state) => state.writingDocumentId);
  const isOnline = useOnlineStatus();

  useTypewriter();
  useKeyboard();
  useAutosave();

  return (
    <div className="app-shell">
      <Header />
      <AuthPanel />
      <DocumentSidebar />
      <OptionsPanel />
      {openBookId ? null : <Typewriter />}
      <AnimatePresence>{openBookId ? <BookJournal key={openBookId} /> : null}</AnimatePresence>
      <div className="status-indicator" aria-live="polite">
        {!isOnline
          ? "Offline · Saved on this device"
          : isCloudSyncing
            ? "Syncing to cloud"
            : cloudSyncError
              ? "Saved locally · Sync retry pending"
              : writingDocumentId
                ? "Ink on the page"
                : lastSavedAt && user
                  ? "Saved local + cloud"
                  : lastSavedAt
                    ? "Saved locally"
                    : "Local journal ready"}
      </div>
    </div>
  );
}
