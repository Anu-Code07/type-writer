"use client";

import { useEffect } from "react";
import { exportDocument } from "@/lib/export";
import { useDocumentStore } from "@/store/documentStore";
import { useEditorStore } from "@/store/editorStore";
import { useSettingsStore } from "@/store/settingsStore";

export const useKeyboard = () => {
  const createDocument = useDocumentStore((state) => state.createDocument);
  const saveCurrentDocument = useDocumentStore((state) => state.saveCurrentDocument);
  const documents = useDocumentStore((state) => state.documents);
  const currentDocumentId = useDocumentStore((state) => state.currentDocumentId);
  const setSidebarOpen = useDocumentStore((state) => state.setSidebarOpen);
  const setOptionsOpen = useSettingsStore((state) => state.setOptionsOpen);
  const toggleFocusMode = useSettingsStore((state) => state.toggleFocusMode);
  const exitFocusMode = useSettingsStore((state) => state.exitFocusMode);
  const replaceDocument = useEditorStore((state) => state.replaceDocument);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isCommand = event.metaKey || event.ctrlKey;
      const currentDocument = documents.find((document) => document.id === currentDocumentId);

      if (event.key === "Escape") {
        exitFocusMode();
        setSidebarOpen(false);
        setOptionsOpen(false);
        return;
      }

      if (!isCommand) {
        return;
      }

      if (event.key.toLowerCase() === "n") {
        event.preventDefault();
        void createDocument().then((document) => replaceDocument(document.content));
        return;
      }

      if (event.key.toLowerCase() === "s" && event.shiftKey) {
        event.preventDefault();
        if (currentDocument) {
          exportDocument(currentDocument, "markdown");
        }
        return;
      }

      if (event.key.toLowerCase() === "s") {
        event.preventDefault();
        void saveCurrentDocument();
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        toggleFocusMode();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    createDocument,
    currentDocumentId,
    documents,
    exitFocusMode,
    replaceDocument,
    saveCurrentDocument,
    setOptionsOpen,
    setSidebarOpen,
    toggleFocusMode,
  ]);
};
