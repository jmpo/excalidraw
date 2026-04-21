-- Daily cron: send reactivation email to users paused for ~3 days
select cron.schedule(
  'reactivation-emails',
  '30 10 * * *',
  $$
    select net.http_post(
      url     := 'https://budelidqeceqphdqelfc.supabase.co/functions/v1/send-reactivation-email',
      headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1ZGVsaWRxZWNlcXBoZHFlbGZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2MzAzOTYsImV4cCI6MjA5MjIwNjM5Nn0.bVadvXf885tBjbfPMa-hrNc3NG-UOYU7s7rG7IeEhw0"}'::jsonb,
      body    := '{}'::jsonb
    );
  $$
);
