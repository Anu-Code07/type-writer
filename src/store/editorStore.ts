import { create } from "zustand";

export interface HistoryState {
  past: string[];
  present: string;
  future: string[];
}

interface EditorState {
  cursorStart: number;
  cursorEnd: number;
  isFocused: boolean;
  returnPulse: number;
  history: HistoryState;
  replaceDocument: (content: string) => void;
  applyContentChange: (content: string, cursorStart: number, cursorEnd: number) => void;
  setSelection: (cursorStart: number, cursorEnd: number) => void;
  setFocused: (isFocused: boolean) => void;
  undo: () => string;
  redo: () => string;
  triggerReturn: () => void;
}

const MAX_HISTORY_ITEMS = 120;

const keepHistorySize = (items: string[]) => items.slice(Math.max(0, items.length - MAX_HISTORY_ITEMS));

export const useEditorStore = create<EditorState>((set, get) => ({
  cursorStart: 0,
  cursorEnd: 0,
  isFocused: false,
  returnPulse: 0,
  history: {
    past: [],
    present: "",
    future: [],
  },
  replaceDocument: (content) =>
    set({
      cursorStart: content.length,
      cursorEnd: content.length,
      history: {
        past: [],
        present: content,
        future: [],
      },
    }),
  applyContentChange: (content, cursorStart, cursorEnd) => {
    const currentHistory = get().history;

    if (content === currentHistory.present) {
      set({ cursorStart, cursorEnd });
      return;
    }

    set({
      cursorStart,
      cursorEnd,
      history: {
        past: keepHistorySize([...currentHistory.past, currentHistory.present]),
        present: content,
        future: [],
      },
    });
  },
  setSelection: (cursorStart, cursorEnd) => set({ cursorStart, cursorEnd }),
  setFocused: (isFocused) => set({ isFocused }),
  undo: () => {
    const { history } = get();
    const previous = history.past.at(-1);

    if (previous === undefined) {
      return history.present;
    }

    const nextPast = history.past.slice(0, -1);

    set({
      cursorStart: previous.length,
      cursorEnd: previous.length,
      history: {
        past: nextPast,
        present: previous,
        future: [history.present, ...history.future],
      },
    });

    return previous;
  },
  redo: () => {
    const { history } = get();
    const next = history.future[0];

    if (next === undefined) {
      return history.present;
    }

    set({
      cursorStart: next.length,
      cursorEnd: next.length,
      history: {
        past: keepHistorySize([...history.past, history.present]),
        present: next,
        future: history.future.slice(1),
      },
    });

    return next;
  },
  triggerReturn: () => set((state) => ({ returnPulse: state.returnPulse + 1 })),
}));
