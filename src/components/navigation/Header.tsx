"use client";

import { motion } from "framer-motion";
import { useAuthStore } from "@/store/authStore";
import { useDocumentStore } from "@/store/documentStore";
import { useSettingsStore } from "@/store/settingsStore";

export function Header() {
  const documents = useDocumentStore((state) => state.documents);
  const currentDocumentId = useDocumentStore((state) => state.currentDocumentId);
  const isSidebarOpen = useDocumentStore((state) => state.isSidebarOpen);
  const setSidebarOpen = useDocumentStore((state) => state.setSidebarOpen);
  const user = useAuthStore((state) => state.user);
  const setAuthPanelOpen = useAuthStore((state) => state.setAuthPanelOpen);
  const signOut = useAuthStore((state) => state.signOut);
  const isOptionsOpen = useSettingsStore((state) => state.isOptionsOpen);
  const setOptionsOpen = useSettingsStore((state) => state.setOptionsOpen);
  const focusMode = useSettingsStore((state) => state.focusMode);
  const currentDocument = documents.find((document) => document.id === currentDocumentId);

  if (focusMode) {
    return null;
  }

  return (
    <motion.header
      className="typewriter-header"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <button
        type="button"
        className="typewriter-header-button"
        aria-label="Open documents"
        onClick={() => setSidebarOpen(!isSidebarOpen)}
      >
        <span />
        <span />
        <span />
      </button>

      <div className="typewriter-title" title={currentDocument?.title}>
        {currentDocument?.title || "Untitled"}
      </div>

      <div className="typewriter-header-actions">
        {user ? (
          <button type="button" className="typewriter-login-button" onClick={() => void signOut()}>
            Logout
          </button>
        ) : (
          <button type="button" className="typewriter-login-button" onClick={() => setAuthPanelOpen(true)}>
            Login
          </button>
        )}
        <button
          type="button"
          className="typewriter-options-button"
          onClick={() => setOptionsOpen(!isOptionsOpen)}
        >
          Options
        </button>
      </div>
    </motion.header>
  );
}
