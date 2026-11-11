# Tripelor × BML — staged payment rollout

**Status:** UAT only. Do not merge/activate production until BML has approved the website and released production credentials.

## Completed and verified

- BML Connect UAT test transaction creation and redirect
- MVR 1.00 sandbox transaction confirmed by BML and checked using the transaction API
- Tester-only UAT endpoints; API keys are server-side Preview environment variables
- BML callback verification skeleton, read-only (does not change reservation records)
- Separate staging-only tables: `public.bml_payment_intents` and `public.bml_payment_events`
- Preview-only booking/quotation readiness review: `/bml-uat-readiness`

## Payment accounting safeguards

1. Use a confirmed Tripelor reservation as the parent booking, not a booking request or pending quotation alone.
2. Require a linked, accepted and unexpired quotation with a final amount.
3. Compare guest, property, dates, currency and exact amount on the server. Do not trust totals supplied by a browser.
4. Current BML UAT merchant is set to **MVR**. Never silently charge MVR for a USD total using an assumed conversion rate. The readiness endpoint requires both records to agree in MVR.
5. Record a unique local ID and original expected amount **before** creating any BML transaction.
6. Store the BML transaction ID, and verify server-to-server before marking a payment intent confirmed.
7. On callbacks, validate signatures and query BML for the final state, amount, currency and local ID. Record a deduplication fingerprint, enforce idempotency and never mark a different booking paid.
8. **Do not** automatically confirm a room reservation just because a card payment succeeded; apply the agreed booking rules and send one receipt after reconciliation.
9. Never store card details, raw secrets or unredacted callback bodies in payment logs.

## Production gates still open

- **Bank approval:** BML production sign-off, site review, production API credentials, and confirmation of settlement currencies.
- **Database deployment:** staging payment ledger has been applied and verified; it is **not** installed on the production database.
- **Application wiring:** create-intent route with DB-backed atomic reservation of payment attempts; verified webhook updates; payment results page; receipts; retries/refunds; reconciliations.
- **Functional checks:** successful/failed/cancelled/expired transactions, duplicate webhooks, mismatched amount/currency, session authorization, refunds, booking cancellation and concurrency.
- **Deployment:** keep PR #120 as a draft and all checkout changes on Preview until gates pass.

## Staging database

Project: `Tripelor Staging`. Tables:

- `bml_payment_intents`: booking/quote foreign keys, immutable-amount snapshot, BML transaction ID, status, unique active payment per booking, RLS enabled; only service-role grants.
- `bml_payment_events`: verified transaction event fingerprints; RLS enabled, service-role read/insert only.

Staging table creation was run through Supabase management. Production database was not modified.

## Environment variables

Preview only: `BML_UAT_API_KEY`, `BML_UAT_APPLICATION_ID`, and `BML_UAT_TESTER_EMAIL`.

The Preview website currently uses the site's existing Supabase configuration for **read-only** readiness lookups; the new staging payment ledger is **not yet wired** to Preview. Add explicit staging-only BML database credentials through a secure server-side connection when implementing persistent UAT checkout. Never expose sensitive keys in `NEXT_PUBLIC_` variables or GitHub source.


## BML compliance changes — 5 November 2026

BML requested (a) payment-card transmission and security disclosure, (b) the exact customer-facing notice "You will be redirected to the BML Payment Gateway to process your transaction", and (c) webhook-based primary transaction notification before live approval.

- The security and redirect notice have been updated in the UAT checkout and Tripelor's `/travel-info#payment-security`; the latter and merchant details/footer were also published separately to `main`.
- The UAT webhook route verifies `X-Signature-Nonce`, `X-Signature-Timestamp` and `X-Signature` with SHA-256; it then retrieves the transaction from the BML UAT API and stores only the verified state, amount, currency and Tripelor UAT reference.
- Deduplicated notifications are saved to the staging-only `public.bml_uat_webhook_notifications` table (composite primary key `transaction_id, verified_state`), with RLS on and grants only to `service_role`. No card data is saved.
- The webhook uses server-only `BML_UAT_STAGING_URL` and `BML_UAT_STAGING_SERVICE_ROLE_KEY` scoped to the testing branch in Vercel. The separate server-only `BML_UAT_WEBHOOK_URL` contains a temporary protection-bypass secret because Vercel Preview deployments require authentication; **never print or expose this URL/secret**.
- When `BML_UAT_WEBHOOK_URL` is configured, BML's UAT test transaction includes a webhook URL in its server-to-server request. Test receipt delivery with a fresh transaction and check the staging notification table. A successful browser redirect is not sufficient.
- This is UAT only; it never marks a Tripelor reservation paid and cannot be represented as live checkout or production webhook approval.
- After BML sign-off, revoke the temporary bypass secret and use a dedicated production HTTPS webhook endpoint with production keys and durable, booking-linked payment-intent reconciliation.

### UAT acceptance check

1. Build the `feature/bml-uat-checkout` branch with Preview environment credentials.
2. Complete a fresh MVR 1.00 test transaction using only BML test cards.
3. Confirm `bml_uat_webhook_notifications` contains a BML-verified `CONFIRMED` event for that transaction.
4. Repeat a callback: it must remain a single row per transaction/state; invalid signatures must return 403.
5. Submit proof to BML, with the statement that real booking settlement remains disabled.
