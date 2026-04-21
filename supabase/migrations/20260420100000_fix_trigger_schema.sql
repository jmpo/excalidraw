-- Fix welcome email trigger: use net.http_post (pg_net default schema in Supabase)
create or replace function public.trigger_welcome_email()
returns trigger
language plpgsql
security definer
as $$
begin
  perform net.http_post(
    url     := 'https://budelidqeceqphdqelfc.supabase.co/functions/v1/send-welcome-email',
    body    := jsonb_build_object('record', row_to_json(new)),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1ZGVsaWRxZWNlcXBoZHFlbGZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2MzAzOTYsImV4cCI6MjA5MjIwNjM5Nn0.bVadvXf885tBjbfPMa-hrNc3NG-UOYU7s7rG7IeEhw0'
    )
  );
  return new;
exception when others then
  raise warning 'welcome email trigger failed: %', sqlerrm;
  return new;
end;
$$;
