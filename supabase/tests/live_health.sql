-- ============================================================================
-- LIVE HEALTH PROBE (read only), run every 15 minutes by .github/workflows/health.yml
-- Output: one JSON row; every value must be true.
-- ============================================================================
select jsonb_build_object(
  -- The three hourly jobs (subscription expiry, reminders, payment health) exist and are on.
  'cron_jobs_active', (select count(*) = 3 and bool_and(active) from cron.job
                       where jobname in ('expire_lapsed_subscriptions_hourly',
                                         'dispatch_subscription_expiry_reminders_hourly',
                                         'check_payment_health_hourly')),
  -- Every job runs hourly, so two hours with no success means the scheduler stopped
  -- (as happened after the 2026-10-29 restore).
  'cron_ran_recently',    exists (select 1 from cron.job_run_details
                                  where status = 'succeeded' and start_time > now() - interval '2 hours'),
  'cron_no_failures_2h',  not exists (select 1 from cron.job_run_details
                                      where status = 'failed' and start_time > now() - interval '2 hours'),
  'cron_none_stuck',      not exists (select 1 from cron.job_run_details
                                      where status = 'running' and start_time < now() - interval '30 minutes'),
  -- Running out of connections makes every API request fail.
  'connections_below_80pct', (select count(*) from pg_stat_activity)
                             < 0.8 * current_setting('max_connections')::int
) as health;
