import { chromium } from "playwright-core";
const EXE = `${process.env.HOME}/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome`;
const browser = await chromium.launch({ executablePath: EXE, args: ["--no-sandbox"] });
const page = await (await browser.newContext({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 1 })).newPage();
await page.goto("file:///tmp/claude-1000/-home-i0215743-App-Kroot/88071698-b6d0-459e-a31b-4489f199c21c/scratchpad/fg-v3.html", { waitUntil: "load" });
await page.evaluate(async () => { try { await document.fonts.ready; } catch {} });
await page.waitForTimeout(1500);
for (const k of ["A","B","C"]) {
  const el = page.locator(`.fg${k}`);
  await el.evaluate((n) => { n.style.setProperty("--s", "1"); n.parentElement.style.width = "1024px"; n.parentElement.style.maxWidth = "1024px"; });
  await el.screenshot({ path: `/tmp/claude-1000/-home-i0215743-App-Kroot/88071698-b6d0-459e-a31b-4489f199c21c/scratchpad/fg-${k}.png` });
  console.log("shot", k);
}
await browser.close();
