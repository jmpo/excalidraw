-- Remove the +edudrawtest5 verification user (created to confirm the Resend
-- webhook) so finance metrics stay at zero real sales.
delete from auth.users            where email     = 'pompa.07+edudrawtest5@gmail.com';
delete from public.email_log      where recipient = 'pompa.07+edudrawtest5@gmail.com';
delete from public.pending_activations where email = 'pompa.07+edudrawtest5@gmail.com';
delete from public.abandoned_carts where email     = 'pompa.07+edudrawtest5@gmail.com';
