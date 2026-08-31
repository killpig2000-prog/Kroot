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
      // The plain-language copy pass renamed this surface twice ("water my
      // words" → Review → Practice) and the manifest was missed both times, so
      // anyone who installed the PWA still long-presses the icon and sees a
      // watering can. nav.practice is the label the app itself uses.
      { name: "Practice", short_name: "Practice", url: "/review?source=pwa", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "Listening", url: "/listening?source=pwa", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
