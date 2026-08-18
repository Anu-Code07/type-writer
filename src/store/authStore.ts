import type { Session, User } from "@supabase/supabase-js";
import { create } from "zustand";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

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
      set({ isLoaded: true, isAuthPanelOpen: false });
      return;
    }

    const { data, error } = await supabase.auth.getSession();

    set({
      session: data.session,
      user: data.session?.user ?? null,
      isLoaded: true,
      isAuthPanelOpen: !data.session,
      authError: error?.message ? getFriendlyAuthError(error.message) : null,
    });

    if (!hasAuthListener) {
      hasAuthListener = true;
      supabase.auth.onAuthStateChange((_event, nextSession) => {
        set({
          session: nextSession,
          user: nextSession?.user ?? null,
          isAuthPanelOpen: nextSession ? false : true,
          authMessage: null,
          authError: null,
          hasSkippedAuth: false,
        });
      });
    }
  },
  setAuthPanelOpen: (isAuthPanelOpen) => set({ isAuthPanelOpen, authError: null, authMessage: null }),
  continueLocally: () => set({ hasSkippedAuth: true, isAuthPanelOpen: false, authError: null }),
  signInWithPassword: async (email, password) => {
    if (!supabase) {
      set({ authError: "Supabase is not configured yet." });
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      set({ authError: getFriendlyAuthError(error.message), authMessage: null });
      return;
    }

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

    set({
      session: data.session,
      user: data.user,
      isAuthPanelOpen: !data.session,
      authError: null,
      authMessage: data.session
        ? "Account created."
        : "Check your email to confirm your account, then come back to sign in.",
    });
  },
  sendMagicLink: async (email) => {
    if (!supabase) {
      set({ authError: "Supabase is not configured yet." });
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
      return;
    }

    await supabase.auth.signOut();
    set({ session: null, user: null, isAuthPanelOpen: true, hasSkippedAuth: false });
  },
}));
