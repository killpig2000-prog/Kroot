"use client";

import { cleanCode, CODE_LENGTH } from "@/lib/auth-errors";

// The 8-digit code field used by sign-up confirmation, code login and
// password reset. Digits only, capped at the code length.
//
// The value is rewritten only when the typed text actually contains
// something other than those digits. Feeding a controlled input a value
// different from what the keyboard just produced — on every keystroke — is
// what confuses mobile IMEs (Gboard, Samsung Keyboard): they keep their own
// composition buffer, and a backspace then deletes from that buffer instead
// of the field, so the digits on screen never go away. There is also an
// explicit clear button, so getting back to an empty field never depends on
// the keyboard at all.
export default function CodeInput({
  id,
  value,
  onChange,
  onEnter,
  className = "",
  clearLabel,
  autoFocus,
}: {
  id: string;
  value: string;
  onChange: (next: string) => void;
  /** Called on Enter when a full code is in the field. */
  onEnter?: () => void;
  className?: string;
  clearLabel: string;
  autoFocus?: boolean;
}) {
  return (
    <div className="relative">
      <input
        id={id}
        className={`${className} pr-11`}
        value={value}
        onChange={(e) => {
          const raw = e.target.value;
          const clean = cleanCode(raw);
          onChange(clean === raw ? raw : clean);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && onEnter) {
            e.preventDefault();
            if (cleanCode(value).length === CODE_LENGTH) onEnter();
          }
        }}
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="one-time-code"
        autoFocus={autoFocus}
        placeholder="••••••••"
      />
      {value.length > 0 && (
        <button
          type="button"
          aria-label={clearLabel}
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-warm text-muted hover:text-charcoal text-[15px] leading-none flex items-center justify-center"
        >
          ✕
        </button>
      )}
    </div>
  );
}
