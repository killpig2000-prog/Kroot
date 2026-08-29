// Mirrors the real /writing page (breadcrumb, header, level tabs, progress
// bar, continue card, genre-grouped path) instead of a generic row list —
// the shapes were different enough that the skeleton→content swap felt like
// a layout jump.
export default function Loading() {
  return (
    <div className="min-h-screen bg-warm">
      <div className="grid grid-cols-1 md:grid-cols-[clamp(216px,18%,280px)_minmax(0,1fr)] w-full min-h-screen">
        <div className="hidden md:block border-r border-dashed border-dash bg-warm" />
        <div className="md:hidden h-[52px] border-b-[1.5px] border-dashed border-dash bg-warm" />
        <main className="min-w-0 px-[clamp(18px,4vw,44px)] pt-6 pb-[100px] md:pb-[60px]">
          <div className="animate-pulse">
            <div className="h-3.5 w-24 rounded-full bg-warm-3 mb-[18px]" />

            <div className="flex items-center justify-between gap-4 mb-[18px] flex-wrap">
              <div className="h-7 w-40 rounded-lg bg-warm-3" />
              <div className="h-3.5 w-56 rounded-full bg-warm-2" />
            </div>

            <div className="flex gap-2 mb-6 flex-wrap">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-9 w-16 rounded-[9px] bg-warm-2 border border-line" />
              ))}
            </div>

            <div className="max-w-[720px] mb-6">
              <div className="flex items-center justify-between mb-2.5">
                <div className="h-3 w-32 rounded-full bg-warm-2" />
                <div className="h-3 w-24 rounded-full bg-warm-4" />
              </div>
              <div className="h-1.5 rounded-full bg-warm-3" />
            </div>

            <div className="h-16 rounded-[14px] bg-warm border border-dashed border-line max-w-[720px] mb-6" />

            <div className="border border-line rounded-[14px] bg-cream max-w-[720px] overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-3.5">
                <div className="flex-1">
                  <div className="h-3.5 w-24 rounded-full bg-warm-2 mb-1.5" />
                  <div className="h-2.5 w-40 rounded-full bg-warm-4" />
                </div>
                <div className="w-[74px] h-1.5 rounded-full bg-warm-3" />
              </div>
              <div className="px-3.5 pb-3.5 pt-2 border-t border-dashed border-line grid gap-6 py-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className={`flex items-center gap-3 ${i % 2 ? "flex-row-reverse text-right" : ""}`}>
                    <div className="w-11 h-11 rounded-full bg-warm-2 border border-line flex-none" />
                    <div className={i % 2 ? "items-end flex flex-col gap-1.5" : "flex flex-col gap-1.5"}>
                      <div className="h-3 w-20 rounded-full bg-warm-2" />
                      <div className="h-2.5 w-32 rounded-full bg-warm-4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
