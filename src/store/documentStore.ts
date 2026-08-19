import { create } from "zustand";
import {
  deleteCloudBook,
  deleteCloudDocument,
  syncLibraryWithSupabase,
  upsertCloudBook,
  upsertCloudDocument,
  upsertCloudProfile,
} from "@/lib/cloudSync";
import {
  createBook,
  createEmptyDocument,
  deleteBookById,
  deleteDocumentById,
  getAllBooks,
  getAllDocuments,
  queuePendingDelete,
  saveBook,
  saveDocument,
  type WritingBook,
  type WritingDocument,
} from "@/lib/indexeddb";
import { isAppOnline, isNetworkError } from "@/lib/offline";
import { useAuthStore } from "@/store/authStore";

interface DocumentState {
  documents: WritingDocument[];
  books: WritingBook[];
  currentDocumentId: string | null;
  isLoaded: boolean;
  isSidebarOpen: boolean;
  isCloudSyncing: boolean;
  cloudSyncError: string | null;
  lastSavedAt: number | null;
  loadDocuments: () => Promise<void>;
  syncWithCloud: () => Promise<void>;
  createDocument: () => Promise<WritingDocument>;
  createBookFromDocuments: (title: string, documentIds: string[]) => Promise<WritingBook | null>;
  createJournal: (title?: string) => Promise<WritingBook>;
  addPageToBook: (bookId: string) => Promise<WritingDocument | null>;
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

const getCloudUser = () => useAuthStore.getState().user;

const getErrorMessage = (error: unknown) => (error instanceof Error ? error.message : "Cloud sync failed.");

const shouldIgnoreCloudError = (error: unknown) => !isAppOnline() || isNetworkError(error);

function catchCloud(error: unknown) {
  if (shouldIgnoreCloudError(error)) {
    return;
  }

  useDocumentStore.setState({ cloudSyncError: getErrorMessage(error) });
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  documents: [],
  books: [],
  currentDocumentId: null,
  isLoaded: false,
  isSidebarOpen: false,
  isCloudSyncing: false,
  cloudSyncError: null,
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
  syncWithCloud: async () => {
    const user = getCloudUser();

    if (!user || !isAppOnline() || get().isCloudSyncing) {
      return;
    }

    set({ isCloudSyncing: true, cloudSyncError: null });

    try {
      await upsertCloudProfile(user);

      const syncedLibrary = await syncLibraryWithSupabase({
        user,
        documents: get().documents,
        books: get().books,
      });

      set((state) => ({
        documents: syncedLibrary.documents,
        books: syncedLibrary.books,
        currentDocumentId:
          state.currentDocumentId && syncedLibrary.documents.some((document) => document.id === state.currentDocumentId)
            ? state.currentDocumentId
            : syncedLibrary.documents[0]?.id ?? null,
        isCloudSyncing: false,
        cloudSyncError: null,
        lastSavedAt: Date.now(),
      }));
    } catch (error) {
      set({
        isCloudSyncing: false,
        cloudSyncError: shouldIgnoreCloudError(error) ? null : getErrorMessage(error),
      });
      console.warn("Supabase sync failed", error);
    }
  },
  createDocument: async () => {
    const document = createEmptyDocument("Untitled");
    await saveDocument(document);
    void upsertCloudDocument(document, getCloudUser()).catch(catchCloud);

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

    if (uniqueDocumentIds.length < 1) {
      return null;
    }

    const book = createBook(title, uniqueDocumentIds);
    await saveBook(book);
    void upsertCloudBook(book, getCloudUser()).catch(catchCloud);

    set((state) => ({
      books: sortBooks([book, ...state.books]),
      currentDocumentId: book.documentIds[0],
      isSidebarOpen: false,
      lastSavedAt: Date.now(),
    }));

    return book;
  },
  createJournal: async (title = "My Journal") => {
    const document = createEmptyDocument("First leaf");
    const book = createBook(title, [document.id]);
    await saveDocument(document);
    await saveBook(book);
    void upsertCloudDocument(document, getCloudUser()).catch(catchCloud);
    void upsertCloudBook(book, getCloudUser()).catch(catchCloud);

    set((state) => ({
      documents: sortDocuments([document, ...state.documents]),
      books: sortBooks([book, ...state.books]),
      currentDocumentId: document.id,
      isSidebarOpen: false,
      lastSavedAt: Date.now(),
    }));

    return book;
  },
  addPageToBook: async (bookId) => {
    const book = get().books.find((item) => item.id === bookId);

    if (!book) {
      return null;
    }

    const document = createEmptyDocument(`Entry ${book.documentIds.length + 1}`);
    const updatedBook = {
      ...book,
      documentIds: [...book.documentIds, document.id],
      updatedAt: Date.now(),
    };

    await saveDocument(document);
    await saveBook(updatedBook);
    void upsertCloudDocument(document, getCloudUser()).catch(catchCloud);
    void upsertCloudBook(updatedBook, getCloudUser()).catch(catchCloud);

    set((state) => ({
      documents: sortDocuments([document, ...state.documents]),
      books: sortBooks(state.books.map((item) => (item.id === bookId ? updatedBook : item))),
      currentDocumentId: document.id,
      lastSavedAt: Date.now(),
    }));

    return document;
  },
  deleteBook: async (bookId) => {
    await deleteBookById(bookId);
    await queuePendingDelete("book", bookId);
    void deleteCloudBook(bookId, getCloudUser()).catch(catchCloud);
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
    void upsertCloudDocument(updatedDocument, getCloudUser()).catch(catchCloud);
    set({ lastSavedAt: Date.now() });
  },
  deleteDocument: async (documentId) => {
    const remainingDocuments = get().documents.filter((document) => document.id !== documentId);

    if (remainingDocuments.length === 0) {
      const replacementDocument = createEmptyDocument("Untitled");
      await saveDocument(replacementDocument);
      await deleteDocumentById(documentId);
      await queuePendingDelete("document", documentId);
      await Promise.all(
        get().books.map(async (book) => {
          await deleteBookById(book.id);
          await queuePendingDelete("book", book.id);
        }),
      );
      void deleteCloudDocument(documentId, getCloudUser()).catch(catchCloud);
      get().books.forEach((book) => {
        void deleteCloudBook(book.id, getCloudUser()).catch(catchCloud);
      });
      void upsertCloudDocument(replacementDocument, getCloudUser()).catch(catchCloud);

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
      .filter((book) => book.documentIds.length > 0);
    const removedBooks = get().books.filter((book) => !updatedBooks.some((updatedBook) => updatedBook.id === book.id));

    await deleteDocumentById(documentId);
    await queuePendingDelete("document", documentId);
    await Promise.all([
      ...updatedBooks.map((book) => saveBook(book)),
      ...removedBooks.map(async (book) => {
        await deleteBookById(book.id);
        await queuePendingDelete("book", book.id);
      }),
    ]);
    void deleteCloudDocument(documentId, getCloudUser()).catch(catchCloud);
    updatedBooks.forEach((book) => {
      void upsertCloudBook(book, getCloudUser()).catch(catchCloud);
    });
    removedBooks.forEach((book) => {
      void deleteCloudBook(book.id, getCloudUser()).catch(catchCloud);
    });

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
    void upsertCloudDocument(currentDocument, getCloudUser()).catch(catchCloud);
    set({ lastSavedAt: Date.now() });
  },
  setSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
}));
