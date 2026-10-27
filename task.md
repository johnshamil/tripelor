# Tripelor existing-project improvement
## Confirmed
- Existing stack Next.js 14 / React 18, Supabase via REST/auth, Resend email.
- Vercel project prj_ke59tHOwEsnoUWmwiQ8AoMxKWov4, latest production READY/PROMOTED main 19faabd5e15df256607f35589ea46eaeaedd3621.
- Branch previews exist. Database/email isolation not verified.
- Local work branch improve/mobile-booking-20261027. No production writes, no migrations, no emails sent.
## Priorities
- Retain gold globe brand; readable mobile styles and consistent image/card sizing.
- Simplify homepage, property discovery and search/filter editing.
- Room/meal comparison and upfront policies; accessible mobile booking action.
- Preserve booking draft/navigation; retain existing availability/hold and quote model.
- Mobile admin property editor; no auth/business-rule/schema changes without evidence.
## Implemented and verified
- User approved the in-place plan and local mocked preview first.
- Existing-stack exception followed: Next.js code handoff only; no Runable publishing or stack migration.
- Homepage/navigation simplified, promo changed to explicit details, editable search/results, readable single-column phone cards, seasonal starting-rate consistency.
- Property anchors/lazy secondary images/mobile CTA collision fix.
- Account-scoped two-hour session booking draft (selection/contact only); preserve dates/party on property change; calendar focus/error handling; condition summary and 401 recovery.
- Admin property search, secondary sections collapsed, dirty-edit warnings; save rules untouched.
- Final build compiled, lint/type validation passed, 122 static pages generated.
- 11 targeted tests + 19 selected regression checks passed; full CJS suite 30 passed/7 pre-existing failures (five Node 26 transform-loader errors, two unresolved fixture imports).
- Local browser fixture checks at 320/360/390/768/1440px passed; no uncaught errors or page overflow. Confirmation is explicitly simulated; admin saves in-memory only.
- Dependencies unchanged; install flagged 1 high/1 critical vulnerability; security patch required before release.
- Local mock listeners 4300/4301; no Resend credentials, mutation RPCs blocked, launcher refuses real .env files/Vercel.
- Handoff/run instructions: docs/mobile-preview-handoff.md.
## Blockers
- GitHub write authorisation not yet granted.
- Need Vercel project environment metadata and safe preview backend configuration (connector only lists deployments).
- Need isolated Supabase test data/admin account to test mutations and email safely.
- Need approved dependency/security patch before any release; other admin screens/upload and real staging login/payment/email remain unverified.
