import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/entrar");
  }

  return user;
}

// Admin status lives in auth.users.app_metadata (never user-editable, only
// writable by the service role), returned by the same getUser() call
// requireUser() already makes -- no extra query, no new table, and it
// cannot be forged from the browser the way user_metadata or a client-sent
// value could be.
export async function requireAdmin() {
  const user = await requireUser();
  const role = (user.app_metadata as { role?: string } | undefined)?.role;

  if (role !== "admin") {
    redirect("/app");
  }

  return user;
}
