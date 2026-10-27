# Tripelor — local mocked preview handoff

**Implemented in the existing Next.js repository on `improve/mobile-booking-20261027`, based on production commit `19faabd`. Nothing has been pushed or deployed.** This is an in-place refinement, not the earlier standalone Runable prototype.

## Changes

- Simplified the homepage; kept destination/date/guest search, selected stays, experiences, concierge help, rewards and reviews. Planning/story/deals features remain reachable in grouped navigation.
- Removed automatic giveaway popups. Reward details open only on explicit request.
- Added editable search to stay results, retaining query values. Invalid paired dates show a correction message. Search does **not** claim to filter by live availability.
- Enlarged mobile search controls and card text, used single-column phone property cards, and added explicit reference-rate caveats. Card starting prices now include seasonal rates, consistent with the property page; stored prices are unchanged.
- Added property section links, lazy-loaded secondary room/photos, and prevented the bottom room action from colliding with the mobile quick navigation.
- Preserved dates and party when changing properties. Added an account-scoped, two-hour session draft for selection/contact details; prices, availability and payment state are never cached. Explicit new URL choices override a restored selection. Successful requests clear the draft.
- Added booking conditions to the summary, contact autocomplete, expired-session recovery link and client-side duplicate-submit guard. The server booking, reservation and payment rules are unchanged.
- Improved calendar focus containment, Escape/return focus, scroll locking and stale-response cancellation. Failed calendars display an outage message instead of portraying unknown dates as confirmed available.
- Added admin property search, collapsed secondary panels, clearer unsaved-state notices and discard/navigation warnings. Existing validation, version checks, save, publish and upload mechanisms remain unchanged.

## Run the local preview

Use a clean clone/copy **without any `.env` files**. No real Supabase or Resend credentials are needed.

```bash
npm install
npm run preview:mock
```

Open **http://localhost:4300**. The synthetic Supabase REST/auth fixture runs at `127.0.0.1:4301`; both listeners are loopback-only. Restarting clears its in-memory changes.

To view protected screens, open the browser console **on localhost:4300** and set a local fixture cookie:

```js
// Synthetic customer session — not a real credential
document.cookie = "tripelor_access=mock-member; Path=/; SameSite=Lax";
location.href = "/booking";

// Synthetic admin session — not a real credential
document.cookie = "tripelor_access=mock-admin; Path=/; SameSite=Lax";
location.href = "/admin/properties";
```

Use **localhost**, not `127.0.0.1`, for the web URL: the existing Next.js development server resolves request origins to localhost, and the unchanged same-origin write checks enforce that.

The launcher refuses to run on Vercel or with project `.env` files, and replaces/removes service credentials in its child processes. Mutation RPCs are disabled. No email key is present. Property saves go only to in-memory fixture data. Booking confirmation is simulated by the browser test; clicking a real request in this fixture cannot send mail or create a live reservation.

Existing Google Ads/analytics integration source is retained. Browser tests block third-party requests; for manual local inspection, use browser request blocking if you also want to suppress analytics traffic.

## Verified tests — 27 October 2026

| Check | Result |
|---|---|
| Production build, lint/type validation | Passed; all 122 static pages generated |
| Targeted mobile/search/draft tests | 11 passed |
| Selected existing booking/inventory/notification/property tests | 19 passed with mocked dependencies; no live services |
| Browser checks | 95 passed at 320, 360, 390, 768 and 1440px; zero uncaught page errors |
| Full existing CJS suite in sandbox Node 26 | 30 passed, 7 failed; same seven files already failed before implementation |
| Git whitespace check | Passed |

Browser checks cover search → filtered/editable results → property/Full Board → login redirect retaining query → synthetic signed-in booking; contact/date persistence; availability against the synthetic backend; calendar error and Escape behaviour; session-expiry recovery; simulated confirmation and draft clearing; admin search/edit/private preview/discard protection/save; no document-level horizontal overflow.

Reproduce focused checks:

```bash
npm run test:mobile
node --test tests/manual-booking.test.cjs tests/availability-alerts.cjs tests/property-arrival.cjs tests/property-know-details.cjs tests/signin-notifications.cjs
npm run build
# After a build, restart preview:mock before browser tests (Next dev/build share .next).
python3 scripts/test-mobile-preview.py
```

The Python checks require Playwright and Google Chrome at `/usr/bin/google-chrome`. Screenshots and results are written to ignored `test-results/`.

## Remaining release gates

1. GitHub write access is not authorised; this branch and commit are local only.
2. Vercel branch previews exist, but preview Supabase/email isolation is **not verified**. No new Vercel deployment was created.
3. Run end-to-end real staging sign-in, booking hold/confirmation/email and cancellation tests with isolated data. Neither real payment instructions nor email delivery was exercised here.
4. Photo upload/storage, conflict-save concurrency and the other admin booking/calendar/sales screens need staging/device testing. This pass focuses on the property editor, not every admin module.
5. Installation reported **one high and one critical dependency vulnerability**, including a deprecation/security warning for pinned Next.js 14.2.4. Do not release this build without a separately approved security/dependency patch and regression pass. See [Next.js official security update](https://nextjs.org/blog/security-update-2025-12-11). Exact current audit detail was not obtained: `npm audit` requires the lockfile this repository lacks.
6. Existing full-suite failures: five test loaders call Node's no-longer-supported `stripTypeScriptTypes` transform mode (`couple-match`, `help-me-choose`, `holiday-shortlist`, `host-messages`, `wishlist`); `trip-cart` and `trip-itinerary` fixtures do not resolve `./bon-abri-public`. These were observed before UI changes and are not silently reported as passing.
7. New recovery/condition labels include English text; the existing English/Italian/Russian translations are retained, but a translation pass is still needed for new strings.

No database migration, production booking/customer edit, auth bypass, rate rewrite, payment-provider addition or real outbound email was performed.