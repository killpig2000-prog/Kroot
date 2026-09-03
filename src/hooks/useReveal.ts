"use client";

import { useEffect } from "react";

export function useReveal() {
  useEffect(() => {
    // Content is visible by default (see .reveal in globals.css) so a slow
    // script, a crawler, or reduced-motion never sees blank sections. Only
    // once this hook is live do we opt the page into the hide-then-reveal.
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.querySelectorAll(".leaf-step").forEach((l) => l.classList.add("grown"));
      return;
    }
    document.documentElement.classList.add("js-reveal");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            if (entry.target.id === "stalk") {
              entry.target.querySelectorAll(".leaf-step").forEach((leaf, i) => {
                setTimeout(() => leaf.classList.add("grown"), 200 + i * 220);
              });
            }
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    document.querySelectorAll(".reveal, #stalk").forEach((el) => io.observe(el));

    return () => {
      io.disconnect();
      document.documentElement.classList.remove("js-reveal");
    };
  }, []);
}
