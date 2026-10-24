export interface RoundWindow { readonly startsAt:Date; readonly endsAt:Date }
export function isRoundOpen(window:RoundWindow, now:Date):boolean {
  return Number.isFinite(window.startsAt.getTime()) && Number.isFinite(window.endsAt.getTime())
    && window.startsAt < window.endsAt && now >= window.startsAt && now < window.endsAt;
}
export function createTiebreakWindow(now:Date,durationMinutes:number):RoundWindow {
  if(!Number.isInteger(durationMinutes)||durationMinutes<5||durationMinutes>10080) throw new Error("Duración fuera del rango de 5 minutos a 7 días.");
  return {startsAt:new Date(now.getTime()),endsAt:new Date(now.getTime()+durationMinutes*60_000)};
}
/** A tie-break must offer at least two eligible choices to every authorized voter. */
export function eligibleVotersForTiebreak(tiedEntryIds:readonly string[],voters:readonly {id:string;ownEntryId:string|null}[]) {
  if(new Set(tiedEntryIds).size!==tiedEntryIds.length||tiedEntryIds.length<2) throw new Error("Invalid tied entries");
  return voters.filter(v=>tiedEntryIds.filter(id=>id!==v.ownEntryId).length>=2);
}
