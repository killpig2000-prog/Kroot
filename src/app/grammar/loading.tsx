// Mirrors src/app/grammar/page.tsx: sidebar + breadcrumb + header + intro callout,
// two grouped lesson-list sections (course chunks / next-up), then a level-pill row
// and a third lesson-list section for "browse by level."

export default function GrammarLoading() {
  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#18181B]">
      <div className="grid grid-cols-1 md:grid-cols-[clamp(200px,18%,280px)_minmax(0,1fr)] w-full min-h-screen">
        <div className="hidden md:block border-r border-dashed border-[#DDD6C8] bg-[#FAF7EF]" />

        <main className="min-w-0 px-[clamp(18px,4vw,44px)] pt-6 pb-[100px] md:pb-[60px] animate-pulse">
          {/* breadcrumb */}
          <div className="flex gap-2 mb-[18px]">
            <div className="h-[13px] w-[50px] rounded-full bg-[#F3EEE2]" />
            <div className="h-[13px] w-[10px] rounded-full bg-[#F3EEE2]" />
            <div className="h-[13px] w-[55px] rounded-full bg-[#F3EEE2]" />
          </div>

          {/* head */}
          <div className="flex items-center justify-between gap-4 mb-[18px] flex-wrap">
            <div className="flex items-center gap-[9px]">
              <div className="w-[30px] h-[30px] rounded-lg bg-[#EFE9DC]" />
              <div className="h-[22px] w-[110px] rounded-full bg-[#EFE9DC]" />
            </div>
            <div className="h-[13px] w-[220px] rounded-full bg-[#F3EEE2]" />
          </div>

          {/* intro callout */}
          <div className="max-w-[820px] bg-[#FAF7EF] border border-dashed border-[#E3DDD0] rounded-[14px] px-[18px] py-4 mb-7">
            <div className="h-[13.5px] w-[95%] rounded-full bg-[#F3EEE2] mb-2" />
            <div className="h-[13.5px] w-[80%] rounded-full bg-[#F3EEE2] mb-2" />
            <div className="h-[13.5px] w-[60%] rounded-full bg-[#F3EEE2]" />
          </div>

          {/* two curated groups (course chunks / next up) */}
          {[0, 1].map((g) => (
            <section key={g} className="max-w-[820px] mb-8">
              <div className="flex items-center gap-2.5 mb-1">
                <div className="h-[11.5px] w-[160px] rounded-full bg-[#F3EEE2]" />
                <span className="h-px flex-1 bg-[#E3DDD0]" />
                <div className="h-[12px] w-[60px] rounded-full bg-[#F7F3E9]" />
              </div>
              <div className="h-[12.5px] w-[70%] rounded-full bg-[#F7F3E9] mb-3" />

              <div className="border border-[#E3DDD0] rounded-[14px] overflow-hidden">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3.5 px-[18px] py-[15px] bg-white ${
                      i > 0 ? "border-t border-[#E3DDD0]" : ""
                    }`}
                  >
                    <div className="flex-none w-8 h-8 rounded-[10px] bg-[#FAF7EF] border border-[#E3DDD0]" />
                    <span className="min-w-0 flex-1">
                      <div className="h-[15px] w-[55%] rounded-full bg-[#EFE9DC] mb-2" />
                      <div className="h-[12.5px] w-[75%] rounded-full bg-[#F7F3E9]" />
                    </span>
                    <div className="flex-none h-[20px] w-[34px] rounded-full bg-[#F3EEE2]" />
                    <div className="flex-none w-3 h-3 rounded-full bg-[#F7F3E9]" />
                  </div>
                ))}
              </div>
            </section>
          ))}

          {/* browse by level */}
          <section className="max-w-[820px] mb-8">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="h-[11.5px] w-[170px] rounded-full bg-[#F3EEE2]" />
              <span className="h-px flex-1 bg-[#E3DDD0]" />
              <div className="h-[12px] w-[60px] rounded-full bg-[#F7F3E9]" />
            </div>
            <div className="h-[12.5px] w-[80%] rounded-full bg-[#F7F3E9] mb-3" />

            {/* level pills */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="rounded-[9px] px-[18px] py-2 h-[36px] w-[70px] border bg-white border-[#E3DDD0]"
                />
              ))}
            </div>

            <div className="border border-[#E3DDD0] rounded-[14px] overflow-hidden">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3.5 px-[18px] py-[15px] bg-white ${
                    i > 0 ? "border-t border-[#E3DDD0]" : ""
                  }`}
                >
                  <div className="flex-none w-8 h-8 rounded-[10px] bg-[#FAF7EF] border border-[#E3DDD0]" />
                  <span className="min-w-0 flex-1">
                    <div className="h-[15px] w-[50%] rounded-full bg-[#EFE9DC] mb-2" />
                    <div className="h-[12.5px] w-[70%] rounded-full bg-[#F7F3E9]" />
                  </span>
                  <div className="flex-none h-[20px] w-[34px] rounded-full bg-[#F3EEE2]" />
                  <div className="flex-none w-3 h-3 rounded-full bg-[#F7F3E9]" />
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
