import { create } from "zustand";
import {
  createEmptyDocument,
  deleteDocumentById,
  getAllDocuments,
  saveDocument,
  type WritingDocument,
} from "@/lib/indexeddb";

interface DocumentState {
  documents: WritingDocument[];
  currentDocumentId: string | null;
  isLoaded: boolean;
  isSidebarOpen: boolean;
  lastSavedAt: number | null;
  loadDocuments: () => Promise<void>;
  createDocument: () => Promise<WritingDocument>;
  renameDocument: (documentId: string, title: string) => Promise<void>;
  deleteDocument: (documentId: string) => Promise<void>;
  switchDocument: (documentId: string) => void;
  updateCurrentDocumentContent: (content: string) => void;
  saveCurrentDocument: () => Promise<void>;
  setSidebarOpen: (isSidebarOpen: boolean) => void;
}

const sortDocuments = (documents: WritingDocument[]) =>
  [...documents].sort((first, second) => second.updatedAt - first.updatedAt);

export const useDocumentStore = create<DocumentState>((set, get) => ({
  documents: [],
  currentDocumentId: null,
  isLoaded: false,
  isSidebarOpen: false,
  lastSavedAt: null,
  loadDocuments: async () => {
    const documents = await getAllDocuments();

    if (documents.length > 0) {
      set({
        documents,
        currentDocumentId: documents[0].id,
        isLoaded: true,
      });
      return;
    }

    const firstDocument = createEmptyDocument("Untitled");
    await saveDocument(firstDocument);

    set({
      documents: [firstDocument],
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

      set({
        documents: [replacementDocument],
        currentDocumentId: replacementDocument.id,
        isSidebarOpen: false,
      });
      return;
    }

    await deleteDocumentById(documentId);

    set((state) => ({
      documents: remainingDocuments,
      currentDocumentId:
        state.currentDocumentId === documentId ? remainingDocuments[0].id : state.currentDocumentId,
      isSidebarOpen: false,
    }));
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
