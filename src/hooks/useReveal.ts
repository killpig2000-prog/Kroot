"use client";

import { useEffect } from "react";

export function useReveal() {
  useEffect(() => {
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

    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.querySelectorAll(".leaf-step").forEach((l) => l.classList.add("grown"));
    }

    return () => io.disconnect();
  }, []);
}
