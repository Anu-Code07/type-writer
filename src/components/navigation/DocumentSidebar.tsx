"use client";

import { AnimatePresence, motion } from "framer-motion";
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
  const currentDocumentId = useDocumentStore((state) => state.currentDocumentId);
  const isSidebarOpen = useDocumentStore((state) => state.isSidebarOpen);
  const setSidebarOpen = useDocumentStore((state) => state.setSidebarOpen);
  const createDocument = useDocumentStore((state) => state.createDocument);
  const switchDocument = useDocumentStore((state) => state.switchDocument);
  const renameDocument = useDocumentStore((state) => state.renameDocument);
  const deleteDocument = useDocumentStore((state) => state.deleteDocument);

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
            <p className="panel-kicker">Documents</p>
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
              <button type="button" className="new-document-button" onClick={() => void createDocument()}>
                + New Document
              </button>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
