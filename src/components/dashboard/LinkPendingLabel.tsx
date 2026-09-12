"use client";

import type { ReactNode } from "react";
import { useLinkStatus } from "next/link";

// Swaps a link's label for a spinner while its navigation is pending, at the
// same size so nothing shifts. Must render inside a <Link>.
export default function LinkPendingLabel({ children }: { children: ReactNode }) {
  const { pending } = useLinkStatus();
  return (
    <span className="relative inline-grid place-items-center" aria-busy={pending}>
      <span className={`transition-opacity duration-100 ${pending ? "opacity-0" : "opacity-100"}`}>{children}</span>
      <span
        aria-hidden="true"
        className={`absolute h-[1.05em] w-[1.05em] rounded-full border-2 border-current border-t-transparent animate-spin transition-opacity duration-100 ${
          pending ? "opacity-100" : "opacity-0"
        }`}
      />
    </span>
  );
}
