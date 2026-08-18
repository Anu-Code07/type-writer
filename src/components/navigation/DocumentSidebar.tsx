"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FormEvent, useState } from "react";
import { exportBook } from "@/lib/export";
import { useDocumentStore } from "@/store/documentStore";

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
  const deleteBook = useDocumentStore((state) => state.deleteBook);
  const switchDocument = useDocumentStore((state) => state.switchDocument);
  const renameDocument = useDocumentStore((state) => state.renameDocument);
  const deleteDocument = useDocumentStore((state) => state.deleteDocument);
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

    if (selectedDocumentIds.length < 2) {
      window.alert("Choose at least two documents to create a book.");
      return;
    }

    void createBookFromDocuments(bookTitle, selectedDocumentIds).then((book) => {
      if (!book) {
        return;
      }

      setBookTitle("");
      setSelectedDocumentIds([]);
      setIsCreatingBook(false);
    });
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
            <p className="panel-kicker">Library</p>
            {books.length > 0 ? (
              <div className="book-shelf">
                {books.map((book) => (
                  <div key={book.id} className="book-card">
                    <button type="button" className="book-cover-button" onClick={() => switchDocument(book.documentIds[0])}>
                      <span className="book-cover-decoration" />
                      <strong>{book.title}</strong>
                      <small>
                        {book.documentIds.length} chapters · {formatDocumentDate(book.updatedAt)}
                      </small>
                    </button>
                    <span className="book-card-actions">
                      <button type="button" onClick={() => exportBook(book, documents, "txt")}>
                        TXT
                      </button>
                      <button type="button" onClick={() => exportBook(book, documents, "markdown")}>
                        MD
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
                Combine documents into a book when a draft starts becoming a manuscript.
              </div>
            )}

            <p className="panel-kicker">Documents as books</p>
            <div className="document-list">
              {documents.map((document) => (
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
                    <small>{formatDocumentDate(document.updatedAt)}</small>
                  </button>
                  <span className="document-row-actions">
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
              ))}
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
                      <span>Book title</span>
                      <input
                        value={bookTitle}
                        onChange={(event) => setBookTitle(event.currentTarget.value)}
                        placeholder="Collected Letters"
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
                      <button type="submit">Create Book</button>
                      <button type="button" onClick={() => setIsCreatingBook(false)}>
                        Cancel
                      </button>
                    </div>
                  </motion.form>
                ) : null}
              </AnimatePresence>
              <button type="button" className="new-document-button" onClick={() => void createDocument()}>
                + New Document
              </button>
              <button
                type="button"
                className="new-document-button book-builder-toggle"
                onClick={() => setIsCreatingBook((isOpen) => !isOpen)}
              >
                + Create Book
              </button>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
