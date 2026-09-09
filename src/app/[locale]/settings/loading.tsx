// Mirrors the Settings screens: a title, then one white sheet of rows. The
// first screen has six (the identity row taller than the rest); the detail
// screens have two or three, so six is the tallest thing that could arrive
// and nothing jumps when the data lands.
export default function Loading() {
  return (
    <div className="min-h-screen bg-warm">
      <div className="grid grid-cols-1 xl:grid-cols-[clamp(216px,18%,280px)_minmax(0,1fr)] w-full min-h-screen content-start xl:content-stretch">
        <div className="hidden xl:block border-r border-dashed border-dash bg-warm" />
        <div className="xl:hidden h-[52px] border-b-[1.5px] border-dashed border-dash bg-warm" />
        <main className="min-w-0 px-[clamp(18px,3vw,36px)] pt-[20px] pb-[100px] xl:pb-[60px]">
          <div className="max-w-[560px] flex flex-col gap-[14px] animate-pulse">
            <div className="h-7 w-28 rounded-lg bg-warm-3 mb-1" />

            <div className="bg-sheet border-y border-line -mx-[clamp(18px,3vw,36px)] xl:mx-0 xl:rounded-[14px] xl:border">
              <div className="flex items-center gap-3.5 min-h-[78px] px-[18px] py-3.5">
                <div className="w-12 h-12 rounded-full bg-warm-2 border border-line flex-none" />
                <div className="flex-1 min-w-0">
                  <div className="h-3.5 w-28 rounded-full bg-warm-2" />
                  <div className="h-2.5 w-44 rounded-full bg-warm-4 mt-2" />
                </div>
              </div>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 min-h-[62px] px-[18px] py-3 border-t border-line/60">
                  <div className="flex-1 min-w-0">
                    <div className="h-3.5 w-32 rounded-full bg-warm-2" />
                    {i < 4 && <div className="h-2.5 w-52 rounded-full bg-warm-4 mt-2" />}
                  </div>
                  <div className="w-2 h-3.5 rounded-full bg-warm-3 flex-none" />
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
