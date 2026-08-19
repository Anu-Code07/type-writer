"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type QuillType from "quill";
import "quill/dist/quill.snow.css";
import { TypewriterMechanism } from "@/components/typewriter/TypewriterMechanism";
import { htmlToPlainText, isEmptyHtml, plainTextToHtml, sanitizeHtml } from "@/lib/richText";
import { typewriterSounds } from "@/lib/sounds";
import { useDocumentStore } from "@/store/documentStore";
import { useEditorStore } from "@/store/editorStore";
import { useSettingsStore } from "@/store/settingsStore";

const fontClasses = {
  "courier-prime": "font-courier-prime",
  "special-elite": "font-special-elite",
  "american-typewriter": "font-american-typewriter",
  "ibm-plex-mono": "font-ibm-plex-mono",
};

interface EditorProps {
  variant?: "typewriter" | "journal";
}

const readEditorHtml = (quill: QuillType) => {
  const html = sanitizeHtml(quill.root.innerHTML);
  return isEmptyHtml(html) ? "" : html;
};

const writeEditorHtml = (quill: QuillType, content: string) => {
  const nextHtml = sanitizeHtml(plainTextToHtml(content));

  if (readEditorHtml(quill) === nextHtml) {
    return;
  }

  quill.setText("");

  if (nextHtml) {
    quill.clipboard.dangerouslyPasteHTML(nextHtml);
  }
};

export function Editor({ variant = "typewriter" }: EditorProps) {
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const quillRef = useRef<QuillType | null>(null);
  const applyingRef = useRef(false);
  const activeDocumentIdRef = useRef<string | null>(null);
  const soundEnabledRef = useRef(true);
  const isJournalRef = useRef(variant === "journal");
  const [isReturning, setIsReturning] = useState(false);
  const [caret, setCaret] = useState({ x: 0, y: 0, height: 24 });
  const documents = useDocumentStore((state) => state.documents);
  const currentDocumentId = useDocumentStore((state) => state.currentDocumentId);
  const returnPulse = useEditorStore((state) => state.returnPulse);
  const fontSize = useSettingsStore((state) => state.fontSize);
  const font = useSettingsStore((state) => state.font);
  const soundEnabled = useSettingsStore((state) => state.soundEnabled);
  const mechanicalEffects = useSettingsStore((state) => state.mechanicalEffects);
  const focusMode = useSettingsStore((state) => state.focusMode);
  const manuscriptLabel = useSettingsStore((state) => state.manuscriptLabel);
  const currentDocument = useMemo(
    () => documents.find((document) => document.id === currentDocumentId),
    [currentDocumentId, documents],
  );
  const isJournal = variant === "journal";
  const editorHeight = Math.max(
    520,
    htmlToPlainText(currentDocument?.content ?? "").split("\n").length * fontSize * 1.8 + 160,
  );

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    isJournalRef.current = isJournal;
  }, [isJournal]);

  useEffect(() => {
    const host = hostRef.current;
    const toolbar = toolbarRef.current;

    if (!host || !toolbar) {
      return undefined;
    }

    let isMounted = true;
    let removeKeyListener: (() => void) | null = null;

    const setup = async () => {
      const { default: Quill } = await import("quill");

      if (!isMounted || quillRef.current) {
        return;
      }

      const quill = new Quill(host, {
        theme: "snow",
        placeholder: isJournalRef.current ? "The leaf is waiting..." : "Begin anywhere...",
        formats: ["header", "bold", "italic", "underline", "strike", "list", "blockquote", "indent", "link", "align"],
        modules: {
          toolbar,
          history: { delay: 400, maxStack: 200, userOnly: true },
        },
      });

      quillRef.current = quill;

      const documentState = useDocumentStore.getState();
      const editorDocument = documentState.documents.find(
        (document) => document.id === documentState.currentDocumentId,
      );

      applyingRef.current = true;
      writeEditorHtml(quill, editorDocument?.content ?? "");
      applyingRef.current = false;
      activeDocumentIdRef.current = editorDocument?.id ?? null;
      useEditorStore.getState().replaceDocument(editorDocument?.content ?? "");

      const syncCaret = () => {
        const selection = quill.getSelection();

        if (!selection) {
          return;
        }

        const bounds = quill.getBounds(selection.index, Math.max(selection.length, 0));

        if (!bounds) {
          return;
        }
        setCaret({
          x: Math.max(0, bounds.left),
          y: Math.max(0, bounds.top),
          height: bounds.height || 24,
        });
      };

      quill.on("text-change", (_delta, _oldContents, source) => {
        if (applyingRef.current || source !== "user") {
          return;
        }

        const html = readEditorHtml(quill);
        useEditorStore.getState().applyContentChange(html, 0, 0);
        useDocumentStore.getState().updateCurrentDocumentContent(html);
        syncCaret();
      });

      quill.on("selection-change", (selection) => {
        useEditorStore.getState().setFocused(Boolean(selection));
        syncCaret();
      });

      const onKeyDown = (event: KeyboardEvent) => {
        void typewriterSounds.unlock();

        if (event.metaKey || event.ctrlKey || event.altKey) {
          return;
        }

        if (event.key === "Enter") {
          typewriterSounds.play("enter", soundEnabledRef.current);
          useEditorStore.getState().triggerReturn();
          setIsReturning(true);
          window.setTimeout(() => setIsReturning(false), 260);
          return;
        }

        if (event.key === "Backspace" || event.key === "Delete") {
          typewriterSounds.play("backspace", soundEnabledRef.current);
          return;
        }

        if (event.key === " ") {
          typewriterSounds.play("space", soundEnabledRef.current);
          return;
        }

        if (event.key.length === 1) {
          typewriterSounds.play("key", soundEnabledRef.current);
        }
      };

      quill.root.addEventListener("keydown", onKeyDown);
      removeKeyListener = () => quill.root.removeEventListener("keydown", onKeyDown);
    };

    void setup();

    return () => {
      isMounted = false;
      removeKeyListener?.();
    };
  }, []);

  useEffect(() => {
    if (!currentDocument || activeDocumentIdRef.current === currentDocument.id) {
      return;
    }

    activeDocumentIdRef.current = currentDocument.id;
    useEditorStore.getState().replaceDocument(currentDocument.content);

    if (quillRef.current) {
      applyingRef.current = true;
      writeEditorHtml(quillRef.current, currentDocument.content);
      applyingRef.current = false;
    }
  }, [currentDocument]);

  return (
    <div className="typewriter-editor-shell">
      {isJournal ? null : <span className="typewriter-manuscript-label">{manuscriptLabel}</span>}
      <div ref={toolbarRef} className={`manuscript-toolbar ${focusMode ? "is-focus" : ""}`}>
        <span className="manuscript-toolbar-kicker">Ink</span>
        <select className="ql-header" defaultValue="" aria-label="Heading">
          <option value="1">Title</option>
          <option value="2">Heading</option>
          <option value="3">Subhead</option>
          <option value="">Body</option>
        </select>
        <button type="button" className="ql-bold" aria-label="Bold" />
        <button type="button" className="ql-italic" aria-label="Italic" />
        <button type="button" className="ql-underline" aria-label="Underline" />
        <button type="button" className="ql-strike" aria-label="Strikethrough" />
        <span className="manuscript-toolbar-rule" />
        <button type="button" className="ql-list" value="ordered" aria-label="Numbered list" />
        <button type="button" className="ql-list" value="bullet" aria-label="Bulleted list" />
        <button type="button" className="ql-blockquote" aria-label="Quote" />
        <button type="button" className="ql-indent" value="-1" aria-label="Outdent" />
        <button type="button" className="ql-indent" value="+1" aria-label="Indent" />
        <span className="manuscript-toolbar-rule" />
        <button type="button" className="ql-link" aria-label="Link" />
        <select className="ql-align" aria-label="Align" defaultValue="">
          <option value="" />
          <option value="center" />
          <option value="right" />
          <option value="justify" />
        </select>
        <button type="button" className="ql-clean" aria-label="Clear formatting" />
      </div>

      <div
        className={`typewriter-editor manuscript-quill ${fontClasses[font]}`}
        style={{ minHeight: isJournal ? "100%" : editorHeight, fontSize, lineHeight: `${fontSize * 1.72}px` }}
      >
        <div ref={hostRef} className="manuscript-host" />
        {isJournal ? null : (
          <TypewriterMechanism
            cursorX={caret.x}
            cursorY={caret.y}
            returnPulse={returnPulse}
            isReturning={isReturning}
            mechanicalEffects={mechanicalEffects}
          />
        )}
      </div>
    </div>
  );
}
