import { openDB, type DBSchema } from "idb";

export interface WritingDocument {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface WritingBook {
  id: string;
  title: string;
  documentIds: string[];
  createdAt: number;
  updatedAt: number;
}

export interface TypewriterSettings {
  paper: "ivory" | "white" | "dark";
  font: "courier-prime" | "special-elite" | "american-typewriter" | "ibm-plex-mono";
  fontSize: number;
  soundEnabled: boolean;
  mechanicalEffects: boolean;
  focusMode: boolean;
}

interface TypewriterDatabase extends DBSchema {
  documents: {
    key: string;
    value: WritingDocument;
    indexes: { "by-updated": number };
  };
  books: {
    key: string;
    value: WritingBook;
    indexes: { "by-updated": number };
  };
  preferences: {
    key: string;
    value: TypewriterSettings;
  };
}

const DATABASE_NAME = "premium-typewriter";
const DATABASE_VERSION = 2;
const SETTINGS_KEY = "settings";

const getDatabase = () =>
  openDB<TypewriterDatabase>(DATABASE_NAME, DATABASE_VERSION, {
    upgrade(database) {
      if (!database.objectStoreNames.contains("documents")) {
        const documentStore = database.createObjectStore("documents", { keyPath: "id" });
        documentStore.createIndex("by-updated", "updatedAt");
      }

      if (!database.objectStoreNames.contains("books")) {
        const bookStore = database.createObjectStore("books", { keyPath: "id" });
        bookStore.createIndex("by-updated", "updatedAt");
      }

      if (!database.objectStoreNames.contains("preferences")) {
        database.createObjectStore("preferences");
      }
    },
  });

export const createEmptyDocument = (title = "Untitled"): WritingDocument => {
  const timestamp = Date.now();

  return {
    id: crypto.randomUUID(),
    title,
    content: "",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
};

export const createBook = (title: string, documentIds: string[]): WritingBook => {
  const timestamp = Date.now();

  return {
    id: crypto.randomUUID(),
    title: title.trim() || "Untitled Book",
    documentIds,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
};

export const getAllDocuments = async () => {
  const database = await getDatabase();
  const documents = await database.getAllFromIndex("documents", "by-updated");

  return documents.sort((first, second) => second.updatedAt - first.updatedAt);
};

export const getAllBooks = async () => {
  const database = await getDatabase();
  const books = await database.getAllFromIndex("books", "by-updated");

  return books.sort((first, second) => second.updatedAt - first.updatedAt);
};

export const saveDocument = async (document: WritingDocument) => {
  const database = await getDatabase();
  await database.put("documents", {
    ...document,
    updatedAt: Date.now(),
  });
};

export const storeDocumentSnapshot = async (document: WritingDocument) => {
  const database = await getDatabase();
  await database.put("documents", document);
};

export const saveBook = async (book: WritingBook) => {
  const database = await getDatabase();
  await database.put("books", {
    ...book,
    updatedAt: Date.now(),
  });
};

export const storeBookSnapshot = async (book: WritingBook) => {
  const database = await getDatabase();
  await database.put("books", book);
};

export const deleteDocumentById = async (documentId: string) => {
  const database = await getDatabase();
  await database.delete("documents", documentId);
};

export const deleteBookById = async (bookId: string) => {
  const database = await getDatabase();
  await database.delete("books", bookId);
};

export const loadSettings = async () => {
  const database = await getDatabase();
  return database.get("preferences", SETTINGS_KEY);
};

export const saveSettings = async (settings: TypewriterSettings) => {
  const database = await getDatabase();
  await database.put("preferences", settings, SETTINGS_KEY);
};
