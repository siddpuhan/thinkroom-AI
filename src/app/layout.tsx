import React from 'react';
import { SupabaseProvider } from "../components/SupabaseProvider";
import { createClient } from "../lib/supabase-server";
import { ThemeProvider } from "../context/ThemeContext";

import "./globals.css";
import "../App.css";

export const metadata = {
  title: "ThinkRoom AI",
  description: "AI Workspace and Chat",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const initialSession = user ? { user } : null;

  return (
    <html lang="en">
      <body>
        <SupabaseProvider initialSession={initialSession}>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}
