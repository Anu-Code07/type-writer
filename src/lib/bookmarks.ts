interface JournalBookmark {
  isCoverOpen: boolean;
  spreadIndex: number;
}

const STORAGE_KEY = "typewriter-journal-bookmarks";

const readAllBookmarks = (): Record<string, JournalBookmark> => {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    return rawValue ? (JSON.parse(rawValue) as Record<string, JournalBookmark>) : {};
  } catch {
    return {};
  }
};

export const readJournalBookmark = (bookId: string): JournalBookmark | null => {
  return readAllBookmarks()[bookId] ?? null;
};

export const writeJournalBookmark = (bookId: string, bookmark: JournalBookmark) => {
  if (typeof window === "undefined") {
    return;
  }

  const bookmarks = readAllBookmarks();
  bookmarks[bookId] = bookmark;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
};
