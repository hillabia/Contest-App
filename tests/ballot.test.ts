import {describe,expect,it} from "vitest";
import {validateRanking} from "../src/domain/services/ballot";
describe("ballot eligibility",()=>{
 it("accepts all eligible entries",()=>expect(()=>validateRanking(["b","c"],["a","b","c"],"a")).not.toThrow());
 it("rejects own entry",()=>expect(()=>validateRanking(["a","b"],["a","b","c"],"a")).toThrow());
 it("rejects duplicates",()=>expect(()=>validateRanking(["b","b"],["a","b","c"],"a")).toThrow());
 it("requires all entries",()=>expect(()=>validateRanking(["b"],["a","b","c"],"a")).toThrow());
 it("rejects one eligible entry",()=>expect(()=>validateRanking(["b"],["a","b"],"a")).toThrow());
});
