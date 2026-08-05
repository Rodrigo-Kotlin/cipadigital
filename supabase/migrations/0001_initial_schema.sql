-- CIPA Digital Fase 3
-- Presenca e voto sao estruturas independentes por desenho.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  cnpj text,
  address text,
  city text,
  state text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.elections (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  slug text not null unique,
  title text not null,
  management_period text not null,
  voting_date date not null,
  voting_start timestamptz not null,
  voting_end timestamptz not null,
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'open', 'paused', 'closed', 'tallied', 'archived')),
  total_employees integer not null check (total_employees > 0),
  titulares_count integer not null default 1 check (titulares_count >= 0),
  suplentes_count integer not null default 1 check (suplentes_count >= 0),
  allow_blank_vote boolean not null default true,
  show_results_only_after_close boolean not null default true,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint elections_valid_period check (voting_end > voting_start)
);

create table public.candidates (
  id uuid primary key default gen_random_uuid(),
  election_id uuid not null references public.elections(id) on delete cascade,
  display_order integer not null check (display_order > 0),
  name text not null,
  role text not null,
  slogan text,
  photo_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint candidates_election_order_unique unique (election_id, display_order)
);

-- This is the identified attendance and eligibility table.
create table public.voters (
  id uuid primary key default gen_random_uuid(),
  election_id uuid not null references public.elections(id) on delete cascade,
  name text not null,
  cpf_hash text not null,
  cpf_last2 text,
  cpf_masked text,
  department text,
  role text,
  registration_number text,
  status text not null default 'active' check (status in ('active', 'inactive', 'blocked')),
  has_voted boolean not null default false,
  voted_at timestamptz,
  attendance_token uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint voters_election_cpf_unique unique (election_id, cpf_hash),
  constraint voters_voted_at_consistency check ((has_voted and voted_at is not null) or (not has_voted and voted_at is null))
);

-- Never add a voter identifier to this table. The RPC is the only write path.
create table public.votes (
  id uuid primary key default gen_random_uuid(),
  election_id uuid not null references public.elections(id) on delete cascade,
  candidate_id uuid references public.candidates(id) on delete set null,
  is_blank boolean not null default false,
  created_at timestamptz not null default now(),
  constraint votes_choice_consistency check ((is_blank and candidate_id is null) or (not is_blank and candidate_id is not null))
);

create table public.admin_users (
  id uuid primary key,
  full_name text not null,
  email text not null unique,
  role text not null check (role in ('super_admin', 'election_admin', 'commission', 'poll_worker')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  election_id uuid references public.elections(id) on delete cascade,
  actor_id uuid,
  action text not null,
  details jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index voters_election_status_idx on public.voters(election_id, status);
create index candidates_election_active_idx on public.candidates(election_id, active);
create index votes_election_idx on public.votes(election_id);
create index audit_logs_election_created_idx on public.audit_logs(election_id, created_at desc);

create trigger companies_set_updated_at before update on public.companies
for each row execute function public.set_updated_at();
create trigger elections_set_updated_at before update on public.elections
for each row execute function public.set_updated_at();
create trigger candidates_set_updated_at before update on public.candidates
for each row execute function public.set_updated_at();
create trigger voters_set_updated_at before update on public.voters
for each row execute function public.set_updated_at();

alter table public.companies enable row level security;
alter table public.elections enable row level security;
alter table public.candidates enable row level security;
alter table public.voters enable row level security;
alter table public.votes enable row level security;
alter table public.admin_users enable row level security;
alter table public.audit_logs enable row level security;

-- No public policies are intentionally created for voters or votes.
-- Authenticated admin policies are scoped to accounts listed in admin_users.
create policy admin_users_read_self on public.admin_users
for select to authenticated using (id = auth.uid() and active = true);

create policy admin_users_read_election on public.elections
for select to authenticated using (
  exists (select 1 from public.admin_users where id = auth.uid() and active = true)
);

create policy admin_users_read_candidates on public.candidates
for select to authenticated using (
  exists (select 1 from public.admin_users where id = auth.uid() and active = true)
);

create policy admin_users_read_companies on public.companies
for select to authenticated using (
  exists (select 1 from public.admin_users where id = auth.uid() and active = true)
);

create policy admin_users_read_voters on public.voters
for select to authenticated using (
  exists (select 1 from public.admin_users where id = auth.uid() and active = true)
);

create policy admin_users_read_audit_logs on public.audit_logs
for select to authenticated using (
  exists (select 1 from public.admin_users where id = auth.uid() and active = true)
);

create policy admin_users_update_elections on public.elections
for update to authenticated using (
  exists (select 1 from public.admin_users where id = auth.uid() and active = true)
) with check (
  exists (select 1 from public.admin_users where id = auth.uid() and active = true)
);

create policy admin_users_write_candidates on public.candidates
for all to authenticated using (
  exists (select 1 from public.admin_users where id = auth.uid() and active = true)
) with check (
  exists (select 1 from public.admin_users where id = auth.uid() and active = true)
);

create policy admin_users_write_voters on public.voters
for all to authenticated using (
  exists (select 1 from public.admin_users where id = auth.uid() and active = true)
) with check (
  exists (select 1 from public.admin_users where id = auth.uid() and active = true)
);

create policy admin_users_insert_audit_logs on public.audit_logs
for insert to authenticated with check (
  exists (select 1 from public.admin_users where id = auth.uid() and active = true)
);

create or replace function public.transition_election_status(
  p_election_id uuid,
  p_target_status text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  election_row public.elections%rowtype;
  active_candidates integer;
  active_voters integer;
  allowed_transition boolean := false;
begin
  if auth.uid() is null or not exists (
    select 1 from public.admin_users where id = auth.uid() and active = true
  ) then
    raise exception using errcode = '42501', message = 'ADMIN_ACCESS_REQUIRED';
  end if;

  select * into election_row from public.elections where id = p_election_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'ELECTION_NOT_FOUND'; end if;

  allowed_transition := (election_row.status = 'draft' and p_target_status = 'scheduled')
    or (election_row.status = 'scheduled' and p_target_status = 'open')
    or (election_row.status = 'open' and p_target_status in ('paused', 'closed'))
    or (election_row.status = 'paused' and p_target_status in ('open', 'closed'))
    or (election_row.status = 'closed' and p_target_status = 'tallied');
  if not allowed_transition then
    raise exception using errcode = '22023', message = 'INVALID_STATUS_TRANSITION';
  end if;

  if p_target_status = 'open' then
    select count(*) into active_candidates from public.candidates where election_id = election_row.id and active = true;
    select count(*) into active_voters from public.voters where election_id = election_row.id and status = 'active';
    if active_candidates < 1 then raise exception using errcode = '22023', message = 'ACTIVE_CANDIDATE_REQUIRED'; end if;
    if active_voters < 1 then raise exception using errcode = '22023', message = 'ACTIVE_VOTER_REQUIRED'; end if;
    if election_row.voting_end <= election_row.voting_start then raise exception using errcode = '22023', message = 'INVALID_VOTING_PERIOD'; end if;
  end if;

  update public.elections set status = p_target_status where id = election_row.id;
  insert into public.audit_logs (election_id, actor_id, action, details)
  values (election_row.id, auth.uid(), 'election_status_changed', jsonb_build_object('from', election_row.status, 'to', p_target_status));
  return p_target_status;
end;
$$;

revoke all on function public.transition_election_status(uuid, text) from public;
grant execute on function public.transition_election_status(uuid, text) to authenticated;

create or replace function public.get_election_tally(p_election_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  election_row public.elections%rowtype;
  company_name_value text;
  company_cnpj_value text;
  total_active_voters bigint;
  total_attendance bigint;
  total_votes bigint;
  blank_votes bigint;
  candidate_rows jsonb;
  top_vote_count bigint;
  tied_top_count bigint;
begin
  if auth.uid() is null or not exists (select 1 from public.admin_users where id = auth.uid() and active = true) then
    raise exception using errcode = '42501', message = 'ADMIN_ACCESS_REQUIRED';
  end if;
  select e.* into election_row
  from public.elections e
  where e.id = p_election_id;
  if not found then raise exception using errcode = 'P0002', message = 'ELECTION_NOT_FOUND'; end if;
  select c.name, c.cnpj into company_name_value, company_cnpj_value
  from public.companies c
  where c.id = election_row.company_id;
  if election_row.status not in ('closed', 'tallied', 'archived') then
    raise exception using errcode = 'P0001', message = 'TALLY_NOT_AVAILABLE';
  end if;

  select count(*) filter (where status = 'active'), count(*) filter (where has_voted)
  into total_active_voters, total_attendance
  from public.voters where election_id = election_row.id;
  select count(*), count(*) filter (where is_blank) into total_votes, blank_votes
  from public.votes where election_id = election_row.id;

  with candidate_counts as (
    select c.id, c.name, c.role, c.display_order, count(v.id)::bigint as votes_count
    from public.candidates c
    left join public.votes v on v.candidate_id = c.id and v.election_id = election_row.id
    where c.election_id = election_row.id
    group by c.id, c.name, c.role, c.display_order
  ), ranked as (
    select *, row_number() over (order by votes_count desc, display_order asc)::integer as rank_position,
      max(votes_count) over () as max_votes,
      count(*) over (partition by votes_count) as same_vote_count
    from candidate_counts
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'candidate_id', id, 'candidate_name', name, 'candidate_role', role,
    'display_order', display_order, 'votes_count', votes_count,
    'rank_position', rank_position,
    'result_status', case when rank_position <= election_row.titulares_count then 'Titular'
      when rank_position <= election_row.titulares_count + election_row.suplentes_count then 'Suplente'
      else 'Candidato votado não eleito' end
  ) order by rank_position), '[]'::jsonb),
  max(max_votes), count(*) filter (where votes_count = max_votes)
  into candidate_rows, top_vote_count, tied_top_count
  from ranked;

  return jsonb_build_object(
    'election_id', election_row.id, 'title', election_row.title, 'company_name', company_name_value,
    'company_cnpj', company_cnpj_value, 'management_period', election_row.management_period,
    'voting_date', election_row.voting_date, 'voting_start', election_row.voting_start,
    'voting_end', election_row.voting_end, 'total_active_voters', total_active_voters,
    'total_attendance', total_attendance, 'total_votes', total_votes, 'blank_votes', blank_votes,
    'participation_percentage', case when total_active_voters = 0 then 0 else round((total_attendance::numeric / total_active_voters) * 100, 2) end,
    'has_tie', coalesce(tied_top_count > 1 and top_vote_count > 0, false),
    'has_divergence', total_attendance <> total_votes, 'candidates', candidate_rows
  );
end;
$$;

revoke all on function public.get_election_tally(uuid) from public;
grant execute on function public.get_election_tally(uuid) to authenticated;

create or replace function public.get_public_election(p_election_slug text)
returns table (
  id uuid,
  slug text,
  title text,
  company_name text,
  management_period text,
  voting_date date,
  voting_start timestamptz,
  voting_end timestamptz,
  status text,
  allow_blank_vote boolean
)
language sql
security definer
set search_path = public
as $$
  select e.id, e.slug, e.title, c.name, e.management_period, e.voting_date,
    e.voting_start, e.voting_end, e.status, e.allow_blank_vote
  from public.elections e
  left join public.companies c on c.id = e.company_id
  where e.slug = p_election_slug;
$$;

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

  select * into voter_row from public.voters where election_id = election_row.id and cpf_hash = p_cpf_hash;
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

create or replace function public.get_active_candidates(p_election_slug text)
returns table (id uuid, name text, role text, slogan text, photo_url text, display_order integer)
language sql
security definer
set search_path = public
as $$
  select c.id, c.name, c.role, c.slogan, c.photo_url, c.display_order
  from public.candidates c
  join public.elections e on e.id = c.election_id
  where e.slug = p_election_slug and e.status = 'open' and c.active = true
  order by c.display_order;
$$;

revoke all on function public.get_public_election(text) from public;
revoke all on function public.verify_voter_access(text, text) from public;
revoke all on function public.get_active_candidates(text) from public;
grant execute on function public.get_public_election(text) to anon, authenticated;
grant execute on function public.verify_voter_access(text, text) to anon, authenticated;
grant execute on function public.get_active_candidates(text) to anon, authenticated;

create or replace function public.cast_vote(
  p_election_slug text,
  p_cpf_hash text,
  p_candidate_id uuid,
  p_is_blank boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  election_row public.elections%rowtype;
  voter_row public.voters%rowtype;
begin
  select * into election_row
  from public.elections
  where slug = p_election_slug
  for share;

  if not found then
    raise exception using errcode = 'P0002', message = 'ELECTION_NOT_FOUND';
  end if;

  if election_row.status <> 'open' then
    raise exception using errcode = 'P0001', message = 'ELECTION_NOT_OPEN';
  end if;

  if now() < election_row.voting_start or now() > election_row.voting_end then
    raise exception using errcode = 'P0001', message = 'VOTING_OUTSIDE_WINDOW';
  end if;

  if p_is_blank and p_candidate_id is not null then
    raise exception using errcode = '22023', message = 'BLANK_VOTE_CANNOT_HAVE_CANDIDATE';
  end if;

  if not p_is_blank and p_candidate_id is null then
    raise exception using errcode = '22023', message = 'CANDIDATE_REQUIRED';
  end if;

  if p_is_blank and not election_row.allow_blank_vote then
    raise exception using errcode = '22023', message = 'BLANK_VOTE_NOT_ALLOWED';
  end if;

  if not p_is_blank and not exists (
    select 1 from public.candidates
    where id = p_candidate_id and election_id = election_row.id and active = true
  ) then
    raise exception using errcode = '22023', message = 'CANDIDATE_NOT_AVAILABLE';
  end if;

  -- The row lock makes the has_voted check and update atomic under concurrency.
  select * into voter_row
  from public.voters
  where election_id = election_row.id and cpf_hash = p_cpf_hash
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'VOTER_NOT_FOUND';
  end if;

  if voter_row.status <> 'active' then
    raise exception using errcode = 'P0001', message = 'VOTER_NOT_ACTIVE';
  end if;

  if voter_row.has_voted then
    raise exception using errcode = '23505', message = 'VOTER_ALREADY_VOTED';
  end if;

  update public.voters
  set has_voted = true, voted_at = now(), attendance_token = gen_random_uuid()
  where id = voter_row.id;

  insert into public.votes (election_id, candidate_id, is_blank)
  values (election_row.id, case when p_is_blank then null else p_candidate_id end, p_is_blank);

  return jsonb_build_object('success', true, 'message', 'VOTE_RECORDED');
end;
$$;

revoke all on function public.cast_vote(text, text, uuid, boolean) from public;
grant execute on function public.cast_vote(text, text, uuid, boolean) to anon, authenticated;

-- Explicitly deny direct client writes. SECURITY DEFINER RPC remains the write path.
revoke insert, update, delete on public.votes from anon, authenticated;
