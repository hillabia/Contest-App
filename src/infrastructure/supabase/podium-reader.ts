import "server-only";
import {serverDatabase} from "./server";
import {resolvePodium,type RoundSnapshot} from "../../domain/services/podium";
import {SupabaseRoundResultsReader} from "./round-results-reader";
async function allRows(table:"voting_rounds"|"round_entries",column:string,id:string){
 const db=serverDatabase();const rows:Record<string,unknown>[]=[];
 for(let offset=0;;offset+=500){
  const {data,error}=await db.from(table).select("*").eq(column,id).range(offset,offset+499);
  if(error)throw error;
  rows.push(...(data??[]));if((data?.length??0)<500)break;
 }
 return rows;
}
export async function readPodium(contestId:string){
 const rounds=await allRows("voting_rounds","contest_id",contestId);
 if(!rounds.length)throw new Error("No voting rounds");
 if(rounds.some(r=>r.status!=="closed"||Date.parse(String(r.ends_at))>Date.now()))throw new Error("Round still open");
 const reader=new SupabaseRoundResultsReader();
 const snapshots:RoundSnapshot[]=[];
 for(const r of rounds.sort((a,b)=>Number(a.round_number)-Number(b.round_number))){
  const roundId=String(r.id);
  const entryIds=await reader.eligibleEntryIds(roundId);
  const scores=await reader.scoredBallots(roundId);
  snapshots.push({id:roundId,kind:String(r.kind) as "regular"|"tiebreak",number:Number(r.round_number),entryIds:[...entryIds],scores:[...scores]});
 }
 return resolvePodium(snapshots);
}
