# Master Test Plan — kran-apps.cloud Application Suite

**Owner:** Kapil Sharma
**Prepared for:** Manual QA tester (no prior knowledge of these apps assumed)
**Last updated:** 19 October 2026

---

## 1. How to use this pack

This pack contains **one detailed guide per application**, plus this master plan. Each app guide is self-contained: it explains what the app does, walks you through every feature in plain English, and then gives you step-by-step test cases with exact expected results.

| # | Application | What it is | Live URL | Features | Tests | Guide |
|---|---|---|---|---|---|---|
| 1 | **SmashPoint** | Badminton club & tournament management | https://smashpoint.kran-apps.cloud | 135 | 356 | [01-smashpoint.md](01-smashpoint.md) |
| 2 | **Voyagr** | AI travel / trip planner | https://travelplan.kran-apps.cloud | 98 | 261 | [02-voyagr.md](02-voyagr.md) |
| 3 | **BhoomiPlan / AgriOps** | Agricultural land designer & farm ops | https://bhoomiplan.kran-apps.cloud | 126 | 517 | [03-bhoomiplan-agriops.md](03-bhoomiplan-agriops.md) |
| 4 | **MoneyPortfolio** | Private financial portfolio dashboard | https://moneyportfolio.kran-apps.cloud | 187 | 543 | [04-moneyportfolio.md](04-moneyportfolio.md) |
| 5 | **Job Agent** | CV & job-hunt automation agent | https://jobs.kran-apps.cloud | 113 | 356 | [05-jobagent.md](05-jobagent.md) |
| 6 | **Chessary** | Chess portal — play, solve, analyse | https://chess.kran-apps.cloud | 163 | 445 | [06-chessary.md](06-chessary.md) |
| 7 | **Junior Playhouse** | Children's games & activities (19 games) | https://junior-playhouse.kran-apps.cloud | 115 | 339 | [07-junior-playhouse.md](07-junior-playhouse.md) |
| 8 | **The Kangra Dham Co.** | Himachali food business website | https://kangradham.kran-apps.cloud | 60 | 279 | [08-kangra-dham.md](08-kangra-dham.md) |
| | **TOTAL** | | | **997** | **3,096** | |

**Suggested reading order for a new tester:** this document → the app you are assigned → that app's "Prerequisites" section (request everything on it *before* you start testing).

### Legacy URLs

Several apps were renamed. The **old URLs still work** and should redirect or serve the same app. Testing that old links have not broken is itself a test case.

| App | Current URL | Legacy URL |
|---|---|---|
| SmashPoint | `smashpoint.kran-apps.cloud` | `smash.kran-apps.cloud` |
| Voyagr | `travelplan.kran-apps.cloud` | `travel.kran-apps.cloud` |
| BhoomiPlan | `bhoomiplan.kran-apps.cloud` | `bhoomi.kran-apps.cloud` |
| Job Agent | `jobs.kran-apps.cloud` | `job.kran-apps.cloud` |
| Kangra Dham | `kangradham.kran-apps.cloud` | `kangra.kran-apps.cloud` |

---

## 2. ⚠️ Safety rules — read before touching anything

These are **live production apps used by real people.** There is no separate staging environment. Three of them can affect the outside world or expose private data.

| App | Risk | Rule |
|---|---|---|
| **Job Agent** | Can submit **real job applications** and send **real emails** to real employers | Never run an "apply" action without the owner's explicit approval or a dry-run mode. Marked ⚠️ in its guide. |
| **Kangra Dham** | Enquiry/booking forms send **real messages to the business owner** | Always prefix submitted text with `TEST — PLEASE IGNORE`. Marked ⚠️ in its guide. |
| **MoneyPortfolio** | Contains **real personal financial data** | Use dummy data. Never put real balances in a bug report or screenshot. |
| **SmashPoint** | Has **real club members** | Do not email/notify members, delete real data, or change real bookings. |

**Universal rules**

1. **Never delete data** you did not create yourself.
2. **Do not change passwords** of real accounts.
3. **Do not test payment flows** with real card details.
4. Before any test marked ⚠️, **stop and get written approval** from the owner.
5. If you are unsure whether an action is reversible — **ask first**.

---

## 3. Before you start — environment setup

### 3.1 Devices and browsers

Test on **at least** the following. Each app guide says where mobile matters most.

| Type | Requirement |
|---|---|
| Desktop browser (primary) | Latest **Chrome** or **Edge** |
| Desktop browser (secondary) | Latest **Firefox** |
| Safari | If a Mac/iPhone is available — layout bugs often appear only here |
| Mobile | A real **Android phone** and, if possible, an **iPhone** |
| Tablet | Important for **Junior Playhouse** (children use tablets) |
| Screen sizes | Check 360px, 768px, 1024px and 1920px wide |

Use your browser's **DevTools device toolbar** (F12 → Ctrl+Shift+M) to simulate sizes, but confirm anything suspicious on a **real device** — simulators miss touch and performance issues.

### 3.2 Always keep the browser console open

Press **F12 → Console** tab while testing. **Any red error in the console is a finding**, even if the page looks fine. Include a screenshot of the console in your bug report.

Also watch the **Network** tab for requests that return **4xx or 5xx** status codes.

### 3.3 Credentials checklist — request from the owner first

Do not start until you have these. Each app guide repeats its own specific needs.

- [ ] SmashPoint — a **member** account *and* an **admin** account (two separate logins, needed for permission tests)
- [ ] Job Agent — a login, plus confirmation of whether a **dry-run/sandbox mode** exists
- [ ] MoneyPortfolio — a login, ideally a **test account with dummy holdings**
- [ ] Kangra Dham — **admin credentials** if an admin area exists, plus the **correct business details** (address, phone, hours, prices) to check the site against
- [ ] Voyagr / BhoomiPlan / Chessary / Junior Playhouse — confirm whether sign-in is needed at all
- [ ] A **dummy CV file** (PDF and DOCX) for Job Agent
- [ ] A **test email address** you control
- [ ] Confirmation of **which tests marked ⚠️ you are allowed to run**

---

## 4. Shared conventions

### 4.1 Test case priority

| Priority | Meaning | When to run |
|---|---|---|
| **P1** | Core function. If this fails, the app is unusable. | Every test cycle, always first |
| **P2** | Important, but there is a workaround. | Every full cycle |
| **P3** | Cosmetic, rare edge case, nice-to-have. | Full regression only |

### 4.2 Defect severity

| Severity | Definition | Examples |
|---|---|---|
| **S1 — Critical** | App down, data loss, security breach, or a real-world wrong action | Site 500s; private data visible without login; a real job application sent by mistake |
| **S2 — Major** | A key feature is broken with no workaround | Cannot create a booking; wrong total calculated; cannot save a design |
| **S3 — Minor** | Feature works but behaves wrongly, or there is a workaround | Validation message wrong; sort order incorrect; date format odd |
| **S4 — Cosmetic** | Looks wrong, no functional impact | Misaligned button; typo; wrong icon |

**Wrong numbers are never cosmetic.** Any incorrect calculation in MoneyPortfolio, BhoomiPlan or SmashPoint scoring is **at least S2**.

### 4.3 Test result statuses

`Pass` · `Fail` · `Blocked` (cannot run — say why) · `Not Run` · `N/A` (feature absent)

### 4.4 Bug report template

Copy this for every defect.

```
TITLE:        [App] Short description of what is wrong

SEVERITY:     S1 / S2 / S3 / S4
PRIORITY:     P1 / P2 / P3
TEST CASE ID: e.g. SP-014  (or "Exploratory" if not from the plan)

ENVIRONMENT:
  App + URL:  e.g. SmashPoint — https://smashpoint.kran-apps.cloud/bookings
  Browser:    e.g. Chrome 131 on Windows 11
  Device:     Desktop 1920x1080 / Samsung S21 Android 14
  Logged in as: role + which test account
  Date/time:  19 Oct 2026, 14:32 IST

STEPS TO REPRODUCE:
  1.
  2.
  3.

EXPECTED RESULT:
  What should have happened, and why you believe so.

ACTUAL RESULT:
  What actually happened. Quote exact error text.

REPRODUCIBILITY:  Always / Sometimes (x out of 5) / Once only

EVIDENCE:
  - Screenshot or screen recording
  - Browser console output (F12 → Console)
  - Failing network request + status code (F12 → Network)

NOTES / WORKAROUND:
```

**Three things that make a bug report actually useful:** exact steps a stranger can follow, the **exact error text** (typed out, not just described), and whether it happens **every time**.

---

## 5. Recommended test order

Work through the apps in this order. It front-loads the riskiest and most complex apps while you are fresh, and leaves the safest for last.

| Order | App | Why this position | Rough effort |
|---|---|---|---|
| 1 | **SmashPoint** | Most complex; has roles, permissions and real members | 1–2 days |
| 2 | **MoneyPortfolio** | Financial correctness and access control are high-risk | 1 day |
| 3 | **Chessary** | Rules engine needs careful, methodical testing | 1–2 days |
| 4 | **Job Agent** | Complex *and* side-effecting; needs approvals in place | 1 day |
| 5 | **BhoomiPlan / AgriOps** | Calculation and editor testing | 1 day |
| 6 | **Voyagr** | AI output needs judgement-based testing | 0.5–1 day |
| 7 | **Junior Playhouse** | Many small games; best on a tablet | 0.5–1 day |
| 8 | **Kangra Dham** | Mostly a content site | 0.5 day |

*Effort estimates assume one tester working through the full plan, not just the smoke tests.*

### Day-one plan

Do not try to test everything on day one. Instead:

1. Run the **15-minute smoke test** from **all eight** guides (~2 hours total).
2. Report anything broken immediately — a blocker found on day one saves days of wasted effort.
3. Then start the deep pass on SmashPoint.

---

## 6. Entry and exit criteria

**Entry — do not begin until all are true:**

- [ ] All eight apps load over HTTPS without certificate warnings
- [ ] All credentials from §3.3 have been received and verified working
- [ ] Owner has stated in writing which ⚠️ tests are permitted
- [ ] You have the correct business details to verify Kangra Dham against

**Exit — testing is complete when:**

- [ ] Every **P1** test case has been executed in every app
- [ ] No open **S1** defects remain
- [ ] All open **S2** defects are either fixed or explicitly accepted by the owner
- [ ] Every executed test has a recorded result
- [ ] A summary report has been produced (see §8)

---

## 7. Cross-application checks

Run these once across the whole suite, not per app.

| ID | Check | Expected Result |
|---|---|---|
| X-01 | Visit each of the 8 URLs | All load over **HTTPS** with a valid certificate and no browser warning |
| X-02 | Visit each **legacy** URL in §1 | Serves the app or redirects correctly — no error, no certificate warning |
| X-03 | Visit `http://` (not https) for each app | Redirects to HTTPS automatically |
| X-04 | Visit a URL that does not exist, e.g. `/this-page-does-not-exist` | A friendly 404 page — **not** a raw server error or stack trace |
| X-05 | Check each app on a mobile phone | Layout adapts; no horizontal scrolling; text readable without zoom |
| X-06 | Open DevTools Console on each app's home page | **No red errors** |
| X-07 | For each app needing login, open a private/incognito window and paste an internal URL | Redirected to sign-in — **no data visible** |
| X-08 | Check page load time on each home page | Loads within ~3 seconds on a normal connection |
| X-09 | Confirm each app shows the **correct app name/branding** | No leftover old names from before the rename |
| X-10 | Test with browser zoom at 150% and 200% | Layout remains usable, nothing overlaps or is cut off |

---

## 8. Final summary report

At the end of the cycle, produce a one-page summary:

```
TEST SUMMARY — kran-apps.cloud suite
Period: ____________    Tester: ____________

Per application:
| App | P1 Run | Passed | Failed | Blocked | S1 | S2 | S3 | S4 |
|-----|--------|--------|--------|---------|----|----|----|----|
| SmashPoint        |  |  |  |  |  |  |  |  |
| MoneyPortfolio    |  |  |  |  |  |  |  |  |
| Chessary          |  |  |  |  |  |  |  |  |
| Job Agent         |  |  |  |  |  |  |  |  |
| BhoomiPlan        |  |  |  |  |  |  |  |  |
| Voyagr            |  |  |  |  |  |  |  |  |
| Junior Playhouse  |  |  |  |  |  |  |  |  |
| Kangra Dham       |  |  |  |  |  |  |  |  |

Top 5 risks / most serious findings:
1.
2.
3.
4.
5.

Areas NOT tested (and why):

Overall recommendation:  Ready for use  /  Fix S1-S2 first  /  Not ready
```

---

## 9. Tips for testing these apps well

1. **Test what the code claims, not what you assume.** Each guide quotes exact button labels and messages taken from the source. If what you see differs from the guide, that mismatch is itself worth reporting.
2. **Try to break things deliberately.** Submit empty forms. Paste 5,000 characters into a name field. Enter negative numbers, zero, and `0.001`. Use emoji and apostrophes (`O'Brien`). Click Submit twice quickly.
3. **Press the browser Back button often.** It breaks more single-page apps than any other action.
4. **Refresh in the middle of a flow.** Half-finished state is a classic bug source.
5. **Check the empty state.** What does a brand-new account with no data look like? It should not be a blank screen or an error.
6. **Verify the maths by hand.** Where a guide gives an expected number, work it out yourself too.
7. **Note anything confusing**, even if it is not a bug. "I could not work out how to do X" is valuable feedback about a personal-project app that has only ever been used by its author.

---

## 10. Issues identified while writing these guides

These were found by **reading the source code**, before any testing began.

> **Status note (19 Oct 2026):** everything marked ✅ below is now **fixed, pushed and deployed to the live sites**, and each one was re-checked against production after deployment. Treat the matching test cases as **regression checks** — they are expected to **pass**. Everything marked ⬜ is a **known gap or accepted residual risk**: it is expected to still be present, so please do not raise it as a new defect.

### ✅ Fixed and deployed

| App | Issue | Fix | Commit |
|---|---|---|---|
| **Job Agent** | `POST /api/cv/check` took a caller-supplied `path` and passed it unvalidated to the file reader, returning extracted emails/URLs **and an AI summary of the file contents**. A logged-in user could read arbitrary server files such as `.env`. | Path is now resolved against the caller's own CV folder and must resolve inside it; `..`, absolute paths and symlinks are rejected (403), missing file 404. | `5d23eae` |
| **MoneyPortfolio** | No attempt limit on the 4-digit vault PIN. | Escalating persisted lockout (1 min → 4 h), PBKDF2 raised 100k → 600k with safe migration of the existing vault, minimum PIN for new/changed PINs raised to 6 digits. | `ca5c1b4` |
| **MoneyPortfolio** | Temporary passwords were shown via `alert()` and left in the DOM in a `data-password` attribute. | Both flows (admin create-user and household invite) now use one masked overlay: bulleted until **Reveal**, copyable without exposing it, cleared from the DOM and memory on dismiss. No `alert()`, no `data-password`. | `87d9a43` |
| **MoneyPortfolio** | Self-registration was open on a system intended to be private. | `POST /api/auth/register` now returns **403** unless `ALLOW_SELF_REGISTRATION=true`; the sign-in screen hides the register link to match. Only exception: while the user table is empty the first account may still be created and becomes the administrator. | `87d9a43` |
| **MoneyPortfolio** | Auto-export silently wrote **unencrypted** `.xlsx` financial data to Downloads. | Auto-export is now **off by default** and enabling it requires confirming that the workbook is written unencrypted. | `87d9a43` |
| **Junior Playhouse** | **"Choose this plan" granted premium with no payment step.** | No payment integration exists at all, so the feature was kept but gated: plan buttons require the existing owner unlock (Parent Zone → ⚙️ App). | `5e728b1` |
| **Junior Playhouse** | Paint **Clear** and Parent Zone **Remove {name}** destroyed data with no confirmation. | New `ConfirmDialog` on both, child-friendly wording, safe option first, Android back = cancel. | `5e728b1` |
| **Junior Playhouse** | Parental-gate lockout reset by leaving the screen. | Lockout persisted to AsyncStorage with corrupt-value, expiry and backwards-clock handling, plus a live countdown. | `5e728b1` |
| **Junior Playhouse** | **No audio anywhere** — ABC Phonics had no letter sounds, Melody Match no instrument notes. | Letter sounds via `speechSynthesis` and instrument notes via a Web Audio oscillator, so no binary assets were added. New **Parent Zone → Safety → "Game sounds"** toggle. Test count 162 → 179. | `15aa52f` |
| **Junior Playhouse** | Coach-card instructions **contradicted the actual game rules** in Little Chef, Story Steps and Basket Catch. | All **6** contradictions corrected. In every case the code was right and the card text was wrong, so the cards were rewritten to match the implemented rules. | `15aa52f` |
| **Voyagr** | AI-extracted **interests, pace and budget** were parsed, shown as "understood", then silently discarded — the itinerary ignored them. | `TripForm` now seeds these three from `prefill` like the other fields; unrecognised values fall back safely. 2 regression tests added. | `65543ce` |
| **SmashPoint** | `EXPO_PUBLIC_APP_URL` fell back to the dead `smashpoint-badminton.surge.sh`, so share/invite links and QR codes pointed at a stale host when the env var was unset. | Fallback now `https://smashpoint.kran-apps.cloud`; 7 occurrences replaced across app, Supabase functions and docs. | `3d09d01` |
| **Chessary** | Lenient FEN parser accepted **kingless / malformed positions**. | New `src/engine/fen.ts` performs structural *and* semantic validation (variant-aware) with a specific message per failure. One genuinely illegal FEN already committed in the repo was found and corrected. 1197 tests pass. | `2a5917d` |
| **Chessary** | No URL router — browser **Back did not change tabs** and exited the app. | Hash router (`src/state/useHashRoute.ts`): tabs are addressable, Back/Forward move between them, and a URL can be shared or bookmarked. | `2a5917d` |
| **Kangra Dham** | Canonical URLs used the **raw IP address** on 9 pages. | Every one of the 11 public pages is now self-canonical on `https://kangradham.kran-apps.cloud/<page>`; `corporate.html` and `stories.html` added to the sitemap (9 → 11 URLs). | `3c6ac33` |
| **Kangra Dham** | **₹200 vs ₹299** hero price conflict, and catering vs corporate prices that looked contradictory. | Unlimited thali is **₹299** site-wide, on all seven days. Corporate (₹200–₹250/meal) and catering (₹159–₹179/thali) are retained but now explicitly labelled as **different services**, on `corporate.html`, `about.html` and `catering.html`. | `3c6ac33` |
| **Kangra Dham** | Stale **"Kangra Dham Express"** branding, empty social-link containers, `offline.html` served as the 404 page, a **Sector 62** footer on `menu.html`, and fake "coming soon" gallery tiles. | All removed or corrected: real `404.html` added and the server fallback repointed, `offline.html` kept for PWA use and now actually precached (cache v5 → v6), footer corrected to Sector 137, gallery placeholders removed and image credits corrected. | `3c6ac33` |

### ⬜ Known gaps and accepted residual risks

These are **expected**. They are listed so you can recognise them and move on rather than re-reporting them.

| App | Residual | Note |
|---|---|---|
| **MoneyPortfolio** | Offline brute force of a **copied vault blob** is still possible. | 600k PBKDF2 iterations raise the cost only ~6×; the 6-digit minimum is the real improvement, and **existing shorter PINs still work**. Change your PIN to 6+ digits to benefit. |
| **MoneyPortfolio** | An **opted-in** auto-export is still a plaintext `.xlsx`. | The bundled SheetJS build can read password-protected workbooks but cannot write them, so encryption was not possible without adding a dependency. Delete exported files after testing. |
| **MoneyPortfolio** | `GET /api/config` reveals whether the instance currently has **zero accounts**. | Only relevant if the database is ever emptied, after which the next visitor could claim the admin account. |
| **MoneyPortfolio** | On-device DevTools tampering can clear the local PIN guard. | The server copy restores it on reload. Accepted. |
| **Junior Playhouse** | The new audio is **web-only**. | It uses `speechSynthesis` and Web Audio, so the **Android APK stays silent**. Also **untested on iOS Safari**. |
| **Chessary** | Pressing **Back** in the middle of a game discards an unfinished local game. | The router changes tab; it does not persist in-progress play. |
| **Chessary** | FEN strings reaching the `server/` code paths are still **unvalidated**. | Only the client-side entry points were hardened. |
| **Voyagr** | The prefill callout still says "cities, dates and travellers". | It now also applies interests, pace and budget — wording only. |
| **Voyagr** | **No password reset** exists. | Not implemented. |
| **Kangra Dham** | Hindi coverage is **partial**; a **personal Gmail** address is still published; two camera-icon placeholder slots remain in the `about.html` heritage section. | The Gmail address was deliberately left alone at the owner's instruction. The placeholder slots need real photos or a design decision — removing them breaks that card layout. |
| **SmashPoint** | The `surge` devDependency is still in `package.json`/lockfile and `.github/copilot-instructions.md` still describes a Surge deployment policy. | Cosmetic / housekeeping only; production no longer uses Surge. |


### Configuration to confirm before testing

| App | Item |
|---|---|
| **SmashPoint** | Confirm production is **not** running in E2E fixture mode (SP-354). |
| **Job Agent** | Confirm current `EMAIL_DRY_RUN` and `FILL_MODE` values — these decide which ⚠️ tests are safe. |
| **BhoomiPlan** | Live config has `online_payment: false` and `tax_percent: 0`, so **all upgrades must return 402** and no GST row should ever appear. |
| **BhoomiPlan** | Free plan hard-stops at **25 units** and each plan costs 2 — metered tests are rationed. |
| **Chessary** | The engine is a **bespoke alpha-beta worker, not Stockfish** — do not judge it by Stockfish strength. |
| **Kangra Dham** | The live menu is served from the **SQLite `settings` table**, which is seeded from `data/menu.json` only on first run. Editing `data/menu.json` alone does **not** change the live menu — the stored setting has to be refreshed too (done 19 Oct 2026). If `/api/menu` and the static pages ever disagree, this is why. |

---



*Each per-app guide was written by reading that application's actual source code, so button labels, validation messages and routes should match the live app exactly. Where behaviour could not be determined from code, the guide says **[CONFIRM WITH OWNER]** rather than guessing.*
