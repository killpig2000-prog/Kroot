// New / Learning / Known as a shape, not a metaphor — an empty ring, a ring
// with a dot, or a solid check. Same three states as WORD_STATUSES.
export default function WordStatusIcon({
  status,
  className = "w-[15px] h-[15px]",
}: {
  status: number;
  className?: string;
}) {
  if (status >= 2) {
    return (
      <svg viewBox="0 0 16 16" className={className} aria-hidden="true">
        <circle cx="8" cy="8" r="7" fill="var(--color-success)" />
        <path
          d="M4.6 8.3 6.9 10.6 11.4 5.7"
          fill="none"
          stroke="white"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (status === 1) {
    return (
      <svg viewBox="0 0 16 16" className={className} aria-hidden="true">
        <circle cx="8" cy="8" r="6.25" fill="none" stroke="var(--color-amber)" strokeWidth="1.6" />
        <circle cx="8" cy="8" r="2.6" fill="var(--color-amber)" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true">
      <circle cx="8" cy="8" r="6.25" fill="none" stroke="var(--color-faint)" strokeWidth="1.6" />
    </svg>
  );
}
