"use client";

import { ChangeEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { Cursor } from "@/components/typewriter/Cursor";
import { TypewriterMechanism } from "@/components/typewriter/TypewriterMechanism";
import { useCursorPosition } from "@/hooks/useCursorPosition";
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

const getTextHeight = (content: string, fontSize: number) => {
  const hardLines = content.split("\n").length;
  const softLines = Math.ceil(content.length / 62);
  return Math.max(520, (hardLines + softLines + 7) * fontSize * 1.72);
};

export function Editor() {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const textLayerRef = useRef<HTMLDivElement | null>(null);
  const activeDocumentIdRef = useRef<string | null>(null);
  const [isReturning, setIsReturning] = useState(false);
  const documents = useDocumentStore((state) => state.documents);
  const currentDocumentId = useDocumentStore((state) => state.currentDocumentId);
  const updateCurrentDocumentContent = useDocumentStore((state) => state.updateCurrentDocumentContent);
  const content = useEditorStore((state) => state.history.present);
  const cursorStart = useEditorStore((state) => state.cursorStart);
  const cursorEnd = useEditorStore((state) => state.cursorEnd);
  const isFocused = useEditorStore((state) => state.isFocused);
  const returnPulse = useEditorStore((state) => state.returnPulse);
  const replaceDocument = useEditorStore((state) => state.replaceDocument);
  const applyContentChange = useEditorStore((state) => state.applyContentChange);
  const setSelection = useEditorStore((state) => state.setSelection);
  const setFocused = useEditorStore((state) => state.setFocused);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const triggerReturn = useEditorStore((state) => state.triggerReturn);
  const fontSize = useSettingsStore((state) => state.fontSize);
  const font = useSettingsStore((state) => state.font);
  const soundEnabled = useSettingsStore((state) => state.soundEnabled);
  const mechanicalEffects = useSettingsStore((state) => state.mechanicalEffects);
  const cursorPosition = useCursorPosition(content, cursorStart, fontSize, textLayerRef);
  const currentDocument = useMemo(
    () => documents.find((document) => document.id === currentDocumentId),
    [currentDocumentId, documents],
  );
  const editorHeight = getTextHeight(content, fontSize);

  useEffect(() => {
    if (currentDocument && activeDocumentIdRef.current !== currentDocument.id) {
      activeDocumentIdRef.current = currentDocument.id;
      replaceDocument(currentDocument.content);
    }
  }, [currentDocument, replaceDocument]);

  useEffect(() => {
    const textarea = textareaRef.current;

    if (textarea && document.activeElement === textarea) {
      requestAnimationFrame(() => textarea.setSelectionRange(cursorStart, cursorEnd));
    }
  }, [cursorEnd, cursorStart, content]);

  const commitContent = (nextContent: string, nextCursorStart: number, nextCursorEnd: number) => {
    applyContentChange(nextContent, nextCursorStart, nextCursorEnd);
    updateCurrentDocumentContent(nextContent);
  };

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    commitContent(event.currentTarget.value, event.currentTarget.selectionStart, event.currentTarget.selectionEnd);
  };

  const updateSelectionFromTextarea = () => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    setSelection(textarea.selectionStart, textarea.selectionEnd);
  };

  const insertText = (text: string) => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    const nextContent = `${content.slice(0, textarea.selectionStart)}${text}${content.slice(
      textarea.selectionEnd,
    )}`;
    const nextCursor = textarea.selectionStart + text.length;

    commitContent(nextContent, nextCursor, nextCursor);
    requestAnimationFrame(() => textarea.setSelectionRange(nextCursor, nextCursor));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    void typewriterSounds.unlock();

    const isCommand = event.metaKey || event.ctrlKey;

    if (isCommand && event.key.toLowerCase() === "z") {
      event.preventDefault();
      const nextContent = event.shiftKey ? redo() : undo();
      updateCurrentDocumentContent(nextContent);
      return;
    }

    if (event.key === "Tab") {
      event.preventDefault();
      insertText("  ");
      typewriterSounds.play("space", soundEnabled);
      return;
    }

    if (isCommand || event.altKey) {
      return;
    }

    if (event.key === "Enter") {
      typewriterSounds.play("enter", soundEnabled);
      triggerReturn();
      setIsReturning(true);
      window.setTimeout(() => setIsReturning(false), 260);
      return;
    }

    if (event.key === "Backspace" || event.key === "Delete") {
      typewriterSounds.play("backspace", soundEnabled);
      return;
    }

    if (event.key === " ") {
      typewriterSounds.play("space", soundEnabled);
      return;
    }

    if (event.key.length === 1) {
      typewriterSounds.play("key", soundEnabled);
    }
  };

  return (
    <div className="typewriter-editor-shell" onClick={() => textareaRef.current?.focus()}>
      <div
        className={`typewriter-editor ${fontClasses[font]}`}
        style={{ minHeight: editorHeight, fontSize, lineHeight: `${fontSize * 1.72}px` }}
      >
        <div ref={textLayerRef} className="typewriter-text-layer" aria-hidden="true">
          {content.length > 0 ? content : <span className="typewriter-placeholder">Begin anywhere...</span>}
          <Cursor
            x={cursorPosition.x}
            y={cursorPosition.y}
            lineHeight={cursorPosition.lineHeight}
            isVisible={isFocused && cursorStart === cursorEnd}
          />
          <TypewriterMechanism
            cursorX={cursorPosition.x}
            cursorY={cursorPosition.y}
            returnPulse={returnPulse}
            isReturning={isReturning}
            mechanicalEffects={mechanicalEffects}
          />
        </div>
        <textarea
          ref={textareaRef}
          aria-label="Typewriter writing area"
          className="typewriter-input-layer"
          spellCheck={false}
          value={content}
          onBlur={() => setFocused(false)}
          onChange={handleChange}
          onClick={updateSelectionFromTextarea}
          onFocus={() => setFocused(true)}
          onKeyDown={handleKeyDown}
          onKeyUp={updateSelectionFromTextarea}
          onPaste={() => typewriterSounds.play("key", soundEnabled)}
          onSelect={updateSelectionFromTextarea}
          style={{ minHeight: editorHeight, fontSize, lineHeight: `${fontSize * 1.72}px` }}
        />
      </div>
    </div>
  );
}
