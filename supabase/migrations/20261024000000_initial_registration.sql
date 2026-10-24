-- Apply to a NEW, dedicated Contest App Supabase project only.
create extension if not exists pgcrypto;

create table if not exists public.contests (
 id uuid primary key default gen_random_uuid(),
 title text not null check(length(title) between 2 and 120),
 registration_ends_at timestamptz not null,
 voting_ends_at timestamptz not null,
 status text not null default 'registration' check(status in ('registration','voting','tiebreak','awaiting_reveal','revealed','purging','purged')),
 revealed_at timestamptz,
 created_at timestamptz not null default now(),
 check(voting_ends_at > registration_ends_at)
);

create table if not exists public.entries (
 id uuid primary key default gen_random_uuid(),
 contest_id uuid not null references public.contests(id) on delete cascade,
 name text not null check(length(name) between 2 and 80),
 image_path text not null unique,
 status text not null default 'approved' check(status in ('approved','rejected')),
 created_at timestamptz not null default now()
);

create table if not exists public.access_codes (
 id uuid primary key default gen_random_uuid(),
 contest_id uuid not null references public.contests(id) on delete cascade,
 entry_id uuid unique references public.entries(id) on delete cascade,
 code_hash text not null unique check(length(code_hash)=64),
 role text not null default 'participant' check(role in ('participant','guest')),
 created_at timestamptz not null default now(),
 check((role='participant' and entry_id is not null) or (role='guest' and entry_id is null))
);

create table if not exists public.voting_rounds (
 id uuid primary key default gen_random_uuid(),
 contest_id uuid not null references public.contests(id) on delete cascade,
 round_number integer not null check(round_number>0),
 kind text not null check(kind in ('regular','tiebreak')),
 starts_at timestamptz not null,
 ends_at timestamptz not null,
 status text not null default 'pending' check(status in ('pending','open','closed')),
 unique(contest_id,round_number),
 check(ends_at>starts_at)
);

create table if not exists public.round_entries (
 round_id uuid not null references public.voting_rounds(id) on delete cascade,
 entry_id uuid not null references public.entries(id) on delete cascade,
 primary key(round_id,entry_id)
);

create table if not exists public.ballots (
 id uuid primary key default gen_random_uuid(),
 round_id uuid not null references public.voting_rounds(id) on delete cascade,
 access_code_id uuid not null references public.access_codes(id) on delete cascade,
 submitted_at timestamptz not null default now(),
 unique(round_id,access_code_id)
);

create table if not exists public.ballot_rankings (
 ballot_id uuid not null references public.ballots(id) on delete cascade,
 entry_id uuid not null references public.entries(id) on delete cascade,
 position integer not null check(position>0),
 normalized_score numeric(12,6) not null check(normalized_score between 0 and 100),
 primary key(ballot_id,entry_id),
 unique(ballot_id,position)
);

-- No direct browser database access; server-side trusted operations only.
alter table public.contests enable row level security;
alter table public.entries enable row level security;
alter table public.access_codes enable row level security;
alter table public.voting_rounds enable row level security;
alter table public.round_entries enable row level security;
alter table public.ballots enable row level security;
alter table public.ballot_rankings enable row level security;
revoke all on public.contests,public.entries,public.access_codes,public.voting_rounds,public.round_entries,public.ballots,public.ballot_rankings from anon,authenticated;

-- Trusted server calls only. This function runs as invoker with service-role access.
create or replace function public.register_entry(
 p_contest_id uuid,
 p_name text,
 p_image_path text,
 p_code_hash text
) returns uuid
language plpgsql security invoker
set search_path = ''
as $$
declare v_id uuid;
begin
 if not exists(select 1 from public.contests where id=p_contest_id and status='registration' and registration_ends_at>now()) then
   raise exception 'Registration closed';
 end if;
 if length(trim(p_name)) not between 2 and 80 or length(p_code_hash)<>64 then
   raise exception 'Invalid registration';
 end if;
 insert into public.entries(contest_id,name,image_path) values(p_contest_id,trim(p_name),p_image_path) returning id into v_id;
 insert into public.access_codes(contest_id,entry_id,code_hash,role) values(p_contest_id,v_id,p_code_hash,'participant');
 return v_id;
end;
$$;
revoke all on function public.register_entry(uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.register_entry(uuid,text,text,text) to service_role;

-- Create a PRIVATE bucket. All image reads are issued by trusted server as short-lived signed URLs.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('contest-photos','contest-photos',false,5000000,array['image/webp'])
on conflict(id) do nothing;
