"use client";

import { useReveal } from "@/hooks/useReveal";

// Renders nothing — it exists only to run useReveal, which drives the
// scroll-in animation entirely through document queries and class toggles.
//
// Keeping it a leaf means the landing page itself stays a server component.
// It used to be "use client" solely to call this hook, which pulled all eight
// section components (~700 lines of static markup, none of them interactive)
// into the client bundle to be hydrated for nothing — on the app's most
// visited, most SEO-sensitive page.
export default function Reveal() {
  useReveal();
  return null;
}
