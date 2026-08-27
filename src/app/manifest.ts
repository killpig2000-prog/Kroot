import type { MetadataRoute } from "next";

// Web app manifest — lets phones install Kroot to the home screen and is a
// prerequisite for Web Push on iOS (16.4+, installed PWAs only).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kroot — Grow your Korean",
    short_name: "Kroot",
    description:
      "A cozy garden where your Korean grows every day — tiny lessons, an AI tutor, and a tree that grows with you.",
    id: "/dashboard",
    start_url: "/dashboard?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FFF9EC",
    theme_color: "#6BBF8A",
    lang: "en",
    categories: ["education"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Water my words", short_name: "Review", url: "/review?source=pwa", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "Listening", url: "/listening?source=pwa", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "Roleplay", url: "/roleplay?source=pwa", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
