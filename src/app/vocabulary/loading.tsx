// Mirrors the real /vocabulary page (breadcrumb, search bar, growth-stage
// legend, level hero with progress bar + pills, continue card, grouped unit
// accordions with icon rows, grow banner) instead of a generic row list.
export default function Loading() {
  return (
    <div className="min-h-screen bg-warm">
      <div className="grid grid-cols-1 md:grid-cols-[clamp(200px,18%,280px)_minmax(0,1fr)] w-full min-h-screen">
        <div className="hidden md:block border-r border-dashed border-dash bg-warm" />
        <main className="min-w-0 px-[clamp(18px,4vw,44px)] pt-6 pb-[100px] md:pb-[60px] max-w-[820px]">
          <div className="animate-pulse">
            {/* breadcrumb */}
            <div className="flex gap-2 mb-[18px]">
              <div className="h-3 w-14 rounded-full bg-warm-2" />
              <div className="h-3 w-2 rounded-full bg-warm-4" />
              <div className="h-3 w-20 rounded-full bg-warm-3" />
            </div>

            {/* search bar */}
            <div className="h-10 rounded-[10px] bg-warm border border-line mb-5" />

            {/* growth-stage legend */}
            <div className="flex gap-4 flex-wrap mb-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-3 w-16 rounded-full bg-warm-4" />
              ))}
            </div>

            {/* level hero */}
            <div className="border border-line rounded-[16px] px-6 py-6 mb-7 flex items-center gap-5 flex-wrap">
              <div className="w-[70px] h-[70px] rounded-[14px] bg-warm-2 flex-none" />
              <div className="flex-1 min-w-[220px]">
                <div className="h-5 w-48 rounded-lg bg-warm-3 mb-2" />
                <div className="h-3 w-64 rounded-full bg-warm-2 mb-3" />
                <div className="flex items-center gap-3">
                  <div className="flex-1 max-w-[300px] h-2 rounded-full bg-warm-3" />
                  <div className="h-3 w-16 rounded-full bg-warm-2 flex-none" />
                </div>
              </div>
              <div className="flex gap-1.5 flex-none">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="w-[42px] h-[38px] rounded-[10px] bg-warm-2 border border-line" />
                ))}
              </div>
            </div>

            {/* continue card */}
            <div className="flex items-center gap-3.5 border-[1.5px] border-dashed border-line bg-warm rounded-[14px] px-5 py-4 mb-6">
              <div className="flex-none w-10 h-10 rounded-[10px] bg-warm-2" />
              <div className="flex-1 min-w-[170px]">
                <div className="h-3.5 w-40 rounded-full bg-warm-3 mb-1.5" />
                <div className="h-3 w-56 rounded-full bg-warm-2" />
              </div>
              <div className="h-3 w-12 rounded-full bg-warm-2 flex-none" />
            </div>

            {/* units heading */}
            <div className="h-4 w-32 rounded-full bg-warm-3 mb-3.5" />

            {/* unit groups */}
            <div className="grid gap-3 mb-7">
              {Array.from({ length: 3 }).map((_, gi) => (
                <div key={gi} className="border border-line rounded-[14px] bg-white overflow-hidden">
                  <div className="flex items-center gap-3 px-5 py-3.5">
                    <div className="h-3.5 w-24 rounded-full bg-warm-2 flex-1" />
                    <div className="w-[74px] h-1.5 rounded-full bg-warm-3 flex-none" />
                    <div className="h-3 w-10 rounded-full bg-warm-4 flex-none" />
                  </div>
                  {gi === 0 && (
                    <div className="grid gap-2.5 px-3.5 pb-3.5 pt-1 border-t border-dashed border-line">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div
                          key={i}
                          className="border border-line rounded-[12px] bg-white px-4 py-3 flex items-center gap-3.5"
                        >
                          <div className="w-[40px] h-[40px] rounded-[11px] bg-warm-2 flex-none" />
                          <div className="flex-1 min-w-0">
                            <div className="h-3.5 w-32 rounded-full bg-warm-3 mb-1.5" />
                            <div className="h-2.5 w-16 rounded-full bg-warm-4" />
                          </div>
                          <div className="text-right flex-none">
                            <div className="h-4 w-20 rounded-full bg-warm-2 mb-1 ml-auto" />
                            <div className="h-2.5 w-14 rounded-full bg-warm-4 ml-auto" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* grow banner */}
            <div className="border border-dashed border-line bg-warm rounded-[14px] px-5 py-4 flex items-center gap-2.5">
              <div className="h-3 w-3 rounded-full bg-warm-2 flex-none" />
              <div className="h-3 w-72 rounded-full bg-warm-2" />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
