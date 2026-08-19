import type { Session, User } from "@supabase/supabase-js";
import { create } from "zustand";
import { upsertCloudProfile } from "@/lib/cloudSync";
import {
  clearCachedWriterProfile,
  isAppOnline,
  readCachedWriterProfile,
  readLocalMode,
  writeCachedWriterProfile,
  writeLocalMode,
} from "@/lib/offline";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { getDisplayNameFromUser } from "@/lib/writerName";

interface AuthState {
  session: Session | null;
  user: User | null;
  isLoaded: boolean;
  isAuthPanelOpen: boolean;
  authMessage: string | null;
  authError: string | null;
  hasSkippedAuth: boolean;
  initializeAuth: () => Promise<void>;
  setAuthPanelOpen: (isAuthPanelOpen: boolean) => void;
  continueLocally: () => void;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUpWithPassword: (displayName: string, email: string, password: string) => Promise<void>;
  sendMagicLink: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

let hasAuthListener = false;

const getFriendlyAuthError = (message: string) =>
  message.replace("Invalid login credentials", "That email or password does not look right.");

const cacheWriterFromUser = (user: User | null | undefined) => {
  if (!user) {
    return;
  }

  writeCachedWriterProfile({
    id: user.id,
    displayName: getDisplayNameFromUser(user),
    email: user.email,
  });
  writeLocalMode(false);
};

const shouldOpenAuthPanel = (session: Session | null) => {
  if (session || !isAppOnline() || readLocalMode() || readCachedWriterProfile()) {
    return false;
  }

  return true;
};

const rememberProfile = (user: User | null | undefined) => {
  cacheWriterFromUser(user);

  if (user) {
    void upsertCloudProfile(user).catch((profileError) => {
      console.warn("Could not save profile", profileError);
    });
  }
};

const getSessionSafely = async () => {
  if (!supabase) {
    return { session: null as Session | null, errorMessage: null as string | null };
  }

  const timeoutMs = isAppOnline() ? 8000 : 1200;

  try {
    const result = await Promise.race([
      supabase.auth.getSession(),
      new Promise<never>((_, reject) => {
        window.setTimeout(() => reject(new Error("timeout")), timeoutMs);
      }),
    ]);

    return {
      session: result.data.session,
      errorMessage: result.error?.message ? getFriendlyAuthError(result.error.message) : null,
    };
  } catch {
    return { session: null as Session | null, errorMessage: null as string | null };
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  isLoaded: false,
  isAuthPanelOpen: false,
  authMessage: null,
  authError: null,
  hasSkippedAuth: false,
  initializeAuth: async () => {
    if (!isSupabaseConfigured || !supabase) {
      set({ isLoaded: true, isAuthPanelOpen: false, hasSkippedAuth: readLocalMode() });
      return;
    }

    if (!isAppOnline()) {
      void supabase.auth.stopAutoRefresh();
    }

    const { session, errorMessage } = await getSessionSafely();

    if (session?.user) {
      rememberProfile(session.user);
    }

    set({
      session,
      user: session?.user ?? null,
      isLoaded: true,
      isAuthPanelOpen: shouldOpenAuthPanel(session),
      hasSkippedAuth: !session && readLocalMode(),
      authError: isAppOnline() ? errorMessage : null,
    });

    if (!hasAuthListener) {
      hasAuthListener = true;
      supabase.auth.onAuthStateChange((event, nextSession) => {
        if (event === "SIGNED_OUT" && !isAppOnline()) {
          return;
        }

        if (nextSession?.user) {
          rememberProfile(nextSession.user);
        }

        if (event === "SIGNED_OUT") {
          clearCachedWriterProfile();
        }

        set({
          session: nextSession,
          user: nextSession?.user ?? null,
          isAuthPanelOpen: shouldOpenAuthPanel(nextSession),
          authMessage: null,
          authError: null,
          hasSkippedAuth: !nextSession && readLocalMode(),
        });
      });
    }
  },
  setAuthPanelOpen: (isAuthPanelOpen) => set({ isAuthPanelOpen, authError: null, authMessage: null }),
  continueLocally: () => {
    writeLocalMode(true);
    set({ hasSkippedAuth: true, isAuthPanelOpen: false, authError: null });
  },
  signInWithPassword: async (email, password) => {
    if (!supabase) {
      set({ authError: "Supabase is not configured yet." });
      return;
    }

    if (!isAppOnline()) {
      set({ authError: "You're offline. Writing still saves on this device." });
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      set({ authError: getFriendlyAuthError(error.message), authMessage: null });
      return;
    }

    rememberProfile(data.user);

    set({
      session: data.session,
      user: data.user,
      isAuthPanelOpen: false,
      authError: null,
      authMessage: "Signed in.",
    });
  },
  signUpWithPassword: async (displayName, email, password) => {
    if (!supabase) {
      set({ authError: "Supabase is not configured yet." });
      return;
    }

    if (!isAppOnline()) {
      set({ authError: "You're offline. Writing still saves on this device." });
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName.trim(),
          username: displayName.trim(),
        },
      },
    });

    if (error) {
      set({ authError: getFriendlyAuthError(error.message), authMessage: null });
      return;
    }

    rememberProfile(data.user);

    set({
      session: data.session,
      user: data.user,
      isAuthPanelOpen: !data.session,
      authError: null,
      authMessage: data.session
        ? "Account created. You should now appear in Supabase Authentication and the profiles table."
        : "Check your email to confirm your account, then come back to sign in.",
    });
  },
  sendMagicLink: async (email) => {
    if (!supabase) {
      set({ authError: "Supabase is not configured yet." });
      return;
    }

    if (!isAppOnline()) {
      set({ authError: "You're offline. Writing still saves on this device." });
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      set({ authError: getFriendlyAuthError(error.message), authMessage: null });
      return;
    }

    set({ authError: null, authMessage: "Magic link sent. Check your email." });
  },
  signOut: async () => {
    if (!supabase) {
      clearCachedWriterProfile();
      set({ session: null, user: null, isAuthPanelOpen: isAppOnline(), hasSkippedAuth: readLocalMode() });
      return;
    }

    if (isAppOnline()) {
      await supabase.auth.signOut();
    }

    clearCachedWriterProfile();
    set({ session: null, user: null, isAuthPanelOpen: isAppOnline(), hasSkippedAuth: false });
  },
}));
