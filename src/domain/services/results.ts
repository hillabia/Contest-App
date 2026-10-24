import { averageScores } from "./scoring";

export interface RankedScore { readonly entryId: string; readonly average: number | null; readonly ballotsReceived: number }
export interface ScoreRow { readonly entryId: string; readonly normalizedScore: number }
export interface TieGroup { readonly rank: number; readonly entryIds: readonly string[] }

/** Score every eligible entry, including those receiving no votes. No-vote entries are unranked. */
export function calculateResults(entryIds: readonly string[], rows: readonly ScoreRow[]): RankedScore[] {
  if (new Set(entryIds).size !== entryIds.length) throw new Error("Duplicate eligible entry");
  const scores = new Map(entryIds.map(id => [id, [] as number[]]));
  for (const row of rows) {
    const received = scores.get(row.entryId);
    if (!received) throw new Error("Score for an ineligible entry");
    received.push(row.normalizedScore);
  }
  return entryIds.map(entryId => {
    const received = scores.get(entryId)!;
    return { entryId, average: received.length ? averageScores(received) : null, ballotsReceived: received.length };
  }).sort((a,b) => {
    if (a.average === null) return b.average === null ? a.entryId.localeCompare(b.entryId) : 1;
    if (b.average === null) return -1;
    return b.average - a.average || a.entryId.localeCompare(b.entryId);
  });
}

/** Competition ranking: equal scores share a position; the next rank skips accordingly. */
export function rankResults(results: readonly RankedScore[]): {entryId:string; rank:number|null; average:number|null}[] {
  let previous: number | null = null;
  let rank = 0;
  return results.map((r,index) => {
    if (r.average === null) return {entryId:r.entryId,rank:null,average:null};
    if (previous === null || r.average !== previous) rank=index+1;
    previous=r.average;
    return {entryId:r.entryId,rank,average:r.average};
  });
}

/** Only ties intersecting podium positions require an additional round. */
export function podiumTies(results: readonly RankedScore[], podiumSize=3): TieGroup[] {
  if (!Number.isInteger(podiumSize) || podiumSize<1) throw new Error("Invalid podium size");
  const ranked=rankResults(results);
  const groups=new Map<number,string[]>();
  for (const item of ranked) if (item.rank !== null) {
    const group=groups.get(item.rank)??[];
    group.push(item.entryId);
    groups.set(item.rank,group);
  }
  return [...groups].filter(([rank,ids])=>ids.length>1 && rank<=podiumSize)
    .map(([rank,entryIds])=>({rank,entryIds}));
}

export function canRevealResults(phase:string, roundsClosed:boolean, unresolvedTies:number):boolean {
  return phase==="awaiting_reveal" && roundsClosed && unresolvedTies===0;
}
