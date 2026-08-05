create or replace function public.verify_voter_access(
  p_election_slug text,
  p_cpf_hash text
)
returns table (
  allowed boolean,
  reason text,
  election_id uuid,
  election_title text,
  company_name text,
  management_period text,
  voting_date date,
  allow_blank_vote boolean,
  voter_name text,
  cpf_masked text,
  department text,
  role text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  election_row public.elections%rowtype;
  company_name_value text;
  voter_row public.voters%rowtype;
begin
  select e.* into election_row
  from public.elections e
  where e.slug = p_election_slug;

  if not found then
    return query select false, 'ELECTION_NOT_FOUND', null::uuid, null::text, null::text, null::text, null::date, false, null::text, null::text, null::text, null::text;
    return;
  end if;
  select c.name into company_name_value
  from public.companies c
  where c.id = election_row.company_id;
  if election_row.status <> 'open' then
    return query select false, case election_row.status when 'paused' then 'ELECTION_PAUSED' when 'closed' then 'ELECTION_CLOSED' else 'ELECTION_NOT_OPEN' end, election_row.id, election_row.title, company_name_value, election_row.management_period, election_row.voting_date, election_row.allow_blank_vote, null::text, null::text, null::text, null::text;
    return;
  end if;
  if now() < election_row.voting_start or now() > election_row.voting_end then
    return query select false, 'VOTING_OUTSIDE_WINDOW', election_row.id, election_row.title, company_name_value, election_row.management_period, election_row.voting_date, election_row.allow_blank_vote, null::text, null::text, null::text, null::text;
    return;
  end if;

  select v.* into voter_row
  from public.voters v
  where v.election_id = election_row.id and v.cpf_hash = p_cpf_hash;
  if not found then
    return query select false, 'VOTER_NOT_FOUND', election_row.id, election_row.title, company_name_value, election_row.management_period, election_row.voting_date, election_row.allow_blank_vote, null::text, null::text, null::text, null::text;
    return;
  end if;
  if voter_row.status <> 'active' then
    return query select false, 'VOTER_NOT_ACTIVE', election_row.id, election_row.title, company_name_value, election_row.management_period, election_row.voting_date, election_row.allow_blank_vote, null::text, null::text, null::text, null::text;
    return;
  end if;
  if voter_row.has_voted then
    return query select false, 'VOTER_ALREADY_VOTED', election_row.id, election_row.title, company_name_value, election_row.management_period, election_row.voting_date, election_row.allow_blank_vote, null::text, null::text, null::text, null::text;
    return;
  end if;

  return query select true, 'OK', election_row.id, election_row.title, company_name_value, election_row.management_period, election_row.voting_date, election_row.allow_blank_vote, voter_row.name, voter_row.cpf_masked, voter_row.department, voter_row.role;
end;
$$;

revoke all on function public.verify_voter_access(text, text) from public;
grant execute on function public.verify_voter_access(text, text) to anon, authenticated;
