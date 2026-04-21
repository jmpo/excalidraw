-- Ensure pg_net extension is enabled (required for HTTP calls from triggers)
create extension if not exists pg_net with schema extensions;

-- Recreate welcome email trigger function with correct pg_net signature
create or replace function public.trigger_welcome_email()
returns trigger
language plpgsql
security definer
as $$
begin
  perform extensions.http_post(
    url     := 'https://budelidqeceqphdqelfc.supabase.co/functions/v1/send-welcome-email',
    body    := jsonb_build_object('record', row_to_json(new)),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1ZGVsaWRxZWNlcXBoZHFlbGZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2MzAzOTYsImV4cCI6MjA5MjIwNjM5Nn0.bVadvXf885tBjbfPMa-hrNc3NG-UOYU7s7rG7IeEhw0'
    )
  );
  return new;
exception when others then
  -- Never block signup if email fails
  raise warning 'welcome email trigger failed: %', sqlerrm;
  return new;
end;
$$;

drop trigger if exists on_profile_created_send_welcome on public.profiles;
create trigger on_profile_created_send_welcome
  after insert on public.profiles
  for each row
  execute function public.trigger_welcome_email();
