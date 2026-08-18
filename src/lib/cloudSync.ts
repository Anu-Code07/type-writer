import type { User } from "@supabase/supabase-js";
import {
  storeBookSnapshot,
  storeDocumentSnapshot,
  type WritingBook,
  type WritingDocument,
} from "@/lib/indexeddb";
import { supabase } from "@/lib/supabase";

interface DocumentRow {
  id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: number;
  updated_at: number;
}

interface BookRow {
  id: string;
  user_id: string;
  title: string;
  document_ids: string[];
  created_at: number;
  updated_at: number;
}

interface SyncLibraryInput {
  user: User;
  documents: WritingDocument[];
  books: WritingBook[];
}

const toDocumentRow = (document: WritingDocument, userId: string): DocumentRow => ({
  id: document.id,
  user_id: userId,
  title: document.title,
  content: document.content,
  created_at: document.createdAt,
  updated_at: document.updatedAt,
});

const fromDocumentRow = (row: DocumentRow): WritingDocument => ({
  id: row.id,
  title: row.title,
  content: row.content,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toBookRow = (book: WritingBook, userId: string): BookRow => ({
  id: book.id,
  user_id: userId,
  title: book.title,
  document_ids: book.documentIds,
  created_at: book.createdAt,
  updated_at: book.updatedAt,
});

const fromBookRow = (row: BookRow): WritingBook => ({
  id: row.id,
  title: row.title,
  documentIds: row.document_ids,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mergeByNewest = <Entity extends { id: string; updatedAt: number }>(
  localEntities: Entity[],
  remoteEntities: Entity[],
) => {
  const entitiesById = new Map<string, Entity>();

  [...remoteEntities, ...localEntities].forEach((entity) => {
    const existingEntity = entitiesById.get(entity.id);

    if (!existingEntity || entity.updatedAt >= existingEntity.updatedAt) {
      entitiesById.set(entity.id, entity);
    }
  });

  return [...entitiesById.values()].sort((first, second) => second.updatedAt - first.updatedAt);
};

export const syncLibraryWithSupabase = async ({ user, documents, books }: SyncLibraryInput) => {
  if (!supabase) {
    return { documents, books };
  }

  const [{ data: documentRows, error: documentsError }, { data: bookRows, error: booksError }] =
    await Promise.all([
      supabase.from("documents").select("*").eq("user_id", user.id),
      supabase.from("books").select("*").eq("user_id", user.id),
    ]);

  if (documentsError) {
    throw documentsError;
  }

  if (booksError) {
    throw booksError;
  }

  const mergedDocuments = mergeByNewest(
    documents,
    ((documentRows ?? []) as DocumentRow[]).map(fromDocumentRow),
  );
  const mergedBooks = mergeByNewest(books, ((bookRows ?? []) as BookRow[]).map(fromBookRow)).filter((book) =>
    book.documentIds.every((documentId) => mergedDocuments.some((document) => document.id === documentId)),
  );

  await Promise.all([
    ...mergedDocuments.map(storeDocumentSnapshot),
    ...mergedBooks.map(storeBookSnapshot),
    mergedDocuments.length
      ? supabase.from("documents").upsert(mergedDocuments.map((document) => toDocumentRow(document, user.id)))
      : Promise.resolve(),
    mergedBooks.length
      ? supabase.from("books").upsert(mergedBooks.map((book) => toBookRow(book, user.id)))
      : Promise.resolve(),
  ]);

  return {
    documents: mergedDocuments,
    books: mergedBooks,
  };
};

export const upsertCloudDocument = async (document: WritingDocument, user: User | null) => {
  if (!supabase || !user) {
    return;
  }

  const { error } = await supabase.from("documents").upsert(toDocumentRow(document, user.id));

  if (error) {
    throw error;
  }
};

export const upsertCloudBook = async (book: WritingBook, user: User | null) => {
  if (!supabase || !user) {
    return;
  }

  const { error } = await supabase.from("books").upsert(toBookRow(book, user.id));

  if (error) {
    throw error;
  }
};

export const deleteCloudDocument = async (documentId: string, user: User | null) => {
  if (!supabase || !user) {
    return;
  }

  const { error } = await supabase.from("documents").delete().eq("id", documentId).eq("user_id", user.id);

  if (error) {
    throw error;
  }
};

export const deleteCloudBook = async (bookId: string, user: User | null) => {
  if (!supabase || !user) {
    return;
  }

  const { error } = await supabase.from("books").delete().eq("id", bookId).eq("user_id", user.id);

  if (error) {
    throw error;
  }
};
