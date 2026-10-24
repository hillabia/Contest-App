-- Voting RPC: service_role only; validates a complete immutable ranked ballot.
create or replace function public.submit_ranked_ballot(
 p_round_id uuid, p_code_hash text, p_ranked_entry_ids uuid[]
) returns uuid
language plpgsql security invoker set search_path = ''
as $$
declare
 v_round public.voting_rounds%rowtype;
 v_contest public.contests%rowtype;
 v_code public.access_codes%rowtype;
 v_expected uuid[];
 v_ballot_id uuid;
 v_count integer;
 v_index integer;
begin
 select * into v_round from public.voting_rounds where id=p_round_id for share;
 if not found then raise exception 'ROUND_NOT_FOUND'; end if;
 select * into v_contest from public.contests where id=v_round.contest_id for share;
 if not found or v_contest.status not in ('voting','tiebreak') then raise exception 'VOTING_CLOSED'; end if;
 if (v_round.kind='regular' and v_contest.status<>'voting') or
    (v_round.kind='tiebreak' and v_contest.status<>'tiebreak') then
    raise exception 'VOTING_CLOSED';
 end if;
 if v_round.status<>'open' or now()<v_round.starts_at or now()>=v_round.ends_at or
    (v_round.kind='regular' and now()>=v_contest.voting_ends_at) then
    raise exception 'VOTING_CLOSED';
 end if;
 select * into v_code from public.access_codes
 where contest_id=v_round.contest_id and code_hash=p_code_hash for share;
 if not found then raise exception 'INVALID_CODE'; end if;
 select array_agg(re.entry_id order by re.entry_id) into v_expected
 from public.round_entries re
 join public.entries e on e.id=re.entry_id and e.contest_id=v_round.contest_id and e.status='approved'
 where re.round_id=p_round_id and (v_code.entry_id is null or re.entry_id<>v_code.entry_id);
 v_count:=coalesce(cardinality(v_expected),0);
 if v_count<2 then raise exception 'INSUFFICIENT_CANDIDATES'; end if;
 if p_ranked_entry_ids is null or cardinality(p_ranked_entry_ids)<>v_count or
    (select array_agg(x order by x) from unnest(p_ranked_entry_ids) x) is distinct from v_expected then
    raise exception 'INCOMPLETE_RANKING';
 end if;
 insert into public.ballots(round_id,access_code_id) values(p_round_id,v_code.id)
 returning id into v_ballot_id;
 for v_index in 1..v_count loop
   insert into public.ballot_rankings(ballot_id,entry_id,position,normalized_score)
   values(v_ballot_id,p_ranked_entry_ids[v_index],v_index,
          round((100.0*(v_count-v_index)/(v_count-1))::numeric,6));
 end loop;
 return v_ballot_id;
exception
 when unique_violation then raise exception 'ALREADY_VOTED';
end;
$$;
revoke all on function public.submit_ranked_ballot(uuid,text,uuid[]) from public,anon,authenticated;
grant execute on function public.submit_ranked_ballot(uuid,text,uuid[]) to service_role;
