"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { syncUser } from "@/lib/auth";

export async function signInWithDemo() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: "demo@pocket.app",
    password: "Demo1234!",
  });
  if (error) throw new Error(error.message);
  await syncUser().catch(console.error);
  redirect("/");
}

export async function signInWithMagicLink(email: string) {
  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (error) throw new Error(error.message);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function ensureUser() {
  return syncUser();
}
