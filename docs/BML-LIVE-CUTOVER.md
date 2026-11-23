# Tripelor | BML live payment cutover (USD)

Status: **BLOCKED / DO NOT ENABLE CUSTOMER CHECKOUT**

This document describes the controlled transition from the confirmed UAT proof of concept to a production integration. It is not an approval to accept payments. Only the USD web API application has been observed; MVR production access is not verified.

## 1. Credential exposure and containment

- An API secret for the newly created USD application `Tripelor website` was exposed in a screenshot. Several pre-existing BML app/terminal keys were also visible.
- Treat those keys as compromised. Request rotation/revocation through BML Merchant Services and coordinate rotation of any production POS keys to avoid disruption. Do not reuse the screenshot-visible secrets.
- NEVER copy keys into GitHub, screenshots, chat transcripts, client JavaScript, or logs.
- When BML supplies the replacement, configure **Vercel -> Tripelor -> Settings -> Environment Variables -> Production only**:
  - `BML_LIVE_APPLICATION_ID`: replacement application ID (plain is acceptable).
  - `BML_LIVE_API_KEY`: new secret API key (Sensitive).
  - `BML_LIVE_PAYMENTS_ENABLED`: keep `false` until the checklist below is complete.
- Do not read/print secrets for diagnostics. Update the deployed environment only after credential rotation.
- UAT settings `BML_UAT_*` must remain separated from the production application.

## 2. Development requirements

- A customer must never supply the charged amount. A server-owned, supplier-approved *final* price/currency must be durably stored and immutable for the payment intent.
- Current `/api/booking` and `/api/cart-booking` create unpaid requests with estimated prices; neither is an approved, chargeable payment intent.
- Add a durable payment-intents table with unique idempotency keys, ownership, original booking reference, confirmed amount in minor units, currency, BML transaction ID, timestamps, immutable consent/version, signed webhook event receipt, reconciliation state, and a separate refund history. Make all server writes idempotent.
- All BML live API calls must be made server-side over HTTPS to the production API host `https://api.merchants.bankofmaldives.com.mv/public` using a **rotated secret** in an Authorization header. The secret must never reach the browser.
- The client may redirect to a validated BML-hosted checkout URL only after a server-authenticated booking/payment intent is created. Validate the destination host to prevent open redirects.
- Verify BML signature, nonce, timestamp/replay interval and event type, then independently GET the live BML transaction before any ledger state change.
- Verify local ID, transaction ID, merchant, currency, minor-unit amount and expected intent against an existing server-owned record. Reject mismatches; never infer success from a browser redirect or client payload.
- Preserve webhook idempotency and database transaction consistency. Confirm the booking and trigger email/receipts only after bank-verified `CONFIRMED` state and business approval; handle refunds and failed payments separately.
- Use the exact production registered webhook, not the UAT callback `/api/bml/uat/notify`, and do not register duplicate per-transaction callbacks.
- Coordinate BML production source-IP allowlisting and use a dedicated webhook route. The IP shared by BML for production allowlisting may not necessarily identify all webhook senders; verify with BML.

## 3. Controlled rollout

1. BML confirms compromised key revoked/rotated; coordinate existing POS applications.
2. Verify Vercel contains only the replacement secret (not the screenshot-visible key) in Production.
3. Complete production booking-intent ledger, signed webhook, bank reconciliation, admin audit and rollback handling.
4. Apply database migration and test authorization/amount-tampering/idempotency/replay/webhook failure paths.
5. Conduct one approved low-value REAL payment with a test booking, verify transaction status with BML, webhook arrival, reconciliation, receipt, refund/cancel flow and settlement reporting.
6. Only after success, set `BML_LIVE_PAYMENTS_ENABLED=true` and deploy the reviewed, production payment implementation. Monitor failed webhooks and settlement discrepancies.

## 4. Readiness snapshot

The new admin-only `GET /api/admin/bml-live/readiness` route returns check states and blockers without any credentials. It is deliberately **fail-closed**; until payment-intent processing and bank-verified webhook reconciliation have been implemented and tested it will never report ready. This route is not a working payment flow.

BML application reference: MO-000698/2026. The BML activation email was received 23 November 2026.


## 5. Prepared application routes (draft PR #125)

- `/admin/payment-requests`: admins select a **confirmed USD reservation**, verify the actual final amount, and issue one idempotent payment link.
- `POST /api/admin/bml-live/approve`: server-side admin authorization, immutable approved amount and booking reference.
- `/pay/[id]`: signed-in guest can view their approved total and explicitly accept purchase/payment terms before attempting the BML redirect.
- `GET/POST /api/bml/live/checkout`: read guest-owned payment intent or attempt exactly one server-side BML transaction when the launch flag is enabled.
- `POST /api/bml/live/webhook`: verifies BML signature, calls bank API for authoritative state, compares the stored immutable localId/currency/amount and commits the event/payment status atomically using `bml_record_verified_payment`.

**These routes are code-prepared only and have not been merged or activated in Production.** Bank live transaction initiation, production webhook registration, payment redirect results and a real test card charge are not yet verified.

## 6. Verified staging checks — 23 November 2026

- Installed the payment-intent / verified-event migration **only in Tripelor Staging**, not production.
- Verified RLS is enabled on both tables, ordinary unauthenticated/authenticated roles cannot read them, and the service role has required write permissions.
- Verified the record-payment RPC is executable only by the service role.
- Tested an example signed-provider-verified state in a *rolled-back SQL transaction* (no actual bank request), then confirmed a subsequent duplicate state created no duplicate event.
- Tested that a staged confirmed unpaid reservation becomes paid after the verified-event RPC (and no earlier); rolled back that transaction.
- Confirmed there were zero test intents, zero test events and zero resulting confirmed staging reservations after rollback.
- Vercel preview builds passed the Next.js build; these are not end-to-end BML tests.

Remaining launch blockers: BML's confirmation that the screenshot-exposed original key was revoked; review/merge and production migration approval; production webhook registration and cryptographic testing; real transaction + return/reconciliation/refund/settlement smoke tests; explicit approval to turn on `BML_LIVE_PAYMENTS_ENABLED`.


## 7. Final preparation review — early callbacks and retry safety

- Confirmed BML's published SDK examples use the production `/public/transactions` endpoint, signed amount/currency and application identification; added `deviceId` from the configured `BML_LIVE_APPLICATION_ID` to the **draft** transaction request. BML must still confirm the current production contract for this merchant and whether any later v2 variant applies.
- Fixed the callback race: a valid, bank-verified signed webhook arriving before the create response is saved may claim the bank transaction ID atomically, **only** for a previously initiated, guest-consented payment intent, and only after checking immutable amount/currency/local ID.
- Checkout now recognizes a bank ID already saved by a verified webhook rather than overwriting it or starting a duplicate payment.
- Initial rollout now enforces **one payment intent per booking for its lifetime**, not merely one active intent. Even if a prior attempt appears FAILED, staff must reconcile it with BML before further payments. An alternative retry/refund workflow can be developed and reviewed later.
- Admin endpoint returns an already-created payment link for the same booking and amount, and rejects attempts to change its amount or reuse an idempotency key across different bookings.
- Staging SQL tests used transaction rollback and confirmed that an early provider ID is linked securely, the matching confirmed reservation is paid once, mismatched provider IDs are blocked, and a second request after FAILED status cannot be created.
- Offline unit tests run with **fake** keys and a mocked BML HTTP response. They do not contact live BML, charge cards, or reveal credentials.

**Production release remains BLOCKED** while old-key revocation, live webhook registration, real provider response compatibility, refund handling and reconciliation tests are outstanding.
