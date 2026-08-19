"use client";

import { useEffect } from "react";
import { useDocumentStore } from "@/store/documentStore";

const AUTOSAVE_DELAY_MS = 750;

export const useAutosave = () => {
  const currentDocumentId = useDocumentStore((state) => state.currentDocumentId);
  const currentDocumentContent = useDocumentStore((state) =>
    state.documents.find((document) => document.id === state.currentDocumentId)?.content,
  );
  const saveCurrentDocument = useDocumentStore((state) => state.saveCurrentDocument);
  const isLoaded = useDocumentStore((state) => state.isLoaded);

  useEffect(() => {
    if (!isLoaded || currentDocumentId === null || currentDocumentContent === undefined) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void saveCurrentDocument();
    }, AUTOSAVE_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [currentDocumentContent, currentDocumentId, isLoaded, saveCurrentDocument]);
};
