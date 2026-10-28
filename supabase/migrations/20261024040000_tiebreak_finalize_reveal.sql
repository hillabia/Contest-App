-- Only service_role can transition round states.
create or replace function public.start_tiebreak_round(
 p_contest_id uuid,p_entry_ids uuid[],p_duration_minutes integer
) returns uuid language plpgsql security invoker set search_path=''
as $$
declare v_contest public.contests%rowtype; v_last public.voting_rounds%rowtype; v_round uuid; v_n integer;
begin
 select * into v_contest from public.contests where id=p_contest_id for update;
 if not found or v_contest.status not in ('voting','tiebreak') then raise exception 'INVALID_CONTEST_PHASE'; end if;
 if p_duration_minutes not between 5 and 10080 then raise exception 'INVALID_DURATION'; end if;
 select * into v_last from public.voting_rounds where contest_id=p_contest_id order by round_number desc limit 1 for update;
 if not found or v_last.status<>'closed' or now()<v_last.ends_at then raise exception 'PREVIOUS_ROUND_OPEN'; end if;
 v_n:=cardinality(p_entry_ids);
 if v_n<2 or v_n<> (select count(distinct id) from unnest(p_entry_ids) id) then raise exception 'INVALID_TIED_ENTRIES'; end if;
 if (select count(*) from public.entries where contest_id=p_contest_id and status='approved' and id=any(p_entry_ids))<>v_n then raise exception 'INVALID_TIED_ENTRIES'; end if;
 if (select count(*) from public.round_entries where round_id=v_last.id and entry_id=any(p_entry_ids))<>v_n then raise exception 'NOT_PREVIOUS_CANDIDATES'; end if;
 insert into public.voting_rounds(contest_id,round_number,kind,starts_at,ends_at,status)
 values(p_contest_id,v_last.round_number+1,'tiebreak',now(),now()+make_interval(mins=>p_duration_minutes),'open')
 returning id into v_round;
 insert into public.round_entries(round_id,entry_id) select v_round,unnest(p_entry_ids);
 update public.contests set status='tiebreak' where id=p_contest_id;
 return v_round;
end;
$$;
revoke all on function public.start_tiebreak_round(uuid,uuid[],integer) from public,anon,authenticated;
grant execute on function public.start_tiebreak_round(uuid,uuid[],integer) to service_role;

create or replace function public.finalize_contest_rounds(p_contest_id uuid)
returns boolean language plpgsql security invoker set search_path=''
as $$
declare v_contest public.contests%rowtype;
begin
 select * into v_contest from public.contests where id=p_contest_id for update;
 if not found or v_contest.status not in ('voting','tiebreak') then raise exception 'INVALID_CONTEST_PHASE'; end if;
 if exists(select 1 from public.voting_rounds where contest_id=p_contest_id and (status<>'closed' or now()<ends_at)) then raise exception 'ROUNDS_NOT_CLOSED'; end if;
 update public.contests set status='awaiting_reveal' where id=p_contest_id;
 return true;
end;
$$;
revoke all on function public.finalize_contest_rounds(uuid) from public,anon,authenticated;
grant execute on function public.finalize_contest_rounds(uuid) to service_role;

create or replace function public.reveal_contest(p_contest_id uuid)
returns boolean language plpgsql security invoker set search_path=''
as $$
begin
 update public.contests set status='revealed',revealed_at=now()
 where id=p_contest_id and status='awaiting_reveal'
 and not exists(select 1 from public.voting_rounds where contest_id=p_contest_id and status<>'closed');
 if not found then raise exception 'CONTEST_NOT_READY'; end if;
 return true;
end;
$$;
revoke all on function public.reveal_contest(uuid) from public,anon,authenticated;
grant execute on function public.reveal_contest(uuid) to service_role;
