import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AuthUser, LoginResponse } from "@shared";
import { api, hasRefreshToken, restoreSession, setSession } from "../../config/api";

type AuthContextValue = {
  user: AuthUser | null;
  ready: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function restore() {
      if (!hasRefreshToken()) {
        setReady(true);
        return;
      }
      try {
        const session = await restoreSession();
        if (!cancelled) setUser(session?.user ?? null);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setReady(true);
      }
    }
    void restore();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      ready,
      async signIn(email: string, password: string) {
        const session = await api<LoginResponse>("/api/v1/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        setSession(session.accessToken, session.refreshToken);
        setUser(session.user);
      },
      async signOut() {
        const refreshToken = sessionStorage.getItem("dhabar.refresh");
        try {
          await api(
            "/api/v1/auth/logout",
            {
              method: "POST",
              body: JSON.stringify({ refreshToken }),
            },
            false,
          );
        } catch {
          // Local sign-out still stands if the network call fails.
        }
        setSession(null, null);
        setUser(null);
      },
    }),
    [ready, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
