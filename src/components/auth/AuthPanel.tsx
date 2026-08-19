"use client";

import { FormEvent, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";

type AuthMode = "signin" | "signup" | "magic";

export function AuthPanel() {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isAuthPanelOpen = useAuthStore((state) => state.isAuthPanelOpen);
  const setAuthPanelOpen = useAuthStore((state) => state.setAuthPanelOpen);
  const continueLocally = useAuthStore((state) => state.continueLocally);
  const signInWithPassword = useAuthStore((state) => state.signInWithPassword);
  const signUpWithPassword = useAuthStore((state) => state.signUpWithPassword);
  const sendMagicLink = useAuthStore((state) => state.sendMagicLink);
  const authMessage = useAuthStore((state) => state.authMessage);
  const authError = useAuthStore((state) => state.authError);
  const isOnline = useOnlineStatus();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      if (mode === "signin") {
        await signInWithPassword(email, password);
      } else if (mode === "signup") {
        await signUpWithPassword(displayName, email, password);
      } else {
        await sendMagicLink(email);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isAuthPanelOpen ? (
        <motion.div
          className="auth-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.section
            className="auth-card"
            initial={{ opacity: 0, rotateX: 8, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, rotateX: 0, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="panel-kicker">Private Journal</p>
            <h1>Open your writing desk.</h1>
            <p>
              Sign in with email and password, create a quiet writing account, or send yourself a magic
              link. Your writing always saves on this device, and syncs to the cloud when you are online.
            </p>

            {!isOnline ? (
              <div className="auth-notice">
                You are offline. Keep writing locally — it will sync when you are back online.
              </div>
            ) : null}

            {!isSupabaseConfigured ? (
              <div className="auth-notice">
                Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
                <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> to enable Supabase Auth.
              </div>
            ) : null}

            <div className="auth-tabs">
              <button type="button" className={mode === "signin" ? "active" : ""} onClick={() => setMode("signin")}>
                Password
              </button>
              <button type="button" className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>
                New Account
              </button>
              <button type="button" className={mode === "magic" ? "active" : ""} onClick={() => setMode("magic")}>
                Magic Link
              </button>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              {mode === "signup" ? (
                <label>
                  <span>Name</span>
                  <input
                    autoComplete="name"
                    minLength={2}
                    required
                    value={displayName}
                    onChange={(event) => setDisplayName(event.currentTarget.value)}
                    placeholder="Anais"
                  />
                </label>
              ) : null}

              <label>
                <span>Email</span>
                <input
                  autoComplete="email"
                  inputMode="email"
                  required
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.currentTarget.value)}
                  placeholder="you@example.com"
                />
              </label>

              {mode !== "magic" ? (
                <label>
                  <span>Password</span>
                  <input
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    minLength={6}
                    required
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.currentTarget.value)}
                    placeholder="At least 6 characters"
                  />
                </label>
              ) : null}

              {authError ? <div className="auth-error">{authError}</div> : null}
              {authMessage ? <div className="auth-message">{authMessage}</div> : null}

              <button type="submit" className="auth-primary" disabled={!isSupabaseConfigured || isSubmitting || !isOnline}>
                {isSubmitting
                  ? "Working..."
                  : mode === "signin"
                    ? "Sign in"
                    : mode === "signup"
                      ? "Create account"
                      : "Send magic link"}
              </button>
            </form>

            <div className="auth-footer-actions">
              <button type="button" onClick={continueLocally}>
                Continue locally
              </button>
              <button type="button" onClick={() => setAuthPanelOpen(false)}>
                Close
              </button>
            </div>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
