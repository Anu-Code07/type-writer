"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { useDocumentStore } from "@/store/documentStore";
import { useSettingsStore } from "@/store/settingsStore";

export const useTypewriter = () => {
  const lastSyncedUserIdRef = useRef<string | null>(null);
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const authLoaded = useAuthStore((state) => state.isLoaded);
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const loadDocuments = useDocumentStore((state) => state.loadDocuments);
  const documentsLoaded = useDocumentStore((state) => state.isLoaded);
  const syncWithCloud = useDocumentStore((state) => state.syncWithCloud);
  const loadSettings = useSettingsStore((state) => state.load);
  const settingsLoaded = useSettingsStore((state) => state.isLoaded);

  useEffect(() => {
    if (!authLoaded) {
      void initializeAuth();
    }
  }, [authLoaded, initializeAuth]);

  useEffect(() => {
    if (!documentsLoaded) {
      void loadDocuments();
    }
  }, [documentsLoaded, loadDocuments]);

  useEffect(() => {
    if (!documentsLoaded || !userId || lastSyncedUserIdRef.current === userId) {
      return;
    }

    lastSyncedUserIdRef.current = userId;
    void syncWithCloud();
  }, [documentsLoaded, syncWithCloud, userId]);

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
