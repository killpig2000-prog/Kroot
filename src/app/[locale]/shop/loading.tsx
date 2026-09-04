// Mirrors the real /shop page: sidebar + breadcrumb + header (title, coin
// pill) + description line, then ShopClient's two-column card —
// left side tab-pill row + item grid, right side sticky try-on figure with
// slot buttons and an action row.
export default function Loading() {
  return (
    <div className="min-h-screen bg-warm">
      <div className="grid grid-cols-1 md:grid-cols-[clamp(216px,18%,280px)_minmax(0,1fr)] w-full min-h-screen">
        <div className="hidden md:block border-r border-dashed border-dash bg-warm" />
        <div className="md:hidden h-[52px] border-b-[1.5px] border-dashed border-dash bg-warm" />
        <main className="min-w-0 px-[clamp(18px,4vw,44px)] pt-6 pb-[100px] md:pb-[60px]">
          <div className="animate-pulse">
            {/* breadcrumb */}
            <div className="h-3.5 w-24 rounded-full bg-warm-3 mb-[18px]" />

            {/* head */}
            <div className="flex items-center justify-between gap-4 mb-[18px] flex-wrap max-w-[1040px]">
              <div className="h-7 w-40 rounded-lg bg-warm-3" />
              <div className="flex items-center gap-2">
                <div className="h-6 w-20 rounded-full bg-warm-2" />
              </div>
            </div>

            {/* description */}
            <div className="h-3 w-full max-w-[70ch] rounded-full bg-warm-4 mb-1.5" />
            <div className="h-3 w-2/3 max-w-[50ch] rounded-full bg-warm-4 mb-5" />

            {/* ShopClient card */}
            <div className="border border-line rounded-[14px] bg-cream overflow-hidden max-w-[1040px]">
              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px]">
                {/* catalog */}
                <div className="p-4 sm:p-5 min-w-0">
                  <div className="flex gap-1.5 pb-1.5 mb-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-8 w-20 rounded-full bg-warm-2 border border-line flex-none" />
                    ))}
                  </div>

                  <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2.5">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="border border-line rounded-[12px] overflow-hidden bg-cream">
                        <div className="h-[96px] bg-warm-2" />
                        <div className="px-2.5 pt-2 pb-2.5">
                          <div className="h-3 w-4/5 rounded-full bg-warm-2 mb-1.5" />
                          <div className="h-2.5 w-1/2 rounded-full bg-warm-4 mb-2" />
                          <div className="flex items-center justify-between gap-1.5">
                            <div className="h-3 w-10 rounded bg-warm-4" />
                            <div className="h-3 w-8 rounded bg-warm-4" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* try-on aside */}
                <div className="border-t lg:border-t-0 lg:border-l border-line bg-warm p-4">
                  <div className="h-2.5 w-20 rounded-full bg-warm-2 mb-2" />
                  <div className="mx-auto max-w-[230px] bg-cream border border-line p-1.5 pb-6 mb-3">
                    <div className="h-[180px] rounded-[9px] bg-warm-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="border border-line bg-cream rounded-lg px-2 py-1.5">
                        <div className="h-2 w-3/5 rounded-full bg-warm-4 mb-1.5" />
                        <div className="h-2.5 w-4/5 rounded-full bg-warm-2" />
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 mt-3">
                    <div className="flex-1 h-9 rounded-[10px] bg-warm-3" />
                    <div className="w-16 h-9 rounded-[10px] bg-cream border border-line" />
                  </div>
                  <div className="h-2.5 w-3/4 mx-auto rounded-full bg-warm-4 mt-2.5" />
                  <div className="h-2.5 w-1/2 mx-auto rounded-full bg-warm-4 mt-3" />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
