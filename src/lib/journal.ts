import type { WritingBook, WritingDocument } from "@/lib/indexeddb";

const CHARACTERS_PER_PAGE = 760;

export interface CoverPalette {
  leather: string;
  leatherLight: string;
  foil: string;
  stitch: string;
  endpaper: string;
}

export type JournalSheet =
  | {
      kind: "cover";
      bookId: string;
      title: string;
      createdAt: number;
      updatedAt: number;
      chapterCount: number;
      wordCount: number;
    }
  | {
      kind: "endpaper";
      side: "front" | "back";
    }
  | {
      kind: "contents";
      chapters: Array<{
        title: string;
        sheetIndex: number;
        documentId: string;
      }>;
    }
  | {
      kind: "chapter";
      documentId: string;
      title: string;
      chapterNumber: number;
      pageInChapter: number;
      pageCountInChapter: number;
      body: string;
      createdAt: number;
    };

const COVER_PALETTES: CoverPalette[] = [
  { leather: "#3c241c", leatherLight: "#5c382c", foil: "#e3c57a", stitch: "#c4a36a", endpaper: "#7a3140" },
  { leather: "#24352c", leatherLight: "#355246", foil: "#d6c39a", stitch: "#b8a078", endpaper: "#3e5c50" },
  { leather: "#2a1e32", leatherLight: "#433250", foil: "#e6d5a8", stitch: "#cbb58a", endpaper: "#6b3d58" },
  { leather: "#1e2a38", leatherLight: "#33485c", foil: "#d7c09a", stitch: "#b79b72", endpaper: "#3f5d72" },
  { leather: "#3a1c1c", leatherLight: "#5a2c2c", foil: "#d4b36a", stitch: "#c09a68", endpaper: "#8a4a38" },
  { leather: "#2c2618", leatherLight: "#4a4030", foil: "#e8d7a4", stitch: "#cbb888", endpaper: "#6d5a38" },
];

export const getCoverPalette = (seed: string): CoverPalette => {
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = seed.charCodeAt(index) + ((hash << 5) - hash);
  }

  return COVER_PALETTES[Math.abs(hash) % COVER_PALETTES.length];
};

export const countWords = (content: string) => (content.trim() ? content.trim().split(/\s+/).length : 0);

export const formatJournalDate = (timestamp: number) =>
  new Intl.DateTimeFormat(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(timestamp));

export const paginateText = (content: string, charactersPerPage = CHARACTERS_PER_PAGE) => {
  const normalized = content.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();

  if (!normalized) {
    return [""];
  }

  const pages: string[] = [];
  let remaining = normalized;

  while (remaining.length > 0) {
    if (remaining.length <= charactersPerPage) {
      pages.push(remaining);
      break;
    }

    const window = remaining.slice(0, charactersPerPage);
    const breakAt = Math.max(window.lastIndexOf("\n\n"), window.lastIndexOf("\n"), window.lastIndexOf(" "));
    const splitAt = breakAt > charactersPerPage * 0.42 ? breakAt : charactersPerPage;
    pages.push(remaining.slice(0, splitAt).trimEnd());
    remaining = remaining.slice(splitAt).replace(/^\s+/, "");
  }

  return pages;
};

const getBookChapters = (book: WritingBook, documents: WritingDocument[]) =>
  book.documentIds
    .map((documentId) => documents.find((document) => document.id === documentId))
    .filter((document): document is WritingDocument => Boolean(document));

export const buildJournalSheets = (book: WritingBook, documents: WritingDocument[]): JournalSheet[] => {
  const chapters = getBookChapters(book, documents);
  const wordCount = chapters.reduce((total, chapter) => total + countWords(chapter.content), 0);
  const sheets: JournalSheet[] = [
    {
      kind: "cover",
      bookId: book.id,
      title: book.title,
      createdAt: book.createdAt,
      updatedAt: book.updatedAt,
      chapterCount: chapters.length,
      wordCount,
    },
    { kind: "endpaper", side: "front" },
  ];

  const contentsIndex = sheets.length;
  sheets.push({ kind: "contents", chapters: [] });

  const contentsChapters: Array<{ title: string; sheetIndex: number; documentId: string }> = [];

  chapters.forEach((chapter, index) => {
    const bodies = paginateText(chapter.content);
    contentsChapters.push({
      title: chapter.title.trim() || "Untitled",
      sheetIndex: sheets.length,
      documentId: chapter.id,
    });

    bodies.forEach((body, pageInChapter) => {
      sheets.push({
        kind: "chapter",
        documentId: chapter.id,
        title: chapter.title.trim() || "Untitled",
        chapterNumber: index + 1,
        pageInChapter: pageInChapter + 1,
        pageCountInChapter: bodies.length,
        body,
        createdAt: chapter.createdAt,
      });
    });
  });

  sheets[contentsIndex] = { kind: "contents", chapters: contentsChapters };
  sheets.push({ kind: "endpaper", side: "back" });
  return sheets;
};

export const getSpreadCount = (sheetCount: number, compact: boolean) => {
  const innerCount = Math.max(0, sheetCount - 1);
  return Math.max(1, compact ? innerCount : Math.ceil(innerCount / 2));
};

export const getSpreadSheets = (sheets: JournalSheet[], spreadIndex: number, compact: boolean) => {
  const innerSheets = sheets.slice(1);

  if (compact) {
    return { left: null, right: innerSheets[spreadIndex] ?? null };
  }

  return {
    left: innerSheets[spreadIndex * 2] ?? null,
    right: innerSheets[spreadIndex * 2 + 1] ?? null,
  };
};

export const spreadIndexForSheet = (sheetIndex: number, compact: boolean) => {
  if (sheetIndex <= 0) {
    return 0;
  }

  const innerIndex = sheetIndex - 1;
  return compact ? innerIndex : Math.floor(innerIndex / 2);
};
