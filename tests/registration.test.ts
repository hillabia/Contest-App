import {describe,it,expect} from "vitest";
import {validateDisplayName,canRegister} from "../src/domain/services/registration";
describe("registration policy",()=>{
  it("trims names",()=>expect(validateDisplayName("  Ana   López  ")).toBe("Ana López"));
  it("rejects invalid names",()=>expect(()=>validateDisplayName("<x>")).toThrow());
  it("closes on deadline",()=>expect(canRegister(new Date("2026-10-31T20:00:00Z"),new Date("2026-10-31T20:00:00Z"),"registration")).toBe(false));
  it("only accepts registration phase",()=>expect(canRegister(new Date("2026-10-30"),new Date("2026-10-31"),"voting")).toBe(false));
});
