// Mirrors the real /settings page: the title, then five cards whose row
// counts match the ones that arrive (4 account, 3 learning, 2 reminders,
// 3 sound & display, 3 about), so nothing jumps when the data lands.
const CARDS = [4, 3, 2, 3, 3];

export default function Loading() {
  return (
    <div className="min-h-screen bg-warm">
      <div className="grid grid-cols-1 xl:grid-cols-[clamp(216px,18%,280px)_minmax(0,1fr)] w-full min-h-screen content-start xl:content-stretch">
        <div className="hidden xl:block border-r border-dashed border-dash bg-warm" />
        <div className="xl:hidden h-[52px] border-b-[1.5px] border-dashed border-dash bg-warm" />
        <main className="min-w-0 px-[clamp(18px,3vw,36px)] pt-[24px] pb-[100px] xl:pb-[60px]">
          <div className="max-w-[560px] flex flex-col gap-[12px] animate-pulse">
            <div>
              <div className="h-6 w-28 rounded-lg bg-warm-3" />
              <div className="h-3 w-56 rounded-full bg-warm-4 mt-2" />
            </div>

            {CARDS.map((rows, card) => (
              <div key={card} className="border border-line rounded-[12px] px-[24px] py-5">
                <div className="h-3.5 w-28 rounded-full bg-warm-3 mb-4" />
                <div className="grid grid-cols-1 gap-3">
                  {Array.from({ length: rows }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-[12px] bg-warm-2 border border-line flex-none" />
                      <div className="flex-1 min-w-0">
                        <div className="h-3 w-32 rounded-full bg-warm-2" />
                        <div className="h-2.5 w-44 rounded-full bg-warm-4 mt-1.5" />
                      </div>
                      <div className="w-11 h-6 rounded-full bg-warm-3 flex-none" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
