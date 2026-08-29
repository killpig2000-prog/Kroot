// Mirrors the real /profile page (breadcrumb, header, identity card with
// avatar + progress bar + streak/coin pills, Plus upsell card, Insights
// section header + stat tile grid) instead of a generic row list.
export default function Loading() {
  return (
    <div className="min-h-screen bg-warm">
      <div className="grid grid-cols-1 md:grid-cols-[clamp(216px,18%,280px)_minmax(0,1fr)] w-full min-h-screen">
        <div className="hidden md:block border-r border-dashed border-dash bg-warm" />
        <div className="md:hidden h-[52px] border-b-[1.5px] border-dashed border-dash bg-warm" />
        <main className="min-w-0 px-[clamp(18px,4vw,44px)] pt-6 pb-[100px] md:pb-[60px]">
          <div className="animate-pulse">
            {/* breadcrumb */}
            <div className="h-3.5 w-32 rounded-full bg-warm-3 mb-[18px]" />

            {/* head */}
            <div className="flex items-center justify-between gap-4 mb-[18px] flex-wrap">
              <div className="flex items-center gap-[9px]">
                <div className="w-[30px] h-[30px] rounded-lg bg-warm-2 border border-line" />
                <div className="h-6 w-36 rounded-lg bg-warm-3" />
              </div>
            </div>

            <div className="max-w-[820px] grid grid-cols-1 gap-3.5">
              {/* identity card */}
              <div className="border border-line rounded-[14px] px-[22px] py-5 flex items-center gap-4 flex-wrap">
                <div className="w-16 h-16 rounded-full bg-warm-2 border border-line flex-none" />
                <div className="flex-1 min-w-[180px]">
                  <div className="h-4 w-28 rounded-full bg-warm-2 mb-2" />
                  <div className="h-3 w-64 rounded-full bg-warm-4 mb-2.5" />
                  <div className="max-w-[280px]">
                    <div className="h-[6px] rounded-full bg-warm-2" />
                    <div className="h-2.5 w-32 rounded-full bg-warm-4 mt-1.5" />
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <div className="h-6 w-28 rounded-full bg-warm-2 border border-line" />
                  <div className="h-6 w-20 rounded-full bg-warm-4 border border-line" />
                </div>
              </div>

              {/* plus upsell card */}
              <div className="border border-dashed border-line bg-warm rounded-[14px] px-[22px] py-4 flex items-center gap-4 flex-wrap">
                <div className="flex-1 min-w-[220px]">
                  <div className="h-3.5 w-24 rounded-full bg-warm-2 mb-2" />
                  <div className="h-2.5 w-full max-w-[420px] rounded-full bg-warm-4 mb-1" />
                  <div className="h-2.5 w-2/3 max-w-[300px] rounded-full bg-warm-4" />
                </div>
                <div className="h-9 w-28 rounded-[9px] bg-warm-2" />
              </div>

              {/* insights section */}
              <div className="flex items-center gap-2 mt-2">
                <div className="h-4 w-24 rounded-full bg-warm-3" />
                <div className="h-4 w-12 rounded-md bg-warm-2" />
              </div>
              <div className="border border-dashed border-line bg-warm rounded-[14px] px-[22px] py-5">
                <div className="h-2.5 w-full rounded-full bg-warm-4 mb-1.5" />
                <div className="h-2.5 w-4/5 rounded-full bg-warm-4 mb-4" />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="border border-line bg-white rounded-[14px] px-4 py-3.5 flex flex-col items-center gap-2"
                    >
                      <div className="h-4 w-10 rounded-full bg-warm-3" />
                      <div className="h-2.5 w-16 rounded-full bg-warm-2" />
                    </div>
                  ))}
                </div>
                <div className="h-9 w-40 rounded-[10px] bg-warm-2" />
              </div>

              {/* footer pointer text */}
              <div className="h-3 w-72 rounded-full bg-warm-4" />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
