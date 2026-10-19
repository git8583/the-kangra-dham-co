# The Kangra Dham Co. — Tester Guide & Test Plan

Test ID prefix: **KD** · Live URL: <https://kangradham.kran-apps.cloud> · Legacy alias: <https://kangra.kran-apps.cloud> (301 redirect)

---

## 1. ⚠️ READ FIRST — Real Customer Impact

**This is a LIVE, REAL BUSINESS website.** Anything you submit or click can reach the actual owner of The Kangra Dham Co.

### What reaches the business owner

| Channel | Where | What happens | Risk |
|---|---|---|---|
| **Contact form** (`#contactForm`, `/contact.html`) | Contact page | `POST /api/enquiries/contact` → a row is written to the live SQLite `enquiries` table and appears in the owner's admin Enquiries list | ⚠️ Looks like a genuine customer lead |
| **Catering form** (`#cateringForm`, `/catering.html`) | Catering page | `POST /api/enquiries/catering` → same, stored as a catering lead | ⚠️ Looks like a genuine catering booking |
| **WhatsApp links** (`wa.me/917011376087?text=…`) | Home, Menu, Order, Catering, Corporate, Contact, Locations, footer, floating button | Opens a **real WhatsApp chat with the owner's personal number** with a pre-filled order/enquiry message | ⚠️⚠️ Highest risk — one tap can send a real order |
| **Click-to-call** (`tel:+917011376087`) | Footer, Contact, Locations, Order | Dials the owner's real phone | ⚠️⚠️ Do not let the call connect |
| **UPI payment link** (`upi://pay?pa=7011376087@upi&pn=The%20Kangra%20Dham%20Co&cu=INR`) | `/order.html` | Opens a real UPI payment intent to the owner's UPI ID | ⚠️⚠️⚠️ **NEVER complete a payment** |
| **Admin actions** (`/admin.html`) | Admin panel | Editing the menu, changing enquiry status, deleting enquiries and changing the admin password all affect the live site immediately | ⚠️⚠️ Destructive |

> **Note:** There is **no email or SMS integration anywhere in the code.** Form submissions are stored in the database only — the owner reads them in the admin panel. Do **not** report "I didn't get an email" as a bug.

### Mandatory rules for this test run

1. **Get written owner approval** before executing *any* test marked ⚠️. Agree a test window with the owner so they know the leads/messages are fake.
2. **Every free-text field you submit must start with `TEST — PLEASE IGNORE`.** For example:
   - Name: `TEST — PLEASE IGNORE QA Tester`
   - Message: `TEST — PLEASE IGNORE automated QA check, no action needed.`
3. **WhatsApp:** you may tap the link to verify the chat window opens with the correct number and pre-filled text, but **do not press Send**. If you must send (to verify delivery), prefix the message with `TEST — PLEASE IGNORE` and tell the owner immediately.
4. **Phone:** tap the `tel:` link to verify the dialler opens with the right number, then **cancel before dialling**.
5. **UPI:** verify only that the UPI app opens and shows the payee `The Kangra Dham Co` / `7011376087@upi`. **Cancel immediately. Never enter an amount or PIN.**
6. **Admin:** only run admin write tests (menu edit, status change, delete, password change) if the owner explicitly authorises it. Record the original value before any change and **restore it afterwards**.
7. **Never** delete a real enquiry. Only ever change/delete rows you yourself created during the test window.
8. After the run, give the owner a list of every enquiry ID you created so they can purge them.

---

## 2. Purpose & Overview

**The Kangra Dham Co.** is a public marketing + ordering website for an authentic Himachali (Kangra) *Dham* food business operating from the Retail Arcade, Sector 137, Noida.

**What the site does**

- Showcases a **rotating 7-day Dham menu** (a different thali each day of the week) with price, hero items, and photos.
- Shows **"Today's Dham"** on the home page, computed from the current day of week (and optionally overridden by the owner from the admin panel).
- Sells **à-la-carte sides** (Siddu, Babru, Chhaas, Kangra Tea) and **retail products** (pickles, loose-leaf tea).
- Drives orders through **WhatsApp**, **phone**, **walk-in** and **UPI pre-payment** (there is no online checkout / cart / payment gateway).
- Collects **contact enquiries** and **catering/corporate enquiries** through two forms that store leads in a local SQLite database.
- Offers content pages: heritage/about, gallery, locations, corporate subscriptions, customer stories, privacy policy.
- Includes a small **password-protected admin panel** for the owner to edit the weekly menu, set the "Today" override, read enquiries and change the admin password.
- Is a **PWA**: installable, with a service worker (`kangra-dham-v5`) and an offline fallback page.
- Has a **Hindi/English toggle** on selected pages and a **GA4 analytics consent banner**.

**Who the visitors are**

| Visitor | Goal |
|---|---|
| Local Noida resident / office worker | See what today's thali is, the price, and order via WhatsApp or walk in |
| Corporate admin / HR | Find lunch subscription pricing and raise a corporate enquiry |
| Event host (wedding, party) | Find catering options, prices per thali, and submit a catering enquiry |
| Himachali diaspora / food enthusiast | Read heritage/stories content, browse gallery, buy retail pickles/tea |
| Business owner (admin) | Log in, update the weekly menu, read incoming enquiries |

**Main user journeys**

1. **Today's thali → WhatsApp order:** Home → "Today's Dham" card → *Order on WhatsApp* → WhatsApp opens pre-filled.
2. **Browse the week:** Home → *The Menu* → day tabs (Sun…Sat) → see dishes/price → order.
3. **Catering enquiry:** Catering page → read packages → fill `#cateringForm` → submit → success message.
4. **General enquiry:** Contact page → fill `#contactForm` → submit → success message.
5. **Find the shop:** Locations / Find Us → address, hours, Google Maps embed → directions / call.
6. **Owner admin:** `/admin.html` → log in → edit menu / read enquiries → log out.

---

## 3. Access & Environment

### URLs

| Item | Value |
|---|---|
| Primary live URL | `https://kangradham.kran-apps.cloud` |
| Legacy alias | `https://kangra.kran-apps.cloud` → must **301 redirect** to the primary URL |
| Admin panel | `https://kangradham.kran-apps.cloud/admin.html` |
| Health endpoint | `https://kangradham.kran-apps.cloud/api/health` → `{"status":"ok","database":"ok"}` |
| Menu API | `https://kangradham.kran-apps.cloud/api/menu` → `{"menu":[…7 days…],"override":null}` |

### Public pages (all must return HTTP 200)

`/` (or `/index.html`) · `/about.html` · `/menu.html` · `/locations.html` · `/catering.html` · `/gallery.html` · `/corporate.html` · `/stories.html` · `/contact.html` · `/order.html` · `/privacy.html` · `/admin.html` · `/offline.html` · `/404.html`

> The server serves only an allow-list of root files. **Any unknown path returns HTTP 404 and renders `404.html`** ("We couldn't find that page", with links back into the site). `offline.html` is now used only as the service-worker offline fallback.

### Browsers / devices to cover

| Platform | Browser | Priority |
|---|---|---|
| Windows desktop | Chrome (latest) | P1 |
| Windows desktop | Edge (latest) | P2 |
| Windows desktop | Firefox (latest) | P2 |
| macOS desktop | Safari (latest) | P3 |
| Android phone | Chrome | P1 (required for WhatsApp/tel/UPI tests) |
| iPhone | Safari | P1 (required for WhatsApp/tel tests) |
| Tablet (iPad / Android 10") | any | P2 |

Breakpoints to check: **360 px**, **390 px**, **768 px**, **1024 px**, **1280 px**, **1920 px**.

### Infrastructure notes

- Served by **nginx** in front of a Node/Express app (`better-sqlite3` database, WAL mode).
- Security headers come from **helmet** — expect `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`.
- **Rate limits** are active and will block you if you hammer the site:
  - All `/api/*`: **150 requests / 15 minutes**
  - Enquiry submissions (`POST /api/enquiries/*`): **5 / 10 minutes**
  - Admin login: **8 attempts / 15 minutes**
  - JSON body limit: **32 kb**
- A **service worker** caches pages. When re-testing after a deploy, **hard-refresh (Ctrl+Shift+R)** or use *Application → Service Workers → Unregister* in DevTools, otherwise you may see a stale page.

---

## 4. Prerequisites & Test Data

### 4.1 Checklist — before you start

- [ ] Written **owner approval** for ⚠️ tests, with an agreed test window (date + time).
- [ ] The owner's **source-of-truth business sheet** (see §10) covering: address, PIN, phone, WhatsApp number, email, opening hours, all menu day names, all prices, side prices, retail prices, catering/corporate prices, social media links, UPI ID.
- [ ] **Admin password** for `/admin.html` (there is no username field — password only). **Not in the source code; must be supplied by the owner.** Without it, all of §9 is blocked.
- [ ] Confirmation from the owner on whether admin **write** tests (menu edit, password change, enquiry delete) are permitted.
- [ ] A **test email address** you control, e.g. `qa.tester+kangra@example.com` (must match `/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/`).
- [ ] A **valid Indian test mobile number** — must match `^(?:\+?91[\s-]?)?[6-9]\d{9}$`, e.g. `9876543210` or `+91 9876543210`.
- [ ] A **real Android phone and a real iPhone** with WhatsApp installed (for the click-to-WhatsApp and click-to-call tests).
- [ ] A **UPI app** installed (PhonePe / GPay / Paytm) for the UPI intent test — payment must never be completed.
- [ ] Browser **DevTools** access (Network, Lighthouse, Application tabs).
- [ ] A **private/incognito window** for access-control tests.

### 4.2 Standard test data

| Field | Valid value to use | Invalid value for negative tests |
|---|---|---|
| Name | `TEST — PLEASE IGNORE QA Tester` | *(empty)* |
| Email | `qa.tester+kangra@example.com` | `qa.tester@example`, `qa tester@example.com`, `@example.com` |
| Phone | `9876543210` or `+91 9876543210` | `1234567890` (starts with 1), `98765` (too short), `98765432101` (too long), `abcdefghij` |
| Subject (contact) | `General Enquiry` | *(see allowed list below)* |
| Service (catering) | `Event Catering` | *(see allowed list below)* |
| Number of people | `50` | `0`, `-5`, `10001`, `abc` |
| Message | `TEST — PLEASE IGNORE automated QA check, no action needed.` | 2001-character string |

**Allowed contact subjects (values):** `general`, `feedback`, `catering`, `corporate`, `franchise`, `complaint`, `other`.
**Allowed catering services (values):** `corporate-lunch`, `group-booking`, `event-catering`, `bulk-order`, `subscription`, `other`.

### 4.3 Field limits (from the code)

| Field | Max length | Required on contact | Required on catering |
|---|---|---|---|
| name | 100 | Yes | Yes |
| email | 254 (stored lowercased) | Yes | Yes |
| phone | 20 | No | Yes |
| subject | 40 | Yes | — |
| service | 40 | — | Yes |
| company | 150 | No | No |
| guests | integer 1–10000 | — | No |
| message | 2000 | Yes | No |

---

## 5. Feature Inventory

| Feature ID | Module | Feature | Where it lives | Sends real message? |
|---|---|---|---|---|
| F-01 | Global | Top navigation bar (Home · Our Heritage · The Menu · Find Us · Catering · Gallery · Corporate · Stories · Contact) | All pages | No |
| F-02 | Global | "Order Now" nav button (`.btn-nav`) → `/order.html` | All pages | No |
| F-03 | Global | Mobile hamburger menu / collapsed nav | All pages ≤768 px | No |
| F-04 | Global | Site logo / brand wordmark → Home | All pages | No |
| F-05 | Global | Footer — brand blurb, quick links, contact block | All pages | No |
| F-06 | Global | Footer click-to-call `tel:+917011376087` | All pages | ⚠️ Yes |
| F-07 | Global | Footer email link `kapil8583@gmail.com` | All pages | ⚠️ Yes |
| F-08 | Global | Footer address block | All pages | No |
| F-09 | Global | Floating / inline WhatsApp order buttons (`wa.me/917011376087?text=…`) | Home, Menu, Order, Catering, Corporate, Contact, Locations | ⚠️ Yes |
| F-10 | Global | Analytics consent banner — **Decline** / **Allow Analytics** (GA4 `G-M812X04ENX`, localStorage `kangra_analytics_consent`) | All pages, first visit | No |
| F-11 | Global | Hindi/English toggle (`हिंदी` ⇄ `English`, localStorage `kangra_lang`, reloads page) | index, about, menu, corporate, stories **only** | No |
| F-12 | Global | Security hardening — honeypot `website_url_hp` injection, `rel="noopener noreferrer"` on all `target="_blank"` links | All pages with `js/security.js` | No |
| F-13 | PWA | Service worker `kangra-dham-v5` (network-first HTML, never caches `/api/`) | All pages | No |
| F-14 | PWA | Web app manifest / installability | `/manifest.json` | No |
| F-15 | PWA | Offline fallback page | `/offline.html` | No |
| F-16 | Home | Hero section with headline, sub-copy, CTA buttons and stat strip (incl. "₹299 Unlimited Thali") | `/` | No |
| F-17 | Home | **Today's Dham** card — day name, thali title, price, dish list, image (from `/api/menu`, falls back to bundled `js/menu-data.js`) | `/` | No |
| F-18 | Home | Heritage / story teaser section | `/` | No |
| F-19 | Home | Dish showcase section | `/` | No |
| F-20 | Home | "How it works" / ordering steps section | `/` | No |
| F-21 | Home | **This week's Dham** preview strip (7 cards) → links to `/menu.html?day=N` | `/` | No |
| F-22 | Home | Find Us section with Google Maps embed | `/` | No |
| F-23 | Home | Testimonial blocks | `/` | No |
| F-24 | Home | Bottom call-to-action band | `/` | No |
| F-25 | Menu | 7-day tab switcher (Sun…Sat) with `?day=0..6` deep link + `history.replaceState` | `/menu.html` | No |
| F-26 | Menu | Daily thali detail — title, price, Madra, Khatta, note, emoji, image, fixed items (Steamed Basmati Rice, Spiced Yogurt Palda, Desi Ghee Drizzle, Meetha Bhat) | `/menu.html` | No |
| F-27 | Menu | **Sides** grid — Pahadi Siddu ₹80, Babru (2 pcs) ₹60, Pahadi Chhaas ₹40, Kangra Orthodox Tea ₹40 | `/menu.html` | No |
| F-28 | Menu | **Retail** grid — Galgal ka Achar 250g ₹150, Lingad Pickle 250g ₹220, Kangra Loose Leaf Tea ₹180–₹350 | `/menu.html` | No |
| F-29 | Menu | Menu page order CTA (WhatsApp) | `/menu.html` | ⚠️ Yes |
| F-30 | About | Heritage narrative, imagery, section headings | `/about.html` | No |
| F-31 | Locations | Address, opening hours (Lunch 12:00–15:30, Snacks 16:30–18:30, Dinner 19:30–22:00), map embed, call & WhatsApp CTAs | `/locations.html` | ⚠️ Yes (call/WA) |
| F-32 | Gallery | Photo grid — licensed stock/Creative Commons imagery only, plus a "more original photography coming soon" note. No placeholder tiles. | `/gallery.html` | No |
| F-33 | Catering | Package/subscription pricing cards (₹179 / ₹169 / ₹159 per thali) | `/catering.html` | No |
| F-34 | Catering | **Catering enquiry form** `#cateringForm` — Name, Email, Phone, Company, Service type, Number of people, Message | `/catering.html` | ⚠️ Yes (stored lead) |
| F-35 | Catering | Catering WhatsApp CTA | `/catering.html` | ⚠️ Yes |
| F-36 | Corporate | Corporate pricing (₹200–₹250 / meal, ₹1,099 / week for 6 days, ₹3,999 / month for 26 days) — labelled on the page as an office-delivery rate, distinct from the ₹299 walk-in thali and the catering tiers | `/corporate.html` | No |
| F-37 | Corporate | Corporate CTA → catering form / WhatsApp | `/corporate.html` | ⚠️ Yes |
| F-38 | Stories | Customer stories / testimonial articles | `/stories.html` | No |
| F-39 | Contact | **Contact form** `#contactForm` — Name, Email, Phone, Subject (select), Message | `/contact.html` | ⚠️ Yes (stored lead) |
| F-40 | Contact | Contact page direct channels — phone, email, WhatsApp | `/contact.html` | ⚠️ Yes |
| F-41 | Contact | Form status messages — `Sending…`, `✓ Sent`, success/error `.form-status` text | `/contact.html`, `/catering.html` | — |
| F-42 | Order | Ordering options cards (WhatsApp / Call / Walk-in) | `/order.html` | ⚠️ Yes |
| F-43 | Order | **UPI pay intent** `upi://pay?pa=7011376087@upi&pn=The%20Kangra%20Dham%20Co&cu=INR` | `/order.html` | ⚠️⚠️ Yes — real payment |
| F-44 | Order | Loyalty / rewards "Coming Soon" block | `/order.html` | No |
| F-45 | Privacy | Privacy policy content | `/privacy.html` | No |
| F-46 | Admin | Login form (password only) → signed httpOnly cookie `kdc_admin`, 8-hour session, CSRF token | `/admin.html` | No |
| F-47 | Admin | Menu editor — day select; Title, Price, Madra, Khatta, Note, Emoji, Image URL, Highlight per day | `/admin.html` | ⚠️ Yes — changes the live menu |
| F-48 | Admin | "Today's Dham" override select (day 0–6 or none) | `/admin.html` | ⚠️ Yes |
| F-49 | Admin | Enquiries table — Date, Customer, Request, Message, Status, Action (newest first, max 500) | `/admin.html` | No |
| F-50 | Admin | Enquiry status change (`new` / `contacted` / `closed`) | `/admin.html` | ⚠️ Yes |
| F-51 | Admin | Enquiry delete with `confirm("Delete the enquiry from <name>? This cannot be undone.")` | `/admin.html` | ⚠️⚠️ Destructive |
| F-52 | Admin | Change-password form (12–128 chars) | `/admin.html` | ⚠️⚠️ Can lock out the owner |
| F-53 | Admin | Logout + unsaved-changes `beforeunload` warning | `/admin.html` | No |
| F-54 | API | `GET /api/health` | `/api/health` | No |
| F-55 | API | `GET /api/menu` (cacheable 60 s) | `/api/menu` | No |
| F-56 | API | `POST /api/enquiries/:type` (contact \| catering) | API | ⚠️ Yes |
| F-57 | API | Admin API: login, session, logout, password, enquiries CRUD, menu PUT | API | ⚠️ Yes |
| F-58 | SEO | `robots.txt`, `sitemap.xml`, canonical tags, Open Graph/Twitter tags, JSON-LD `Restaurant` schema, favicon | Site-wide | No |
| F-59 | Infra | Legacy alias 301 redirect `kangra.kran-apps.cloud` → `kangradham.kran-apps.cloud` | Infra | No |
| F-60 | Infra | Rate limiting (API 150/15 min, enquiries 5/10 min, admin login 8/15 min) | API | No |

**Total features catalogued: 60.**

---

## 6. User Guide

### 6.1 Getting around

Every page has the same **top navigation**, in this order:

`Home` · `Our Heritage` · `The Menu` · `Find Us` · `Catering` · `Gallery` · `Corporate` · `Stories` · `Contact` · **`Order Now`** (a highlighted button, class `.btn-nav`).

The brand name on the left returns you to the Home page. On a phone the nav collapses into a hamburger/stacked menu.

Every page ends with the same **footer**: a short brand blurb, quick links, a contact block (address, phone `+91 7011376087`, email `kapil8583@gmail.com`), and a "Follow Us" heading.

On your first visit a **cookie/analytics consent banner** appears with two buttons, **Decline** and **Allow Analytics**. Google Analytics only loads if you press *Allow Analytics*; your choice is saved in browser storage (`kangra_analytics_consent`) and the banner does not return.

On the Home, Our Heritage, The Menu, Corporate and Stories pages there is a **language toggle** button reading `हिंदी`. Pressing it reloads the page in Hindi and the button becomes `English`. The choice is remembered (`kangra_lang`).

### 6.2 Home page (`/`)

1. **Hero** — the big headline, a short description of Kangra Dham, call-to-action buttons, and a strip of statistics (including "₹299 Unlimited Thali").
2. **Today's Dham** — the main feature. The site works out today's day of the week and shows that day's thali: the day name, the thali title (e.g. *The Grand Shadi Wali Dham*), the price, the hero dishes (Madra and Khatta of the day), a note, an emoji and a photo. The data comes live from `/api/menu`; if the API is unreachable the page silently falls back to a copy bundled in the browser, so the card is never empty. The owner can force a particular day using the admin "override".
3. **Heritage teaser** — a short story about the Kangra Dham tradition with a link to *Our Heritage*.
4. **Dish showcase** — the signature dishes with pictures.
5. **How it works** — the ordering steps.
6. **This week's Dham** — seven small cards, one per day. Clicking one takes you to `/menu.html?day=N`, which opens the menu page already on that day.
7. **Find Us** — address plus an embedded Google Map.
8. **Testimonials** — customer quotes.
9. **Closing call-to-action** — order via WhatsApp / call.

### 6.3 The Menu (`/menu.html`)

A row of **day tabs** (Sun, Mon, Tue, Wed, Thu, Fri, Sat). The tab for today is selected by default, unless you arrived with `?day=N` in the URL. Selecting a tab swaps the thali details below **without reloading the page**, and quietly updates the address bar to `?day=N` so the view is shareable.

For each day you see: thali **title**, **price**, the **Madra** and **Khatta** of the day, an optional **note**, an **emoji**, a **photo**, plus the **fixed items served every day**: Steamed Basmati Rice, Spiced Yogurt Palda, Desi Ghee Drizzle and Meetha Bhat.

Below the thali are two grids:

- **Sides** — Pahadi Siddu ₹80, Babru (2 pcs) ₹60, Pahadi Chhaas ₹40, Kangra Orthodox Tea ₹40.
- **Retail** — Galgal ka Achar 250g ₹150, Lingad Pickle 250g ₹220, Kangra Loose Leaf Tea Packets ₹180–₹350.

### 6.4 Our Heritage (`/about.html`), Gallery, Stories, Privacy

- **Our Heritage** — long-form story of the Dham tradition and the family behind the business.
- **Gallery** — shows licensed stock / Creative Commons imagery that illustrates the tradition, with an explicit note that the business's own photography is still to come. The old placeholder tiles have been removed.
- **Stories** — customer stories / testimonials in article form.
- **Privacy** — the privacy policy text.

### 6.5 Find Us (`/locations.html`)

Shows the shop address (Retail Arcade, Sector 137, opposite the metro station, Noida Expressway), the **opening hours** (Lunch 12:00–15:30, Snacks 16:30–18:30, Dinner 19:30–22:00, every day), an embedded map, and buttons to call or message on WhatsApp.

### 6.6 Catering (`/catering.html`)

Explains catering for events and offices and shows **subscription cards priced at ₹179 / ₹169 / ₹159 per thali** (the per-thali price falls as the order size or commitment grows).

At the bottom is the **catering enquiry form** (`#cateringForm`) with: Name, Email, Phone, Company, **Service type** (dropdown), **Number of people**, and Message. Name, Email, Phone and Service type are mandatory. Pressing the submit button shows `Sending…`, then `✓ Sent`, and a confirmation line appears: **"Thank you. Your enquiry has been received."** The enquiry is **saved to the business's database**, where the owner reads it in the admin panel. No email is sent.

### 6.7 Corporate (`/corporate.html`)

Pitches office lunch subscriptions with pricing of **₹200–₹250 per meal**, **₹1,099 per week (6 days)** and **₹3,999 per month (26 days)**, and links through to the catering enquiry / WhatsApp.

### 6.8 Contact (`/contact.html`)

Two ways to get in touch:

- **Direct channels** — phone, email and WhatsApp links.
- **The contact form** (`#contactForm`) with Name, Email, Phone, **Subject** (dropdown: General Enquiry, Feedback, Catering, Corporate, Franchise, Complaint, Other) and Message. Name, Email, Subject and Message are mandatory. Submitting behaves exactly like the catering form and stores a lead in the database.

Both forms contain an **invisible honeypot field** (`website_url_hp`) added by the site's JavaScript. Humans never see or fill it; bots that do are rejected with **"Submission rejected."**

### 6.9 Order Now (`/order.html`)

Lists the ways to order: **WhatsApp** (pre-filled message), **Call**, **Walk in**, and a **UPI payment** link that opens your UPI app with the payee `The Kangra Dham Co` / `7011376087@upi` (no amount is pre-filled). There is **no shopping cart or online checkout.** A loyalty/rewards block is marked **Coming Soon**.

### 6.10 Admin panel (`/admin.html`)

Owner-only. There is **no username** — just a password box. After logging in the owner can:

- **Edit the weekly menu** — pick a day, then edit Title, Price, Madra, Khatta, Note, Emoji, Image URL (must be `https://`) and a Highlight flag. Unsaved changes trigger a browser warning if you try to leave.
- **Set a "Today's Dham" override** — force the site to show a specific day's thali regardless of the real date, or clear it back to automatic.
- **Read enquiries** — a table of the 500 most recent enquiries (newest first) with Date, Customer, Request, Message, Status and Action columns. If there are none it reads **"No enquiries yet."**
- **Change the enquiry status** — `new`, `contacted` or `closed`.
- **Delete an enquiry** — with a browser confirmation prompt.
- **Change the admin password** — current password plus a new one of 12–128 characters.
- **Log out** — the session also expires automatically after 8 hours.

---

## 7. Test Plan — Public Site

Priority: **P1** blocker/critical · **P2** major · **P3** minor/cosmetic.

### 7.1 Global navigation, header & footer

| Test ID | Title | Priority | Type | Pre-conditions | Steps | Expected Result |
|---|---|---|---|---|---|---|
| KD-001 | Site loads over HTTPS | P1 | Functional | Browser open | 1. Go to `https://kangradham.kran-apps.cloud`. | Home page renders fully; padlock shown; no certificate warning; HTTP 200. |
| KD-002 | Legacy alias redirects | P1 | Functional | — | 1. Go to `https://kangra.kran-apps.cloud`. | Browser is **301-redirected** to `https://kangradham.kran-apps.cloud`; the same Home page renders. |
| KD-003 | Nav links — order and labels | P1 | UI | Home page open | 1. Read the top nav left→right. | Exactly: `Home`, `Our Heritage`, `The Menu`, `Find Us`, `Catering`, `Gallery`, `Corporate`, `Stories`, `Contact`, then the `Order Now` button. No typos, no extra items. |
| KD-004 | Every nav link navigates correctly | P1 | Functional | Home page open | 1. Click `Our Heritage`. 2. Back. 3. Repeat for `The Menu`, `Find Us`, `Catering`, `Gallery`, `Corporate`, `Stories`, `Contact`, `Order Now`. | Destinations: `/about.html`, `/menu.html`, `/locations.html`, `/catering.html`, `/gallery.html`, `/corporate.html`, `/stories.html`, `/contact.html`, `/order.html`. Each returns 200 with no console errors. |
| KD-005 | Nav present and identical on every page | P2 | UI | — | 1. Visit each of the 11 public pages. 2. Compare the nav on each. | The same nav appears on all pages with the same labels and order. |
| KD-006 | Active page is highlighted in nav | P3 | UI | — | 1. Open `/menu.html`. 2. Look at the nav. | `The Menu` is visually marked as the current page. **[CONFIRM WITH OWNER]** if no active state exists by design. |
| KD-007 | Logo returns to Home | P2 | Functional | Any inner page open | 1. Open `/contact.html`. 2. Click the brand name/logo top-left. | Navigates to `/` (Home). |
| KD-008 | Footer contact details | P1 | Content | — | 1. Scroll to the footer on Home. 2. Read address, phone, email. | Phone `+91 7011376087`; email `kapil8583@gmail.com`; address "Retail Arcade, Sector 137 (Opp. Metro Station), Noida Expressway", PIN **201305**. Must match the owner's sheet (§10). |
| KD-009 | Footer address on Menu page | P1 | Content | — | 1. Open `/menu.html`. 2. Scroll to the footer. 3. Read the address. | **Fixed:** the Menu footer now reads "Retail Arcade, Sector 137 (Opp. Metro Station), Noida Expressway", matching every other page. Any reappearance of "Sector 62" is a regression (S2). |
| KD-010 | Footer quick links work | P2 | Functional | — | 1. Click every link in the footer quick-links column. | Each opens the correct page with HTTP 200; none 404. |
| KD-011 | No dead social links | P2 | UI | — | 1. Scroll to the footer on any page. 2. Open `/contact.html`. | **Fixed:** the empty `.social-links` containers and the orphaned "Follow Us" heading have been removed site-wide, so no empty social area is presented. **[CONFIRM WITH OWNER]** — once real profile URLs exist they can be added back. |
| KD-012 | External links are safe | P3 | Functional | DevTools open | 1. Inspect any link with `target="_blank"` (map, WhatsApp). | Each carries `rel="noopener noreferrer"` (added by `js/security.js`). |
| KD-013 | Footer copyright year | P3 | Content | — | 1. Read the footer copyright. | Shows the current year and "The Kangra Dham Co." **[CONFIRM WITH OWNER]** |
| KD-014 | Analytics consent banner appears | P2 | Functional | Fresh incognito window | 1. Open the site in incognito. | A consent banner appears with exactly two buttons: **Decline** and **Allow Analytics**. |
| KD-015 | Decline keeps analytics off | P2 | Functional | KD-014 done | 1. Open DevTools → Network, filter `google`. 2. Click **Decline**. 3. Browse 2 pages. | Banner closes; **no** request to `googletagmanager.com` / `google-analytics.com`; `localStorage.kangra_analytics_consent` is set to the declined value. |
| KD-016 | Allow Analytics loads GA4 | P2 | Functional | Fresh incognito | 1. DevTools → Network. 2. Click **Allow Analytics**. | A request to `googletagmanager.com/gtag/js?id=G-M812X04ENX` is made; banner closes. |
| KD-017 | Consent choice persists | P2 | Functional | KD-015 or KD-016 done | 1. Navigate to another page. 2. Reload. | The banner does **not** reappear. |
| KD-018 | Hindi toggle switches language | P2 | Functional | — | 1. Open `/`. 2. Click the `हिंदी` button. | The page reloads with Hindi text; the button now reads `English`; `localStorage.kangra_lang` is set. |
| KD-019 | Hindi choice persists across pages | P2 | Functional | KD-018 done | 1. Navigate to `/about.html`, `/menu.html`, `/corporate.html`, `/stories.html`. | Those pages also render in Hindi. |
| KD-020 | Hindi toggle missing on other pages | P3 | UI | Hindi selected | 1. Open `/contact.html`, `/catering.html`, `/gallery.html`, `/locations.html`, `/order.html`, `/privacy.html`. | **Known gap:** no language toggle and English content, even while Hindi is selected. Raise as S3 inconsistency. **[CONFIRM WITH OWNER]** whether all pages should be translated. |
| KD-021 | Switching back to English | P2 | Functional | Hindi selected | 1. Click `English`. | Page reloads in English; button reverts to `हिंदी`. |

### 7.2 Home page (`/`)

| Test ID | Title | Priority | Type | Pre-conditions | Steps | Expected Result |
|---|---|---|---|---|---|---|
| KD-030 | Hero renders | P1 | UI | — | 1. Open `/`. | Headline, sub-copy, CTA buttons and the stat strip all render; no overlapping text; hero image loads. |
| KD-031 | Hero CTA buttons work | P1 | Functional | — | 1. Click each hero CTA in turn. | Each goes to its stated destination (menu / order / WhatsApp). WhatsApp buttons ⚠️ — see KD-060. |
| KD-032 | Hero price claim vs menu | P2 | Content | — | 1. Read the hero stat "₹299 Unlimited Thali". 2. Open `/menu.html` and check every day's price. | **Fixed:** the unlimited thali is **₹299 on all seven days**, matching the hero stat, the Open Graph/Twitter descriptions and the ₹299 customer testimonial on Home. |
| KD-033 | Today's Dham matches the real day | P1 | Functional | Know today's weekday | 1. Open `/`. 2. Read the Today's Dham card. | The day name equals today's weekday, and the thali title/price match that day in `/menu.html` (e.g. Sunday → *The Grand Shadi Wali Dham*, ₹299). |
| KD-034 | Today's Dham data comes from the API | P2 | Functional | DevTools Network open | 1. Reload `/`. 2. Find the `/api/menu` request. | Request returns HTTP 200 with `{"menu":[…],"override":…}`; the card content matches the API payload. |
| KD-035 | Today's Dham fallback when API fails | P2 | Negative | DevTools open | 1. DevTools → Network → block the URL `*/api/menu`. 2. Reload `/`. | The card still renders correct content from the bundled fallback (`js/menu-data.js`). **No blank card, no JS error visible to the user.** |
| KD-036 | Today's Dham image loads | P2 | UI | — | 1. Inspect the thali image on the card. | Image loads over `https://`, is not broken, and has meaningful `alt` text. |
| KD-037 | Heritage teaser section | P2 | Content | — | 1. Scroll to the heritage section. | Heading, body copy and image render; the "read more" link opens `/about.html`. |
| KD-038 | Dish showcase section | P2 | UI | — | 1. Scroll to the dish showcase. | All dish cards render with images and names; no broken images; layout is even. |
| KD-039 | How-it-works steps | P3 | Content | — | 1. Scroll to the ordering-steps section. | Steps appear in logical numbered order with readable copy. |
| KD-040 | Week preview shows 7 days | P1 | Functional | — | 1. Scroll to "This week's Dham". | Exactly 7 cards, Sunday→Saturday, each with the correct day name, thali title and price matching `/menu.html`. |
| KD-041 | Week preview cards deep-link | P1 | Functional | — | 1. Click the Wednesday card. | Navigates to `/menu.html?day=3` and the Wednesday tab is already selected showing *The Royal Delicacy*. |
| KD-042 | Sunday highlight styling | P3 | UI | — | 1. Look at the Sunday card in the week preview. | Sunday is visually highlighted (it carries the `highlight` flag in the data). |
| KD-043 | Home map embed loads | P2 | Functional | — | 1. Scroll to the Find Us section. | A Google Map iframe loads and shows the Sector 137 Noida location; it is interactive (zoom/pan). |
| KD-044 | Testimonials render | P3 | Content | — | 1. Scroll through the testimonial blocks. | Each quote shows text and an attribution; no placeholder/lorem text. **[CONFIRM WITH OWNER]** that the testimonials are genuine. |
| KD-045 | Bottom CTA band | P2 | Functional | — | 1. Scroll to the final CTA. | Buttons render and link to WhatsApp / order page (⚠️ WhatsApp — see KD-060). |
| KD-046 | No console errors on Home | P2 | Functional | DevTools Console open | 1. Hard-reload `/`. | No uncaught JavaScript errors; no CSP violations; no 404s for CSS/JS/images in the Network tab. |

### 7.3 The Menu (`/menu.html`)

| Test ID | Title | Priority | Type | Pre-conditions | Steps | Expected Result |
|---|---|---|---|---|---|---|
| KD-050 | Menu page opens on today's tab | P1 | Functional | — | 1. Open `/menu.html` with no query string. | The tab for today's weekday is pre-selected and its thali is displayed. |
| KD-051 | All 7 day tabs switch content | P1 | Functional | — | 1. Click each tab Sun→Sat in turn. 2. Read the thali title each time. | Sun *The Grand Shadi Wali Dham* · Mon *The Classic Comfort* · Tue *The Wholesome Feast* · Wed *The Royal Delicacy* · Thu *The Fragrant Mid-Week* · Fri *The Festive Friday* · Sat *The Weekend Warmup* — every day priced **₹299**. Content swaps without a page reload. |
| KD-052 | Tab click updates the URL | P2 | Functional | — | 1. Click the Friday tab. 2. Look at the address bar. | URL becomes `/menu.html?day=5` via `history.replaceState` (no new history entry added). |
| KD-053 | `?day=` deep link works | P1 | Functional | — | 1. Open `/menu.html?day=0` directly. 2. Then `?day=6`. | `day=0` shows Sunday, `day=6` shows Saturday, with the matching tab active. |
| KD-054 | Invalid `?day=` value | P2 | Negative | — | 1. Open `/menu.html?day=9`. 2. Then `/menu.html?day=abc`. 3. Then `/menu.html?day=-1`. | Page loads without error and falls back to today's day (or Sunday). No blank content, no JS exception. |
| KD-055 | Fixed daily items listed | P2 | Content | — | 1. Check any day's thali detail. | Shows the four always-included items: **Steamed Basmati Rice, Spiced Yogurt Palda, Desi Ghee Drizzle, Meetha Bhat**. |
| KD-056 | Madra / Khatta / note / emoji per day | P2 | Content | — | 1. For each of the 7 days read the Madra, Khatta, note and emoji. | All fields populate for every day; none show `undefined`, `null` or an empty dash. |
| KD-057 | Sides grid prices | P1 | Content | — | 1. Scroll to the Sides grid. | Pahadi Siddu **₹80**, Babru (2 pcs) **₹60**, Pahadi Chhaas **₹40**, Kangra Orthodox Tea **₹40**. Verify against the owner's price list. |
| KD-058 | Retail grid prices | P1 | Content | — | 1. Scroll to the Retail grid. | Galgal ka Achar 250g **₹150**, Lingad Pickle 250g **₹220**, Kangra Loose Leaf Tea Packets **₹180–₹350**. Verify against the owner's price list. |
| KD-059 | Menu images load | P2 | UI | DevTools Network open | 1. Reload `/menu.html`. 2. Filter by `Img`. | Every image returns 200. Note that images are served from external hosts (`upload.wikimedia.org`, `images.pexels.com`, `cdn.pixabay.com`) — report any that fail or are slow (>3 s). |
| KD-060 | ⚠️ Menu WhatsApp order CTA | P1 | Functional | Owner approval; real phone | 1. On a phone, tap the WhatsApp order button. 2. **Read the pre-filled text. DO NOT press Send.** 3. Close WhatsApp. | WhatsApp opens a chat with **+91 7011376087** with an order message pre-filled. Check the text names "The Kangra Dham Co." — see KD-063. |
| KD-061 | Menu page API/fallback parity | P2 | Functional | DevTools | 1. Block `*/api/menu`. 2. Reload `/menu.html`. 3. Cycle all 7 tabs. | All 7 days still render from the bundled fallback with identical titles and prices. |
| KD-062 | Menu matches the API payload | P2 | Functional | — | 1. Open `https://kangradham.kran-apps.cloud/api/menu` in a tab. 2. Compare all 7 entries with the Menu page. | Titles, prices, madra, khatta and notes match exactly. |
| KD-063 | Brand name in WhatsApp text | P2 | Content | — | 1. Inspect the `wa.me` links on `/contact.html`, `/menu.html` and `/order.html` (right-click → Copy link address). | **Fixed:** every pre-filled text now says "The Kangra Dham Co." Any reappearance of "Kangra Dham Express" is a regression (S3). |

### 7.4 Our Heritage, Gallery, Stories, Privacy

| Test ID | Title | Priority | Type | Pre-conditions | Steps | Expected Result |
|---|---|---|---|---|---|---|
| KD-070 | About page content | P2 | Content | — | 1. Open `/about.html` and read top to bottom. | Heritage narrative renders fully; headings in order; images load; no lorem/placeholder text; no spelling errors in the brand name. |
| KD-071 | About page images | P3 | UI | — | 1. Inspect each image. | All load over HTTPS with non-empty `alt` text. |
| KD-072 | Gallery honesty | P2 | UI | — | 1. Open `/gallery.html`. | **Fixed:** no placeholder tiles remain. Every tile is a real licensed stock / Creative Commons photograph, and the closing note states plainly that the business's own photography is still to come. |
| KD-073 | Gallery layout on mobile | P3 | UI | 390 px viewport | 1. Open `/gallery.html` at 390 px. | Tiles stack or wrap cleanly; no horizontal scrollbar; icons centred. |
| KD-074 | Stories page content | P3 | Content | — | 1. Open `/stories.html`. | Story articles render with headings and body copy; any links work. **[CONFIRM WITH OWNER]** that stories are genuine/approved. |
| KD-075 | Privacy policy content | P2 | Content | — | 1. Open `/privacy.html`. | Policy renders; mentions what data the forms collect (name, email, phone, message) and how to contact the business; no placeholder text. **[CONFIRM WITH OWNER]** that the policy text is legally approved. |
| KD-076 | Privacy link reachable from footer | P2 | Functional | — | 1. From Home, find and click the Privacy link in the footer. | Opens `/privacy.html` (200). |

### 7.5 Find Us (`/locations.html`)

| Test ID | Title | Priority | Type | Pre-conditions | Steps | Expected Result |
|---|---|---|---|---|---|---|
| KD-080 | Address displayed | P1 | Content | — | 1. Open `/locations.html`. | Shows "Retail Arcade, Sector 137 (Opp. Metro Station), Noida Expressway", PIN **201305**. Must match the owner's sheet. |
| KD-081 | Opening hours displayed | P1 | Content | — | 1. Read the hours block. | **Lunch 12:00–15:30**, **Snacks 16:30–18:30**, **Dinner 19:30–22:00**, all seven days. Verify against the owner's actual hours. |
| KD-082 | Map embed points to the right place | P1 | Functional | — | 1. Inspect/interact with the map. | Map loads and the pin corresponds to lat/long **28.5151 / 77.3939** (Sector 137, Noida). |
| KD-083 | Map "Directions" opens Google Maps | P2 | Functional | — | 1. Click the directions/open-in-maps control. | Google Maps opens in a new tab with the correct destination. |
| KD-084 | ⚠️ Click-to-call from Find Us | P1 | Functional | Real phone; owner approval | 1. On a phone, tap the phone number. 2. Verify the dialler shows `+91 7011376087`. 3. **Cancel — do not dial.** | The native dialler opens pre-filled with the correct number. |
| KD-085 | ⚠️ WhatsApp CTA from Find Us | P1 | Functional | Real phone; owner approval | 1. Tap the WhatsApp button. 2. Verify the chat is with +91 7011376087. 3. **Do not send.** | WhatsApp opens the correct chat with pre-filled text. |
| KD-086 | Parking / landmark info | P3 | Content | — | 1. Read any landmark, parking or "how to reach" copy. | Information is accurate. **[CONFIRM WITH OWNER]** |

### 7.6 Corporate (`/corporate.html`) and Catering (`/catering.html`) content

| Test ID | Title | Priority | Type | Pre-conditions | Steps | Expected Result |
|---|---|---|---|---|---|---|
| KD-090 | Corporate pricing cards | P1 | Content | — | 1. Open `/corporate.html`. 2. Read every price. | **₹200–₹250 per meal**, **₹1,099 per week (6 days)**, **₹3,999 per month (26 days)**. Verify against the owner's price list. |
| KD-091 | Catering subscription cards | P1 | Content | — | 1. Open `/catering.html`. 2. Read every price. | **₹179 / ₹169 / ₹159 per thali**. Verify against the owner's price list. |
| KD-092 | Catering vs Corporate pricing is clearly labelled | P1 | Content | — | 1. Compare KD-090 and KD-091 side by side. | **By design (owner decision):** Corporate ₹200–₹250/meal is a higher-touch office-delivery service; Catering ₹179/₹169/₹159 are bulk tiers. Both pages now say so explicitly and name the ₹299 walk-in thali, so the three price sets cannot be mistaken for each other. |
| KD-093 | Corporate weekly/monthly maths | P2 | Content | — | 1. Divide ₹1,099 by 6 and ₹3,999 by 26. | ≈ ₹183/meal and ≈ ₹154/meal — check these are consistent with the advertised per-meal range. Flag if misleading. **[CONFIRM WITH OWNER]** |
| KD-094 | Corporate CTA works | P2 | Functional | — | 1. Click the corporate call-to-action. | Navigates to the catering enquiry form or opens WhatsApp (⚠️ if WhatsApp). |
| KD-095 | Catering package descriptions | P3 | Content | — | 1. Read what each package includes. | Inclusions, minimum order quantities and notice periods are stated and accurate. **[CONFIRM WITH OWNER]** |

### 7.7 Order Now (`/order.html`)

| Test ID | Title | Priority | Type | Pre-conditions | Steps | Expected Result |
|---|---|---|---|---|---|---|
| KD-100 | Order page renders all options | P1 | UI | — | 1. Open `/order.html`. | The WhatsApp, Call and Walk-in option cards all render with clear instructions. |
| KD-101 | ⚠️ WhatsApp order link | P1 | Functional | Real phone; owner approval | 1. Tap the WhatsApp order button. 2. Verify number and pre-filled text. 3. **Do not send.** | Chat with +91 7011376087 opens, message pre-filled with "The Kangra Dham Co." (KD-063). |
| KD-102 | ⚠️ Call-to-order link | P1 | Functional | Real phone; owner approval | 1. Tap the call option. 2. Verify `+91 7011376087`. 3. **Cancel.** | Dialler opens with the correct number. |
| KD-103 | ⚠️⚠️ UPI payment intent | P1 | Functional | Real phone with a UPI app; **explicit owner approval** | 1. Tap the UPI pay link. 2. Read the payee shown by the UPI app. 3. **Press Back / Cancel immediately. Do NOT enter an amount or PIN.** | The UPI app opens showing payee name **The Kangra Dham Co** and UPI ID **7011376087@upi**, with no amount pre-filled. No money moves. |
| KD-104 | UPI link on desktop | P3 | Negative | Desktop browser | 1. Click the UPI link on desktop. | Either nothing happens or the browser shows a "no app to handle upi://" dialog — it must **not** produce a broken page or a JS error. |
| KD-105 | Loyalty block shows "Coming Soon" | P3 | UI | — | 1. Scroll to the loyalty/rewards block. | It is clearly marked **Coming Soon** and its controls are disabled/non-interactive. |
| KD-106 | No online checkout exists | P2 | Functional | — | 1. Look for a cart, quantity selector or "Pay now with card" on any page. | None exists — ordering is WhatsApp/phone/walk-in/UPI only. Do not raise the absence of a cart as a bug. |
| KD-107 | Order page delivery info | P3 | Content | — | 1. Read any delivery radius, minimum order or timing copy. | Accurate per the owner's sheet. **[CONFIRM WITH OWNER]** |

---

## 8. Form & Enquiry Tests ⚠️

> **⚠️ EVERY TEST IN THIS SECTION CREATES A REAL LEAD IN THE BUSINESS'S DATABASE.**
> The owner sees it in the admin panel and may treat it as a genuine customer.
> **Rules:** owner approval first · every text field starts with `TEST — PLEASE IGNORE` · use your own test email/phone · note the enquiry ID shown so the owner can delete it afterwards.
> No email or SMS is sent by the application — "no email arrived" is **not** a bug.
>
> **Rate limit:** only **5 successful submissions per 10 minutes** per IP. Plan the order of these tests; if you hit the limit you will get an HTTP 429. Validation failures that the browser blocks client-side do not consume the quota, but server-rejected posts do.

### 8.1 Contact form — `#contactForm` on `/contact.html`

Fields: **Name** (required, ≤100) · **Email** (required, ≤254) · **Phone** (optional, ≤20) · **Subject** (required, dropdown) · **Message** (required, ≤2000) · hidden honeypot `website_url_hp`.

| Test ID | Title | Priority | Type | Pre-conditions | Steps | Expected Result |
|---|---|---|---|---|---|---|
| KD-200 | Contact form renders all fields | P1 | UI | — | 1. Open `/contact.html`. 2. Scroll to the form. | Name, Email, Phone, Subject (select) and Message fields plus the submit button all render with visible labels. Required fields are marked. |
| KD-201 | Subject dropdown options | P1 | UI | — | 1. Open the Subject dropdown. | Exactly these choices (values in brackets): General Enquiry `general`, Feedback `feedback`, Catering `catering`, Corporate `corporate`, Franchise `franchise`, Complaint `complaint`, Other `other`. |
| KD-202 | Honeypot field is invisible | P2 | UI | DevTools open | 1. Inspect the form DOM. | A field named `website_url_hp` exists, injected by `js/security.js`, and is **not visible** to the user and not tab-focusable. |
| KD-203 | Submit with all fields empty | P1 | Validation | — | 1. Click submit without typing anything. | Submission is blocked. Browser-native required-field prompts appear on Name, Email, Subject and Message. No network request is sent. |
| KD-204 | Missing Name only | P1 | Validation | — | 1. Fill Email, Subject, Message. Leave Name blank. 2. Submit. | Blocked. If it reaches the server, the response is **"A required field is missing."** |
| KD-205 | Missing Message only | P1 | Validation | — | 1. Fill Name, Email, Subject. Leave Message blank. 2. Submit. | Blocked / **"A required field is missing."** |
| KD-206 | Missing Subject only | P1 | Validation | — | 1. Leave Subject on its default/placeholder option. 2. Fill everything else. 3. Submit. | Blocked / **"A required field is missing."** or **"Select a valid subject."** |
| KD-207 | Invalid email — no TLD | P1 | Validation | — | 1. Email = `qa.tester@example`. 2. Fill the rest validly. 3. Submit. | Rejected with **"Enter a valid email address."** (error text in red `#b42318` in the `.form-status` line). |
| KD-208 | Invalid email — no `@` | P1 | Validation | — | 1. Email = `qatesterexample.com`. 2. Submit. | Rejected with **"Enter a valid email address."** |
| KD-209 | Invalid email — spaces | P2 | Validation | — | 1. Email = `qa tester@example.com`. 2. Submit. | Rejected with **"Enter a valid email address."** |
| KD-210 | Invalid email — 1-char TLD | P2 | Validation | — | 1. Email = `qa@example.c`. 2. Submit. | Rejected — the pattern requires a TLD of at least 2 characters. |
| KD-211 | Email is stored lowercased | P3 | Functional | Admin access | 1. ⚠️ Submit with Email `QA.Tester+KANGRA@Example.COM`. 2. Open `/admin.html` → Enquiries. | The stored email appears entirely in lowercase. |
| KD-212 | Phone optional on contact | P2 | Functional | — | 1. ⚠️ Submit a valid contact enquiry leaving Phone empty. | Accepted — Phone is not required on the contact form. |
| KD-213 | Invalid phone — starts with 1 | P1 | Validation | — | 1. Phone = `1234567890`. 2. Submit. | Rejected with **"Enter a valid Indian phone number."** (must start 6–9). |
| KD-214 | Invalid phone — too short | P1 | Validation | — | 1. Phone = `98765`. 2. Submit. | Rejected with **"Enter a valid Indian phone number."** |
| KD-215 | Invalid phone — too long | P2 | Validation | — | 1. Phone = `98765432101`. 2. Submit. | Rejected with **"Enter a valid Indian phone number."** |
| KD-216 | Invalid phone — letters | P2 | Validation | — | 1. Phone = `abcdefghij`. 2. Submit. | Rejected with **"Enter a valid Indian phone number."** |
| KD-217 | Valid phone formats accepted | P2 | Validation | — | 1. ⚠️ Try each in turn: `9876543210`, `+919876543210`, `+91 9876543210`, `91-9876543210`, `98765 43210`. | All five are accepted (the code strips spaces and allows an optional `+91` prefix with space or hyphen). |
| KD-218 | Name over 100 characters | P2 | Validation | — | 1. Paste a 101-character name. 2. Submit. | Rejected with **"A field exceeds the 100 character limit."** (or the input caps at 100 via `maxlength`). |
| KD-219 | Message over 2000 characters | P2 | Validation | — | 1. Paste a 2001-character message. 2. Submit. | Rejected with **"A field exceeds the 2000 character limit."** (or capped at 2000). |
| KD-220 | Message exactly 2000 characters | P3 | Validation | — | 1. ⚠️ Paste exactly 2000 characters (prefixed `TEST — PLEASE IGNORE`). 2. Submit. | Accepted — boundary value passes. |
| KD-221 | Special characters and emoji | P2 | Validation | — | 1. ⚠️ Name = `TEST — PLEASE IGNORE O'Brien-Sharma (श्री) 🙏`. 2. Message with `& < > " ' / \ %`. 3. Submit. | Accepted and stored intact; in the admin table the characters display literally — **no HTML is rendered and no script executes**. |
| KD-222 | XSS attempt in Message | P1 | Negative | — | 1. ⚠️ Message = `TEST — PLEASE IGNORE <script>alert(1)</script><img src=x onerror=alert(2)>`. 2. Submit. 3. Open the admin Enquiries table. | Submission is accepted but the text is **escaped and displayed as plain text**. No alert fires anywhere on the site or in the admin panel. |
| KD-223 | SQL-injection-style input | P2 | Negative | — | 1. ⚠️ Name = `TEST — PLEASE IGNORE '); DROP TABLE enquiries;--`. 2. Submit. 3. Check the admin table and `/api/health`. | Stored verbatim as text; `/api/health` still returns `{"status":"ok","database":"ok"}`; the enquiries table is intact. |
| KD-224 | ⚠️ Successful contact submission | P1 | Functional | Owner approval | 1. Fill: Name `TEST — PLEASE IGNORE QA Tester`, Email `qa.tester+kangra@example.com`, Phone `9876543210`, Subject `General Enquiry`, Message `TEST — PLEASE IGNORE automated QA check, no action needed.` 2. Click submit. 3. Watch the button and the status line. | Button becomes disabled showing **`Sending…`**, then **`✓ Sent`** (re-enabled after ~2 seconds). A green (`#2C5E3B`) status line reads **"Thank you. Your enquiry has been received."** The API returns HTTP **201** with an `id`. Record that id. |
| KD-225 | Form clears after success | P2 | Functional | KD-224 done | 1. Look at the form fields after the success message. | Fields are reset/cleared so a second enquiry is not accidentally resent. **[CONFIRM WITH OWNER]** if the code retains values by design. |
| KD-226 | Double-click submit | P1 | Negative | — | 1. ⚠️ Fill the form validly. 2. Double-click the submit button rapidly. | The button is disabled on the first click, so **only one** enquiry is created. Verify in the admin table that exactly one new row exists. |
| KD-227 | Duplicate submission | P2 | Functional | KD-224 done | 1. ⚠️ Submit the identical enquiry a second time. | Accepted — the app does not de-duplicate; two rows appear. Confirm this is acceptable. **[CONFIRM WITH OWNER]** |
| KD-228 | Rate limit on enquiries | P2 | Negative | — | 1. ⚠️ Submit 6 valid enquiries within 10 minutes (clearly marked TEST). | The 6th is rejected with HTTP **429**; the UI shows an error status line rather than a silent failure. Wait 10 minutes before continuing. |
| KD-229 | Honeypot rejection | P2 | Negative | DevTools open | 1. In DevTools, set the value of the hidden `website_url_hp` input to `http://spam.example`. 2. Submit an otherwise-valid form. | Rejected with **"Submission rejected."** and nothing is stored. |
| KD-230 | Submit with JavaScript disabled | P3 | Negative | JS disabled in browser | 1. Disable JS. 2. Open `/contact.html`. 3. Try to submit. | Document the behaviour — the AJAX handler and the honeypot come from JS, so the form may not submit at all. **[CONFIRM WITH OWNER]** whether a no-JS fallback is required. |
| KD-231 | Network failure during submit | P2 | Negative | DevTools open | 1. ⚠️ Fill the form. 2. Set DevTools → Network to **Offline**. 3. Submit. | A visible error status line appears (red); the button is re-enabled so the user can retry. The page does not freeze or navigate away. |
| KD-232 | Unknown enquiry type (API) | P3 | Negative | — | 1. In a terminal/REST client, `POST` to `/api/enquiries/feedback` with a valid JSON body. | HTTP **404** with `"Unknown enquiry type."` Only `contact` and `catering` are accepted. |
| KD-233 | Oversized JSON body | P3 | Negative | — | 1. `POST` a JSON body larger than 32 kb to `/api/enquiries/contact`. | Rejected (HTTP 413 / 400) — the body limit is 32 kb. Server stays up. |

### 8.2 Catering form — `#cateringForm` on `/catering.html`

Fields: **Name** (required, ≤100) · **Email** (required, ≤254) · **Phone** (**required**, ≤20) · **Company** (optional, ≤150) · **Service type** (required, dropdown, ≤40) · **Number of people** (optional, integer 1–10000) · **Message** (optional, ≤2000) · hidden honeypot.

| Test ID | Title | Priority | Type | Pre-conditions | Steps | Expected Result |
|---|---|---|---|---|---|---|
| KD-250 | Catering form renders all fields | P1 | UI | — | 1. Open `/catering.html` and scroll to the form. | Name, Email, Phone, Company, Service type, Number of people and Message render with labels; required fields are marked. |
| KD-251 | Service dropdown options | P1 | UI | — | 1. Open the Service type dropdown. | Exactly: Corporate Lunch `corporate-lunch`, Group Booking `group-booking`, Event Catering `event-catering`, Bulk Order `bulk-order`, Subscription `subscription`, Other `other`. |
| KD-252 | Phone is required here | P1 | Validation | — | 1. Fill Name, Email, Service type. Leave Phone blank. 2. Submit. | Blocked / **"A required field is missing."** — unlike the contact form, Phone is mandatory. |
| KD-253 | Service type required | P1 | Validation | — | 1. Leave Service type on the placeholder. 2. Fill everything else. 3. Submit. | Blocked / **"A required field is missing."** or **"Select a valid service."** |
| KD-254 | Message optional here | P2 | Functional | — | 1. ⚠️ Submit with Name, Email, Phone and Service type only. | Accepted — Message is optional on the catering form. |
| KD-255 | Guests = 0 | P1 | Validation | — | 1. Number of people = `0`. 2. Submit. | Rejected with **"Number of people must be between 1 and 10,000."** |
| KD-256 | Guests negative | P2 | Validation | — | 1. Number of people = `-5`. 2. Submit. | Rejected with **"Number of people must be between 1 and 10,000."** |
| KD-257 | Guests above maximum | P1 | Validation | — | 1. Number of people = `10001`. 2. Submit. | Rejected with **"Number of people must be between 1 and 10,000."** |
| KD-258 | Guests boundary values | P2 | Validation | — | 1. ⚠️ Submit with `1`. 2. ⚠️ Submit with `10000`. | Both accepted. |
| KD-259 | Guests non-numeric / decimal | P2 | Validation | — | 1. Try `abc`, then `12.5`. 2. Submit each. | Non-numeric is blocked by the number input or rejected; a decimal is either rejected or truncated to an integer — it must never be stored as `12.5`. **[CONFIRM WITH OWNER]** |
| KD-260 | Company over 150 characters | P3 | Validation | — | 1. Paste a 151-character company name. 2. Submit. | Rejected with **"A field exceeds the 150 character limit."** (or capped at 150). |
| KD-261 | ⚠️ Successful catering submission | P1 | Functional | Owner approval | 1. Fill: Name `TEST — PLEASE IGNORE QA Tester`, Email `qa.tester+kangra@example.com`, Phone `9876543210`, Company `TEST — PLEASE IGNORE QA Co`, Service type `Event Catering`, Number of people `50`, Message `TEST — PLEASE IGNORE automated QA check, no action needed.` 2. Submit. | Button shows `Sending…` then `✓ Sent`; green status line **"Thank you. Your enquiry has been received."**; HTTP **201** with an `id`. Record the id. |
| KD-262 | Catering enquiry stored with the right type | P1 | Functional | Admin access; KD-261 done | 1. Log in to `/admin.html`. 2. Open the Enquiries table. | The new row's Request/type column shows **catering** (not contact) and carries the Service type and Number of people. |
| KD-263 | Catering form honeypot | P2 | Negative | DevTools | 1. Fill `website_url_hp` via DevTools. 2. Submit a valid form. | **"Submission rejected."** Nothing stored. |
| KD-264 | Catering form double-submit | P1 | Negative | — | 1. ⚠️ Double-click submit. | Only one enquiry is created. |
| KD-265 | ⚠️ Catering WhatsApp CTA | P2 | Functional | Real phone; owner approval | 1. Tap the WhatsApp button on `/catering.html`. 2. Verify the number and text. 3. **Do not send.** | Opens a chat with +91 7011376087 with catering text pre-filled. |
| KD-266 | Error styling is legible | P3 | UI | — | 1. Trigger any validation error. | The `.form-status` line is red (`#b42318`), readable at 360 px width, and sits next to the form (not off-screen). |
| KD-267 | Success styling is legible | P3 | UI | KD-261 done | 1. Observe the success line. | Green (`#2C5E3B`), readable, clearly a success. |
| KD-268 | Keyboard-only form completion | P2 | Functional | — | 1. Using only Tab/Shift+Tab/arrow keys/Enter, complete and submit the contact form. ⚠️ | Every field is reachable in a logical order, the dropdown is operable with the keyboard, focus is visible, and Enter submits. |

---

## 9. Admin / Stored Data Tests

**An admin area DOES exist at `/admin.html`.** It is protected by a **password only** (no username). A successful login sets a signed, httpOnly cookie `kdc_admin` (SameSite=Strict, Secure, 8-hour expiry) and issues a **CSRF token** that the admin JavaScript sends in the `X-CSRF-Token` header on every write.

> ⚠️ Admin **write** tests change the live site. Get explicit owner approval, record original values, and restore them.
> ⚠️ **Do not run KD-330 (password change) unless the owner is present** — getting it wrong locks the owner out of their own site.

### 9.1 Access control (run these FIRST — no password needed)

| Test ID | Title | Priority | Type | Pre-conditions | Steps | Expected Result |
|---|---|---|---|---|---|---|
| KD-300 | Admin page is reachable but gated | P1 | Functional | Incognito window | 1. Open `/admin.html`. | The page loads (HTTP 200) but shows only the **login form**. No menu editor and no enquiry data are visible. |
| KD-301 | Enquiries API blocked when logged out | P1 | Negative | Incognito | 1. Open `https://kangradham.kran-apps.cloud/api/admin/enquiries`. | HTTP **401** with `"Authentication required."` **No customer data is returned.** |
| KD-302 | Session API blocked when logged out | P1 | Negative | Incognito | 1. Open `/api/admin/session`. | HTTP **401**. |
| KD-303 | Menu write blocked when logged out | P1 | Negative | REST client | 1. `PUT /api/admin/menu` with a valid JSON body and no cookie. | HTTP **401** `"Authentication required."` The live menu is unchanged. |
| KD-304 | Enquiry delete blocked when logged out | P1 | Negative | REST client | 1. `DELETE /api/admin/enquiries/1` with no cookie. | HTTP **401**. Nothing is deleted. |
| KD-305 | Wrong password rejected | P1 | Negative | — | 1. On `/admin.html` enter `wrongpassword123`. 2. Submit. | Error shown: **"Invalid credentials."** No cookie is set. The message must not reveal whether the password was close. |
| KD-306 | Empty password rejected | P2 | Validation | — | 1. Submit the login form with an empty password. | Blocked / rejected with **"Invalid credentials."** |
| KD-307 | Login rate limit | P2 | Negative | — | 1. Enter a wrong password 9 times in a row. | From the 9th attempt the server returns HTTP **429** (limit is 8 per 15 minutes). **Do this last** in the access-control block — it will lock you out of logging in for 15 minutes. |
| KD-308 | CSRF protection on writes | P1 | Negative | Logged in; REST client with the cookie | 1. Send `PATCH /api/admin/enquiries/<id>` with the valid session cookie but **no** `X-CSRF-Token` header. | HTTP **403** with **"Invalid security token."** The change is not applied. |
| KD-309 | Cookie is httpOnly | P2 | Functional | Logged in | 1. In the browser console run `document.cookie`. | The `kdc_admin` cookie is **not** listed (httpOnly). In DevTools → Application → Cookies it shows `HttpOnly ✓`, `Secure ✓`, `SameSite=Strict`. |
| KD-310 | Admin page is not indexed | P2 | Functional | — | 1. Open `/robots.txt`. 2. Open `/sitemap.xml`. | `/admin.html` is disallowed in robots.txt and absent from the sitemap. **[CONFIRM WITH OWNER]** if not — raise as S3. |

### 9.2 Logged-in admin (requires the owner's password)

| Test ID | Title | Priority | Type | Pre-conditions | Steps | Expected Result |
|---|---|---|---|---|---|---|
| KD-320 | Successful login | P1 | Functional | Admin password | 1. Open `/admin.html`. 2. Enter the correct password. 3. Submit. | The login form is replaced by the admin dashboard (menu editor, Today's override, enquiries table, password form, logout). A `kdc_admin` cookie is set. |
| KD-321 | Session persists on reload | P2 | Functional | Logged in | 1. Reload `/admin.html`. | You remain logged in; the dashboard renders without re-entering the password. |
| KD-322 | Logout works | P1 | Functional | Logged in | 1. Click Logout. 2. Reload `/admin.html`. 3. Open `/api/admin/enquiries`. | Back to the login form; the cookie is cleared; the API returns **401**. |
| KD-323 | Expired/invalid session | P2 | Negative | Logged in; DevTools | 1. In DevTools → Application → Cookies, edit the `kdc_admin` value to garbage. 2. Reload and try an admin action. | HTTP **401** with `"Authentication required."` or `"Session expired."`; you are returned to the login form. |
| KD-324 | Enquiries table lists leads | P1 | Functional | Logged in; KD-224/KD-261 done | 1. Open the Enquiries section. | A table with columns **Date, Customer, Request, Message, Status, Action**. Your `TEST — PLEASE IGNORE` rows appear **at the top** (newest first). At most 500 rows are listed. |
| KD-325 | Enquiry data integrity | P1 | Functional | KD-224 and KD-261 done | 1. Compare each stored row with exactly what you submitted. | Name, email (lowercased), phone, subject/service, company, guests and message all match what you entered, with no truncation or mangled characters (including the emoji from KD-221). |
| KD-326 | Empty state | P3 | UI | A database with no enquiries | 1. View the Enquiries section when nothing has been submitted. | Shows **"No enquiries yet."** *(Likely not reproducible on the live site — verify in a local/staging copy or skip.)* |
| KD-327 | ⚠️ Change enquiry status | P2 | Functional | Logged in; owner approval; use **your own** test row | 1. On your TEST row, change Status to `contacted`. 2. Reload the page. 3. Change it to `closed`. 4. Reload. 5. Set it back to `new`. | Each change saves without error and survives a reload. Only `new`, `contacted` and `closed` are offered. |
| KD-328 | Invalid status rejected | P3 | Negative | Logged in; REST client with cookie + CSRF token | 1. `PATCH /api/admin/enquiries/<your test id>` with `{"status":"spam"}`. | HTTP **400** with **"Invalid enquiry status."** |
| KD-329 | Non-existent enquiry id | P3 | Negative | Logged in | 1. `PATCH /api/admin/enquiries/999999` with a valid status. | HTTP **404** with **"Enquiry not found."** |
| KD-330 | ⚠️⚠️ Change admin password | P2 | Functional | **Owner present and performing it** | 1. Open the password form. 2. Enter the current password and a new 12+ character password. 3. Save. 4. Log out and log back in with the new password. | Password changes successfully and the new one works. **The owner must do this and must record the new password.** |
| KD-331 | Password — wrong current password | P2 | Negative | Logged in | 1. Enter an incorrect current password with a valid new one. 2. Save. | HTTP **401** with **"Current password is incorrect."** Nothing changes. |
| KD-332 | Password — too short | P2 | Validation | Logged in | 1. New password = `short123` (8 chars). 2. Save. | HTTP **400** with **"New password must contain 12–128 characters."** |
| KD-333 | Password — too long | P3 | Validation | Logged in | 1. New password = 129 characters. 2. Save. | **"New password must contain 12–128 characters."** |
| KD-334 | Password — same as current | P2 | Validation | Logged in | 1. Enter the current password in both fields. 2. Save. | HTTP **400** with **"Choose a new password that differs from the current password."** |
| KD-335 | ⚠️ Edit a menu day | P1 | Functional | Logged in; owner approval | 1. **Record the current values first.** 2. Select `Monday`. 3. Change Note to `TEST — PLEASE IGNORE`. 4. Save. 5. Open `/menu.html?day=1` in another tab. 6. **Restore the original Note and save again.** | The change saves, appears on the public Menu page within ~60 seconds (API `Cache-Control: max-age=60` — hard-refresh if needed), and the restore puts the original text back. |
| KD-336 | Menu editor field set | P2 | UI | Logged in | 1. Select each day in turn. | For every day the editor shows: **Title, Price, Madra, Khatta, Note, Emoji, Image URL, Highlight** — all pre-populated with the current values. |
| KD-337 | Image URL must be HTTPS | P1 | Validation | Logged in; owner approval | 1. Set a day's Image URL to `http://example.com/a.jpg`. 2. Save. | Rejected with **"Image URLs must use HTTPS."** (or **"Image URLs must be valid HTTPS URLs."** for a malformed URL). Nothing is saved. |
| KD-338 | Image URL — javascript: scheme | P1 | Negative | Logged in; owner approval | 1. Set Image URL to `javascript:alert(1)`. 2. Save. | Rejected with an HTTPS-URL error; no script is ever executed on the public site. |
| KD-339 | Menu must keep 7 unique days | P2 | Negative | Logged in; REST client | 1. `PUT /api/admin/menu` with only 6 entries. 2. Then with two entries for the same day. | **"Menu must contain exactly seven daily entries."** and **"Every menu day must be unique."** respectively. The live menu is unchanged. |
| KD-340 | ⚠️ Today's Dham override | P1 | Functional | Logged in; owner approval | 1. Note the current override (expected: none/null). 2. Set the override to a day that is **not** today, e.g. `Sunday`. 3. Save. 4. Open `/` in an incognito window and hard-refresh. 5. **Set the override back to none and save.** | While the override is set, the Home page "Today's Dham" shows the overridden day; `/api/menu` reports `"override": 0`. After the reset, the real weekday is shown again and `override` is back to `null`. |
| KD-341 | Override validation | P3 | Negative | Logged in; REST client | 1. Send an override value of `9`. | **"Menu override must be a day from 0 to 6 or null."** |
| KD-342 | Unsaved-changes warning | P3 | Functional | Logged in | 1. Edit a menu field but do **not** save. 2. Try to close the tab or navigate away. | The browser shows a "leave site?" confirmation (`beforeunload`). Choose **Stay**, then undo the edit. |
| KD-343 | ⚠️⚠️ Delete an enquiry | P2 | Functional | Logged in; owner approval; **only your own TEST row** | 1. Click Delete on a row whose name starts with `TEST — PLEASE IGNORE`. 2. Read the confirmation dialog. 3. Confirm. 4. Reload. | The native dialog reads **"Delete the enquiry from &lt;name&gt;? This cannot be undone."** After confirming, the row disappears and does not return after a reload. |
| KD-344 | Cancel delete | P2 | Functional | Logged in | 1. Click Delete on your TEST row. 2. Press **Cancel** in the dialog. | Nothing is deleted; the row remains after a reload. |
| KD-345 | Admin UI escapes stored HTML | P1 | Negative | KD-222 done | 1. View the XSS test row in the admin table. | The script tag is shown as literal text; no alert fires and the table layout is not broken. |
| KD-346 | Admin on mobile | P3 | UI | 390 px viewport | 1. Open `/admin.html` at 390 px and log in. | Login form and tables are usable; the enquiry table scrolls horizontally rather than breaking the layout. |
| KD-347 | Enquiry ordering | P3 | Functional | Two enquiries submitted minutes apart | 1. Compare the Date column top to bottom. | Strictly newest-first (`ORDER BY created_at DESC`). |

---

## 10. Content Accuracy Checks

Ask the owner for a single **source-of-truth sheet** and tick every row below against it. Anything that does not match is a **content defect (S2 if it could mislead a customer about price, address or hours; otherwise S3)**.

| Test ID | Item | Value currently on the site | Where it appears | Matches owner? (Y/N) | Notes |
|---|---|---|---|---|---|
| KD-400 | Business name | The Kangra Dham Co. | Everywhere | | The old name "Kangra Dham Express" is gone — any sighting is a regression |
| KD-401 | Street address | Retail Arcade, Sector 137 (Opp. Metro Station), Noida Expressway | Footer, Locations, Home Find Us, JSON-LD | | |
| KD-402 | PIN code | 201305 | Footer, Locations, JSON-LD | | |
| KD-403 | Menu page footer address | Retail Arcade, Sector 137 (Opp. Metro Station), Noida Expressway | `/menu.html` footer | | ✅ Now matches KD-401 — see KD-009 |
| KD-404 | Phone number | +91 7011376087 | Footer, Contact, Locations, Order, all `tel:` links | | |
| KD-405 | WhatsApp number | 917011376087 | All `wa.me` links | | Must be the same as KD-404 |
| KD-406 | Email address | kapil8583@gmail.com | Footer, Contact | | A personal Gmail — **[CONFIRM WITH OWNER]** whether a business address should be used |
| KD-407 | UPI ID | 7011376087@upi | `/order.html` | | |
| KD-408 | UPI payee name | The Kangra Dham Co | `/order.html` | | |
| KD-409 | Lunch hours | 12:00–15:30 | Locations, JSON-LD | | |
| KD-410 | Snacks hours | 16:30–18:30 | Locations, JSON-LD | | |
| KD-411 | Dinner hours | 19:30–22:00 | Locations, JSON-LD | | |
| KD-412 | Open all 7 days | Yes | Locations, JSON-LD | | Confirm there is no weekly off day |
| KD-413 | Geo coordinates | 28.5151, 77.3939 | JSON-LD, map embed | | |
| KD-414 | Price range | ₹₹ | JSON-LD | | |
| KD-415 | Accepts reservations | False | JSON-LD | | **[CONFIRM WITH OWNER]** — catering bookings arguably are reservations |
| KD-416 | Sunday thali | The Grand Shadi Wali Dham — **₹299** | Menu, Home week preview | | The only day above ₹250 |
| KD-417 | Monday thali | The Classic Comfort — ₹299 | Menu | | |
| KD-418 | Tuesday thali | The Wholesome Feast — ₹299 | Menu | | |
| KD-419 | Wednesday thali | The Royal Delicacy — ₹299 | Menu | | |
| KD-420 | Thursday thali | The Fragrant Mid-Week — ₹299 | Menu | | |
| KD-421 | Friday thali | The Festive Friday — ₹299 | Menu | | |
| KD-422 | Saturday thali | The Weekend Warmup — ₹299 | Menu | | |
| KD-423 | Fixed daily items | Steamed Basmati Rice, Spiced Yogurt Palda, Desi Ghee Drizzle, Meetha Bhat | Menu | | |
| KD-424 | Madra & Khatta per day | 7 distinct pairs | Menu | | Check each day's dish names are spelled correctly |
| KD-425 | Pahadi Siddu | ₹80 | Menu sides | | |
| KD-426 | Babru (2 pcs) | ₹60 | Menu sides | | |
| KD-427 | Pahadi Chhaas | ₹40 | Menu sides | | |
| KD-428 | Kangra Orthodox Tea | ₹40 | Menu sides | | |
| KD-429 | Galgal ka Achar 250g | ₹150 | Menu retail | | |
| KD-430 | Lingad Pickle 250g | ₹220 | Menu retail | | |
| KD-431 | Kangra Loose Leaf Tea Packets | ₹180–₹350 | Menu retail | | |
| KD-432 | Catering subscription prices | ₹179 / ₹169 / ₹159 per thali | `/catering.html` | | ❌ Conflicts with KD-433 — see KD-092 |
| KD-433 | Corporate per-meal price | ₹200–₹250 | `/corporate.html` | | ✅ Intentionally different from KD-432 — labelled as an office-delivery rate |
| KD-434 | Corporate weekly price | ₹1,099 (6 days) | `/corporate.html` | | |
| KD-435 | Corporate monthly price | ₹3,999 (26 days) | `/corporate.html` | | |
| KD-436 | Hero stat | "₹299 Unlimited Thali" | Home hero | | ✅ Matches every menu day and the testimonial |
| KD-437 | Social media links | **None — the empty social area has been removed** | Footer, all pages | | Ask the owner for Instagram/Facebook URLs before re-adding — see KD-011 |
| KD-438 | Testimonials | Quotes on Home and `/stories.html` | Home, Stories | | **[CONFIRM WITH OWNER]** that these are real and consented |
| KD-439 | Gallery photos | Licensed stock / CC imagery only, with a "coming soon" note for original photography | `/gallery.html` | | **[CONFIRM WITH OWNER]** |
| KD-440 | Privacy policy | Policy text | `/privacy.html` | | **[CONFIRM WITH OWNER]** legally reviewed |
| KD-441 | Delivery area / minimum order | As stated on `/order.html` | `/order.html` | | **[CONFIRM WITH OWNER]** |
| KD-442 | Food-type claims (veg/jain/allergens) | As written in the copy | Menu, Home | | **[CONFIRM WITH OWNER]** — allergen accuracy matters legally |
| KD-443 | GST / FSSAI licence number | Check whether one is displayed | Footer / Privacy | | **[CONFIRM WITH OWNER]** whether an FSSAI number is legally required on the site |

---

## 11. SEO, Performance & Link Integrity

| Test ID | Title | Priority | Type | Pre-conditions | Steps | Expected Result |
|---|---|---|---|---|---|---|
| KD-500 | Home page title | P1 | SEO | — | 1. Open `/`. 2. Read the browser tab / `<title>`. | Exactly **"The Kangra Dham Co. \| Authentic Himachali Food in Noida"**. |
| KD-501 | Unique title on every page | P1 | SEO | — | 1. Visit all 11 public pages and note each `<title>`. | Every page has a distinct, descriptive title mentioning the brand. No duplicates, none empty, none over ~60 characters. |
| KD-502 | Meta description on every page | P1 | SEO | DevTools | 1. On each page run `document.querySelector('meta[name=description]').content`. | Present, unique, 120–160 characters, no placeholder text. |
| KD-503 | Canonical URLs | P1 | SEO | DevTools | 1. On `/about.html` run `document.querySelector('link[rel=canonical]').href`. 2. Repeat on catering, contact, corporate, gallery, locations, menu, order, stories, privacy and `/`. | **Fixed:** all 11 public pages are self-canonical on `https://kangradham.kran-apps.cloud/<page>`. No raw IP (`201.18.209.226`) or alias host remains anywhere in the markup. Any IP canonical is a regression (S1/S2). |
| KD-504 | Open Graph tags | P1 | SEO | DevTools | 1. On `/` check `og:title`, `og:description`, `og:image`, `og:url`, `og:type`. | All present; `og:image` returns HTTP 200 and is at least 600×315; `og:url` uses the real domain (not an IP). |
| KD-505 | Twitter card tags | P2 | SEO | DevTools | 1. Check `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`. | Present and consistent with the OG tags. |
| KD-506 | Social preview renders | P2 | SEO | — | 1. Paste `https://kangradham.kran-apps.cloud` into a WhatsApp chat **with yourself** (never the business number) or a link-preview debugger. | A preview card appears with the correct title, description and image. |
| KD-507 | Favicon | P2 | SEO | — | 1. Look at the browser tab on every page. | A favicon loads (not the default blank page icon) and is identical site-wide. |
| KD-508 | JSON-LD structured data | P1 | SEO | DevTools | 1. View source and find the `application/ld+json` block on `/`. 2. Paste it into Google's Rich Results Test. | Valid `Restaurant` schema with correct name, address (Sector 137, 201305), telephone, geo (28.5151/77.3939), `openingHours`, `priceRange ₹₹`. No validation errors. |
| KD-509 | `robots.txt` | P2 | SEO | — | 1. Open `/robots.txt`. | Returns 200; allows the public pages; disallows `/admin.html` and `/api/`; references the sitemap with the real domain. |
| KD-510 | `sitemap.xml` | P2 | SEO | — | 1. Open `/sitemap.xml`. 2. Open each URL it lists. | Valid XML; 11 URLs including `/corporate.html` and `/stories.html`; every URL returns 200; all use `https://kangradham.kran-apps.cloud`; `/admin.html`, `/offline.html` and `/404.html` are **not** listed. |
| KD-511 | Heading structure | P2 | SEO/A11y | DevTools | 1. On each page list the headings in order. | Exactly one `<h1>` per page, and heading levels descend without skipping (h1 → h2 → h3). |
| KD-512 | Image alt text | P1 | SEO/A11y | DevTools | 1. On each page run `[...document.images].filter(i=>!i.alt)`. | The list is empty — every content image has meaningful alt text (decorative images may use `alt=""`). |
| KD-513 | No broken internal links | P1 | Functional | — | 1. Crawl the site (e.g. a link checker) or click every link on all 11 pages. | No link returns 404/500. Remember: a broken internal link renders the **404 page body with a 404 status** — check the status code in DevTools, not just the look of the page. |
| KD-514 | No broken external links | P2 | Functional | — | 1. Click/inspect every external link (map, image hosts, social links if added). | All resolve; all open in a new tab with `rel="noopener noreferrer"`. |
| KD-515 | External image hosts load | P2 | Performance | DevTools Network | 1. Hard-reload `/` and `/menu.html`. 2. Filter by `Img` and sort by time. | Images from `upload.wikimedia.org`, `images.pexels.com` and `cdn.pixabay.com` all return 200. Flag any image over **300 kB** or taking over **3 s**. Note the dependency on third-party hosts as a reliability risk. |
| KD-516 | Lighthouse — Performance | P2 | Performance | Chrome DevTools | 1. Run Lighthouse (Mobile, Performance) on `/`. | Score ≥ 80. Record LCP (target < 2.5 s), CLS (< 0.1) and TBT. Repeat for `/menu.html`. |
| KD-517 | Lighthouse — Accessibility | P2 | A11y | Chrome DevTools | 1. Run Lighthouse (Accessibility) on `/`, `/menu.html`, `/contact.html`. | Score ≥ 90; log every contrast and label failure individually. |
| KD-518 | Lighthouse — SEO | P1 | SEO | Chrome DevTools | 1. Run Lighthouse (SEO) on every public page. | Score ≥ 90. Canonicals are now correct (KD-503), so a canonical warning here is a regression. |
| KD-519 | Lighthouse — Best Practices / PWA | P3 | Performance | Chrome DevTools | 1. Run Lighthouse Best Practices on `/`. | Score ≥ 90; no mixed content; no deprecated APIs; the manifest is detected and the app is installable. |
| KD-520 | Security headers | P2 | Functional | DevTools Network | 1. Inspect the response headers for `/`. | `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options: nosniff` are present (helmet). No CSP violations in the console. |
| KD-521 | `/api/health` | P2 | Functional | — | 1. Open `/api/health`. | HTTP 200 with `{"status":"ok","database":"ok"}`. |
| KD-522 | `/api/menu` caching | P3 | Performance | DevTools | 1. Request `/api/menu` and read the response headers. | `Cache-Control: public, max-age=60, stale-while-revalidate=300`; body is `{"menu":[7 items],"override":null}`. |
| KD-523 | Unknown API path | P3 | Negative | — | 1. Open `/api/does-not-exist`. | HTTP **404** with `{"error":"Not found."}`. |
| KD-524 | API rate limit headers | P3 | Functional | DevTools | 1. Make a few `/api/menu` requests and inspect the headers. | Draft-8 rate-limit headers are returned (e.g. `RateLimit`, `RateLimit-Policy`). |
| KD-525 | Page weight | P3 | Performance | DevTools Network | 1. Hard-reload `/` with the cache disabled and read the total transferred size. | Record it; flag anything over **3 MB** on the home page. |
| KD-526 | Time to first render on 3G | P2 | Performance | DevTools | 1. Throttle to "Slow 4G"/"Fast 3G". 2. Load `/`. | Meaningful content (hero + Today's Dham) appears within ~5 s; no long blank screen. |
| KD-527 | HTTPS everywhere / no mixed content | P1 | Functional | DevTools Console | 1. Load every page and watch the console. | No mixed-content warnings; every asset is loaded over `https://`. |

---

## 12. Cross-Cutting Checks

### 12.1 Responsive layout

| Test ID | Title | Priority | Type | Pre-conditions | Steps | Expected Result |
|---|---|---|---|---|---|---|
| KD-600 | 360 px (small Android) | P1 | UI | DevTools device toolbar | 1. Set the viewport to 360×640. 2. Scroll through all 11 public pages. | No horizontal scrollbar; no text clipped or overlapping; buttons at least 44×44 px; images scale; the nav collapses correctly. |
| KD-601 | 390 px (iPhone) | P1 | UI | — | 1. Repeat at 390×844. | As above. |
| KD-602 | 768 px (tablet portrait) | P2 | UI | — | 1. Repeat at 768×1024. | Grids reflow to 2 columns; the nav is either full or hamburger, consistently. |
| KD-603 | 1024 px | P2 | UI | — | 1. Repeat at 1024×768. | Desktop layout; no excessive white space. |
| KD-604 | 1280 px and 1920 px | P2 | UI | — | 1. Repeat at both widths. | Content is centred within a max width; no stretched images. |
| KD-605 | Mobile menu opens/closes | P1 | Functional | ≤768 px | 1. Tap the hamburger. 2. Tap a link. 3. Re-open and tap outside/close. | The menu opens over the page, links navigate, and the menu closes afterwards. It must not stay stuck open. |
| KD-606 | Menu day tabs on mobile | P2 | UI | 360 px | 1. Open `/menu.html` and use the day tabs. | All 7 tabs are reachable (scrollable or wrapped) and the active tab is clearly marked. |
| KD-607 | Forms on mobile | P1 | UI | 360 px | 1. Open the contact and catering forms. | All fields are full width, labels visible, the dropdown opens natively, and the on-screen keyboard does not hide the submit button. |
| KD-608 | Landscape orientation | P3 | UI | Phone | 1. Rotate the phone to landscape on Home and Menu. | Layout adapts; nothing is cut off. |
| KD-609 | Pinch zoom allowed | P3 | A11y | Phone | 1. Pinch-zoom on any page. | Zooming works up to 200% (the viewport must not set `user-scalable=no`). |

### 12.2 Device integrations ⚠️

| Test ID | Title | Priority | Type | Pre-conditions | Steps | Expected Result |
|---|---|---|---|---|---|---|
| KD-620 | ⚠️ Click-to-call on Android | P1 | Functional | Android phone; owner approval | 1. Tap every `tel:` link (footer, Contact, Locations, Order). 2. **Cancel each before dialling.** | The dialler opens pre-filled with `+91 7011376087` every time. |
| KD-621 | ⚠️ Click-to-call on iPhone | P1 | Functional | iPhone; owner approval | 1. Repeat KD-620 on iOS. | Same result. |
| KD-622 | ⚠️ Click-to-WhatsApp on Android | P1 | Functional | Android + WhatsApp; owner approval | 1. Tap every WhatsApp link across the site. 2. Check the number and pre-filled text. 3. **Do not send.** | Each opens a chat with +91 7011376087 with a sensible, correctly-branded pre-filled message ("The Kangra Dham Co."). Log any that say "Kangra Dham Express" — that would be a regression. |
| KD-623 | ⚠️ Click-to-WhatsApp on iPhone | P1 | Functional | iPhone + WhatsApp | 1. Repeat KD-622 on iOS. | Same result. |
| KD-624 | WhatsApp link on desktop | P2 | Functional | Desktop | 1. Click a WhatsApp link on desktop. | `web.whatsapp.com` opens in a **new tab** with the chat pre-filled; the original page is still open behind it. |
| KD-625 | ⚠️ Email link | P2 | Functional | — | 1. Click the email address in the footer. 2. **Close the mail client without sending.** | The default mail client opens a new message addressed to `kapil8583@gmail.com`. |

### 12.3 Navigation, state and errors

| Test ID | Title | Priority | Type | Pre-conditions | Steps | Expected Result |
|---|---|---|---|---|---|---|
| KD-640 | Browser Back/Forward | P1 | Functional | — | 1. Navigate Home → Menu → Catering → Contact. 2. Press Back three times. 3. Press Forward three times. | Each page renders correctly from history with no blank screens or JS errors. |
| KD-641 | Back after a menu tab change | P2 | Functional | — | 1. On `/menu.html` click 3 different day tabs. 2. Press Back once. | Because the code uses `history.replaceState`, Back returns to the **previous page**, not the previous tab. Confirm this is acceptable. **[CONFIRM WITH OWNER]** |
| KD-642 | Refresh preserves state | P2 | Functional | — | 1. Open `/menu.html?day=4`. 2. Press F5. | The Thursday tab is still selected after the reload. |
| KD-643 | Deep link shareability | P2 | Functional | — | 1. Copy `/menu.html?day=2` and open it in a different browser. | Tuesday's thali is shown. |
| KD-644 | 404 behaviour | P1 | Negative | — | 1. Open `https://kangradham.kran-apps.cloud/does-not-exist`. 2. Check the status code in DevTools. | **Fixed:** status **404** with the body of `404.html` — "We couldn't find that page" plus a Home button and links to Menu, Order, Find Us, Catering and Contact. It must **not** say "You're offline". |
| KD-645 | Directory traversal blocked | P2 | Negative | — | 1. Request `/../server.js`, `/lib/database.js`, `/.env`, `/data/menu.json`, `/package.json`. | Each returns 404 with the `404.html` body (the server serves only an allow-list of root files). **No source code, `.env` or database file is ever served.** |
| KD-646 | Database file not exposed | P1 | Negative | — | 1. Request `/kangra.db`, `/data/app.db`, `/data/`. | 404. No SQLite file is downloadable. |
| KD-647 | Offline page via service worker | P2 | Functional | — | 1. Load `/`. 2. DevTools → Network → **Offline**. 3. Navigate to another page. | The offline fallback page renders with a friendly message; the browser's native error page is not shown. |
| KD-648 | Service worker does not cache the API | P2 | Functional | DevTools Application | 1. Load the site, then inspect Cache Storage `kangra-dham-v5`. | No `/api/` responses are cached — the menu is always fetched fresh. |
| KD-649 | Stale content after a deploy | P3 | Functional | — | 1. After any content change, reload without a hard refresh. | Because HTML is network-first, the new content appears on a normal reload. If it does not, note the need for a hard refresh. |
| KD-650 | PWA install | P3 | Functional | Chrome Android | 1. Use "Add to Home screen". 2. Open the installed app. | It installs with the correct name and icon from `/manifest.json` and launches at the Home page. |

### 12.4 Accessibility basics

| Test ID | Title | Priority | Type | Pre-conditions | Steps | Expected Result |
|---|---|---|---|---|---|---|
| KD-660 | Keyboard navigation site-wide | P1 | A11y | — | 1. Tab through Home, Menu and Contact from the top. | Every interactive element is reachable in a logical order with a **visible focus outline**; no keyboard traps. |
| KD-661 | Skip-to-content link | P3 | A11y | — | 1. Press Tab once on page load. | A "skip to content" link appears, or note its absence. **[CONFIRM WITH OWNER]** |
| KD-662 | Colour contrast | P2 | A11y | Lighthouse / contrast checker | 1. Check body text, buttons and the green success / red error status text. | All text meets WCAG AA (4.5:1 for body text, 3:1 for large text). |
| KD-663 | Form labels | P1 | A11y | DevTools | 1. Inspect every input on both forms. | Each has an associated `<label for>` or `aria-label`; screen readers announce the field name. |
| KD-664 | Screen reader pass | P3 | A11y | NVDA / VoiceOver | 1. Read through Home and Contact with a screen reader. | Headings, links, images and form fields are announced meaningfully; no "unlabelled button". |
| KD-665 | Lang attribute | P3 | A11y | DevTools | 1. Check `<html lang>` in English mode and again after switching to Hindi. | English pages use `lang="en"`; in Hindi mode the attribute should become `hi`. **[CONFIRM WITH OWNER]** if it does not change. |
| KD-666 | Map iframe has a title | P3 | A11y | DevTools | 1. Inspect the Google Maps `<iframe>`. | It carries a descriptive `title` attribute. |
| KD-667 | Reduced motion | P3 | A11y | OS setting | 1. Enable "reduce motion" in the OS. 2. Load the site. | Animations are reduced or removed; nothing flashes rapidly. |

---

## 13. Smoke Test (15 minutes)

Run this ordered subset after every deployment. **None of these steps sends a real message** — they are all safe.

| # | Test ID | What to do | Pass if |
|---|---|---|---|
| 1 | KD-001 | Load `https://kangradham.kran-apps.cloud` | Home page renders over HTTPS |
| 2 | KD-002 | Load `https://kangra.kran-apps.cloud` | 301-redirects to the primary domain |
| 3 | KD-521 | Open `/api/health` | `{"status":"ok","database":"ok"}` |
| 4 | KD-004 | Click all 10 nav items | Every page returns 200 |
| 5 | KD-033 | Read Today's Dham on Home | Correct weekday, title and price |
| 6 | KD-040 | Check the week preview | 7 cards, correct titles/prices |
| 7 | KD-041 | Click the Wednesday card | Opens `/menu.html?day=3` on Wednesday |
| 8 | KD-051 | Click all 7 day tabs | All switch correctly, no reload |
| 9 | KD-057 / KD-058 | Check the sides and retail prices | Match §10 |
| 10 | KD-080 / KD-081 | Open Find Us | Address Sector 137 / 201305 and the three hour bands shown |
| 11 | KD-008 | Check the footer on 3 pages | Correct phone, email and address |
| 12 | KD-200 / KD-250 | Open both forms | All fields render |
| 13 | KD-203 | Submit the empty contact form | Blocked by validation (nothing is sent) |
| 14 | KD-301 | Open `/api/admin/enquiries` in incognito | HTTP 401, no data |
| 15 | KD-300 | Open `/admin.html` in incognito | Login form only |
| 16 | KD-644 | Open `/does-not-exist` | 404 returned, showing the "Page not found" body |
| 17 | KD-046 | Check the console on Home | No JS errors, no CSP violations |
| 18 | KD-500 | Check the page title | "The Kangra Dham Co. \| Authentic Himachali Food in Noida" |
| 19 | KD-600 | View Home at 360 px | No horizontal scroll, nav collapses |
| 20 | KD-515 | Check Network → Img on Home and Menu | All images 200, none excessively slow |

If any of steps 1–8 fails, **stop and escalate** — the site is not fit for customers.

---

## 14. Out of Scope / Known Limitations

Do **not** raise these as defects.

1. **No email or SMS notifications.** The application has no mail/SMS/WhatsApp-API integration. Form submissions are stored in the database only; the owner must check `/admin.html`. "I submitted a form but got no email" is expected behaviour.
2. **No online payment or shopping cart.** Ordering is WhatsApp, phone, walk-in or a manual UPI transfer. There is no checkout, cart, quantity selector, order tracking or order history.
3. **No customer accounts.** There is no signup, login, profile or password reset for customers. The only login is the owner's admin password.
4. **Admin has no username.** A single shared password is by design; so is the absence of multi-user roles, 2FA, audit logs and "forgot password".
5. **Gallery imagery is licensed stock/CC, not the business's own photos.** The page says so explicitly; replacing it with original photography is a pending content task, not a bug.
6. **Loyalty/rewards "Coming Soon".** Intentionally non-functional.
7. **Hindi translation is partial.** Only Home, Our Heritage, The Menu, Corporate and Stories have the toggle. Report the gap once (KD-020), not per page.
8. **Images hosted externally.** Photos come from Wikimedia, Pexels and Pixabay. Occasional slowness from those CDNs is an infrastructure characteristic — report only outright failures.
9. **Rate limiting.** HTTP 429 after 5 enquiries in 10 minutes, 8 login attempts in 15 minutes, or 150 API calls in 15 minutes is **correct behaviour**, not a bug.
10. **Service-worker caching.** Seeing a slightly stale page before a hard refresh is expected PWA behaviour.
11. **Menu changes take up to 60 seconds** to appear publicly because `/api/menu` is cached for 60 s.
12. **The empty-enquiries state ("No enquiries yet.")** probably cannot be reproduced on the live site.
13. **Server-side/API tests requiring a REST client** (KD-232, KD-233, KD-303, KD-304, KD-308, KD-328, KD-329, KD-339, KD-341) may be skipped if the tester has no such tool — mark them "Not executed", do not fail them.
14. **Backend/infrastructure items** (nginx config, systemd unit, nightly backups, DB file permissions) are outside manual QA scope.

---

## 15. Defect Reporting

### 15.1 Severity definitions

| Severity | Meaning | Examples on this site |
|---|---|---|
| **S1 — Critical** | Site down, data loss, security breach, or customers cannot order at all | Site returns 5xx; `/api/admin/enquiries` returns data without logging in; enquiries are not saved; WhatsApp/phone number is wrong so orders go nowhere; XSS executes |
| **S2 — Major** | A core journey is broken or a customer could be materially misled | Contact/catering form fails to submit; a menu day shows the wrong price; unlabelled contradictory prices between the thali, Catering and Corporate; wrong address in the Menu footer; the 404 page claiming the user is offline; canonical tags pointing at a raw IP |
| **S3 — Minor** | Noticeable but has a workaround, or is cosmetic with business impact | An empty "Follow Us" social area; old "Kangra Dham Express" wording in WhatsApp text; a hero price that disagrees with the menu; missing alt text; Hindi toggle missing on some pages; layout glitch at one breakpoint |
| **S4 — Trivial** | Cosmetic only, no business impact | Minor spacing/alignment, slightly inconsistent button padding, a stray typo in body copy |

### 15.2 Priority guidance

- **P1** — fix before the next customer visits (all S1, and S2 on Home/Menu/Contact).
- **P2** — fix in the current sprint.
- **P3** — backlog.

### 15.3 Bug report template

```markdown
**Bug ID:** KD-BUG-001
**Title:** <one-line summary, e.g. "Menu page footer shows Sector 62 instead of Sector 137">
**Related Test ID:** KD-009
**Severity:** S2
**Priority:** P1
**Environment:** https://kangradham.kran-apps.cloud
**Browser / Device / OS:** Chrome 131 / Windows 11 desktop (and/or Chrome Android 14, Pixel 7)
**Viewport:** 1280×800
**Date / Time (IST):** 2024-00-00 00:00
**Logged in as admin?** No

**Pre-conditions:**
<e.g. none / logged in to /admin.html>

**Steps to reproduce:**
1.
2.
3.

**Expected result:**
<exact expected text/behaviour, quoting the source of truth>

**Actual result:**
<what actually happened, quoting exact on-screen text>

**Evidence:**
- Screenshot / screen recording: <link>
- Console errors: <paste>
- Network: <request URL, method, status code, response body>

**Reproducibility:** Always / Intermittent (x of y attempts) / Once

**Real-customer impact:** Yes/No — <did this test create a lead, message or call? If yes, give the enquiry ID so the owner can delete it.>

**Notes / workaround:**
```

### 15.4 Reporting rules for this engagement

1. **One defect per report.** Do not bundle "three content errors" into one ticket.
2. **Always attach a screenshot** for UI/content defects and the **exact response status + body** for API defects.
3. **Quote exact strings** — both what the site shows and what it should show.
4. For any **content accuracy** defect, cite the owner's source-of-truth sheet row (§10 Test ID).
5. For every test that touched a ⚠️ channel, list in the report the **enquiry IDs created**, the **time of any WhatsApp/phone contact**, and confirm that every submitted text was prefixed `TEST — PLEASE IGNORE`.
6. At the end of the run, send the owner: (a) the list of test enquiry IDs to delete, (b) confirmation that any admin menu/override changes were restored, (c) confirmation that no payment was made.

### 15.5 Known defects identified from the source code

Items 1–7 and 9 were fixed in the content/SEO correctness pass. Re-test them as **regression checks**; raise the remaining open items as tickets unless the owner has already accepted them.

| # | Defect | Test ID | Suggested severity | Status |
|---|---|---|---|---|
| 1 | Canonical tags on 9 pages point to `https://201.18.209.226/…` instead of the real domain | KD-503 | S2 (SEO-critical) | ✅ Fixed — all pages self-canonical on the primary domain |
| 2 | Menu page footer shows "Sector 62, Noida, UP 201301" instead of Sector 137 / 201305 | KD-009 | S2 | ✅ Fixed |
| 3 | Catering (₹179/₹169/₹159 per thali) appears to contradict Corporate (₹200–₹250 per meal) | KD-092 | S2 | ✅ Fixed — both are intentional and are now explicitly labelled as different services |
| 4 | Unknown URLs return the offline page body ("You're offline right now…") instead of a 404 page | KD-644 | S2 | ✅ Fixed — dedicated `404.html` |
| 5 | WhatsApp pre-filled text still says "Kangra Dham Express" on some pages | KD-063 | S3 | ✅ Fixed |
| 6 | "Follow Us" social links container is empty on every page | KD-011 | S3 | ✅ Fixed — empty social area removed; real URLs still needed from the owner |
| 7 | Home hero claims "₹200 Unlimited Thali" while the thali is ₹299 | KD-032 | S3 | ✅ Fixed — ₹299 site-wide |
| 8 | Hindi toggle missing on Contact, Catering, Gallery, Find Us, Order and Privacy | KD-020 | S3 | ⬜ Open |
| 9 | Gallery shows placeholder tiles instead of photographs | KD-072 | S3 (content task) | ✅ Fixed — placeholders removed; original photography still pending |
| 10 | Business email is a personal Gmail address (`kapil8583@gmail.com`) | KD-406 | S3 (advisory) | ⬜ Open — owner's decision, deliberately left unchanged |

---

*End of document.*




