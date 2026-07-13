"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "../components/SupabaseProvider";
import ProductionLandingPage from "../components/landing/ProductionLandingPage";

export default function Home() {
  const router = useRouter();
  const { session, supabase } = useSupabase();

  useEffect(() => {
    if (session) router.replace("/chat");
  }, [session, router]);

  const [emailMode, setEmailMode] = useState<"login" | "signup" | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const googleAuth = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      return;
    }

    if (data?.url) {
      window.location.assign(data.url);
    }
  };

  const emailAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    try {
      if (emailMode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          setError(error.message);
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setError(error.message);
          return;
        }
      }

      router.replace("/chat");
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Authentication failed");
    }
  };

  if (emailMode) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
        }}
      >
        <form
          onSubmit={emailAuth}
          style={{
            width: "100%",
            maxWidth: "360px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <h2 style={{ color: "white", margin: 0 }}>
            {emailMode === "login" ? "Sign In" : "Create Account"}
          </h2>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            style={{
              padding: "12px",
              borderRadius: "8px",
              background: "#111",
              color: "white",
              border: "1px solid #333",
            }}
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={6}
            style={{
              padding: "12px",
              borderRadius: "8px",
              background: "#111",
              color: "white",
              border: "1px solid #333",
            }}
          />

          <button
            type="submit"
            style={{
              padding: "12px",
              borderRadius: "8px",
              background: "white",
              color: "black",
              fontWeight: 600,
            }}
          >
            {emailMode === "login" ? "Sign In" : "Sign Up"}
          </button>

          <button
            type="button"
            onClick={googleAuth}
            style={{
              color: "#ccc",
              textDecoration: "underline",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            Or use Google
          </button>

          <button
            type="button"
            onClick={() =>
              setEmailMode(emailMode === "login" ? "signup" : "login")
            }
            style={{
              color: "#ccc",
              textDecoration: "underline",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            {emailMode === "login"
              ? "Need an account? Sign up"
              : "Have an account? Sign in"}
          </button>

          <button
            type="button"
            onClick={() => {
              setError("");
              setEmailMode(null);
            }}
            style={{
              color: "#888",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            ← Back
          </button>

          {error && (
            <p style={{ color: "#f87171", fontSize: "0.85rem" }}>{error}</p>
          )}
        </form>
      </div>
    );
  }

  return (
    <ProductionLandingPage
      onEnterChat={googleAuth}
      onEnterResources={() => setEmailMode("signup")}
    />
  );
}