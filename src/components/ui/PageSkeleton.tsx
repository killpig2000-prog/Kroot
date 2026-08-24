// Route-level loading skeleton: the app's paper background with pulsing card
// shapes, so slow first paints (Korea → us-east-1 round trips) show structure
// instead of a blank screen.
export default function PageSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <div className="grid grid-cols-1 md:grid-cols-[clamp(200px,18%,280px)_minmax(0,1fr)] w-full min-h-screen">
        <div className="hidden md:block border-r border-dashed border-[#DDD6C8] bg-[#FAF7EF]" />
        <main className="min-w-0 px-[clamp(18px,4vw,44px)] pt-6 pb-[60px] w-full max-w-[760px]">
          <div className="animate-pulse">
            <div className="h-3.5 w-36 rounded-full bg-[#EFE9DC] mb-7" />
            <div className="h-7 w-60 rounded-lg bg-[#EFE9DC] mb-3" />
            <div className="h-3.5 w-44 rounded-full bg-[#F3EEE2] mb-7" />
            <div className="grid gap-3.5">
              {Array.from({ length: rows }).map((_, i) => (
                <div
                  key={i}
                  className="h-[84px] rounded-[14px] border border-[#EFE9DC] bg-white flex items-center gap-4 px-5"
                >
                  <div className="w-11 h-11 rounded-[11px] bg-[#F3EEE2] flex-none" />
                  <div className="flex-1">
                    <div className="h-3.5 w-1/2 rounded-full bg-[#F3EEE2] mb-2" />
                    <div className="h-3 w-1/3 rounded-full bg-[#F7F3E9]" />
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
