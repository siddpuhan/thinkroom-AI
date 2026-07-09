"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export type SupabaseClient = ReturnType<typeof createBrowserClient>;

interface SupabaseContextValue {
  supabase: SupabaseClient;
  session: any;
  user: any;
}

const SupabaseContext = createContext<SupabaseContextValue | null>(null);

export function SupabaseProvider({
  children,
  initialSession,
}: {
  children: React.ReactNode;
  initialSession: any;
}) {
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  );
  const [session, setSession] = useState(initialSession ?? null);
  const [user, setUser] = useState(initialSession?.user ?? null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  return (
    <SupabaseContext.Provider value={{ supabase, session, user }}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase() {
  const ctx = useContext(SupabaseContext);
  if (!ctx) throw new Error("useSupabase must be used within SupabaseProvider");
  return ctx;
}

export function useSession() {
  const ctx = useContext(SupabaseContext);
  if (!ctx) throw new Error("useSession must be used within SupabaseProvider");
  return ctx.session;
}

export function useUser() {
  const ctx = useContext(SupabaseContext);
  if (!ctx) throw new Error("useUser must be used within SupabaseProvider");
  return ctx.user;
}
