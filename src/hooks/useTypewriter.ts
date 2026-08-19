"use client";

import { useEffect } from "react";
import { isAppOnline } from "@/lib/offline";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { useDocumentStore } from "@/store/documentStore";
import { useSettingsStore } from "@/store/settingsStore";

const registerServiceWorker = () => {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  void navigator.serviceWorker.register("/sw.js");
};

export const useTypewriter = () => {
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
    if (!documentsLoaded || !userId || !isAppOnline()) {
      return;
    }

    void syncWithCloud();
  }, [documentsLoaded, syncWithCloud, userId]);

  useEffect(() => {
    if (!settingsLoaded) {
      void loadSettings();
    }
  }, [loadSettings, settingsLoaded]);

  useEffect(() => {
    const syncWhenOnline = () => {
      void supabase?.auth.startAutoRefresh();
      void supabase?.auth.getSession();

      if (useDocumentStore.getState().isLoaded && useAuthStore.getState().user) {
        void useDocumentStore.getState().syncWithCloud();
      }
    };

    const pauseCloud = () => {
      void supabase?.auth.stopAutoRefresh();
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible" && isAppOnline()) {
        syncWhenOnline();
      }
    };

    if (document.readyState === "complete") {
      registerServiceWorker();
    } else {
      window.addEventListener("load", registerServiceWorker, { once: true });
    }

    if (!isAppOnline()) {
      pauseCloud();
    }

    window.addEventListener("online", syncWhenOnline);
    window.addEventListener("offline", pauseCloud);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("load", registerServiceWorker);
      window.removeEventListener("online", syncWhenOnline);
      window.removeEventListener("offline", pauseCloud);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);
};
