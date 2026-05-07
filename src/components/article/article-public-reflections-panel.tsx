interface PublicArticleReflectionView {
  id: string;
  itemType: "article";
  articleId: string | null;
  content: string;
  visibility: "public";
  createdAt: string;
  updatedAt: string;
}

interface ArticlePublicReflectionsPanelProps {
  reflections: PublicArticleReflectionView[];
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function ArticlePublicReflectionsPanel({
  reflections,
}: ArticlePublicReflectionsPanelProps) {
  return (
    <section className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-[0_18px_50px_-32px_rgba(28,25,23,0.2)] sm:p-10">
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400">
            Public reflections
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-stone-950">
              Shared reflections
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-stone-600 sm:text-base">
              Reflections that readers chose to make public for this published article.
            </p>
          </div>
        </div>

        {reflections.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-stone-200 bg-stone-50 px-5 py-6 text-sm leading-7 text-stone-500">
            No public reflections yet.
          </div>
        ) : (
          <div className="space-y-4">
            {reflections.map((reflection) => {
              const wasUpdated = reflection.updatedAt !== reflection.createdAt;

              return (
                <article
                  key={reflection.id}
                  className="rounded-3xl border border-stone-200 bg-stone-50 p-5"
                >
                  <div className="space-y-4">
                    <div className="whitespace-pre-wrap text-sm leading-7 text-stone-800">
                      {reflection.content}
                    </div>

                    <div className="text-xs leading-6 text-stone-500">
                      <span>Created {formatDate(reflection.createdAt)}</span>
                      {wasUpdated ? (
                        <span> / Updated {formatDate(reflection.updatedAt)}</span>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export type { PublicArticleReflectionView };
