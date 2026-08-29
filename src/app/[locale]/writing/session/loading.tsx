// Mirrors WritingSession's write-phase two-column card so the page
// transition (turning a page, jumping from the map) shows structure instead
// of a blank flash while the server fetches the next prompt.
export default function Loading() {
  return (
    <div className="min-h-screen bg-warm">
      <div className="grid grid-cols-1 md:grid-cols-[clamp(216px,18%,280px)_minmax(0,1fr)] w-full min-h-screen">
        <div className="hidden md:block border-r border-dashed border-dash bg-warm" />
        <div className="md:hidden h-[52px] border-b-[1.5px] border-dashed border-dash bg-warm" />
        <main className="min-w-0 px-[clamp(18px,4vw,44px)] pt-6 pb-[100px] md:pb-[60px]">
          <div className="animate-pulse">
            <div className="h-3.5 w-40 rounded-full bg-warm-3 mb-[18px]" />
            <div className="flex items-center justify-between gap-4 mb-5">
              <div className="h-7 w-32 rounded-lg bg-warm-3" />
              <div className="h-3.5 w-28 rounded-full bg-warm-2" />
            </div>

            <div className="border border-line rounded-[14px] bg-cream max-w-[900px] overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="p-[clamp(20px,3vw,32px)] flex flex-col gap-3.5 border-b md:border-b-0 md:border-r border-dashed border-line">
                  <div className="h-3 w-24 rounded-full bg-warm-2" />
                  <div className="h-6 w-[85%] rounded-lg bg-warm-3" />
                  <div className="h-6 w-[60%] rounded-lg bg-warm-3" />
                  <div className="h-3.5 w-[70%] rounded-full bg-warm-4 mt-2" />
                  <div className="h-[54px] rounded-[10px] bg-warm border border-dashed border-line mt-auto" />
                </div>
                <div className="p-[clamp(20px,3vw,32px)] flex flex-col gap-3.5">
                  <div className="h-3 w-20 rounded-full bg-warm-2" />
                  <div className="h-4 w-full rounded-full bg-warm-4" />
                  <div className="h-4 w-full rounded-full bg-warm-4" />
                  <div className="h-4 w-2/3 rounded-full bg-warm-4" />
                  <div className="flex-1" />
                  <div className="flex justify-end">
                    <div className="h-9 w-36 rounded-[9px] bg-warm-3" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
