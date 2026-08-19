const WRITER_PROFILE_KEY = "typewriter-writer-profile";
const LOCAL_MODE_KEY = "typewriter-local-mode";

export interface CachedWriterProfile {
  id: string;
  displayName: string;
  email?: string;
}

export const isAppOnline = () => typeof navigator === "undefined" || navigator.onLine;

const readJson = <Value,>(key: string): Value | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(key);
    return rawValue ? (JSON.parse(rawValue) as Value) : null;
  } catch {
    return null;
  }
};

export const readCachedWriterProfile = () => readJson<CachedWriterProfile>(WRITER_PROFILE_KEY);

export const writeCachedWriterProfile = (profile: CachedWriterProfile) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(WRITER_PROFILE_KEY, JSON.stringify(profile));
};

export const clearCachedWriterProfile = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(WRITER_PROFILE_KEY);
};

export const readLocalMode = () => {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(LOCAL_MODE_KEY) === "1";
};

export const writeLocalMode = (enabled: boolean) => {
  if (typeof window === "undefined") {
    return;
  }

  if (enabled) {
    window.localStorage.setItem(LOCAL_MODE_KEY, "1");
    return;
  }

  window.localStorage.removeItem(LOCAL_MODE_KEY);
};

export const isNetworkError = (error: unknown) => {
  if (error instanceof TypeError) {
    return true;
  }

  const message = error instanceof Error ? error.message : String(error);
  return /failed to fetch|network|offline|timeout|auth retryable/i.test(message);
};
