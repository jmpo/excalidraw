-- Enable pg_cron extension
create extension if not exists pg_cron with schema extensions;
grant usage on schema cron to postgres;

-- Daily cron job: sends trial expiry warning (1 day before) and expired email (day of)
-- Runs every day at 10:00 AM UTC (7:00 AM ARG)
select cron.schedule(
  'trial-expiry-emails',
  '0 10 * * *',
  $$
    select net.http_post(
      url     := 'https://budelidqeceqphdqelfc.supabase.co/functions/v1/send-trial-expiry-email',
      headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1ZGVsaWRxZWNlcXBoZHFlbGZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2MzAzOTYsImV4cCI6MjA5MjIwNjM5Nn0.bVadvXf885tBjbfPMa-hrNc3NG-UOYU7s7rG7IeEhw0"}'::jsonb,
      body    := '{}'::jsonb
    );
  $$
);
