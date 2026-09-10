import Glyph from "@/components/dashboard/Glyph";

// Mirrors My room: the full-bleed garden up top (a sprout bobs where the
// tree will stand), the Mine | Shop switch, the slot chips, a shelf of three
// cards, and the word-bank row. Without this file the tab didn't move until
// the page's eleven reads came back (~0.8–1.5s), which read as a freeze.
export default function Loading() {
  return (
    <div className="min-h-screen bg-warm">
      <div className="grid grid-cols-1 xl:grid-cols-[clamp(216px,18%,280px)_minmax(0,1fr)] w-full min-h-screen content-start xl:content-stretch">
        <div className="hidden xl:block border-r border-dashed border-dash bg-warm" />
        <div className="xl:hidden h-[52px] border-b-[1.5px] border-dashed border-dash bg-warm" />

        <main className="min-w-0 px-[clamp(18px,3vw,36px)] pt-[24px] pb-[100px] xl:pb-[60px]">
          <div className="max-w-[560px] xl:max-w-[760px]">
            {/* the garden */}
            <div
              className="relative -mx-[clamp(18px,3vw,36px)] -mt-[24px] rounded-b-[22px] border-b border-line md:mx-0 md:mt-0 md:rounded-[20px] md:border overflow-hidden"
              style={{ minHeight: 320, background: "linear-gradient(180deg, #EAF6FF 0%, #EAF3EC 58%, #CFE6D5 58%, #BFDCC7 100%)" }}
            >
              <div className="animate-pulse">
                <div className="absolute top-3 left-3 h-[26px] w-36 rounded-full bg-cream/80 border border-line" />
                <div className="absolute top-3 right-3 h-[26px] w-16 rounded-full bg-cream/80 border border-line" />
                <div className="absolute left-4 right-4 bottom-3">
                  <div className="h-2.5 w-28 ml-auto rounded-full bg-cream/80 mb-1.5" />
                  <div className="h-[7px] rounded-full bg-cream/70" />
                </div>
              </div>
              <div className="absolute left-1/2 bottom-[64px] -translate-x-1/2 text-success bob">
                <Glyph name="sprout" className="w-[56px] h-[56px]" />
              </div>
            </div>

            <div className="animate-pulse mt-3">
              {/* Mine | Shop */}
              <div className="grid grid-cols-2 gap-[3px] p-[3px] rounded-[12px] bg-line/50 mb-2.5">
                <div className="h-[44px] rounded-[9px] bg-cream" />
                <div className="h-[44px] rounded-[9px]" />
              </div>

              {/* slot chips */}
              <div className="flex gap-1.5 pb-1 overflow-hidden">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-[34px] w-[88px] flex-none rounded-full bg-cream border border-line" />
                ))}
              </div>

              {/* the shelf */}
              <div className="flex gap-2.5 pt-2 pb-2.5 overflow-hidden">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex-none w-[clamp(134px,38vw,150px)] border border-line rounded-[12px] overflow-hidden bg-cream">
                    <div className="h-[92px] bg-warm-2" />
                    <div className="px-2.5 pt-2 pb-2.5">
                      <div className="h-3 w-4/5 rounded-full bg-warm-2 mb-1.5" />
                      <div className="h-2.5 w-1/2 rounded-full bg-warm-4 mb-2" />
                      <div className="flex items-center justify-between">
                        <div className="h-3 w-12 rounded bg-warm-4" />
                        <div className="h-3 w-10 rounded bg-warm-4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* word bank row */}
              <div className="max-w-[560px] mt-4 h-[50px] rounded-[12px] border border-line bg-cream" />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
