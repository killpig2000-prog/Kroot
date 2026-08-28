// Route-level loading skeleton for full-width pages without the dashboard
// sidebar (pricing, admin, onboarding, ...). See PageSkeleton for the
// sidebar-layout variant.
export default function PlainSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="min-h-screen bg-warm px-6 pt-10 pb-16">
      <div className="max-w-[720px] mx-auto animate-pulse">
        <div className="h-3.5 w-40 rounded-full bg-warm-3 mb-4 mx-auto" />
        <div className="h-8 w-72 rounded-lg bg-warm-3 mb-8 mx-auto" />
        <div className="grid gap-3.5">
          {Array.from({ length: rows }).map((_, i) => (
            <div
              key={i}
              className="h-[72px] rounded-[14px] border border-warm-3 bg-white flex items-center gap-4 px-5"
            >
              <div className="w-11 h-11 rounded-[11px] bg-warm-2 flex-none" />
              <div className="flex-1">
                <div className="h-3.5 w-1/2 rounded-full bg-warm-2 mb-2" />
                <div className="h-3 w-1/3 rounded-full bg-warm-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
