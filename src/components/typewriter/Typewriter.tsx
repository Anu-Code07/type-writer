"use client";

import { motion } from "framer-motion";
import { Editor } from "@/components/typewriter/Editor";
import { Paper } from "@/components/typewriter/Paper";
import { useDocumentStore } from "@/store/documentStore";
import { useSettingsStore } from "@/store/settingsStore";

export function Typewriter() {
  const isLoaded = useDocumentStore((state) => state.isLoaded);
  const focusMode = useSettingsStore((state) => state.focusMode);

  return (
    <main className={`typewriter-workspace ${focusMode ? "typewriter-workspace-focus" : ""}`}>
      <motion.div
        className="typewriter-stage"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: isLoaded ? 1 : 0.35, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <Paper>
          <Editor />
        </Paper>
      </motion.div>
    </main>
  );
}
