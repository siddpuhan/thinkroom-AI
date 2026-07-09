"use server";

import { createClient } from "../lib/supabase-server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "global" });
  redirect("/");
}
