import {describe,expect,it} from "vitest";
import {mayCreateTiebreak,mayPublishPodium,mayPurge} from "../src/domain/services/lifecycle";
describe("administrative transitions",()=>{
 it("blocks early reveal",()=>expect(mayPublishPodium("voting",true,0)).toBe(false));
 it("blocks reveal with unresolved ties",()=>expect(mayPublishPodium("awaiting_reveal",true,2)).toBe(false));
 it("permits reveal only when ready",()=>expect(mayPublishPodium("awaiting_reveal",true,0)).toBe(true));
 it("requires explicit purge confirmation after reveal",()=>expect(mayPurge("revealed",true)).toBe(true));
 it("prevents tiebreak with one candidate",()=>expect(mayCreateTiebreak("voting",true,["a"])).toBe(false));
});
