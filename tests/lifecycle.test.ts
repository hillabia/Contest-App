import {describe,expect,it} from "vitest";
import {mayCreateTiebreak,mayPublishPodium,mayPurge} from "../src/domain/services/lifecycle";
describe("contest lifecycle",()=>{
 it("allows tiebreak only after closing the round",()=>{expect(mayCreateTiebreak("voting",true,["a","b"])).toBe(true);expect(mayCreateTiebreak("voting",false,["a","b"])).toBe(false);});
 it("rejects repeated tied entries",()=>expect(mayCreateTiebreak("voting",true,["a","a"])).toBe(false));
 it("never publishes before authorization state",()=>expect(mayPublishPodium("voting",true,0)).toBe(false));
 it("requires explicit deletion confirmation",()=>{expect(mayPurge("revealed",false)).toBe(false);expect(mayPurge("revealed",true)).toBe(true);});
 it("does not purge unrevealed results",()=>expect(mayPurge("awaiting_reveal",true)).toBe(false));
});
