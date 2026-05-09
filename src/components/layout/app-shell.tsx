import type { ReactNode } from "react";

import { createClient } from "@/lib/supabase/server";

import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

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
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7f4ee_0%,#fbfaf7_20%,#fcfcfa_100%)] text-stone-900">
      <Topbar
        hasAuthorProfile={hasAuthorProfile}
        isAuthenticated={isAuthenticated}
      />
      <div className="mx-auto grid w-full max-w-7xl md:grid-cols-[280px_minmax(0,1fr)]">
        <Sidebar
          hasAuthorProfile={hasAuthorProfile}
          isAuthenticated={isAuthenticated}
        />
        <main className="min-w-0 px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-4xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
