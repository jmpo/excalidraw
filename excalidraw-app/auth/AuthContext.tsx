import { createContext, useContext, useEffect, useState } from "react";

import { supabase } from "../data/supabase";

import type { Session, User } from "@supabase/supabase-js";

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  passwordRecovery: boolean;
  clearPasswordRecovery: () => void;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  passwordRecovery: false,
  clearPasswordRecovery: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [passwordRecovery, setPasswordRecovery] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    const hasHashTokens = hash.includes("access_token");

    // If URL contains auth tokens (email confirmation / magic link), call setSession
    // so Supabase stores them before onAuthStateChange fires INITIAL_SESSION.
    if (hasHashTokens) {
      const params = new URLSearchParams(hash.slice(1));
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");
      if (access_token && refresh_token) {
        supabase.auth.setSession({ access_token, refresh_token }).then(() => {
          window.history.replaceState(null, "", window.location.pathname);
        });
      }
    }

    const timeout = setTimeout(() => setLoading(false), 5000);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // When hash tokens are being processed, ignore the initial null INITIAL_SESSION
      // to avoid redirecting to login before the SIGNED_IN event arrives.
      if (hasHashTokens && event === "INITIAL_SESSION" && !session) {
        return;
      }
      setSession(session);
      setLoading(false);
      clearTimeout(timeout);
      if (event === "PASSWORD_RECOVERY") {
        setPasswordRecovery(true);
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        passwordRecovery,
        clearPasswordRecovery: () => setPasswordRecovery(false),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
