import {describe,it,expect} from "vitest";
import {resolvePodium,type RoundSnapshot} from "../src/domain/services/podium";
const base:RoundSnapshot={id:"r1",kind:"regular",number:1,entryIds:["a","b","c","d"],scores:[{entryId:"a",normalizedScore:100},{entryId:"b",normalizedScore:100},{entryId:"c",normalizedScore:60},{entryId:"d",normalizedScore:20}]};
describe("podium resolution",()=>{
 it("blocks an unresolved first-place tie",()=>expect(resolvePodium([base]).unresolved).toEqual([["a","b"]]));
 it("resolves a podium tie using a dedicated round",()=>{
 const tie:RoundSnapshot={id:"r2",kind:"tiebreak",number:2,entryIds:["a","b"],scores:[{entryId:"a",normalizedScore:0},{entryId:"b",normalizedScore:100}]};
 expect(resolvePodium([base,tie])).toEqual({podium:["b","a","c"],unresolved:[]});
 });
 it("requires another round if tied again",()=>{
 const tie:RoundSnapshot={id:"r2",kind:"tiebreak",number:2,entryIds:["a","b"],scores:[{entryId:"a",normalizedScore:50},{entryId:"b",normalizedScore:50}]};
 expect(resolvePodium([base,tie]).unresolved).toEqual([["a","b"]]);
 });
 it("does not require tie-break below podium",()=>{
 const r:RoundSnapshot={...base,scores:[{entryId:"a",normalizedScore:100},{entryId:"b",normalizedScore:80},{entryId:"c",normalizedScore:60},{entryId:"d",normalizedScore:40}]};
 expect(resolvePodium([r]).unresolved).toEqual([]);
 });
});
