import Link from "next/link";

import {
  getReadingTracesData,
  type ReadingTracesQueryFilters,
} from "@/app/api/me/reading-traces/route";
import { ReadingTracesPanel } from "@/components/reading-traces/reading-traces-panel";
import { ROUTES } from "@/lib/constants/routes";
import { createClient } from "@/lib/supabase/server";

export default async function ReadingTracesPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.id) {
    return (
      <section className="space-y-6">
        <div className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-[0_18px_50px_-32px_rgba(28,25,23,0.35)] sm:p-10">
          <div className="space-y-4">
            <div className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400">
              Reading traces
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
              Sign in to review your private reading traces
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-stone-600 sm:text-base">
              This overview gathers your own notes and reflections across articles and saved
              external items. Nothing is shown until you sign in.
            </p>
            <Link
              href={ROUTES.LOGIN}
              className="inline-flex items-center rounded-full border border-stone-900 bg-stone-900 px-5 py-2.5 text-sm font-medium text-stone-50 transition-colors hover:bg-stone-800"
            >
              Go to login
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const filters: ReadingTracesQueryFilters = {
    traceType: null,
    itemType: null,
    limit: 100,
  };
  const result = await getReadingTracesData(supabase, user.id, filters);

  if (result.errorMessage || !result.data) {
    return (
      <section className="space-y-6">
        <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {result.errorMessage ?? "Failed to load reading traces."}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-8">
      <div className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-[0_18px_50px_-32px_rgba(28,25,23,0.35)] sm:p-10">
        <div className="space-y-3">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400">
            Reading traces
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
            Private notes and reflections in one place
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-stone-600 sm:text-base">
            Review the private traces you have left across articles and external items, then jump
            back to the original source when you want more context.
          </p>
        </div>
      </div>

      <ReadingTracesPanel data={result.data} />
    </section>
  );
}
