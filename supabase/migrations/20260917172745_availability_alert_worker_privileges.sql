-- Cron runs as postgres. Client roles must never read queued HTTP credentials.
revoke all on all tables in schema net from public, anon, authenticated;
revoke execute on all functions in schema net from public, anon, authenticated;
revoke usage on schema net from public, anon, authenticated;
