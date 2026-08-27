// Mirrors the real /course page (breadcrumb, hero card with icon + start
// button, and two chained sections — each a heading + a vertical timeline of
// numbered node circles linked to day cards) instead of a generic row list.
export default function Loading() {
  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      <div className="grid grid-cols-1 md:grid-cols-[clamp(200px,18%,280px)_minmax(0,1fr)] w-full min-h-screen">
        <div className="hidden md:block border-r border-dashed border-[#DDD6C8] bg-[#FAF7EF]" />
        <main className="min-w-0 px-[clamp(18px,4vw,44px)] pt-6 pb-[100px] md:pb-[60px] max-w-[760px]">
          <div className="animate-pulse">
            {/* breadcrumb */}
            <div className="h-3.5 w-40 rounded-full bg-[#EFE9DC] mb-[18px]" />

            {/* hero */}
            <div className="border border-[#E3DDD0] rounded-[16px] p-6 flex gap-[18px] items-center flex-wrap mb-7">
              <div className="w-16 h-16 rounded-[14px] bg-[#F3EEE2] flex-none" />
              <div className="flex-1 min-w-[230px]">
                <div className="h-5 w-64 rounded-lg bg-[#EFE9DC] mb-2" />
                <div className="h-3 w-52 rounded-full bg-[#F3EEE2]" />
              </div>
              <div className="flex-none h-11 w-36 rounded-[10px] bg-[#EFE9DC]" />
            </div>

            {/* chain sections */}
            {Array.from({ length: 2 }).map((_, s) => (
              <section key={s} className="mb-8">
                <div className="h-4 w-44 rounded-lg bg-[#EFE9DC] mb-2" />
                <div className="h-3 w-56 rounded-full bg-[#F3EEE2] mb-4" />

                <div className="relative ml-[18px] border-l-2 border-[#E3DDD0]">
                  {Array.from({ length: s === 0 ? 4 : 5 }).map((_, i) => (
                    <div key={i} className="relative pl-7 pb-5 last:pb-1">
                      <div className="absolute -left-[15px] top-0 w-7 h-7 rounded-full border-2 border-[#E3DDD0] bg-white" />
                      <div className="border border-[#E3DDD0] rounded-[12px] px-4 py-3 bg-white">
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex-1 min-w-[200px]">
                            <div className="h-3.5 w-36 rounded-full bg-[#F3EEE2] mb-1.5" />
                            <div className="h-2.5 w-24 rounded-full bg-[#F7F3E9]" />
                          </div>
                          <div className="flex-none h-2.5 w-16 rounded-full bg-[#F7F3E9]" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
