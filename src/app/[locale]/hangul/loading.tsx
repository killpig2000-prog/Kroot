// Mirrors HangulPage: sidebar placeholder, breadcrumb, icon+title header,
// the green intro callout, the explorer's tab pills, and a jamo-card grid —
// so the route swap doesn't flash blank while the profile/user fetch runs.
export default function Loading() {
  return (
    <div className="min-h-screen bg-warm text-charcoal">
      <div className="grid grid-cols-1 md:grid-cols-[clamp(216px,18%,280px)_minmax(0,1fr)] w-full min-h-screen">
        <div className="hidden md:block border-r border-dashed border-dash bg-warm" />
        <div className="md:hidden h-[52px] border-b-[1.5px] border-dashed border-dash bg-warm" />

        <main className="min-w-0 px-[clamp(18px,4vw,44px)] pt-6 pb-[100px] md:pb-[60px]">
          <div className="animate-pulse">
            {/* breadcrumb */}
            <div className="h-3.5 w-28 rounded-full bg-warm-2 mb-[18px]" />

            {/* head */}
            <div className="flex items-center justify-between gap-4 mb-[18px] flex-wrap">
              <div className="flex items-center gap-[9px]">
                <div className="w-[30px] h-[30px] rounded-lg bg-warm-3" />
                <div className="h-6 w-24 rounded-lg bg-warm-3" />
              </div>
              <div className="h-3.5 w-64 rounded-full bg-warm-2" />
            </div>

            {/* intro callout */}
            <div className="max-w-[820px] bg-warm border border-dashed border-line rounded-[14px] px-[18px] py-4 mb-6">
              <div className="h-3.5 w-full rounded-full bg-warm-4 mb-2" />
              <div className="h-3.5 w-full rounded-full bg-warm-4 mb-2" />
              <div className="h-3.5 w-2/3 rounded-full bg-warm-4" />
            </div>

            {/* tabs */}
            <div className="flex gap-2 mb-6 flex-wrap">
              <div className="h-[34px] w-[130px] rounded-[9px] bg-warm-3" />
              <div className="h-[34px] w-[100px] rounded-[9px] bg-warm-2" />
              <div className="h-[34px] w-[170px] rounded-[9px] bg-warm-2" />
            </div>

            {/* section label */}
            <div className="h-3 w-48 rounded-full bg-warm-2 mb-2.5" />

            {/* jamo card grid */}
            <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-3 max-w-[980px] mb-8">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="border border-line rounded-[14px] bg-cream px-4 py-[15px] flex items-center gap-3.5"
                >
                  <div className="flex-none w-[52px] h-[52px] rounded-xl bg-warm-2" />
                  <div className="min-w-0 flex-1">
                    <div className="h-3.5 w-14 rounded-full bg-warm-3 mb-2" />
                    <div className="h-3 w-20 rounded-full bg-warm-4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
