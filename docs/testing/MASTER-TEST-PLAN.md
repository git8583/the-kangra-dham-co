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

## 10. Issues already identified while writing these guides

These were found by **reading the source code**, before any testing began. They are not yet confirmed against the live apps — the tester should verify each one first, as a quick high-value pass. Test IDs are given where the guide covers them.

### Security & data-safety (verify first)

| App | Issue | Why it matters |
|---|---|---|
| **Job Agent** | `POST /api/cv/check` takes a caller-supplied `path` and passes it straight to the file reader. The response returns `word_count`, `emails`, `urls` and an **AI summary of the file's contents**. | A logged-in user can read arbitrary server files, e.g. `.env`. Mitigated by: login required, invite-only, no self-signup — so realistically owner-only exposure. |
| **MoneyPortfolio** | No attempt limit or lockout on the 4–6 digit vault PIN. | A 4-digit PIN is brute-forceable with unlimited attempts. |
| **MoneyPortfolio** | Temporary passwords rendered via `alert()` / in the DOM. | Credentials exposed in screenshots and browser history. |
| **MoneyPortfolio** | Self-registration may be open on a system intended to be private. | Strangers could create accounts. Confirm intended behaviour. |
| **MoneyPortfolio** | Auto-export writes **unencrypted** `.xlsx` financial data to Downloads. | Plaintext financial data at rest. |
| **Junior Playhouse** | **"Choose this plan" grants premium with no payment step.** | Paid features are free to anyone. |

### Likely functional bugs

| App | Issue | Test ID |
|---|---|---|
| **Voyagr** | AI-detected interests / pace / budget are **never applied** to the planner form — the AI "understands" them, then discards them. | VY-C-29 |
| **SmashPoint** | `EXPO_PUBLIC_APP_URL` falls back to a stale `smashpoint-badminton.surge.sh` host, so **share and invite links may point at the wrong domain**. | SP-352 |
| **Junior Playhouse** | Paint **Clear** and Parent Zone **Remove {name}** destroy data with **no confirmation dialog**. | — |
| **Junior Playhouse** | Parental-gate lockout (3 tries / 60 s) **resets simply by leaving the screen**. | — |
| **Junior Playhouse** | **No audio at all** — ABC Phonics has no letter sounds, Melody Match no instrument sounds. | — |
| **Junior Playhouse** | Coach-card instructions **contradict actual game rules** in Little Chef, Story Steps and Basket Catch. | — |
| **Kangra Dham** | Canonical URLs use the **raw IP address** on 9 pages. | KD content |
| **Kangra Dham** | **₹200 vs ₹299** hero price conflict; catering vs corporate price conflict. | KD-content |
| **Kangra Dham** | Stale **"Kangra Dham Express"** branding in WhatsApp message text; empty social links; `offline.html` served as the 404 page. | KD content |
| **Chessary** | Lenient FEN parser accepts **kingless / malformed positions**. | CH-IO |
| **Chessary** | No URL router — the browser **Back button does not change tabs** and exits the app. | CH-XC |

### Configuration to confirm before testing

| App | Item |
|---|---|
| **SmashPoint** | Confirm production is **not** running in E2E fixture mode (SP-354). |
| **Job Agent** | Confirm current `EMAIL_DRY_RUN` and `FILL_MODE` values — these decide which ⚠️ tests are safe. |
| **BhoomiPlan** | Live config has `online_payment: false` and `tax_percent: 0`, so **all upgrades must return 402** and no GST row should ever appear. |
| **BhoomiPlan** | Free plan hard-stops at **25 units** and each plan costs 2 — metered tests are rationed. |
| **Chessary** | The engine is a **bespoke alpha-beta worker, not Stockfish** — do not judge it by Stockfish strength. |

---



*Each per-app guide was written by reading that application's actual source code, so button labels, validation messages and routes should match the live app exactly. Where behaviour could not be determined from code, the guide says **[CONFIRM WITH OWNER]** rather than guessing.*
