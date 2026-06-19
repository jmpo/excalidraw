-- Remove the test data created while wiring up the Hotmart webhook so the admin
-- and finance metrics reflect reality (no real sales yet). Only matches the
-- specific test addresses used during testing — never touches real users.

-- Auth users (cascades to public.profiles via FK ON DELETE CASCADE)
delete from auth.users
where email like 'pompa.07+edudrawtest%@gmail.com'
   or email like '%@example.com'
   or email like '%@hotmart.com';

-- Supporting tables
delete from public.abandoned_carts
where email like '%@example.com' or email like '%@hotmart.com';

delete from public.pending_activations
where email like '%@example.com'
   or email like '%@hotmart.com'
   or email like 'pompa.07+edudrawtest%@gmail.com';

delete from public.email_log
where recipient like '%@example.com'
   or recipient like '%@hotmart.com'
   or recipient like 'pompa.07+edudrawtest%@gmail.com'
   or recipient like 'pompa.07+resenddebug%@gmail.com';
