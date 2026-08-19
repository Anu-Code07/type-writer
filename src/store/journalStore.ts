import { create } from "zustand";
import { readJournalBookmark, writeJournalBookmark } from "@/lib/bookmarks";

interface JournalState {
  openBookId: string | null;
  isCoverOpen: boolean;
  spreadIndex: number;
  turnDirection: 1 | -1;
  writingDocumentId: string | null;
  pendingLastSpread: boolean;
  openJournal: (bookId: string) => void;
  closeJournal: () => void;
  openCover: () => void;
  closeCover: () => void;
  setSpreadIndex: (spreadIndex: number, direction?: 1 | -1) => void;
  beginWriting: (documentId: string) => void;
  stopWriting: () => void;
  requestLastSpread: () => void;
  consumeLastSpreadRequest: () => void;
}

const persistBookmark = (state: Pick<JournalState, "openBookId" | "isCoverOpen" | "spreadIndex">) => {
  if (state.openBookId) {
    writeJournalBookmark(state.openBookId, {
      isCoverOpen: state.isCoverOpen,
      spreadIndex: state.spreadIndex,
    });
  }
};

export const useJournalStore = create<JournalState>((set, get) => ({
  openBookId: null,
  isCoverOpen: false,
  spreadIndex: 0,
  turnDirection: 1,
  writingDocumentId: null,
  pendingLastSpread: false,
  openJournal: (bookId) => {
    const bookmark = readJournalBookmark(bookId);

    set({
      openBookId: bookId,
      isCoverOpen: false,
      spreadIndex: bookmark?.spreadIndex ?? 0,
      turnDirection: 1,
      writingDocumentId: null,
      pendingLastSpread: false,
    });
  },
  closeJournal: () => {
    persistBookmark(get());
    set({
      openBookId: null,
      isCoverOpen: false,
      spreadIndex: 0,
      writingDocumentId: null,
      pendingLastSpread: false,
    });
  },
  openCover: () => {
    const nextState = { ...get(), isCoverOpen: true };
    persistBookmark(nextState);
    set({ isCoverOpen: true });
  },
  closeCover: () => {
    const nextState = { ...get(), isCoverOpen: false, spreadIndex: 0, writingDocumentId: null };
    persistBookmark(nextState);
    set({ isCoverOpen: false, spreadIndex: 0, writingDocumentId: null });
  },
  setSpreadIndex: (spreadIndex, direction = 1) => {
    const nextState = { ...get(), spreadIndex, turnDirection: direction, isCoverOpen: true };
    persistBookmark(nextState);
    set({ spreadIndex, turnDirection: direction, isCoverOpen: true });
  },
  beginWriting: (documentId) => set({ writingDocumentId: documentId, isCoverOpen: true }),
  stopWriting: () => set({ writingDocumentId: null }),
  requestLastSpread: () => set({ pendingLastSpread: true, isCoverOpen: true }),
  consumeLastSpreadRequest: () => set({ pendingLastSpread: false }),
}));
