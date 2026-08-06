"use client";

export type DayMinutes = { date: string; label: string; minutes: number };

const PLOT_HEIGHT = 128;

export default function WeeklyChart({ days }: { days: DayMinutes[] }) {
  const max = Math.max(...days.map((d) => d.minutes), 0);
  const todayIndex = days.length - 1;
  const peakIndex = max > 0 ? days.findIndex((d) => d.minutes === max) : -1;

  return (
    <div className="border border-[#E3DDD0] rounded-[14px] px-[22px] py-5">
      <div className="flex justify-between items-baseline mb-4 gap-3">
        <b className="font-semibold text-[15px] tracking-[-0.01em]">This week&apos;s watering</b>
        <span className="text-[12px] text-[#A19A8C] font-medium">minutes / day</span>
      </div>

      <div className="flex items-end gap-2" style={{ height: PLOT_HEIGHT }} aria-hidden="true">
        {days.map((d, i) => {
          const isToday = i === todayIndex;
          const showValue = d.minutes > 0 && (isToday || i === peakIndex);
          const barHeight = max > 0 ? Math.max(3, Math.round((d.minutes / max) * (PLOT_HEIGHT - 22))) : 3;

          return (
            <div
              key={d.date}
              className="flex-1 flex flex-col justify-end items-center gap-1.5 h-full"
              title={`${d.label}: ${d.minutes} min`}
            >
              <span
                className={`text-[11px] leading-none font-semibold tabular-nums ${
                  isToday ? "text-[#16A34A]" : "text-[#A19A8C]"
                } ${showValue ? "" : "invisible"}`}
              >
                {d.minutes}
              </span>
              <div
                className={`w-full max-w-[26px] rounded-t-[4px] ${
                  isToday ? "bg-[#16A34A]" : d.minutes > 0 ? "bg-[#BBF7D0]" : "bg-[#E3DDD0]"
                }`}
                style={{ height: barHeight }}
              />
            </div>
          );
        })}
      </div>

      <div className="flex gap-2 mt-2 border-t border-[#E3DDD0] pt-2" aria-hidden="true">
        {days.map((d, i) => (
          <div
            key={d.date}
            className={`flex-1 text-center text-[11px] leading-none ${
              i === todayIndex ? "text-[#18181B] font-semibold" : "text-[#A19A8C] font-medium"
            }`}
          >
            {d.label}
          </div>
        ))}
      </div>

      <table className="sr-only">
        <caption>Minutes studied per day, last 7 days</caption>
        <thead>
          <tr>
            <th scope="col">Day</th>
            <th scope="col">Minutes</th>
          </tr>
        </thead>
        <tbody>
          {days.map((d) => (
            <tr key={d.date}>
              <td>{d.label}</td>
              <td>{d.minutes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
