export type ContestStatus="registration"|"voting"|"tiebreak"|"awaiting_reveal"|"revealed"|"purging"|"purged";
export function mayCreateTiebreak(status:ContestStatus,roundClosed:boolean,tiedEntries:readonly string[]):boolean{
 return (status==="voting"||status==="tiebreak") && roundClosed &&
   tiedEntries.length>=2 && new Set(tiedEntries).size===tiedEntries.length;
}
export function mayPublishPodium(status:ContestStatus,roundsClosed:boolean,unresolvedTies:number):boolean{
 return status==="awaiting_reveal"&&roundsClosed&&unresolvedTies===0;
}
export function mayPurge(status:ContestStatus,explicitConfirmation:boolean):boolean{
 return status==="revealed"&&explicitConfirmation;
}
