# Tripelor isolated hosted demo

This is the existing Tripelor Next.js repository, not the separate Runable prototype. Hosted demo implementation was explicitly approved on 27 October 2026.

## Isolation and access

- Separate Vercel project: `tripelor-mobile-demo` (`prj_SIbBMw9JWpXi8gqpqvmQ9QQ8H8pj`). No Git auto-deploy connection, custom Tripelor domain, or production integration.
- Project environment contains only `TRIPELOR_MOCK_PREVIEW=1`. No Supabase, Resend, storage, payment or aviation credentials.
- Backend requests are intercepted in Node instrumentation and served from in-memory sample fixtures. Requests to other hosts throw instead of connecting to live services.
- Demo refuses service credentials and the production Vercel project. Automatic Git deployment of this branch is disabled in `vercel.json`; a production-project build guard is also present.
- Only sample availability and property editing APIs are enabled. Real booking requests, accounts, email, uploads, quotations and other admin mutations return 403.
- Banner buttons provide synthetic member/admin sessions. Endpoint returns 404 with demo mode off; production mock-admin cookie is rejected. No changes to actual Supabase auth rules.
- Google Ads and analytics are suppressed in demo mode; CSP blocks external browser connections and script sources. External contact links are intercepted. Production integrations remain enabled with demo mode off.
- Demo is noindex/nofollow. Admin saves return a validated sample to the current browser view only; reloading resets them and no property is publicly published. This avoids false version conflicts between independent serverless instances. Actual production save/version rules are untouched. Do not enter private information.

## Testing on an iPhone

Open the hosted HTTPS URL in Safari. Use the menu, choose destination/dates/guests, open a property and select a room plus BB/HB/FB. When redirected to login, tap **Enter member demo** in the yellow banner; the selected room/meal/dates are retained. No actual password is needed. Tap **Open admin demo** to search/edit properties and use private preview or browser-view-only save. **Sign out demo** clears the synthetic session.

The booking request button does not make a reservation; it displays the disabled-service error. Payment, confirmation and email delivery are not connected. Property data/rates/photos and availability are examples, not verified current offers.

## Dependency/security changes

- Next.js 14.2.4 → 15.5.28, the patched maintenance release named in the official 14 October 2026 security update: https://nextjs.org/blog/nextjs-security-update-october-14-2026
- React remains 18.2.0. Migrated request cookie and route query APIs to the Next.js async API; auth session setters and callers are awaited.
- PostCSS → 8.5.32 with an override to replace Next's vulnerable nested PostCSS. Added lockfile for repeatable installs.
- `npm audit`: zero reported vulnerabilities in the installed locked dependency tree. This is not a security certification or a staging integration test.

## Evidence before deployment

- Both demo and non-demo production builds pass compilation/type/lint validation (99 static pages each).
- 11 targeted tests and 19 selected regression checks passed.
- Existing browser suite: 95 checks passed at 320/360/390/768/1440px; zero page errors. Its confirmation response is simulated in-browser.
- Additional no-browser-mock demo suite: 20 check groups at 320/390/768/1440px; member/admin banner access, search/meal/date handoff, sample availability, blocked mutations, property editing and signout; no observed production-service browser requests.
- Config guards reject connected credentials, demo in production project, and this branch in production project.
- Non-demo server: demo session endpoint returns 404; synthetic admin cookie redirects to login; demo banner absent.

Run deployed-demo checks with `PREVIEW_URL=https://the-deployment-url python3 scripts/test-hosted-demo.py`.

## Before updating Tripelor.com

Real iPhone Safari review, isolated staging Supabase login/session refresh, reservation holds/concurrency/confirmation/cancellation, email/payment instructions, photo uploads/storage, concurrent admin version-conflict handling and the remaining admin screens are still required. Translate new labels into Italian/Russian. Seven pre-existing full-suite failures remain documented in `mobile-preview-handoff.md`. Do not merge or promote to Tripelor.com on the strength of sample-data tests alone.