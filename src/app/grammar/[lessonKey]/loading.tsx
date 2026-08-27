// Mirrors GrammarLessonPage: breadcrumb, title with kr-badge, level line,
// an indigo summary callout, 3 numbered explanation sections each with an
// example box, a "check yourself" quiz divider + block, and footer nav.
export default function Loading() {
  return (
    <div className="min-h-screen bg-[#FFFFFF] text-charcoal">
      <div className="grid grid-cols-1 md:grid-cols-[clamp(200px,18%,280px)_minmax(0,1fr)] w-full min-h-screen">
        <div className="hidden md:block border-r border-dashed border-dash bg-warm" />

        <main className="min-w-0 px-[clamp(18px,4vw,44px)] pt-6 pb-[100px] md:pb-[60px]">
          <div className="animate-pulse">
            {/* breadcrumb */}
            <div className="flex gap-2 mb-[18px]">
              <div className="h-3 w-14 rounded-full bg-warm-2" />
              <div className="h-3 w-2 rounded-full bg-warm-2" />
              <div className="h-3 w-16 rounded-full bg-warm-2" />
              <div className="h-3 w-2 rounded-full bg-warm-2" />
              <div className="h-3 w-24 rounded-full bg-warm-3" />
            </div>

            {/* head */}
            <div className="flex items-center justify-between gap-4 mb-[18px] flex-wrap">
              <div className="flex items-center gap-[9px]">
                <div className="w-[30px] h-[30px] rounded-lg bg-[#EEF2FF] border border-[#C7D2FE]" />
                <div className="h-6 w-48 rounded-lg bg-warm-3" />
              </div>
              <div className="h-3.5 w-40 rounded-full bg-warm-2" />
            </div>

            {/* summary */}
            <div className="max-w-[720px] bg-[#EEF2FF] border border-[#C7D2FE] rounded-[14px] px-[18px] py-4 mb-7">
              <div className="h-3.5 w-full rounded-full bg-[#C7D2FE]/50 mb-2" />
              <div className="h-3.5 w-[80%] rounded-full bg-[#C7D2FE]/50" />
            </div>

            {/* sections */}
            <div className="max-w-[720px]">
              {Array.from({ length: 3 }).map((_, i) => (
                <section
                  key={i}
                  className="border border-line rounded-[14px] p-[clamp(18px,2.5vw,26px)] mb-3.5"
                >
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <div className="flex-none w-[22px] h-[22px] rounded-md bg-[#EEF2FF] border border-[#C7D2FE]" />
                    <div className="h-4 w-52 rounded-lg bg-warm-3" />
                  </div>
                  <div className="flex flex-col gap-2 mb-4">
                    <div className="h-3 w-full rounded-full bg-warm-4" />
                    <div className="h-3 w-full rounded-full bg-warm-4" />
                    <div className="h-3 w-2/3 rounded-full bg-warm-4" />
                  </div>
                  <div className="rounded-[10px] bg-warm border border-dashed border-line p-4 flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                      <div className="h-3.5 w-1/2 rounded-full bg-warm-2" />
                      <div className="h-3 w-1/3 rounded-full bg-warm-4" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <div className="h-3.5 w-2/5 rounded-full bg-warm-2" />
                      <div className="h-3 w-1/4 rounded-full bg-warm-4" />
                    </div>
                  </div>
                </section>
              ))}

              {/* quiz divider */}
              <div className="flex items-center gap-2.5 mt-8 mb-3.5">
                <div className="h-3 w-28 rounded-full bg-warm-3" />
                <span className="h-px flex-1 bg-line" />
              </div>
              <div className="border border-line rounded-[14px] p-[clamp(18px,2.5vw,26px)] flex flex-col gap-3.5">
                <div className="h-4 w-[70%] rounded-lg bg-warm-3" />
                <div className="flex flex-col gap-2.5">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-10 rounded-[9px] bg-warm border border-dashed border-line"
                    />
                  ))}
                </div>
              </div>

              {/* footer nav */}
              <div className="flex items-center justify-between gap-3 mt-6 flex-wrap">
                <div className="h-10 w-32 rounded-[9px] bg-white border border-line" />
                <div className="h-10 w-40 rounded-[9px] bg-warm-3" />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
