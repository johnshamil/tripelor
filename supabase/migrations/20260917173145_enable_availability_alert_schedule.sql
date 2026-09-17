-- Keep disabled until the corresponding website worker has passed deployment.
select cron.schedule('tripelor-availability-alerts', '*/5 * * * *',
  'select private.queue_availability_alert_check();');
select cron.alter_job(
  job_id := (select jobid from cron.job where jobname='tripelor-availability-alerts'),
  active := false
);
