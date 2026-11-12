import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { resetApiRefresh } from '../lib/api';
import { supabase } from '../lib/supabase';

type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

interface AuthApi {
  status: AuthStatus;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthApi | null>(null);

export class AuthClientError extends Error {
  constructor(
    readonly code: string | undefined,
    message: string,
  ) {
    super(message);
    this.name = 'AuthClientError';
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let active = true;

    void supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        setSession(data.session);
        setStatus(data.session ? 'signedIn' : 'signedOut');
      })
      .catch(() => {
        if (!active) return;
        setSession(null);
        setStatus('signedOut');
      });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      resetApiRefresh();
      setSession(nextSession);
      setStatus(nextSession ? 'signedIn' : 'signedOut');
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const api = useMemo<AuthApi>(
    () => ({
      status,
      session,
      async signIn(email, password) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new AuthClientError(error.code, error.message);
      },
      async signUp(email, password) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw new AuthClientError(error.code, error.message);
        return { needsConfirmation: data.session === null };
      },
      async signOut() {
        const { error } = await supabase.auth.signOut({ scope: 'local' });
        if (error) throw new AuthClientError(error.code, error.message);
      },
    }),
    [session, status],
  );

  return <AuthContext.Provider value={api}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthApi {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
