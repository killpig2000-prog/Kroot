// Shared card/label primitives for feature-screen UI. See Button.tsx for the
// matching button token consolidation.
import type { HTMLAttributes } from "react";

export function Card({ className = "", ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`border border-line rounded-[14px] p-[clamp(20px,3vw,28px)] ${className}`}
      {...rest}
    />
  );
}

export function Label({ className = "", ...rest }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={`text-[11.5px] font-semibold tracking-[.06em] uppercase text-faint mb-2 ${className}`}
      {...rest}
    />
  );
}
