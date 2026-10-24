import {describe,expect,it} from "vitest";
import {scoreRank,averageScores} from "../src/domain/services/scoring";
describe("normalized ranking",()=>{
  it("scores first and last positions",()=>{expect(scoreRank(1,5)).toBe(100);expect(scoreRank(5,5)).toBe(0);});
  it("scores middle position",()=>expect(scoreRank(3,5)).toBe(50));
  it("handles single eligible design",()=>expect(scoreRank(1,1)).toBe(100));
  it("rejects invalid positions",()=>expect(()=>scoreRank(0,5)).toThrow());
  it("averages received points",()=>expect(averageScores([100,50,0])).toBe(50));
});
