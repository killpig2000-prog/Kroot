// Mirrors the real /listening page (breadcrumb, header, level tabs, and the
// situation card grid — image thumbnail with icon badge, title, subtitle,
// status pill) instead of a generic row list.
export default function Loading() {
  return (
    <div className="min-h-screen bg-warm">
      <div className="grid grid-cols-1 xl:grid-cols-[clamp(216px,18%,280px)_minmax(0,1fr)] w-full min-h-screen content-start xl:content-stretch">
        <div className="hidden md:block border-r border-dashed border-dash bg-warm" />
        <main className="min-w-0 px-[clamp(18px,4vw,44px)] pt-6 pb-[100px] xl:pb-[60px]">
          {/* the lesson bar's shape, so the swap doesn't jump (2026-09-10) */}
          <div className="h-[52px] -mx-[clamp(18px,4vw,44px)] -mt-6 mb-4 border-b-[1.5px] border-dashed border-dash xl:h-9 xl:mx-0 xl:mt-0 xl:mb-5 xl:border-0" />
          <div className="animate-pulse">
            {/* topic grid */}
            <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3.5 max-w-[980px]">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="border border-line rounded-[14px] bg-cream overflow-hidden"
                >
                  <div className="relative aspect-[16/9] bg-warm">
                    <div className="absolute left-3 bottom-3 w-9 h-9 rounded-[10px] bg-cream border border-line" />
                  </div>
                  <div className="px-[18px] py-4">
                    <div className="h-3.5 w-24 rounded-full bg-warm-3 mb-2" />
                    <div className="h-2.5 w-full rounded-full bg-warm-4 mb-1.5" />
                    <div className="h-2.5 w-2/3 rounded-full bg-warm-4 mb-3" />
                    <div className="h-5 w-28 rounded-full bg-warm-2 border border-line" />
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
