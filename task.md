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
- GitHub connector is connected; repository API confirms admin/push permissions. Local git has no credential helper/token and gh is unavailable. Branch remains local at cd2b21d; no push attempted because automatic Vercel preview isolation remains unverified.
- Need Vercel project environment metadata and safe preview backend configuration (connector only lists deployments).
- Need isolated Supabase test data/admin account to test mutations and email safely.
- Need approved dependency/security patch before any release; other admin screens/upload and real staging login/payment/email remain unverified.
## Hosted preview continuation
- User approved isolated hosted mock and security fixes, supplied scoped tokens outside repo. Both tokens validated via API.
- Production env metadata confirms Supabase/Resend variables target both preview and production. No production settings changed.
- Created separate Vercel project tripelor-mobile-demo / prj_SIbBMw9JWpXi8gqpqvmQ9QQ8H8pj; only TRIPELOR_MOCK_PREVIEW=1; no Git link; Node 22; no production domain.
- Next 15.5.28 + PostCSS 8.5.32 override + lockfile; npm audit reports zero vulnerabilities. Async cookie/query migration; no change to reservation/payment rules.
- Hosted fixture installed via Node instrumentation; all non-fixture external server fetches blocked. Demo middleware allowlist blocks bookings/accounts/mail/uploads/other admin mutations.
- Banner member/admin/signout uses synthetic HttpOnly sessions; sample-data/noindex labels; production ads/analytics disabled only in demo. Non-demo endpoint 404 and mock-admin cookie rejected verified.
- Demo and non-demo builds passed, 99 static pages; 11 targeted + 19 regression tests; rerun 95 browser checks passed; additional 20 demo check groups passed without browser API mocks. All 3 fail-closed config guards verified.
- Next: commit security and hosted-demo changes, atomically push guarded branch, create draft PR, deploy only separate project, run live HTTPS demo checks, verify production unchanged, deliver URL + refreshed code/test handoff.
## Current verified outcome
- Local commits: cd2b21d (UI), aa445dd (security/async APIs), 3aa6a77 (hosted demo), 34a3799 (deployment exclusions), eac2e0b (browser-local demo saves).
- Push FAILED 403. GitHub PAT reads metadata but Git blob probe rejects contents=write. No remote branch or PR; need corrected PAT permission. GitHub plugin account permissions alone did not prove PAT write permission.
- Hosted HTTPS https://tripelor-mobile-demo.vercel.app; final READY deployment dpl_CTBtpfdNywjpeam9sjsSF1JJ6by5, deployed source eac2e0b.
- First live suite exposed serverless memory version conflicts; fixed sample saves to return validated current-browser-view-only data, reload resets it. Production save validation/version/RPC path untouched.
- Final live HTTPS no-browser-mock suite passed 20 check groups at 320/390/768/1440px, zero page errors and no observed production-service requests.
- Separate project only demo flag, no Git link, no SSO requirement; public 200/noindex. Existing Tripelor production deployment remains dpl_2g9BmwwLpZ1obzN4LVwWd5ma5a8d / 19faabd. No production changes or bookings/emails.
- Remaining: corrected GitHub contents/PR write token, push/PR verification; actual iPhone Safari and real isolated staging login/booking/email/payment/storage/concurrency/remaining admin tests before release.
