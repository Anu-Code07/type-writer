"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRef, useState } from "react";
import { exportBook, exportDocument } from "@/lib/export";
import { parseWritingFile } from "@/lib/importFile";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { readCachedWriterProfile } from "@/lib/offline";
import { isSupabaseConfigured } from "@/lib/supabase";
import { getDisplayNameFromUser } from "@/lib/writerName";
import { useAuthStore } from "@/store/authStore";
import { useDocumentStore } from "@/store/documentStore";
import { useJournalStore } from "@/store/journalStore";
import { useSettingsStore } from "@/store/settingsStore";

const paperOptions = [
  { label: "Ivory", value: "ivory" },
  { label: "White", value: "white" },
  { label: "Dark", value: "dark" },
] as const;

const fontOptions = [
  { label: "Courier Prime", value: "courier-prime" },
  { label: "Special Elite", value: "special-elite" },
  { label: "American Typewriter", value: "american-typewriter" },
  { label: "IBM Plex Mono", value: "ibm-plex-mono" },
] as const;

export function OptionsPanel() {
  const isOptionsOpen = useSettingsStore((state) => state.isOptionsOpen);
  const setOptionsOpen = useSettingsStore((state) => state.setOptionsOpen);
  const paper = useSettingsStore((state) => state.paper);
  const font = useSettingsStore((state) => state.font);
  const fontSize = useSettingsStore((state) => state.fontSize);
  const soundEnabled = useSettingsStore((state) => state.soundEnabled);
  const mechanicalEffects = useSettingsStore((state) => state.mechanicalEffects);
  const focusMode = useSettingsStore((state) => state.focusMode);
  const updateSettings = useSettingsStore((state) => state.update);
  const documents = useDocumentStore((state) => state.documents);
  const books = useDocumentStore((state) => state.books);
  const currentDocumentId = useDocumentStore((state) => state.currentDocumentId);
  const importDocument = useDocumentStore((state) => state.importDocument);
  const addPageToBook = useDocumentStore((state) => state.addPageToBook);
  const closeJournal = useJournalStore((state) => state.closeJournal);
  const openBookId = useJournalStore((state) => state.openBookId);
  const requestLastSpread = useJournalStore((state) => state.requestLastSpread);
  const beginWriting = useJournalStore((state) => state.beginWriting);
  const switchDocument = useDocumentStore((state) => state.switchDocument);
  const user = useAuthStore((state) => state.user);
  const setAuthPanelOpen = useAuthStore((state) => state.setAuthPanelOpen);
  const signOut = useAuthStore((state) => state.signOut);
  const currentDocument = documents.find((document) => document.id === currentDocumentId);
  const openBook = books.find((book) => book.id === openBookId);
  const isOnline = useOnlineStatus();
  const cachedProfile = readCachedWriterProfile();
  const accountName =
    getDisplayNameFromUser(user) || user?.email || cachedProfile?.displayName || cachedProfile?.email || "Local writing mode";
  const hasAccount = Boolean(user || cachedProfile);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleImport = async (file: File | undefined) => {
    if (!file) {
      return;
    }

    setIsImporting(true);
    setImportError(null);

    try {
      const imported = await parseWritingFile(file);

      if (openBook) {
        const document = await addPageToBook(openBook.id, imported);

        if (document) {
          switchDocument(document.id);
          beginWriting(document.id);
          requestLastSpread();
        }
      } else {
        await importDocument(imported.title, imported.content);
        closeJournal();
      }

      setOptionsOpen(false);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Could not import that file.");
    } finally {
      setIsImporting(false);

      if (importInputRef.current) {
        importInputRef.current.value = "";
      }
    }
  };

  return (
    <AnimatePresence>
      {isOptionsOpen ? (
        <>
          <motion.button
            type="button"
            aria-label="Close options"
            className="panel-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOptionsOpen(false)}
          />
          <motion.aside
            className="options-panel"
            initial={{ x: 360, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 360, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <section>
              <p className="panel-kicker">Appearance</p>
              <div className="segmented-control">
                {paperOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={paper === option.value ? "active" : ""}
                    onClick={() => updateSettings({ paper: option.value })}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <p className="panel-kicker">Font</p>
              <div className="font-options">
                {fontOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={font === option.value ? "active" : ""}
                    onClick={() => updateSettings({ font: option.value })}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <p className="panel-kicker">Font size</p>
              <div className="slider-row">
                <span>12</span>
                <input
                  min={12}
                  max={24}
                  type="range"
                  value={fontSize}
                  onChange={(event) => updateSettings({ fontSize: Number(event.currentTarget.value) })}
                />
                <span>24</span>
              </div>
            </section>

            <section className="toggle-stack">
              <button type="button" className="toggle-row" onClick={() => updateSettings({ soundEnabled: !soundEnabled })}>
                <span>
                  <strong>Typing sounds</strong>
                  <small>Mechanical key, bell, and return sounds</small>
                </span>
                <em>{soundEnabled ? "ON" : "OFF"}</em>
              </button>
              <button
                type="button"
                className="toggle-row"
                onClick={() => updateSettings({ mechanicalEffects: !mechanicalEffects })}
              >
                <span>
                  <strong>Mechanical effects</strong>
                  <small>Carriage vibration and page movement</small>
                </span>
                <em>{mechanicalEffects ? "ON" : "OFF"}</em>
              </button>
              <button type="button" className="toggle-row" onClick={() => updateSettings({ focusMode: !focusMode })}>
                <span>
                  <strong>Focus mode</strong>
                  <small>Hide everything except the page</small>
                </span>
                <em>{focusMode ? "ON" : "OFF"}</em>
              </button>
            </section>

            <section>
              <p className="panel-kicker">{openBook ? "Export this page" : "Export"}</p>
              <div className="export-row">
                <button
                  type="button"
                  disabled={!currentDocument}
                  onClick={() => currentDocument && exportDocument(currentDocument, "txt")}
                >
                  TXT
                </button>
                <button
                  type="button"
                  disabled={!currentDocument}
                  onClick={() => currentDocument && exportDocument(currentDocument, "markdown")}
                >
                  Markdown
                </button>
                <button
                  type="button"
                  disabled={!currentDocument}
                  onClick={() => currentDocument && exportDocument(currentDocument, "pdf")}
                >
                  PDF
                </button>
              </div>
            </section>

            {openBook ? (
              <section>
                <p className="panel-kicker">Export journal</p>
                <div className="export-row">
                  <button type="button" onClick={() => exportBook(openBook, documents, "txt")}>
                    TXT
                  </button>
                  <button type="button" onClick={() => exportBook(openBook, documents, "markdown")}>
                    Markdown
                  </button>
                  <button type="button" onClick={() => exportBook(openBook, documents, "pdf")}>
                    PDF
                  </button>
                </div>
              </section>
            ) : null}

            <section>
              <p className="panel-kicker">{openBook ? "Import into journal" : "Import"}</p>
              <div className="export-row">
                <input
                  ref={importInputRef}
                  accept=".txt,.md,.markdown,text/plain,text/markdown"
                  className="import-file-input"
                  type="file"
                  onChange={(event) => void handleImport(event.currentTarget.files?.[0])}
                />
                <button type="button" disabled={isImporting} onClick={() => importInputRef.current?.click()}>
                  {isImporting ? "Importing..." : "TXT or Markdown"}
                </button>
              </div>
              {importError ? <p className="import-error">{importError}</p> : null}
            </section>

            <section>
              <p className="panel-kicker">Account</p>
              <div className="account-card">
                <span>
                  <strong>{accountName}</strong>
                  <small>
                    {hasAccount
                      ? isOnline
                        ? "Signed in · syncs to the cloud"
                        : "Signed in · working offline"
                      : isSupabaseConfigured
                        ? "Sign in with email/password or magic link"
                        : "Supabase environment keys are not configured"}
                  </small>
                </span>
                {hasAccount ? (
                  <button type="button" onClick={() => void signOut()}>
                    Sign out
                  </button>
                ) : (
                  <button type="button" onClick={() => setAuthPanelOpen(true)}>
                    Sign in
                  </button>
                )}
              </div>
            </section>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
