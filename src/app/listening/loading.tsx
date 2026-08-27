// Mirrors the real /listening page (breadcrumb, header, level tabs, and the
// situation card grid — image thumbnail with icon badge, title, subtitle,
// status pill) instead of a generic row list.
export default function Loading() {
  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      <div className="grid grid-cols-1 md:grid-cols-[clamp(200px,18%,280px)_minmax(0,1fr)] w-full min-h-screen">
        <div className="hidden md:block border-r border-dashed border-[#DDD6C8] bg-[#FAF7EF]" />
        <main className="min-w-0 px-[clamp(18px,4vw,44px)] pt-6 pb-[100px] md:pb-[60px]">
          <div className="animate-pulse">
            {/* breadcrumb */}
            <div className="h-3.5 w-28 rounded-full bg-[#EFE9DC] mb-[18px]" />

            {/* head */}
            <div className="flex items-center justify-between gap-4 mb-[18px] flex-wrap">
              <div className="flex items-center gap-[9px]">
                <div className="w-[30px] h-[30px] rounded-lg bg-[#F3EEE2]" />
                <div className="h-6 w-28 rounded-lg bg-[#EFE9DC]" />
              </div>
              <div className="h-3.5 w-64 rounded-full bg-[#F3EEE2]" />
            </div>

            {/* level tabs */}
            <div className="flex gap-2 mb-6 flex-wrap">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-9 w-16 rounded-[9px] bg-[#F3EEE2] border border-[#E3DDD0]"
                />
              ))}
            </div>

            {/* topic grid */}
            <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3.5 max-w-[980px]">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="border border-[#E3DDD0] rounded-[14px] bg-white overflow-hidden"
                >
                  <div className="relative aspect-[16/9] bg-[#FAF7EF]">
                    <div className="absolute left-3 bottom-3 w-9 h-9 rounded-[10px] bg-white border border-[#E3DDD0]" />
                  </div>
                  <div className="px-[18px] py-4">
                    <div className="h-3.5 w-24 rounded-full bg-[#EFE9DC] mb-2" />
                    <div className="h-2.5 w-full rounded-full bg-[#F7F3E9] mb-1.5" />
                    <div className="h-2.5 w-2/3 rounded-full bg-[#F7F3E9] mb-3" />
                    <div className="h-5 w-28 rounded-full bg-[#F3EEE2] border border-[#E3DDD0]" />
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
