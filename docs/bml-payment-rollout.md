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
