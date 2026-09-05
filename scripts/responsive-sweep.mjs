// Screenshot the key pages at the five reference widths (see AGENTS.md
// "Responsive rules") and flag any page whose body scrolls sideways.
//
//   npm i --no-save playwright-core@1.54     # not a dependency; reinstall as needed
//   BASE=http://localhost:3000 OUT=./sweep node scripts/responsive-sweep.mjs
//
// Logs in with the review account (KROOT_EMAIL / KROOT_PASSWORD env override),
// then visits each page at each width and writes <OUT>/<page>-<width>.png.
// A line "OVERFLOW <page> @<width>: scrollWidth > innerWidth" is the thing to
// look for; everything else is a picture to eyeball.
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:3000";
const OUT = process.env.OUT ?? "./sweep";
const EMAIL = process.env.KROOT_EMAIL ?? "killpig2000+uxreview@gmail.com";
const PASSWORD = process.env.KROOT_PASSWORD ?? "KrootReview2026!";
const EXE = process.env.CHROME ?? `${process.env.HOME}/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome`;

const WIDTHS = [360, 390, 430, 768, 1280];
const PAGES = [
  ["dashboard", "/en/dashboard"],
  ["ranking", "/en/ranking"],
  ["shop", "/en/shop"],
  ["vocabulary", "/en/vocabulary"],
  ["writing", "/en/writing"],
  ["listening", "/en/listening"],
  ["hangul", "/en/hangul"],
  ["profile", "/en/profile"],
];

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: EXE, args: ["--no-sandbox", "--ignore-certificate-errors"] });
const problems = [];

for (const width of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, locale: "en", deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/en/auth/login`, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForSelector("#email", { timeout: 120000 });
  await page.fill("#email", EMAIL);
  await page.fill("#pw", PASSWORD);
  await page.locator("button[type=submit]").first().click();
  await page.waitForTimeout(8000);

  for (const [name, path] of PAGES) {
    try {
      await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded", timeout: 120000 });
      await page.waitForTimeout(2500);
      const { sw, iw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
      if (sw > iw + 1) {
        problems.push(`OVERFLOW ${name} @${width}: scrollWidth ${sw} > innerWidth ${iw}`);
      }
      await page.screenshot({ path: `${OUT}/${name}-${width}.png`, fullPage: true });
      console.log(`ok ${name} @${width}${sw > iw + 1 ? "  <-- OVERFLOW" : ""}`);
    } catch (e) {
      problems.push(`ERROR ${name} @${width}: ${String(e).slice(0, 120)}`);
      console.log(`err ${name} @${width}`);
    }
  }
  await ctx.close();
}
await browser.close();
console.log("\n=== findings ===");
console.log(problems.length ? problems.join("\n") : "no horizontal overflow on any page/width");
