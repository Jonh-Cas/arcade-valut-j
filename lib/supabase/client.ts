// ===== lib/supabase/client.ts — Supabase client for Client Components =====

import { createBrowserClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";

// Visible name: user_metadata.username, or the local part of the email as fallback.
export function getDisplayName(user: User): string {
  const username = user.user_metadata?.username;
  if (typeof username === "string" && username.trim())
    return username.trim().toUpperCase();
  return (user.email?.split("@")[0] ?? "PLAYER").toUpperCase();
}

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
