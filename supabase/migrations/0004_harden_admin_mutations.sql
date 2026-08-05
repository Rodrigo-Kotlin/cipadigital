create or replace function public.prevent_direct_election_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status and current_user <> 'postgres' then
    raise exception using errcode = '42501', message = 'STATUS_TRANSITION_REQUIRES_RPC';
  end if;
  return new;
end;
$$;

drop trigger if exists elections_protect_status on public.elections;
create trigger elections_protect_status
before update on public.elections
for each row execute function public.prevent_direct_election_status_change();

create or replace function public.prevent_direct_voter_attendance_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_user <> 'postgres' and (
    new.election_id is distinct from old.election_id
    or new.cpf_hash is distinct from old.cpf_hash
    or new.has_voted is distinct from old.has_voted
    or new.voted_at is distinct from old.voted_at
    or new.attendance_token is distinct from old.attendance_token
  ) then
    raise exception using errcode = '42501', message = 'VOTER_ATTENDANCE_REQUIRES_RPC';
  end if;
  return new;
end;
$$;

drop trigger if exists voters_protect_attendance on public.voters;
create trigger voters_protect_attendance
before update on public.voters
for each row execute function public.prevent_direct_voter_attendance_change();

drop policy if exists admin_users_write_candidates on public.candidates;
create policy admin_users_insert_candidates on public.candidates
for insert to authenticated
with check (
  exists (select 1 from public.admin_users where id = auth.uid() and active = true)
  and exists (select 1 from public.elections e where e.id = election_id and e.status in ('draft', 'scheduled'))
);

create policy admin_users_update_candidates on public.candidates
for update to authenticated
using (
  exists (select 1 from public.admin_users where id = auth.uid() and active = true)
  and exists (select 1 from public.elections e where e.id = election_id and e.status in ('draft', 'scheduled'))
)
with check (
  exists (select 1 from public.admin_users where id = auth.uid() and active = true)
  and exists (select 1 from public.elections e where e.id = election_id and e.status in ('draft', 'scheduled'))
);

create policy admin_users_delete_candidates on public.candidates
for delete to authenticated
using (
  exists (select 1 from public.admin_users where id = auth.uid() and active = true)
  and exists (select 1 from public.elections e where e.id = election_id and e.status in ('draft', 'scheduled'))
);

drop policy if exists admin_users_write_voters on public.voters;
create policy admin_users_insert_voters on public.voters
for insert to authenticated
with check (
  exists (select 1 from public.admin_users where id = auth.uid() and active = true)
  and exists (select 1 from public.elections e where e.id = election_id and e.status in ('draft', 'scheduled'))
);

create policy admin_users_update_voters on public.voters
for update to authenticated
using (
  exists (select 1 from public.admin_users where id = auth.uid() and active = true)
  and exists (select 1 from public.elections e where e.id = election_id and e.status in ('draft', 'scheduled'))
)
with check (
  exists (select 1 from public.admin_users where id = auth.uid() and active = true)
  and exists (select 1 from public.elections e where e.id = election_id and e.status in ('draft', 'scheduled'))
);

create policy admin_users_delete_voters on public.voters
for delete to authenticated
using (
  exists (select 1 from public.admin_users where id = auth.uid() and active = true)
  and exists (select 1 from public.elections e where e.id = election_id and e.status in ('draft', 'scheduled'))
);
