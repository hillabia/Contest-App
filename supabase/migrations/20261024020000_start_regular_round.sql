-- Atomically transition a registration contest into its first voting round.
-- Invoker-only; grant execution to service_role. Never callable by public clients.
create or replace function public.start_regular_round(p_contest_id uuid)
returns uuid
language plpgsql security invoker set search_path=''
as $$
declare
 v_contest public.contests%rowtype;
 v_round_id uuid;
 v_count integer;
begin
 select * into v_contest from public.contests where id=p_contest_id for update;
 if not found or v_contest.status<>'registration'
   or now()<v_contest.registration_ends_at or now()>=v_contest.voting_ends_at then
   raise exception 'INVALID_ROUND_WINDOW';
 end if;
 select count(*) into v_count from public.entries
 where contest_id=p_contest_id and status='approved';
 if v_count<3 then raise exception 'NOT_ENOUGH_ENTRIES'; end if;
 if exists(select 1 from public.voting_rounds where contest_id=p_contest_id) then
   raise exception 'ROUND_ALREADY_EXISTS';
 end if;
 insert into public.voting_rounds(contest_id,round_number,kind,starts_at,ends_at,status)
 values(p_contest_id,1,'regular',now(),v_contest.voting_ends_at,'open')
 returning id into v_round_id;
 insert into public.round_entries(round_id,entry_id)
 select v_round_id,id from public.entries where contest_id=p_contest_id and status='approved';
 update public.contests set status='voting' where id=p_contest_id;
 return v_round_id;
end;
$$;
revoke all on function public.start_regular_round(uuid) from public,anon,authenticated;
grant execute on function public.start_regular_round(uuid) to service_role;
