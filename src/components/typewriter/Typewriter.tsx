"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { DeskCover } from "@/components/typewriter/DeskCover";
import { Editor } from "@/components/typewriter/Editor";
import { Paper } from "@/components/typewriter/Paper";
import { getWriterCoverName } from "@/lib/writerName";
import { useAuthStore } from "@/store/authStore";
import { useDocumentStore } from "@/store/documentStore";
import { useSettingsStore } from "@/store/settingsStore";

let deskOpenedThisSession = false;

export function Typewriter() {
  const isLoaded = useDocumentStore((state) => state.isLoaded);
  const documents = useDocumentStore((state) => state.documents);
  const currentDocumentId = useDocumentStore((state) => state.currentDocumentId);
  const renameDocument = useDocumentStore((state) => state.renameDocument);
  const focusMode = useSettingsStore((state) => state.focusMode);
  const manuscriptLabel = useSettingsStore((state) => state.manuscriptLabel);
  const updateSettings = useSettingsStore((state) => state.update);
  const user = useAuthStore((state) => state.user);
  const [isCoverOpen, setIsCoverOpen] = useState(deskOpenedThisSession);
  const [isOpening, setIsOpening] = useState(false);
  const currentDocument = documents.find((document) => document.id === currentDocumentId);
  const coverName = getWriterCoverName(user);

  const handleOpen = () => {
    deskOpenedThisSession = true;
    setIsCoverOpen(true);
    setIsOpening(false);
  };

  return (
    <main className={`typewriter-workspace ${focusMode ? "typewriter-workspace-focus" : ""}`}>
      <motion.div
        className={`typewriter-stage ${isCoverOpen ? "is-open" : "is-closed"} ${isOpening ? "is-opening" : ""}`}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: isLoaded ? 1 : 0.35, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        {isCoverOpen || isOpening ? (
          <Paper>
            <Editor />
          </Paper>
        ) : null}
        <AnimatePresence>
          {isCoverOpen ? null : (
            <DeskCover
              coverName={coverName}
              kicker={manuscriptLabel}
              title={currentDocument?.title || "Untitled"}
              onBeginOpen={() => setIsOpening(true)}
              onOpen={handleOpen}
              onRenameKicker={(nextKicker) => updateSettings({ manuscriptLabel: nextKicker })}
              onRenameTitle={(nextTitle) => {
                if (currentDocument) {
                  void renameDocument(currentDocument.id, nextTitle);
                }
              }}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </main>
  );
}
