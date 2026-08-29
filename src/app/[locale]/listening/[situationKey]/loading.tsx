// Mirrors the real /listening/[situationKey] page (breadcrumb, back-button +
// icon header with a "clips heard" count, CEFR level tabs, situation
// progress bar, resume banner, and a stacked list of clip cards) instead of
// a generic row list, so the skeleton→content swap doesn't jump.
export default function Loading() {
  return (
    <div className="min-h-screen bg-warm">
      <div className="grid grid-cols-1 md:grid-cols-[clamp(216px,18%,280px)_minmax(0,1fr)] w-full min-h-screen">
        <div className="hidden md:block border-r border-dashed border-dash bg-warm" />
        <div className="md:hidden h-[52px] border-b-[1.5px] border-dashed border-dash bg-warm" />
        <main className="min-w-0 px-[clamp(18px,4vw,44px)] pt-6 pb-[100px] md:pb-[60px]">
          <div className="animate-pulse">
            {/* breadcrumb */}
            <div className="flex gap-2 mb-[18px]">
              <div className="h-3.5 w-14 rounded-full bg-warm-3" />
              <div className="h-3.5 w-3 rounded-full bg-warm-2" />
              <div className="h-3.5 w-16 rounded-full bg-warm-3" />
              <div className="h-3.5 w-3 rounded-full bg-warm-2" />
              <div className="h-3.5 w-24 rounded-full bg-warm-3" />
            </div>

            {/* head */}
            <div className="flex items-center justify-between gap-4 mb-[18px] flex-wrap">
              <div className="flex items-center">
                <div className="w-[30px] h-[30px] rounded-lg bg-cream border border-line mr-[9px]" />
                <div className="w-[30px] h-[30px] rounded-lg bg-warm-2 border border-line mr-[9px]" />
                <div className="h-6 w-40 rounded-lg bg-warm-3" />
              </div>
              <div className="h-3.5 w-32 rounded-full bg-warm-2" />
            </div>

            {/* level tabs */}
            <div className="flex gap-2 mb-6 flex-wrap">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-9 w-16 rounded-[9px] bg-warm-2 border border-line" />
              ))}
            </div>

            <div className="max-w-[680px]">
              {/* situation progress */}
              <div className="h-[7px] rounded-full bg-warm border border-line mb-4" />

              {/* resume banner */}
              <div className="w-full flex items-center gap-3 border-[1.5px] border-line bg-warm rounded-[13px] px-4 py-3 mb-3.5">
                <div className="w-5 h-5 rounded-full bg-warm-2 flex-none" />
                <div className="flex-1 min-w-0">
                  <div className="h-3.5 w-44 rounded-full bg-warm-2 mb-1.5" />
                  <div className="h-3 w-36 rounded-full bg-warm-4" />
                </div>
                <div className="h-3.5 w-16 rounded-full bg-warm-2 flex-none" />
              </div>

              {/* clip cards */}
              <div className="grid gap-2.5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-full flex items-center gap-3 rounded-[13px] px-3.5 py-3 border-[1.5px] border-line bg-cream"
                  >
                    <div className="flex-none w-[34px] h-[34px] rounded-full bg-warm border-[1.5px] border-line" />
                    <div className="flex-1 min-w-0">
                      <div className="h-3.5 w-40 rounded-full bg-warm-2 mb-1.5" />
                      <div className="h-2.5 w-24 rounded-full bg-warm-4" />
                    </div>
                    <div className="flex-none h-3 w-12 rounded-full bg-warm-2" />
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
