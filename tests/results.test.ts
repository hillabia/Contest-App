import {describe,expect,it} from "vitest";
import {calculateResults,rankResults,podiumTies,canRevealResults} from "../src/domain/services/results";
import {createTiebreakWindow,isRoundOpen,eligibleVotersForTiebreak} from "../src/domain/services/rounds";
describe("contest results",()=>{
 it("averages scores rather than totals",()=>{
  const r=calculateResults(["a","b"],[{entryId:"a",normalizedScore:100},{entryId:"a",normalizedScore:0},{entryId:"b",normalizedScore:60}]);
  expect(r.map(x=>[x.entryId,x.average])).toEqual([["b",60],["a",50]]);
 });
 it("never treats an entry without votes as zero",()=>expect(calculateResults(["a"],[])[0].average).toBeNull());
 it("rejects scores for noneligible entries",()=>expect(()=>calculateResults(["a"],[{entryId:"b",normalizedScore:50}])).toThrow());
 it("detects a tie for first place",()=>{
  const r=calculateResults(["a","b","c"],[{entryId:"a",normalizedScore:100},{entryId:"b",normalizedScore:100},{entryId:"c",normalizedScore:0}]);
  expect(rankResults(r).map(x=>x.rank)).toEqual([1,1,3]);
  expect(podiumTies(r)).toEqual([{rank:1,entryIds:["a","b"]}]);
 });
 it("ignores ties below the podium",()=>{
  const r=calculateResults(["a","b","c","d","e"],[["a",100],["b",90],["c",80],["d",40],["e",40]].map(([entryId,normalizedScore])=>({entryId:String(entryId),normalizedScore:Number(normalizedScore)})));
  expect(podiumTies(r)).toEqual([]);
 });
 it("does not reveal while a tie is unresolved",()=>expect(canRevealResults("awaiting_reveal",true,1)).toBe(false));
 it("never reveals before awaiting_reveal",()=>expect(canRevealResults("voting",true,0)).toBe(false));
});
describe("round windows",()=>{
 it("uses inclusive start and exclusive end",()=>{
  const w=createTiebreakWindow(new Date("2026-10-24T12:00:00Z"),30);
  expect(isRoundOpen(w,w.startsAt)).toBe(true);
  expect(isRoundOpen(w,w.endsAt)).toBe(false);
 });
 it("rejects invalid duration",()=>expect(()=>createTiebreakWindow(new Date(),0)).toThrow());
 it("excludes tied entrants when only one eligible photo remains",()=>{
  const voters=[{id:"a",ownEntryId:"a"},{id:"guest",ownEntryId:null}];
  expect(eligibleVotersForTiebreak(["a","b"],voters).map(x=>x.id)).toEqual(["guest"]);
 });
});
