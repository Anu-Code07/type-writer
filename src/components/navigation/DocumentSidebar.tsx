"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FormEvent, useRef, useState } from "react";
import { exportBook } from "@/lib/export";
import { parseWritingFile } from "@/lib/importFile";
import { useDocumentStore } from "@/store/documentStore";
import { useJournalStore } from "@/store/journalStore";

const formatDocumentDate = (updatedAt: number) => {
  const formatter = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  });

  const today = new Date();
  const date = new Date(updatedAt);
  const isToday = today.toDateString() === date.toDateString();

  if (isToday) {
    return "Today";
  }

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (yesterday.toDateString() === date.toDateString()) {
    return "Yesterday";
  }

  return formatter.format(date);
};

export function DocumentSidebar() {
  const documents = useDocumentStore((state) => state.documents);
  const books = useDocumentStore((state) => state.books);
  const currentDocumentId = useDocumentStore((state) => state.currentDocumentId);
  const isSidebarOpen = useDocumentStore((state) => state.isSidebarOpen);
  const setSidebarOpen = useDocumentStore((state) => state.setSidebarOpen);
  const createDocument = useDocumentStore((state) => state.createDocument);
  const createBookFromDocuments = useDocumentStore((state) => state.createBookFromDocuments);
  const createJournal = useDocumentStore((state) => state.createJournal);
  const deleteBook = useDocumentStore((state) => state.deleteBook);
  const openJournal = useJournalStore((state) => state.openJournal);
  const switchDocument = useDocumentStore((state) => state.switchDocument);
  const renameDocument = useDocumentStore((state) => state.renameDocument);
  const deleteDocument = useDocumentStore((state) => state.deleteDocument);
  const beginWriting = useJournalStore((state) => state.beginWriting);
  const importDocument = useDocumentStore((state) => state.importDocument);
  const addPageToBook = useDocumentStore((state) => state.addPageToBook);
  const closeJournal = useJournalStore((state) => state.closeJournal);
  const openBookId = useJournalStore((state) => state.openBookId);
  const requestLastSpread = useJournalStore((state) => state.requestLastSpread);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const importTargetRef = useRef<string>("loose");
  const [isCreatingBook, setIsCreatingBook] = useState(false);
  const [bookTitle, setBookTitle] = useState("");
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);

  const handleRename = (documentId: string, currentTitle: string) => {
    const nextTitle = window.prompt("Rename document", currentTitle);

    if (nextTitle !== null) {
      void renameDocument(documentId, nextTitle);
    }
  };

  const handleDelete = (documentId: string) => {
    if (window.confirm("Delete this document? This cannot be undone.")) {
      void deleteDocument(documentId);
    }
  };

  const toggleSelectedDocument = (documentId: string) => {
    setSelectedDocumentIds((currentDocumentIds) =>
      currentDocumentIds.includes(documentId)
        ? currentDocumentIds.filter((currentDocumentId) => currentDocumentId !== documentId)
        : [...currentDocumentIds, documentId],
    );
  };

  const handleCreateBook = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (selectedDocumentIds.length < 1) {
      window.alert("Choose at least one page to bind into a journal.");
      return;
    }

    void createBookFromDocuments(bookTitle, selectedDocumentIds).then((book) => {
      if (!book) {
        return;
      }

      setBookTitle("");
      setSelectedDocumentIds([]);
      setIsCreatingBook(false);
      handleOpenJournal(book.id);
    });
  };

  const handleStartBlankJournal = () => {
    void createJournal(bookTitle || "My Journal").then((book) => {
      setBookTitle("");
      setIsCreatingBook(false);
      handleOpenJournal(book.id);
    });
  };

  const handleOpenJournal = (bookId: string) => {
    setSidebarOpen(false);
    openJournal(bookId);
  };

  const handleImportFile = async (file: File | undefined) => {
    if (!file) {
      return;
    }

    const importTarget = importTargetRef.current;

    try {
      const imported = await parseWritingFile(file);

      if (importTarget === "loose") {
        await importDocument(imported.title, imported.content);
        closeJournal();
      } else {
        const document = await addPageToBook(importTarget, imported);

        if (document) {
          if (openBookId !== importTarget) {
            handleOpenJournal(importTarget);
          }

          switchDocument(document.id);
          beginWriting(document.id);
          requestLastSpread();
        }
      }

      setSidebarOpen(false);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Could not import that file.");
    } finally {
      importTargetRef.current = "loose";

      if (importInputRef.current) {
        importInputRef.current.value = "";
      }
    }
  };

  const startImport = (target: string) => {
    importTargetRef.current = target;
    importInputRef.current?.click();
  };

  return (
    <AnimatePresence>
      {isSidebarOpen ? (
        <>
          <motion.button
            type="button"
            aria-label="Close documents"
            className="panel-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          />
          <motion.aside
            className="document-sidebar"
            initial={{ x: -360, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -360, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="panel-kicker">Journals</p>
            {books.length > 0 ? (
              <div className="book-shelf">
                {books.map((book) => (
                  <div key={book.id} className="book-card">
                    <button type="button" className="book-cover-button" onClick={() => handleOpenJournal(book.id)}>
                      <span className="book-cover-decoration" />
                      <strong>{book.title}</strong>
                      <small>
                        {book.documentIds.length} {book.documentIds.length === 1 ? "leaf" : "leaves"} ·{" "}
                        {formatDocumentDate(book.updatedAt)}
                      </small>
                    </button>
                    <span className="book-card-actions">
                      <button type="button" onClick={() => handleOpenJournal(book.id)}>
                        Open
                      </button>
                      <button type="button" onClick={() => exportBook(book, documents, "txt")}>
                        TXT
                      </button>
                      <button type="button" onClick={() => exportBook(book, documents, "markdown")}>
                        MD
                      </button>
                      <button type="button" onClick={() => exportBook(book, documents, "pdf")}>
                        PDF
                      </button>
                      <button type="button" onClick={() => startImport(book.id)}>
                        Import
                      </button>
                      <button type="button" onClick={() => void deleteBook(book.id)}>
                        Delete
                      </button>
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-book-shelf">
                Bind pages into a journal with a cover, contents, and turning leaves.
              </div>
            )}

            <p className="panel-kicker">Loose pages</p>
            <div className="document-list">
              {documents.map((document) => {
                const boundJournal = books.find((book) => book.documentIds.includes(document.id));

                return (
                <div
                  key={document.id}
                  className={`document-row ${document.id === currentDocumentId ? "document-row-active" : ""}`}
                >
                  <button
                    type="button"
                    className="document-select"
                    onClick={() => switchDocument(document.id)}
                  >
                    <span className="document-book-spine" />
                    <strong>{document.title || "Untitled"}</strong>
                    <small>
                      {formatDocumentDate(document.updatedAt)}
                      {boundJournal ? ` · ${boundJournal.title}` : ""}
                    </small>
                  </button>
                  <span className="document-row-actions">
                    {boundJournal ? (
                      <button
                        type="button"
                        onClick={() => {
                          handleOpenJournal(boundJournal.id);
                          switchDocument(document.id);
                          beginWriting(document.id);
                        }}
                      >
                        Journal
                      </button>
                    ) : null}
                    <button
                      type="button"
                      aria-label={`Rename ${document.title}`}
                      onClick={() => handleRename(document.id, document.title)}
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${document.title}`}
                      onClick={() => handleDelete(document.id)}
                    >
                      Delete
                    </button>
                  </span>
                </div>
                );
              })}
            </div>

            <div className="document-sidebar-footer">
              <AnimatePresence>
                {isCreatingBook ? (
                  <motion.form
                    className="book-builder"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleCreateBook}
                  >
                    <label>
                      <span>Journal title</span>
                      <input
                        value={bookTitle}
                        onChange={(event) => setBookTitle(event.currentTarget.value)}
                        placeholder="Morning Pages"
                      />
                    </label>
                    <div className="book-builder-documents">
                      {documents.map((document) => (
                        <label key={document.id}>
                          <input
                            type="checkbox"
                            checked={selectedDocumentIds.includes(document.id)}
                            onChange={() => toggleSelectedDocument(document.id)}
                          />
                          <span>{document.title || "Untitled"}</span>
                        </label>
                      ))}
                    </div>
                    <div className="book-builder-actions">
                      <button type="submit">Bind selected pages</button>
                      <button type="button" onClick={handleStartBlankJournal}>
                        Blank journal
                      </button>
                      <button type="button" onClick={() => setIsCreatingBook(false)}>
                        Cancel
                      </button>
                    </div>
                  </motion.form>
                ) : null}
              </AnimatePresence>
              <button type="button" className="new-document-button" onClick={() => void createDocument()}>
                + New page
              </button>
              <input
                ref={importInputRef}
                accept=".txt,.md,.markdown,text/plain,text/markdown"
                className="import-file-input"
                type="file"
                onChange={(event) => void handleImportFile(event.currentTarget.files?.[0])}
              />
              <button type="button" className="new-document-button" onClick={() => startImport("loose")}>
                + Import .txt / .md
              </button>
              <button
                type="button"
                className="new-document-button book-builder-toggle"
                onClick={() => setIsCreatingBook((isOpen) => !isOpen)}
              >
                + Bind journal
              </button>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
