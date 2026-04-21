-- Trigger: send welcome email via Edge Function when a new profile is created
create or replace function public.trigger_welcome_email()
returns trigger
language plpgsql
security definer
as $$
begin
  perform net.http_post(
    url     := 'https://budelidqeceqphdqelfc.supabase.co/functions/v1/send-welcome-email',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1ZGVsaWRxZWNlcXBoZHFlbGZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2MzAzOTYsImV4cCI6MjA5MjIwNjM5Nn0.bVadvXf885tBjbfPMa-hrNc3NG-UOYU7s7rG7IeEhw0"}'::jsonb,
    body    := jsonb_build_object('record', row_to_json(new))
  );
  return new;
end;
$$;

drop trigger if exists on_profile_created_send_welcome on public.profiles;

create trigger on_profile_created_send_welcome
  after insert on public.profiles
  for each row
  execute function public.trigger_welcome_email();
