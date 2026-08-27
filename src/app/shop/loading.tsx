// Mirrors the real /shop page: sidebar + breadcrumb + header (title, coin
// pill, Plus pill) + description line, then ShopClient's two-column card —
// left side tab-pill row + item grid, right side sticky try-on figure with
// slot buttons and an action row.
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
            <div className="flex items-center justify-between gap-4 mb-[18px] flex-wrap max-w-[1040px]">
              <div className="h-7 w-40 rounded-lg bg-[#EFE9DC]" />
              <div className="flex items-center gap-2">
                <div className="h-6 w-20 rounded-full bg-[#F3EEE2]" />
                <div className="h-6 w-16 rounded-full bg-[#F7F3E9]" />
              </div>
            </div>

            {/* description */}
            <div className="h-3 w-full max-w-[70ch] rounded-full bg-[#F7F3E9] mb-1.5" />
            <div className="h-3 w-2/3 max-w-[50ch] rounded-full bg-[#F7F3E9] mb-5" />

            {/* ShopClient card */}
            <div className="border border-[#E3DDD0] rounded-[14px] bg-white overflow-hidden max-w-[1040px]">
              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px]">
                {/* catalog */}
                <div className="p-4 sm:p-5 min-w-0">
                  <div className="flex gap-1.5 pb-1.5 mb-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-8 w-20 rounded-full bg-[#F3EEE2] border border-[#E3DDD0] flex-none" />
                    ))}
                  </div>

                  <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2.5">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="border border-[#E3DDD0] rounded-[12px] overflow-hidden bg-white">
                        <div className="h-[96px] bg-[#F3EEE2]" />
                        <div className="px-2.5 pt-2 pb-2.5">
                          <div className="h-3 w-4/5 rounded-full bg-[#F3EEE2] mb-1.5" />
                          <div className="h-2.5 w-1/2 rounded-full bg-[#F7F3E9] mb-2" />
                          <div className="flex items-center justify-between gap-1.5">
                            <div className="h-3 w-10 rounded bg-[#F7F3E9]" />
                            <div className="h-3 w-8 rounded bg-[#F7F3E9]" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* try-on aside */}
                <div className="border-t lg:border-t-0 lg:border-l border-[#E3DDD0] bg-[#FAF7EF] p-4">
                  <div className="h-2.5 w-20 rounded-full bg-[#F3EEE2] mb-2" />
                  <div className="mx-auto max-w-[230px] bg-white border border-[#E3DDD0] p-1.5 pb-6 mb-3">
                    <div className="h-[180px] rounded-[9px] bg-[#F3EEE2]" />
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="border border-[#E3DDD0] bg-white rounded-lg px-2 py-1.5">
                        <div className="h-2 w-3/5 rounded-full bg-[#F7F3E9] mb-1.5" />
                        <div className="h-2.5 w-4/5 rounded-full bg-[#F3EEE2]" />
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 mt-3">
                    <div className="flex-1 h-9 rounded-[10px] bg-[#EFE9DC]" />
                    <div className="w-16 h-9 rounded-[10px] bg-white border border-[#E3DDD0]" />
                  </div>
                  <div className="h-2.5 w-3/4 mx-auto rounded-full bg-[#F7F3E9] mt-2.5" />
                  <div className="h-2.5 w-1/2 mx-auto rounded-full bg-[#F7F3E9] mt-3" />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
