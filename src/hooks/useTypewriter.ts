"use client";

import { useEffect } from "react";
import { useDocumentStore } from "@/store/documentStore";
import { useSettingsStore } from "@/store/settingsStore";

export const useTypewriter = () => {
  const loadDocuments = useDocumentStore((state) => state.loadDocuments);
  const documentsLoaded = useDocumentStore((state) => state.isLoaded);
  const loadSettings = useSettingsStore((state) => state.load);
  const settingsLoaded = useSettingsStore((state) => state.isLoaded);

  useEffect(() => {
    if (!documentsLoaded) {
      void loadDocuments();
    }
  }, [documentsLoaded, loadDocuments]);

  useEffect(() => {
    if (!settingsLoaded) {
      void loadSettings();
    }
  }, [loadSettings, settingsLoaded]);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        void navigator.serviceWorker.register("/sw.js");
      });
    }
  }, []);
};
