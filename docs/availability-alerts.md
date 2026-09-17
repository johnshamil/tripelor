# Room availability alerts

Customers subscribe from an unavailable room result or `/account/availability-alerts`. Alerts belong to the signed-in account and require a confirmed account email. The server validates the room against active inventory and uses the existing availability function, including reservations and stop-sale rules. Duplicate active subscriptions are reused; each account can have 10 active alerts.

Supabase Cron calls the private worker at `/api/internal/availability-alerts` every five minutes. The scheduling credential is generated in the database and kept in Vault; only its hash is available to the application. The worker uses existing `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` and `RESEND_API_KEY` settings. No new Vercel secrets are required.

Each batch claims up to 20 alerts with `FOR UPDATE SKIP LOCKED` and an expiring lease. Confirmed account email addresses are resolved afresh before delivery. A successful notification closes the alert. Failed checks/deliveries retry after ten minutes; expired claims can be recovered. Resend's per-alert idempotency key protects delivery retries within its 24-hour retention window. The customer can cancel an active alert; a cancellation cannot recall email already in transit. Dates expire after the check-in date in Maldives time. An alert does not reserve inventory or guarantee a price.

## Deployment

Apply the schema migrations, deploy the matching website, then activate the prepared schedule:

```sql
select cron.alter_job(
  job_id := (select jobid from cron.job where jobname='tripelor-availability-alerts'),
  active := true
);
select private.queue_availability_alert_check();
```

Check the HTTP response in `net._http_response` and the schedule in `cron.job`. A healthy empty batch returns HTTP 200 with zero checked/sent/failed. The worker reports a configuration error if its email key is missing. Keep the `net`, `vault` and `private` schemas outside the Data API's exposed schemas: queued requests contain the scheduler credential. The managed `pg_net` objects retain platform-owned grants, so the defensive revoke migration alone does not establish isolation; the unexposed schema boundary is required.

Pause delivery with `cron.alter_job` using the same job ID and `active := false`. Customer alerts remain stored. Future migrations using pg_net must preserve the schema boundary around the networking queue.

## Verification

- `node tests/availability-alerts.cjs`: route, worker and inventory behavior with mocked services.
- `tests/availability-alerts.sql`: transaction-only duplicate, lease, expiry, limit and RLS verification. It uses an existing account and rolls back all test rows; run in a controlled maintenance window or staging.
- `npx tsc --noEmit --incremental false`.
