"use client";

import { useEffect, useState } from "react";

export default function SkillBar({ percent, note }: { percent: number; note: string }) {
  const [fill, setFill] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setFill(percent), 250);
    return () => clearTimeout(t);
  }, [percent]);

  return (
    <span className="flex items-center gap-2.5 mt-1.5">
      <span className="flex-1 max-w-[220px] h-[5px] bg-[#E7E5E4] rounded-full overflow-hidden">
        <i
          className={`not-italic block h-full rounded-full transition-[width] duration-1000 ${
            percent > 0 ? "bg-[#16A34A]" : "bg-[#F59E0B]"
          }`}
          style={{ width: `${fill}%` }}
        />
      </span>
      <span className="text-[11.5px] font-semibold text-[#71717A] whitespace-nowrap">
        {percent}% · {note}
      </span>
    </span>
  );
}
