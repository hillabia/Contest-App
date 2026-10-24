import { calculateResults, type RankedScore } from "./results";
export interface RoundSnapshot {id:string;kind:"regular"|"tiebreak";number:number;entryIds:string[];scores:{entryId:string;normalizedScore:number}[]}
export interface PodiumResolution {podium:string[];unresolved:string[][]}
/** Only closed rounds are supplied. Each tiebreak must contain exactly the unresolved tied subset. */
export function resolvePodium(rounds:readonly RoundSnapshot[]):PodiumResolution {
 const regular=rounds.find(r=>r.kind==="regular");
 if(!regular)throw new Error("Missing regular round");
 const used=new Set<string>();
 const unresolved:string[][]=[];
 function resolveGroup(ids:string[],after:number):string[]{
  const matching=rounds.filter(r=>r.kind==="tiebreak"&&r.number>after&&r.entryIds.length===ids.length&&r.entryIds.every(id=>ids.includes(id))).sort((a,b)=>a.number-b.number)[0];
  if(!matching){unresolved.push(ids);return ids;}
  if(used.has(matching.id))throw new Error("Round reused");
  used.add(matching.id);
  const scores=calculateResults(ids,matching.scores);
  return split(scores,matching.number);
 }
 function split(scores:RankedScore[],after:number):string[]{
  const result:string[]=[];
  for(let i=0;i<scores.length;){
   const current=scores[i].average;
   let j=i+1;
   while(j<scores.length&&scores[j].average===current)j++;
   const group=scores.slice(i,j).map(x=>x.entryId);
   if(group.length>1)result.push(...resolveGroup(group,after));
   else result.push(...group);
   i=j;
  }
  return result;
 }
 const ordered=split(calculateResults(regular.entryIds,regular.scores),regular.number);
 // Unresolved ties matter only if they intersect the top three places.
 return {podium:ordered.slice(0,3),unresolved:unresolved.filter(g=>g.some(id=>ordered.indexOf(id)<3))};
}
