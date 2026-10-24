-- Close a round only after its deadline, without revealing any results.
create or replace function public.close_voting_round(p_round_id uuid)
returns uuid language plpgsql security invoker set search_path=''
as $$
declare v_round public.voting_rounds%rowtype; v_contest public.contests%rowtype;
begin
 select * into v_round from public.voting_rounds where id=p_round_id for update;
 if not found or v_round.status<>'open' or now()<v_round.ends_at then
  raise exception 'ROUND_NOT_READY';
 end if;
 select * into v_contest from public.contests where id=v_round.contest_id for update;
 if not found or (v_round.kind='regular' and v_contest.status<>'voting')
   or (v_round.kind='tiebreak' and v_contest.status<>'tiebreak') then
  raise exception 'INVALID_CONTEST_PHASE';
 end if;
 update public.voting_rounds set status='closed' where id=p_round_id;
 -- Do not set awaiting_reveal automatically: unresolved podium ties must be evaluated first.
 return v_round.contest_id;
end;
$$;
revoke all on function public.close_voting_round(uuid) from public,anon,authenticated;
grant execute on function public.close_voting_round(uuid) to service_role;
