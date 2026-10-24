import "server-only";
import type { RoundResultsReader } from "../../application/use-cases/calculate-round-results";
import { serverDatabase } from "./server";
export class SupabaseRoundResultsReader implements RoundResultsReader {
  async roundState(roundId:string){
    const {data,error}=await serverDatabase().from("voting_rounds")
      .select("status,ends_at").eq("id",roundId).maybeSingle();
    if(error) throw error;
    return data?{status:data.status,endsAt:new Date(data.ends_at)}:null;
  }
  async eligibleEntryIds(roundId:string){
    const {data,error}=await serverDatabase().from("round_entries")
      .select("entry_id").eq("round_id",roundId);
    if(error) throw error;
    return (data??[]).map(row=>row.entry_id);
  }
  async scoredBallots(roundId:string){
    const {data:ballots,error:ballotsError}=await serverDatabase().from("ballots")
      .select("id").eq("round_id",roundId);
    if(ballotsError) throw ballotsError;
    const ids=(ballots??[]).map(row=>row.id);
    if(!ids.length) return [];
    // Bounded batches avoid excessive URL sizes in PostgREST.
    const result:{entryId:string;normalizedScore:number}[]=[];
    for(let offset=0;offset<ids.length;offset+=100){
      const {data,error}=await serverDatabase().from("ballot_rankings")
        .select("entry_id,normalized_score").in("ballot_id",ids.slice(offset,offset+100));
      if(error) throw error;
      for(const row of data??[]) result.push({entryId:row.entry_id,normalizedScore:Number(row.normalized_score)});
    }
    return result;
  }
}
