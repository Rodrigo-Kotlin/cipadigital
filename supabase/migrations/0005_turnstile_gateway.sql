revoke all on function public.verify_voter_access(text, text) from anon, authenticated;
revoke all on function public.cast_vote(text, text, uuid, boolean) from anon, authenticated;
grant execute on function public.verify_voter_access(text, text) to service_role;
grant execute on function public.cast_vote(text, text, uuid, boolean) to service_role;
