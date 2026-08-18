"use client";

import { AnimatePresence, motion } from "framer-motion";
import { exportDocument } from "@/lib/export";
import { useDocumentStore } from "@/store/documentStore";
import { useSettingsStore } from "@/store/settingsStore";

const paperOptions = [
  { label: "Ivory", value: "ivory" },
  { label: "White", value: "white" },
  { label: "Dark", value: "dark" },
] as const;

const fontOptions = [
  { label: "Courier Prime", value: "courier-prime" },
  { label: "Special Elite", value: "special-elite" },
  { label: "American Typewriter", value: "american-typewriter" },
  { label: "IBM Plex Mono", value: "ibm-plex-mono" },
] as const;

export function OptionsPanel() {
  const isOptionsOpen = useSettingsStore((state) => state.isOptionsOpen);
  const setOptionsOpen = useSettingsStore((state) => state.setOptionsOpen);
  const paper = useSettingsStore((state) => state.paper);
  const font = useSettingsStore((state) => state.font);
  const fontSize = useSettingsStore((state) => state.fontSize);
  const soundEnabled = useSettingsStore((state) => state.soundEnabled);
  const mechanicalEffects = useSettingsStore((state) => state.mechanicalEffects);
  const focusMode = useSettingsStore((state) => state.focusMode);
  const updateSettings = useSettingsStore((state) => state.update);
  const documents = useDocumentStore((state) => state.documents);
  const currentDocumentId = useDocumentStore((state) => state.currentDocumentId);
  const currentDocument = documents.find((document) => document.id === currentDocumentId);

  return (
    <AnimatePresence>
      {isOptionsOpen ? (
        <>
          <motion.button
            type="button"
            aria-label="Close options"
            className="panel-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOptionsOpen(false)}
          />
          <motion.aside
            className="options-panel"
            initial={{ x: 360, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 360, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <section>
              <p className="panel-kicker">Appearance</p>
              <div className="segmented-control">
                {paperOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={paper === option.value ? "active" : ""}
                    onClick={() => updateSettings({ paper: option.value })}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <p className="panel-kicker">Font</p>
              <div className="font-options">
                {fontOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={font === option.value ? "active" : ""}
                    onClick={() => updateSettings({ font: option.value })}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <p className="panel-kicker">Font size</p>
              <div className="slider-row">
                <span>12</span>
                <input
                  min={12}
                  max={24}
                  type="range"
                  value={fontSize}
                  onChange={(event) => updateSettings({ fontSize: Number(event.currentTarget.value) })}
                />
                <span>24</span>
              </div>
            </section>

            <section className="toggle-stack">
              <button type="button" className="toggle-row" onClick={() => updateSettings({ soundEnabled: !soundEnabled })}>
                <span>
                  <strong>Typing sounds</strong>
                  <small>Mechanical key, bell, and return sounds</small>
                </span>
                <em>{soundEnabled ? "ON" : "OFF"}</em>
              </button>
              <button
                type="button"
                className="toggle-row"
                onClick={() => updateSettings({ mechanicalEffects: !mechanicalEffects })}
              >
                <span>
                  <strong>Mechanical effects</strong>
                  <small>Carriage vibration and page movement</small>
                </span>
                <em>{mechanicalEffects ? "ON" : "OFF"}</em>
              </button>
              <button type="button" className="toggle-row" onClick={() => updateSettings({ focusMode: !focusMode })}>
                <span>
                  <strong>Focus mode</strong>
                  <small>Hide everything except the page</small>
                </span>
                <em>{focusMode ? "ON" : "OFF"}</em>
              </button>
            </section>

            <section>
              <p className="panel-kicker">Export</p>
              <div className="export-row">
                <button
                  type="button"
                  disabled={!currentDocument}
                  onClick={() => currentDocument && exportDocument(currentDocument, "txt")}
                >
                  Plain Text
                </button>
                <button
                  type="button"
                  disabled={!currentDocument}
                  onClick={() => currentDocument && exportDocument(currentDocument, "markdown")}
                >
                  Markdown
                </button>
                <button type="button" disabled title="PDF export can be added cleanly later.">
                  PDF Soon
                </button>
              </div>
            </section>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
