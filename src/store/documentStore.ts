import { create } from "zustand";
import {
  createBook,
  createEmptyDocument,
  deleteBookById,
  deleteDocumentById,
  getAllBooks,
  getAllDocuments,
  saveBook,
  saveDocument,
  type WritingBook,
  type WritingDocument,
} from "@/lib/indexeddb";

interface DocumentState {
  documents: WritingDocument[];
  books: WritingBook[];
  currentDocumentId: string | null;
  isLoaded: boolean;
  isSidebarOpen: boolean;
  lastSavedAt: number | null;
  loadDocuments: () => Promise<void>;
  createDocument: () => Promise<WritingDocument>;
  createBookFromDocuments: (title: string, documentIds: string[]) => Promise<WritingBook | null>;
  deleteBook: (bookId: string) => Promise<void>;
  renameDocument: (documentId: string, title: string) => Promise<void>;
  deleteDocument: (documentId: string) => Promise<void>;
  switchDocument: (documentId: string) => void;
  updateCurrentDocumentContent: (content: string) => void;
  saveCurrentDocument: () => Promise<void>;
  setSidebarOpen: (isSidebarOpen: boolean) => void;
}

const sortDocuments = (documents: WritingDocument[]) =>
  [...documents].sort((first, second) => second.updatedAt - first.updatedAt);

const sortBooks = (books: WritingBook[]) => [...books].sort((first, second) => second.updatedAt - first.updatedAt);

export const useDocumentStore = create<DocumentState>((set, get) => ({
  documents: [],
  books: [],
  currentDocumentId: null,
  isLoaded: false,
  isSidebarOpen: false,
  lastSavedAt: null,
  loadDocuments: async () => {
    const [documents, books] = await Promise.all([getAllDocuments(), getAllBooks()]);

    if (documents.length > 0) {
      set({
        documents,
        books,
        currentDocumentId: documents[0].id,
        isLoaded: true,
      });
      return;
    }

    const firstDocument = createEmptyDocument("Untitled");
    await saveDocument(firstDocument);

    set({
      documents: [firstDocument],
      books,
      currentDocumentId: firstDocument.id,
      isLoaded: true,
      lastSavedAt: Date.now(),
    });
  },
  createDocument: async () => {
    const document = createEmptyDocument("Untitled");
    await saveDocument(document);

    set((state) => ({
      documents: sortDocuments([document, ...state.documents]),
      currentDocumentId: document.id,
      isSidebarOpen: false,
      lastSavedAt: Date.now(),
    }));

    return document;
  },
  createBookFromDocuments: async (title, documentIds) => {
    const uniqueDocumentIds = documentIds.filter(
      (documentId, index) =>
        documentIds.indexOf(documentId) === index &&
        get().documents.some((document) => document.id === documentId),
    );

    if (uniqueDocumentIds.length < 2) {
      return null;
    }

    const book = createBook(title, uniqueDocumentIds);
    await saveBook(book);

    set((state) => ({
      books: sortBooks([book, ...state.books]),
      currentDocumentId: book.documentIds[0],
      isSidebarOpen: false,
      lastSavedAt: Date.now(),
    }));

    return book;
  },
  deleteBook: async (bookId) => {
    await deleteBookById(bookId);
    set((state) => ({
      books: state.books.filter((book) => book.id !== bookId),
      lastSavedAt: Date.now(),
    }));
  },
  renameDocument: async (documentId, title) => {
    const sanitizedTitle = title.trim() || "Untitled";
    const document = get().documents.find((item) => item.id === documentId);

    if (!document) {
      return;
    }

    const updatedDocument = {
      ...document,
      title: sanitizedTitle,
      updatedAt: Date.now(),
    };

    set((state) => ({
      documents: sortDocuments(
        state.documents.map((item) => (item.id === documentId ? updatedDocument : item)),
      ),
    }));

    await saveDocument(updatedDocument);
    set({ lastSavedAt: Date.now() });
  },
  deleteDocument: async (documentId) => {
    const remainingDocuments = get().documents.filter((document) => document.id !== documentId);

    if (remainingDocuments.length === 0) {
      const replacementDocument = createEmptyDocument("Untitled");
      await saveDocument(replacementDocument);
      await deleteDocumentById(documentId);
      await Promise.all(get().books.map((book) => deleteBookById(book.id)));

      set({
        documents: [replacementDocument],
        books: [],
        currentDocumentId: replacementDocument.id,
        isSidebarOpen: false,
      });
      return;
    }

    const updatedBooks = get()
      .books.map((book) => ({
        ...book,
        documentIds: book.documentIds.filter((bookDocumentId) => bookDocumentId !== documentId),
      }))
      .filter((book) => book.documentIds.length > 1);
    const removedBooks = get().books.filter((book) => !updatedBooks.some((updatedBook) => updatedBook.id === book.id));

    await deleteDocumentById(documentId);
    await Promise.all([
      ...updatedBooks.map((book) => saveBook(book)),
      ...removedBooks.map((book) => deleteBookById(book.id)),
    ]);

    set({
      documents: remainingDocuments,
      books: updatedBooks,
      currentDocumentId: get().currentDocumentId === documentId ? remainingDocuments[0].id : get().currentDocumentId,
      isSidebarOpen: false,
    });
  },
  switchDocument: (documentId) => {
    if (get().documents.some((document) => document.id === documentId)) {
      set({ currentDocumentId: documentId, isSidebarOpen: false });
    }
  },
  updateCurrentDocumentContent: (content) => {
    const timestamp = Date.now();

    set((state) => ({
      documents: state.documents.map((document) =>
        document.id === state.currentDocumentId
          ? {
              ...document,
              content,
              updatedAt: timestamp,
            }
          : document,
      ),
    }));
  },
  saveCurrentDocument: async () => {
    const currentDocument = get().documents.find((document) => document.id === get().currentDocumentId);

    if (!currentDocument) {
      return;
    }

    await saveDocument(currentDocument);
    set({ lastSavedAt: Date.now() });
  },
  setSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
}));
