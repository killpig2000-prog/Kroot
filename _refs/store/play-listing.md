# Kroot — Google Play listing draft

Draft for the Play Console "Main store listing" + "Data safety" + "Content rating" forms.
Keep this file in sync when the app's data handling changes (privacy page: `src/app/[locale]/privacy/page.tsx`).

---

## Store listing (default language: English – US)

**App name** (≤30 chars) — chosen by user 2026-09-06
```
Kroot: Korean from the Roots
```

**Short description** (≤80 chars)
```
Grow your Korean daily: level test, 6 tools, an AI tutor & a tree that grows.
```

**Full description** (≤4000 chars)
```
Build Korean from the roots, one lesson at a time.

Kroot is a cozy, ad-free Korean learning app for people who want to actually speak — not just collect streaks. Take a 3-minute adaptive level test, get one quest a day already picked for you, and watch your tree grow every time you study.

🌱 FIND YOUR LEVEL IN 3 MINUTES
A short adaptive test places you on the CEFR scale (A1–C2) and stops as soon as it's sure. Can't read Hangul yet? Start there — no account needed.

📅 ONE QUEST A DAY, ALREADY PICKED
No feed, no deciding what to study. Open the app, do the one thing that's due, water your tree, close it.

🧰 6 TOOLS YOU'LL REACH FOR EVERY DAY
• Listening — A1–C2 dialogues with natural Korean voices and a subtitle toggle
• Pronunciation — say it into the mic and get an instant score
• Writing — build sentences word by word and get feedback
• Reading — real passages; tap any word for a hint
• Vocabulary — 4,000+ flashcards by topic, with spaced repetition so you never forget
• Slang — the real phrases textbooks skip

🌳 YOUR TREE GROWS WITH YOU
Every quiz and every recording waters it. Level up and it grows taller. Earn coins, dress your tree with Korean-themed costumes, and compare gardens with friends on the weekly ranking.

📚 FROM HANGUL TO FLUENCY
Start with an interactive Hangul guide with stroke-order animations, then move through 6 levels of grammar, vocabulary and practice — all included.

✨ EVERY LESSON FREE
No credit card, no paywalled levels, no ads.

Interface in English, Spanish, Japanese, Chinese and Vietnamese.

Questions or ideas? Tap the 💬 button in the app — a real person reads every message.
```

**Category:** Education
**Tags:** Language learning, Korean, Education
**Contact email:** killpig2000@gmail.com
**Website:** https://www.koreanunboxed.com
**Privacy policy URL:** https://www.koreanunboxed.com/en/privacy

---

## Graphics

| Asset | Spec | Status |
|---|---|---|
| App icon | 512×512 PNG, 32-bit, ≤1 MB | ✅ `play-store-icon-512.png` |
| Feature graphic | 1024×500 PNG/JPG | 🟡 v3 redesign, 3 boards awaiting pick — see "Feature graphic v3" below. `feature-graphic.png` currently holds the rejected phone-mockup version |
| Phone screenshots | 2–8, 16:9 or 9:16, 320–3840 px | 🟡 `screenshots/` (raw captures, see below) |
| 7" tablet screenshots | optional | skip for v1 |

Captured 2026-09-06 v6 (1080×1922, 390×694 CSS px ×2.77, review account on dev server; set per user):
1. `01-dashboard` — Lv.83 veteran tree on "moonlit-night" sky; name/avatar swapped in the DOM to "Ronnie" + the owner's photo. Level/sky came from a local, uncommitted edit of dashboard/shop pages + RankingBoard (`level = 83`, equipped + "moonlit-night") on the dev server — reverted after the shoot; DB untouched
2. `02-listening` — Cafe A1 clip, two characters + waveform
3. `03-vocabulary` — Japanese UI (/ja) with the More-sheet language menu open (shows all 5 languages)
4. `04-reading` — Chapter 1 scrolled to the "Morning routine" title, tapped word popup (시 · o'clock)
5. `05-writing` — Chapter 1 Q1 with one tile placed (저는) and a 👆 hand on the next (빵을) — hand is a DOM overlay
6. `06-vocabulary` — English Chapter 1 Day 1 word list; sticky "Continue Chapter 1 →" bar hidden for the shot (pronunciation shot dropped by user)
7. `07-shop` — Lv.83 night try-on tree + category tabs + first item cards ("This week only" banner and slot chips moved off-screen for the shot — banner must stay in the DOM, its SVG holds the trunk gradient defs)
8. `08-ranking` — Garden Fair podium, own row shown as Lv.83 night tree (same local override); shows other users' display names — user OK'd

Add caption text over each (Figma / Canva), e.g. "One quest a day", "Say it, get scored".

---

## Data safety form

**Does your app collect or share any of the required user data types?** Yes
**Is all user data encrypted in transit?** Yes (HTTPS)
**Do you provide a way for users to request that their data is deleted?** Yes — email killpig2000@gmail.com; also state on the privacy page. (Play also wants a deletion URL: use `https://www.koreanunboxed.com/en/privacy#retention-deletion`)

### Data types

| Category | Type | Collected | Shared | Optional? | Purpose |
|---|---|---|---|---|---|
| Personal info | Email address | Yes | No | Required (account) | Account management |
| Personal info | Name (display name) | Yes | No | Required (account) | Account management, app functionality (ranking) |
| Personal info | User IDs (Supabase uid) | Yes | No | Required | Account management |
| Photos & videos | Photos (profile photo) | Yes | No | Optional | App functionality |
| Audio | Voice or sound recordings (pronunciation) | Yes* | No | Optional | App functionality |
| Messages | Other in-app messages (feedback form) | Yes | No | Optional | Customer support |
| App activity | App interactions (pages/features used) | Yes | No | Required | Analytics |
| App activity | In-app search history | No | — | — | — |
| App activity | Other user-generated content (writing answers, quiz answers, learning progress) | Yes | No | Required | App functionality |
| App info & performance | Crash logs / diagnostics | No** | — | — | — |
| Device or other IDs | Device or other IDs (push token) | Yes | No | Optional (reminders) | App functionality |
| Location | Any | No | — | — | — |
| Financial info | Any | No | — | — | — |
| Health & fitness | Any | No | — | — | — |
| Contacts / Calendar / Files | Any | No | — | — | — |
| Web browsing | Any | No | — | — | — |

\* Pronunciation audio is processed on-device by the browser's speech recognition (Web Speech API) — verify whether it leaves the device via the OS speech service before answering. If Chrome/Android sends audio to Google for recognition, mark "Collected: Yes, ephemeral" (processed but not stored).
\*\* Vercel Web Analytics is cookie-free and aggregated; Play counts it under "App interactions". No crash reporter (Sentry etc.) is installed — re-check if one is added.

**Data handling practices per type:** Not shared with third parties. Processors (Supabase, Vercel, Brevo, Google Cloud TTS) act as service providers only, which Play does NOT count as "sharing".

**Ephemeral processing:** TTS text sent to Google Cloud (not user data — it's lesson content).

---

## Content rating questionnaire (IARC)

Category: **Utility, Productivity, Communication, or Other** → choose **Education/Reference** where offered.

| Question | Answer |
|---|---|
| Violence, sexual content, drugs, gambling, profanity | No (slang section teaches casual phrases; none are rated profane — review the slang list once before submitting) |
| Does the app allow users to interact or exchange content? | Yes — weekly ranking shows other users' display names + trees. No chat, no free-text UGC visible to others. |
| Does the app share user's location with others? | No |
| Does the app allow purchase of digital goods? | No (coins are earned only, no IAP) |
| Contains ads? | No |

Expected rating: **Everyone / PEGI 3**.

---

## Other Play Console sections

- **App access:** "All functionality is available without special access" is FALSE — the reviewer needs an account. Provide the review account: `killpig2000+uxreview@gmail.com` / `KrootReview2026!` (or make a dedicated `+playreview` account). Note the level test is open without login.
- **Ads:** No ads.
- **Target audience:** 13+ (privacy page says not directed at under-13). Pick "13–15, 16–17, 18 and over"; do NOT pick under-13 (triggers Families policy).
- **News app:** No.
- **COVID-19 tracing:** No.
- **Data safety → Government app:** No.
- **Financial features:** None.
- **Health:** None.

---

## Localized listings (later)

App UI ships in en / es / ja / zh / vi. Add localized short + full descriptions for those five once the English listing is approved; Korean (ko-KR) listing optional since the target audience is English-speaking.

---

## Status 2026-09-06 & what's next

**Mockup (store preview + all 8 screenshots + feature-graphic draft + copy + data-safety table):**
https://claude.ai/code/artifact/c09d5f56-2ed5-47b3-9e9b-ed8aea672c91

**Done (all committed locally, NOT pushed):** privacy page fixed (TTS → Google Cloud), listing copy, data-safety + content-rating answers, 8 phone screenshots v6 (`screenshots/`), feature-graphic HTML draft (direction A, no Free/No-ads/A1→C2 chips).

**User's own to-dos (needs their Google account / browser):**
1. Google Play developer account — $25 one-time. Choose **Individual**, not Organization (Organization needs a D-U-N-S number → weeks). Payment failed on 2026-09-01; retry.
2. ~~Pick the feature graphic direction~~ — done, see below.
3. Confirm screenshots v6 are final (or ask for a slightly-scrolled dashboard so streak/coins chips show). Screenshots v7 (swap in the Hangul ㅅ trace shot) still pending — see roadmap memory.
4. Generate the TWA package at pwabuilder.com → enter https://www.koreanunboxed.com → **decide the package name (permanent, e.g. com.koreanunboxed.kroot)** → download the .aab + signing-key SHA-256 fingerprint.
5. Hand the SHA-256 fingerprint to Claude → Claude adds `public/.well-known/assetlinks.json` and deploys.
6. `adb install` the test APK on a real phone: no URL bar, splash shows, status bar color right.
7. Play Console: create app → upload .aab → paste copy from this file → upload icon (`play-store-icon-512.png`), feature graphic, 8 screenshots → fill Data safety / Content rating / App access (review account) / Target audience 13+ → submit for review.

**Claude's remaining pieces:** feature graphic PNG export (after step 2), assetlinks.json (after step 5), optional screenshot captions, localized listings (es/ja/zh/vi) after EN is approved.

---

## TWA package — generated 2026-09-06

Built with the PWABuilder packaging API (same backend as pwabuilder.com) from the live manifest.

- **Package name (permanent once uploaded):** `com.koreanunboxed.kroot`
- Android app label + launcher name = "Kroot" (regenerated 2026-09-06 with the same keystore, fingerprint unchanged). Version 1.0.0 (code 1), host `www.koreanunboxed.com`, start `/dashboard?source=pwa`, portrait, standalone, fallback = Chrome Custom Tabs, notifications on, minSdk 21
- Files in `_refs/store/twa/` (**gitignored — contains the upload keystore; back it up somewhere safe, losing it = can't update the app**):
  - `Kroot.aab` → upload to Play Console
  - `Kroot.apk` → `adb install` on a phone for testing
  - `signing.keystore` + `signing-key-info.txt` (passwords inside) → keep private, needed for every future upload
  - `assetlinks.json`, `Readme.html`
- Upload-key SHA-256: `FA:97:FB:84:C6:C8:CF:A7:A7:3E:EA:13:38:C7:22:82:DE:C4:3B:F5:54:78:83:D7:7C:D8:FA:12:B2:7C:2C:37`
- `public/.well-known/assetlinks.json` added with that fingerprint (proxy matcher skips dotted paths, verified served on dev).

**After the first Play upload:** with Google Play App Signing on, Google re-signs the app with *its* key. Copy the "App signing key certificate" SHA-256 from Play Console → App integrity and add it as a second entry in `sha256_cert_fingerprints`, then deploy — otherwise the Play-installed app shows a URL bar.

**Regenerate when:** manifest name/icons/colors/start_url change, or Google raises the target SDK. Re-run the API with `signingMode: "mine"` + the existing keystore so the fingerprint stays the same.

---

## Feature graphic v3 — 3 boards, AWAITING PICK (2026-09-06 evening)

User rejected the phone-mockup graphic below ("너무 못생겼다") and asked for a benchmark-based, Kroot-only design. Resume here tomorrow.

**Mockup (3 boards + benchmark notes):** https://claude.ai/code/artifact/1336b300-d143-4ed8-9516-be7eab8d0171
**Rendered 1024×500 PNGs:** `feature-graphic-v3/A-night-garden.png` (recommended) · `B-sunny-meadow.png` · `C-paper-card.png`

Rules applied (from Headspace/Duolingo-style top feature graphics + Google's guide — sources in the mockup):
1. One anchor element, not a collage → the **tree** (the admin's real Lv.62 tree, pulled from the dashboard as vector SVG: `feature-graphic-source/tree-clean.svg`, ruler stripped)
2. 4–8-word benefit headline (A "Learn Korean. Grow your tree." · B "Your Korean grows here." · C "Grow your Korean, one lesson a day.")
3. No cream/white background (blends into Play's white surfaces) → deep green / saturated green
4. Text inside a ~60px safe area; centre left empty for the ▶ overlay if a promo video is added
5. No big logo (duplicates the app icon in listings) → small "Kroot" wordmark only
6. Kroot-only motif: Hangul jamo as fireflies/leaves; C adds the ㅅ stroke-guide

**To export the picked board:** `feature-graphic-source/fg-v3.tpl.html` has `__TREE__` placeholders — inject `tree-clean.svg` (rename gradient ids `tc-`→`tcA-` etc. per copy), open in Playwright at 1200px, set `--s:1` on `.fg<X>` and screenshot it → `feature-graphic.png`. `feature-graphic-v3/render.mjs` does exactly this for all three (paths point at the session scratchpad — repoint to `feature-graphic-v3/mockup.html`).

---

## Feature graphic (phone mockup) — SUPERSEDED by v3 above

`feature-graphic.png` (1024×500) is final: direction A layout — headline "Grow your Korean, one lesson a day.", two tilted phones.
- Phone 1: the real dashboard, logged in as the **live admin account** (magic-link login, not a faked DB override) showing its actual current state — Pine tree, Lv.62, C2, streak. The oversized admin coin-balance pill was cropped out (canvas stitch, not a UI change).
- Phone 2: the Hangul ㅅ trace popup (Practice tab, first stroke highlighted) — replaces the listening screenshot used in earlier drafts.

Source screenshots kept at `_refs/store/feature-graphic-source/` (dashboard-admin-lv62.png, hangul-trace-s.png) in case the graphic needs a re-crop later. No source code was changed to produce these — captured via a throwaway Playwright script against a local dev server, admin login via a Supabase-generated magic link, script deleted after use.
