import Glyph from "@/components/dashboard/Glyph";

// Mirrors the ranking: title and days-left, the podium garden (three sprouts
// bob where the top trees will stand), then a column of rows. Without this
// file the tab didn't move until the profile read came back.
export default function Loading() {
  return (
    <div className="min-h-screen bg-warm">
      <div className="grid grid-cols-1 xl:grid-cols-[clamp(216px,18%,280px)_minmax(0,1fr)] w-full min-h-screen content-start xl:content-stretch">
        <div className="hidden xl:block border-r border-dashed border-dash bg-warm" />
        <div className="xl:hidden h-[52px] border-b-[1.5px] border-dashed border-dash bg-warm" />

        <main className="min-w-0 px-[clamp(18px,4vw,44px)] pt-6 pb-[100px] xl:pb-[60px]">
          <div className="grid gap-3.5 max-w-[560px]">
            <div className="animate-pulse flex items-end justify-between gap-3">
              <div>
                <div className="h-[22px] w-32 rounded-lg bg-warm-3" />
                <div className="h-3 w-44 rounded-full bg-warm-4 mt-2" />
              </div>
              <div className="h-3 w-20 rounded-full bg-warm-4" />
            </div>

            {/* the podium garden */}
            <div
              className="relative rounded-[18px] border border-line h-[clamp(236px,62vw,290px)] overflow-hidden"
              style={{ background: "linear-gradient(180deg, #EAF6FF 0%, #EAF3EC 52%, #CFE6D5 52%, #BFDCC7 100%)" }}
            >
              {[
                { left: "50%", bottom: "38%", size: 52, cls: "bob" },
                { left: "22%", bottom: "26%", size: 40, cls: "bob2" },
                { left: "78%", bottom: "22%", size: 36, cls: "bob" },
              ].map((s, i) => (
                <div key={i} className={`absolute -translate-x-1/2 text-success ${s.cls}`} style={{ left: s.left, bottom: s.bottom, width: s.size, height: s.size }}>
                  <Glyph name="sprout" className="w-full h-full" />
                </div>
              ))}
            </div>

            {/* rows */}
            <div className="animate-pulse grid gap-1.5">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="grid grid-cols-[22px_48px_minmax(0,1fr)_auto] items-center gap-2.5 px-2.5 py-2 rounded-[12px] border border-line bg-cream">
                  <div className="h-3 w-4 mx-auto rounded bg-warm-4" />
                  <div className="w-12 h-12 rounded-[10px] bg-warm-2" />
                  <div className="min-w-0">
                    <div className="h-3.5 w-2/5 rounded-full bg-warm-2" />
                    <div className="mt-2 h-[7px] rounded-full bg-warm-2" />
                  </div>
                  <div className="text-right">
                    <div className="h-3.5 w-14 rounded-full bg-warm-3" />
                    <div className="h-2.5 w-10 ml-auto rounded-full bg-warm-4 mt-1.5" />
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
