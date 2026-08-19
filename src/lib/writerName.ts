import type { User } from "@supabase/supabase-js";
import { readCachedWriterProfile } from "@/lib/offline";

const STRANGER_GREETING = "Hey Stranger";

const readMetadataName = (user: User | null | undefined, key: string) => {
  const value = user?.user_metadata?.[key];
  return typeof value === "string" ? value.trim() : "";
};

export const getDisplayNameFromUser = (user: User | null | undefined) =>
  readMetadataName(user, "display_name") || readMetadataName(user, "username");

export const getWriterCoverName = (user: User | null | undefined) =>
  getDisplayNameFromUser(user) || readCachedWriterProfile()?.displayName?.trim() || STRANGER_GREETING;
