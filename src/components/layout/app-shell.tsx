import type { ReactNode } from "react";

import { createClient } from "@/lib/supabase/server";

import { AppFrame } from "./app-frame";

interface AppShellProps {
  children: ReactNode;
}

export async function AppShell({ children }: AppShellProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthenticated = Boolean(user?.id);
  let hasAuthorProfile = false;

  if (user?.id) {
    const { data } = await supabase
      .from("author_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    hasAuthorProfile = Boolean(data?.id);
  }

  return (
    <AppFrame
      hasAuthorProfile={hasAuthorProfile}
      isAuthenticated={isAuthenticated}
    >
      {children}
    </AppFrame>
  );
}
