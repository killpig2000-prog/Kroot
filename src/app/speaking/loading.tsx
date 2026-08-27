// Mirrors the real /speaking page (breadcrumb, icon header, and the
// PronunciationTrail's vertical tier line with rows of wrapped stone cards)
// instead of a generic row list.
export default function Loading() {
  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      <div className="grid grid-cols-1 md:grid-cols-[clamp(200px,18%,280px)_minmax(0,1fr)] w-full min-h-screen">
        <div className="hidden md:block border-r border-dashed border-dash bg-warm" />
        <main className="min-w-0 px-[clamp(18px,4vw,44px)] pt-6 pb-[100px] md:pb-[60px]">
          <div className="animate-pulse">
            {/* breadcrumb */}
            <div className="h-3.5 w-32 rounded-full bg-warm-3 mb-[18px]" />

            {/* head */}
            <div className="flex items-center justify-between gap-4 mb-[18px] flex-wrap">
              <div className="flex items-center gap-[9px]">
                <div className="w-[30px] h-[30px] rounded-lg bg-warm-2 border border-line" />
                <div className="h-6 w-44 rounded-lg bg-warm-3" />
              </div>
              <div className="h-3.5 w-40 rounded-full bg-warm-2" />
            </div>

            {/* trail */}
            <div className="relative pl-[26px] max-w-[820px]">
              <div className="absolute top-1.5 bottom-1.5 left-[9px] w-1 rounded-full bg-warm-3" />

              {Array.from({ length: 3 }).map((_, g) => (
                <div key={g} className="relative mb-1.5">
                  <div className="flex items-center gap-2.5 py-4 pb-2.5">
                    <span className="absolute left-[-26px] w-5 h-5 rounded-full border-[3px] border-white bg-warm-2" />
                    <div className="h-4 w-32 rounded-full bg-warm-3" />
                    <div className="ml-auto h-3 w-28 rounded-full bg-warm-4" />
                  </div>
                  <div className="flex flex-wrap gap-2.5 pb-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-[112px] flex-none rounded-[12px] border-[1.5px] border-line bg-white px-2.5 pt-2.5 pb-3"
                      >
                        <div className="w-9 h-9 mx-auto mb-1.5 rounded-full bg-warm-2" />
                        <div className="h-2.5 w-full rounded-full bg-warm-2 mb-1" />
                        <div className="h-2.5 w-3/4 mx-auto rounded-full bg-warm-4 mb-1.5" />
                        <div className="h-2 w-10 mx-auto rounded-full bg-warm-4" />
                      </div>
                    ))}
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
