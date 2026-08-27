// Mirrors the real /slang page (breadcrumb, header, pink "slang of the day"
// hero card, daily quiz banner, sticker-book progress bar + vibe filter
// chips, and the flip-card grid) instead of a generic row list.
export default function Loading() {
  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      <div className="grid grid-cols-1 md:grid-cols-[clamp(200px,18%,280px)_minmax(0,1fr)] w-full min-h-screen">
        <div className="hidden md:block border-r border-dashed border-[#DDD6C8] bg-[#FAF7EF]" />
        <main className="min-w-0 px-[clamp(18px,4vw,44px)] pt-6 pb-[100px] md:pb-[60px]">
          <div className="animate-pulse">
            {/* breadcrumb */}
            <div className="h-3.5 w-24 rounded-full bg-[#EFE9DC] mb-[18px]" />

            {/* head */}
            <div className="flex items-center justify-between gap-4 mb-[18px] flex-wrap">
              <div className="h-7 w-28 rounded-lg bg-[#EFE9DC]" />
              <div className="h-3.5 w-72 rounded-full bg-[#F3EEE2]" />
            </div>

            {/* slang-of-the-day hero */}
            <div className="rounded-[14px] bg-[#FAF7EF] border border-dashed border-[#E3DDD0] p-[18px] md:p-6 mb-6 max-w-[980px] flex flex-col md:flex-row gap-5 md:items-center">
              <div className="md:w-[220px] shrink-0">
                <div className="h-3 w-28 rounded-full bg-[#F3EEE2] mb-2" />
                <div className="h-9 w-24 rounded-lg bg-[#EFE9DC] mb-1.5" />
                <div className="h-3 w-16 rounded-full bg-[#F7F3E9]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="h-4 w-40 rounded-full bg-[#EFE9DC] mb-2" />
                <div className="h-3 w-28 rounded-full bg-[#F7F3E9] mb-3" />
                <div className="h-3 w-full max-w-[380px] rounded-full bg-[#F3EEE2] mb-1.5" />
                <div className="h-3 w-2/3 rounded-full bg-[#F3EEE2] mb-3" />
                <div className="rounded-[10px] bg-white border border-[#E3DDD0] px-3.5 py-2.5">
                  <div className="h-3 w-3/4 rounded-full bg-[#F3EEE2] mb-1.5" />
                  <div className="h-2.5 w-1/2 rounded-full bg-[#F7F3E9]" />
                </div>
                <div className="mt-3 h-5 w-24 rounded-full bg-[#F3EEE2]" />
              </div>
            </div>

            {/* daily quiz banner */}
            <div className="rounded-[14px] bg-[#FAF7EF] border border-dashed border-[#E3DDD0] px-5 py-4 mb-6">
              <div className="flex items-center gap-3.5 flex-wrap">
                <div className="w-[22px] h-[22px] rounded-full bg-[#F3EEE2] flex-none" />
                <div className="flex-1 min-w-[180px]">
                  <div className="h-3.5 w-40 rounded-full bg-[#F3EEE2] mb-1.5" />
                  <div className="h-3 w-56 rounded-full bg-[#F7F3E9]" />
                </div>
                <div className="w-20 h-8 rounded-[9px] bg-[#F3EEE2] flex-none" />
              </div>
            </div>

            {/* sticker-book progress */}
            <div className="flex items-center gap-3 mb-4 max-w-[420px]">
              <div className="h-3.5 w-28 rounded-full bg-[#F3EEE2] flex-none" />
              <div className="flex-1 h-1.5 rounded-full bg-[#EFE9DC]" />
            </div>

            {/* vibe filter chips */}
            <div className="flex gap-2 mb-6 flex-wrap">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-9 w-20 rounded-[9px] bg-white border border-[#E3DDD0]" />
              ))}
            </div>

            {/* flip-card grid */}
            <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3.5 max-w-[980px]">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="w-full h-[210px] rounded-[14px] bg-[#FAF7EF] border border-[#E3DDD0] flex flex-col items-center justify-center px-5"
                >
                  <div className="h-8 w-20 rounded-lg bg-[#EFE9DC] mb-3" />
                  <div className="h-2.5 w-16 rounded-full bg-[#F3EEE2] mb-4" />
                  <div className="h-6 w-6 rounded-full bg-[#F3EEE2]" />
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
