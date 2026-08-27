// Mirrors the real /level-test page (breadcrumb, title, intro line, and the
// requirements card with three labeled progress bars) instead of a generic
// row list, so the skeleton→content swap doesn't jump layout.
export default function Loading() {
  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      <div className="grid grid-cols-1 md:grid-cols-[clamp(200px,18%,280px)_minmax(0,1fr)] w-full min-h-screen">
        <div className="hidden md:block border-r border-dashed border-[#DDD6C8] bg-[#FAF7EF]" />
        <main className="min-w-0 px-[clamp(18px,4vw,44px)] pt-6 pb-[100px] md:pb-[60px] max-w-[680px]">
          <div className="animate-pulse">
            <div className="h-3.5 w-32 rounded-full bg-[#EFE9DC] mb-[18px]" />

            <div className="h-6 w-64 rounded-lg bg-[#EFE9DC] mb-3" />
            <div className="h-3 w-full max-w-[520px] rounded-full bg-[#F3EEE2] mb-1.5" />
            <div className="h-3 w-3/4 rounded-full bg-[#F3EEE2] mb-6" />

            <div className="border border-[#E3DDD0] rounded-[14px] p-5 grid gap-3.5">
              <div className="h-3.5 w-72 rounded-full bg-[#F3EEE2] mb-1" />

              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex-none w-[130px] h-2.5 rounded-full bg-[#F7F3E9]" />
                  <div className="flex-1 h-2.5 rounded-full bg-[#F5F5F4] overflow-hidden">
                    <div className="h-full w-1/3 rounded-full bg-[#EFE9DC]" />
                  </div>
                  <div className="flex-none w-10 h-2.5 rounded-full bg-[#F3EEE2]" />
                </div>
              ))}
            </div>

            <div className="h-3 w-full max-w-[560px] rounded-full bg-[#F7F3E9] mt-4 mb-1.5" />
            <div className="h-3 w-2/3 rounded-full bg-[#F7F3E9]" />
          </div>
        </main>
      </div>
    </div>
  );
}
