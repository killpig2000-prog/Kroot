// Route-level loading fallback for the public slang share page. Mirrors the
// real page's single-column layout: header with logo + CTA, a centered term
// card (badge, big KR heading, romanization, meaning, example box, origin
// blurb), a "more slang" grid, and the bottom CTA callout.

export default function SlangShareLoading() {
  return (
    <div className="min-h-screen bg-[var(--tint-pink)] text-charcoal">
      <div className="animate-pulse">
        <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <div className="h-6 w-16 rounded-full bg-warm-3" />
          <div className="h-9 w-32 rounded-full bg-warm-2" />
        </header>

        <main className="mx-auto max-w-3xl px-6 pb-16">
          <div className="mb-2 h-4 w-40 rounded-full bg-warm-2" />

          <article className="relative border border-line rounded-[22px] bg-cream p-8 sm:p-10 text-center">
            <div className="mx-auto mb-5 h-6 w-28 rounded-full bg-warm-2" />
            <div className="mx-auto h-[64px] w-3/5 rounded-lg bg-warm-3" />
            <div className="mx-auto mt-4 h-5 w-2/5 rounded-full bg-warm-2" />
            <div className="mx-auto mt-6 h-7 w-1/2 rounded-full bg-warm-3" />

            <div className="mt-7 border border-line rounded-[14px] bg-warm px-5 py-4 text-left">
              <div className="h-5 w-4/5 rounded-full bg-warm-2" />
              <div className="mt-2 h-4 w-2/3 rounded-full bg-warm-4" />
            </div>

            <div className="mt-5 text-left">
              <div className="mb-2 h-3 w-32 rounded-full bg-warm-2" />
              <div className="h-4 w-full rounded-full bg-warm-4" />
              <div className="mt-2 h-4 w-5/6 rounded-full bg-warm-4" />
            </div>
          </article>

          <section className="mt-10">
            <div className="h-5 w-48 rounded-full bg-warm-3" />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-line bg-cream px-4 py-3"
                >
                  <div className="h-4 w-2/5 rounded-full bg-warm-3" />
                  <div className="mt-2 h-3 w-4/5 rounded-full bg-warm-2" />
                </div>
              ))}
            </div>
          </section>

          <section className="mt-12 rounded-[24px] bg-warm border border-dashed border-line p-8 text-center">
            <div className="mx-auto h-7 w-3/4 rounded-full bg-warm-3" />
            <div className="mx-auto mt-3 h-4 w-full rounded-full bg-warm-2" />
            <div className="mx-auto mt-2 h-4 w-5/6 rounded-full bg-warm-2" />
            <div className="mx-auto mt-5 h-11 w-36 rounded-full bg-warm-2" />
          </section>
        </main>
      </div>
    </div>
  );
}
