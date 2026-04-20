alter table public.drawings
  alter column user_id set default auth.uid();

alter table public.drawing_files
  alter column user_id set default auth.uid();
